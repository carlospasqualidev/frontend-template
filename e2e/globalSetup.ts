import path from 'node:path';

import {
  request,
  type APIRequestContext,
  type APIResponse,
  type FullConfig,
} from '@playwright/test';

import { assertServesThisFrontend } from './helpers/frontend';
import {
  createUserWithoutRole,
  deleteLeftoverPreparedUsers,
  deleteUser,
  SEED_ADMIN,
  SERVER_API_URL,
  serverApiUrl,
  storeManager,
  uniqueSuffix,
} from './helpers/serverApi';
import {
  ADMIN_STORAGE_STATE,
  MANAGER_STORAGE_STATE,
} from './helpers/storageState';

const SERVER_SETUP_HINT =
  'Suba o ../server-template antes: `npm run db:up`, `npm run db:deploy`, `npm run db:seed` e `npm run dev` lá dentro.';

/**
 * Logins que os specs fazem depois dos 2 deste setup (o admin e o gestor).
 * Só entra de verdade quem prova o próprio login: pela tela, o admin em
 * `session.spec.ts` e a pessoa sem cargo em `userWithoutRole.spec.ts`; os 2
 * recusados de propósito em `loginErrors.spec.ts` (senha errada e conta
 * bloqueada), que também contam; e, pela API, a pessoa que troca a própria
 * senha em `account.spec.ts` (`signInThroughApi`). O resto entra com as
 * sessões deste setup (`ADMIN_STORAGE_STATE`, `MANAGER_STORAGE_STATE`), sem
 * login. Spec novo que faz login soma aqui.
 */
const SPEC_LOGIN_COUNT = 5;

/** Os logins depois do do admin: o do gestor, aqui, e os dos specs. */
const LOGINS_AFTER_ADMIN = 1 + SPEC_LOGIN_COUNT;

/** A janela do limite de login do server é de 1 minuto: esperar mais que isso é outra regra. */
const MAX_RATE_LIMIT_WAIT_SECONDS = 70;

/*
 * Limite de login do server (`@fastify/rate-limit`, 10 por minuto por IP), lido
 * dos cabeçalhos da resposta. O Node deste setup e o Chromium dos specs chegam
 * ao server pelo mesmo loopback IPv4 (`127.0.0.1`: o server escuta em
 * `0.0.0.0`) e dividem o contador.
 */
function readRateLimitRemaining(response: APIResponse): number | undefined {
  const remaining = response.headers()['x-ratelimit-remaining'];
  return remaining === undefined ? undefined : Number(remaining);
}

async function waitForRateLimitReset(
  response: APIResponse,
  reason: string
): Promise<void> {
  const resetSeconds = Number(response.headers()['x-ratelimit-reset']);

  if (
    !Number.isFinite(resetSeconds) ||
    resetSeconds > MAX_RATE_LIMIT_WAIT_SECONDS
  ) {
    throw new Error(
      `Limite de login do server: ${reason}, e a janela não reinicia em até ${MAX_RATE_LIMIT_WAIT_SECONDS} s (x-ratelimit-reset: ${response.headers()['x-ratelimit-reset']}). Confira o LOGIN_RATE_LIMIT do server.`
    );
  }

  console.info(
    `[test:e2e] Limite de login do server: ${reason}. Aguardando ${resetSeconds} s até a janela reiniciar...`
  );
  await new Promise((resolve) => setTimeout(resolve, resetSeconds * 1000));
}

/**
 * Entra como o admin do seed e grava a sessão em `ADMIN_STORAGE_STATE`. Com
 * menos logins sobrando que os que vêm depois, espera a janela do limite
 * reiniciar (a sessão aberta continua valendo).
 */
