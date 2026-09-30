import { expect, test, type APIRequestContext } from '@playwright/test';

import {
  isValidateResponse,
  newAdminApiContext,
  readSystemConfigValue,
  writeSystemConfigValue,
} from './helpers/serverApi';
import { MANAGER_STORAGE_STATE } from './helpers/storageState';

const IDLE_TIMEOUT_KEY = 'security.idleTimeoutMinutes';
// O aviso abre 60 s antes do fim: com 2 minutos, aos 60 s de inatividade (com
// o padrão de 20, só aos 19 minutos).
const COMPANY_IDLE_MINUTES = '2';
// `defaultValue` da chave no catálogo do server (`systemConfig.catalog.ts`).
const CATALOG_IDLE_MINUTES = '20';

// O tempo de inatividade da sessão vem do server já resolvido (usuário →
// `security.idleTimeoutMinutes` da empresa → 20) a cada leitura da sessão. O
// preparo grava a configuração da empresa pelo admin (`PATCH
// /client/system-configs`), e quem entra é o gestor do `globalSetup`, sem
// tempo próprio; o fim devolve o valor anterior.
test.describe('Tempo de inatividade da sessão', () => {
  test.use({ storageState: MANAGER_STORAGE_STATE });

  let admin: APIRequestContext | undefined;
  let idleMinutesToRestore: string | undefined;

  test.beforeAll(async () => {
    admin = await newAdminApiContext();
    const currentIdleMinutes = await readSystemConfigValue(
      admin,
      IDLE_TIMEOUT_KEY
    );
    // Já com o valor do teste, uma execução anterior parou antes de restaurar:
    // o valor de antes dela se perdeu, e a empresa volta ao padrão.
    idleMinutesToRestore =
      currentIdleMinutes === COMPANY_IDLE_MINUTES
        ? CATALOG_IDLE_MINUTES
        : currentIdleMinutes;
    await writeSystemConfigValue(admin, IDLE_TIMEOUT_KEY, COMPANY_IDLE_MINUTES);
  });

  test.afterAll(async () => {
    try {
      if (admin && idleMinutesToRestore !== undefined) {
        await writeSystemConfigValue(
          admin,
          IDLE_TIMEOUT_KEY,
          idleMinutesToRestore
        );
      }
    } finally {
      await admin?.dispose();
    }
  });

  test('segue a configuração da empresa gravada no preparo', async ({
    page,
  }) => {
    // Relógio controlado pelo teste: a inatividade passa sem esperar de verdade.
    await page.clock.install();

    const validation = page.waitForResponse(isValidateResponse);
    await page.goto('/');

    const { user: sessionUser } = (await (await validation).json()) as {
      user: { idleTimeoutMinutes: number };
    };
    expect(sessionUser.idleTimeoutMinutes).toBe(Number(COMPANY_IDLE_MINUTES));
    await expect(
      page.getByRole('heading', { level: 1, name: /Pessoa$/ })
    ).toBeVisible();

    const warning = page.getByRole('dialog', {
      name: 'Sessão prestes a expirar',
    });

    await page.clock.fastForward('00:50');
    await expect(warning).toBeHidden();

    await page.clock.fastForward('00:20');
    await expect(warning).toBeVisible();
  });
});
