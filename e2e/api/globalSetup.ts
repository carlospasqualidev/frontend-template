import { request, type APIResponse } from '@playwright/test';

import {
  SEED_ADMIN,
  SERVER_API_URL,
  serverApiUrl,
  storeAdminStorageState,
} from '../helpers/serverApi';

const SERVER_SETUP_HINT =
  'Suba o ../server-template antes: `npm run db:up`, `npm run db:deploy`, `npm run db:seed` e `npm run dev` lá dentro.';

/**
 * Logins que os specs fazem depois deste, pelo navegador (os 2 recusados de
 * propósito contam). Spec novo que faz login soma aqui.
 */
const SPEC_LOGIN_COUNT = 6;

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
    `[test:e2e:api] Limite de login do server: ${reason}. Aguardando ${resetSeconds} s até a janela reiniciar...`
  );
  await new Promise((resolve) => setTimeout(resolve, resetSeconds * 1000));
}

/*
 * Pré-condições dos E2E contra o server real, conferidas uma vez antes dos
 * specs: o server responde em `VITE_API_URL` com o banco no ar, o admin do seed
 * entra e sobram logins para os specs no limite do server; se não sobrarem, o
 * setup espera a janela reiniciar. A sessão do admin fica em `process.env` para
 * o preparo de dado (`newAdminApiContext`), sem um login por spec.
 */
export default async function globalSetup(): Promise<void> {
  const readinessUrl = new URL('/health/ready', SERVER_API_URL).toString();
  const context = await request.newContext();
  const signInAdmin = (): Promise<APIResponse> =>
    context.post(serverApiUrl('/client/session/login'), { data: SEED_ADMIN });

  try {
    const readiness = await context.get(readinessUrl).catch(() => null);

    if (!readiness?.ok()) {
      throw new Error(
        `O server não está pronto em ${readinessUrl}. ${SERVER_SETUP_HINT}`
      );
    }

    let signIn = await signInAdmin();

    if (signIn.status() === 429) {
      await waitForRateLimitReset(
        signIn,
        'o login do admin foi recusado (429)'
      );
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

    if (remaining !== undefined && remaining < SPEC_LOGIN_COUNT) {
      await waitForRateLimitReset(
        signIn,
        `restam ${remaining} logins nesta janela e os specs fazem ${SPEC_LOGIN_COUNT}`
      );
    }

    storeAdminStorageState(JSON.stringify(await context.storageState()));
  } finally {
    await context.dispose();
  }
}