async function storeAdminSession(admin: APIRequestContext): Promise<void> {
  const signInAdmin = (): Promise<APIResponse> =>
    admin.post(serverApiUrl('/client/session/login'), { data: SEED_ADMIN });

  let signIn = await signInAdmin();

  if (signIn.status() === 429) {
    await waitForRateLimitReset(signIn, 'o login do admin foi recusado (429)');
    signIn = await signInAdmin();

    if (signIn.status() === 429) {
      throw new Error(
        'O server recusou o login do admin por excesso de tentativas (429) mesmo depois de a janela reiniciar: outro cliente no mesmo IP está gastando o limite de 10 logins por minuto (a tela de login aberta, outra suíte). Pare esse cliente e rode de novo.'
      );
    }
  }

  if (!signIn.ok()) {
    throw new Error(
      `O login de ${SEED_ADMIN.email} falhou (${signIn.status()}): o seed não está aplicado. ${SERVER_SETUP_HINT}`
    );
  }

  const remaining = readRateLimitRemaining(signIn);

  if (remaining !== undefined && remaining < LOGINS_AFTER_ADMIN) {
    await waitForRateLimitReset(
      signIn,
      `restam ${remaining} logins nesta janela e a suíte faz mais ${LOGINS_AFTER_ADMIN}`
    );
  }

  await admin.storageState({ path: ADMIN_STORAGE_STATE });
}

/** Início do nome do gestor: é por ele que sai o gestor de uma execução morta. */
const MANAGER_NAME_PREFIX = 'Pessoa Gestora ';

/**
 * Cria o gestor (sem cargo; o spec que entra com ele dá o cargo), entra com
 * ele pela API e grava a sessão em `MANAGER_STORAGE_STATE`. Devolve o id,
 * para a exclusão no fim da suíte. Antes, exclui os gestores que execuções
 * interrompidas deixaram (o fim da suíte delas não rodou).
 */
async function storeManagerSession(admin: APIRequestContext): Promise<string> {
  const leftovers = await deleteLeftoverPreparedUsers(
    admin,
    MANAGER_NAME_PREFIX
  );
  if (leftovers > 0) {
    console.info(
      `[test:e2e] ${leftovers} gestor(es) de execução interrompida excluído(s).`
    );
  }

  const manager = await createUserWithoutRole(
    admin,
    `${MANAGER_NAME_PREFIX}${uniqueSuffix()}`
  );
  const context = await request.newContext();

  try {
    const signIn = await context.post(serverApiUrl('/client/session/login'), {
      data: { email: manager.email, password: manager.password },
    });

    if (!signIn.ok()) {
      throw new Error(
        `O login do gestor criado no preparo falhou (${signIn.status()}).`
      );
    }

    await context.storageState({ path: MANAGER_STORAGE_STATE });
    storeManager(manager);
    return manager.id;
  } catch (error) {
    // Sem o setup completo, o Playwright não roda o fim da suíte: o gestor
    // sai daqui mesmo.
    await deleteUser(admin, manager.id);
    throw error;
  } finally {
    await context.dispose();
  }
}

/** O server pronto, e as sessões do admin e do gestor gravadas. Devolve o id do gestor. */
async function openSessions(): Promise<string> {
  const readinessUrl = new URL('/health/ready', SERVER_API_URL).toString();
  const admin = await request.newContext();

  try {
    const readiness = await admin.get(readinessUrl).catch(() => null);

    if (!readiness?.ok()) {
      throw new Error(
        `O server não está pronto em ${readinessUrl}. ${SERVER_SETUP_HINT}`
      );
    }

    await storeAdminSession(admin);
    return await storeManagerSession(admin);
  } finally {
    await admin.dispose();
  }
}

/*
 * Pré-condições dos E2E, conferidas uma vez antes dos specs (o `webServer` já
 * subiu, ou reaproveitou, o Vite na porta dos E2E): a porta serve este
 * frontend apontando para `VITE_API_URL`; o server responde ali com o banco no
 * ar; o admin do seed entra e sobram logins para o resto da suíte no limite do
 * server (se não sobrarem, o setup espera a janela reiniciar). Abre as sessões
 * que os specs reaproveitam pelo `storageState` (o admin e o gestor), e
 * devolve o fim da suíte, que exclui o gestor.
 */
export default async function globalSetup(
  config: FullConfig
): Promise<() => Promise<void>> {
  await assertServesThisFrontend(
    config.configFile ? path.dirname(config.configFile) : process.cwd()
  );

  const managerId = await openSessions();

  return async () => {
    const cleanup = await request.newContext({
      storageState: ADMIN_STORAGE_STATE,
    });
    try {
      await deleteUser(cleanup, managerId);
    } finally {
      await cleanup.dispose();
    }
  };
}
