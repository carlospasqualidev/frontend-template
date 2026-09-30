import { expect, test, type APIRequestContext } from '@playwright/test';

import {
  newAdminApiContext,
  readSystemConfigValue,
  serverApiUrl,
  uniqueSuffix,
  writeSystemConfigValue,
} from './helpers/serverApi';
import { openAdminSession } from './helpers/session';

const NAME_KEY = 'app.name';
const IDLE_KEY = 'security.idleTimeoutMinutes';
// Valores do teste e `defaultValue` das chaves no catálogo do server
// (`systemConfig.catalog.ts`).
const TEST_NAME_PREFIX = 'Produto E2E';
const TEST_IDLE_MINUTES = '45';
const CATALOG_NAME = 'Meu Produto';
const CATALOG_IDLE_MINUTES = '20';

const IDLE_RANGE_MESSAGE =
  'Tempo de inatividade até o logout (min): Informe um valor de 1 a 480 minutos.';
const RETENTION_ORDER_MESSAGE =
  'Prazo para apagar a auditoria (meses): Informe um valor maior que o prazo para anonimizar.';

// Configurações do sistema (`/settings`) contra o server real — formulário
// agrupado por módulo no padrão "salvar aparece quando há mudança". O preparo
// lê pela API o que o teste de gravação vai mudar, e o fim devolve os valores:
// o spec roda quantas vezes for preciso contra o mesmo banco.
test.describe('Configurações', () => {
  let admin: APIRequestContext | undefined;
  let nameToRestore: string | undefined;
  let idleToRestore: string | undefined;

  // Já com o valor do teste, uma execução anterior parou antes de restaurar: o
  // valor de antes dela se perdeu, e a empresa volta ao padrão do catálogo.
  async function readRestorable(
    context: APIRequestContext,
    key: string,
    isTestValue: (value: string) => boolean,
    catalogValue: string
  ): Promise<string> {
    const current = await readSystemConfigValue(context, key);
    if (!isTestValue(current)) return current;

    await writeSystemConfigValue(context, key, catalogValue);
    return catalogValue;
  }

  test.beforeAll(async () => {
    admin = await newAdminApiContext();
    nameToRestore = await readRestorable(
      admin,
      NAME_KEY,
      (value) => value.startsWith(TEST_NAME_PREFIX),
      CATALOG_NAME
    );
    idleToRestore = await readRestorable(
      admin,
      IDLE_KEY,
      (value) => value === TEST_IDLE_MINUTES,
      CATALOG_IDLE_MINUTES
    );
  });

  test.afterAll(async () => {
    try {
      if (admin && nameToRestore !== undefined) {
        await writeSystemConfigValue(admin, NAME_KEY, nameToRestore);
      }
      if (admin && idleToRestore !== undefined) {
        await writeSystemConfigValue(admin, IDLE_KEY, idleToRestore);
      }
    } finally {
      await admin?.dispose();
    }
  });

  test.beforeEach(async ({ page }) => {
    await openAdminSession(page);
    await page.goto('/settings');
  });

  // Só as chaves do catálogo do servidor, nos três grupos dele.
  test('exibe os grupos e só as configurações do servidor', async ({
    page,
  }) => {
    for (const group of ['Geral', 'Segurança', 'Notificações']) {
      await expect(page.getByText(group, { exact: true })).toBeVisible();
    }
    for (const label of [
      'Nome da aplicação',
      'E-mail de suporte',
      'Tempo de inatividade até o logout (min)',
      'Prazo para anonimizar a auditoria (meses)',
      'Prazo para apagar a auditoria (meses)',
      'Notificações por e-mail',
    ]) {
      await expect(page.getByLabel(label)).toBeVisible();
    }

    const form = page.locator('form#settings-form');
    await expect(form.getByRole('textbox')).toHaveCount(2);
    await expect(form.getByRole('spinbutton')).toHaveCount(3);
    await expect(form.getByRole('switch')).toHaveCount(1);
  });

  test('grava as alterações numa chamada só, com um toast, e o valor fica no servidor', async ({
    page,
  }) => {
    const nome = page.getByLabel('Nome da aplicação');
    const inatividade = page.getByLabel(
      'Tempo de inatividade até o logout (min)'
    );
    await expect(nome).toHaveValue(nameToRestore ?? '');
    await expect(inatividade).toHaveValue(idleToRestore ?? '');

    // Pristine: nenhuma ação de salvar no topo.
    await expect(
      page.getByRole('button', { name: 'Salvar alterações' })
    ).toHaveCount(0);

    // Editar torna o form dirty → aparece Descartar + Salvar alterações.
    const newName = `${TEST_NAME_PREFIX} ${uniqueSuffix()}`;
    await nome.fill(newName);
    await inatividade.fill(TEST_IDLE_MINUTES);
    const salvar = page.getByRole('button', { name: 'Salvar alterações' });
    await expect(salvar).toBeVisible();
    await expect(page.getByRole('button', { name: 'Descartar' })).toBeVisible();

    const patch = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        request.url() === serverApiUrl('/client/system-configs')
    );
    await salvar.click();

    // Um lote só, com os dois itens alterados.
    expect((await patch).postDataJSON()).toEqual({
      items: [
        { key: NAME_KEY, value: newName },
        { key: IDLE_KEY, value: TEST_IDLE_MINUTES },
      ],
    });

    // Sucesso (um toast só, com o `message` da gravação) e retorno ao estado
    // pristine (as ações somem).
    await expect(page.getByText('Configurações atualizadas.')).toHaveCount(1);
    await expect(
      page.getByRole('button', { name: 'Salvar alterações' })
    ).toHaveCount(0);

    // Recarregar lê de novo do servidor: os valores ficaram gravados.
    await page.reload();
    await expect(nome).toHaveValue(newName);
    await expect(inatividade).toHaveValue(TEST_IDLE_MINUTES);
  });

  // O server recusa o valor fora da faixa com `issues` no item do lote (o item
  // 0, a única alteração) e a tela marca o campo pela chave (o terceiro da
  // tela), sem toast e sem gravar nada.
  test('marca o campo que o servidor recusou, sem toast e sem gravar', async ({
    page,
  }) => {
    const inatividade = page.getByLabel(
      'Tempo de inatividade até o logout (min)'
    );
    await expect(inatividade).not.toHaveValue('');

    const rejection = page.waitForResponse(
      (response) =>
        response.request().method() === 'PATCH' &&
        response.url() === serverApiUrl('/client/system-configs')
    );
    await inatividade.fill('999');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    expect((await rejection).status()).toBe(400);

    await expect(page.getByText(IDLE_RANGE_MESSAGE)).toBeVisible();
    await expect(inatividade).toHaveAttribute('aria-invalid', 'true');
    // Contagem de uma vez, sem `toHaveCount(0)`: essa asserção espera, e
    // passaria quando o toast some sozinho. Com o erro já sob o campo, o toast
    // do 400 já estaria na página.
    expect(await page.locator('[data-sonner-toast]').count()).toBe(0);
    await expect(
      page.getByRole('button', { name: 'Salvar alterações' })
    ).toBeVisible();

    // Mudar o valor tira a marca.
    await inatividade.fill('30');
    await expect(page.getByText(IDLE_RANGE_MESSAGE)).toHaveCount(0);
    await expect(inatividade).not.toHaveAttribute('aria-invalid', 'true');
  });

  // Regra entre as chaves de retenção da auditoria: apagar só depois de
  // anonimizar. Só o prazo para apagar muda, então o server confere a regra
  // contra o prazo para anonimizar já gravado e responde 400 só com `message`:
  // sem campo a marcar, o texto vira o toast e a alteração continua pendente.
  test('recusa apagar a auditoria antes de anonimizá-la, com toast, sem gravar', async ({
    page,
  }) => {
    const anonimizar = page.getByLabel(
      'Prazo para anonimizar a auditoria (meses)'
    );
    const apagar = page.getByLabel('Prazo para apagar a auditoria (meses)');
    await expect(anonimizar).not.toHaveValue('');
    const anonymizeMonths = await anonimizar.inputValue();

    await apagar.fill(anonymizeMonths);
    await page.getByRole('button', { name: 'Salvar alterações' }).click();

    await expect(
      page.locator('[data-sonner-toast]', { hasText: RETENTION_ORDER_MESSAGE })
    ).toBeVisible();
    await expect(apagar).not.toHaveAttribute('aria-invalid', 'true');
    await expect(
      page.getByRole('button', { name: 'Salvar alterações' })
    ).toBeVisible();
    await expect(apagar).toHaveValue(anonymizeMonths);
  });

  test('descartar reverte a alteração', async ({ page }) => {
    const nome = page.getByLabel('Nome da aplicação');
    await expect(nome).not.toHaveValue('');
    const original = await nome.inputValue();

    await nome.fill('Valor Temporário');
    await page.getByRole('button', { name: 'Descartar' }).click();

    await expect(nome).toHaveValue(original);
    await expect(
      page.getByRole('button', { name: 'Salvar alterações' })
    ).toHaveCount(0);
  });
});
