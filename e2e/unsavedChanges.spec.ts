import {
  expect,
  test,
  type APIRequestContext,
  type Locator,
  type Page,
} from '@playwright/test';

import {
  createUserWithoutRole,
  deleteUserIfExists,
  newAdminApiContext,
  serverApiUrl,
  uniqueSuffix,
  type PreparedUser,
} from './helpers/serverApi';
import { ADMIN_STORAGE_STATE } from './helpers/storageState';

// Um item do menu lateral (o grupo "Administração" aberto, se preciso).
async function sidebarLink(page: Page, item: string): Promise<Locator> {
  const sidebar = page.locator('[data-sidebar="sidebar"]');
  const administration = sidebar.getByRole('button', {
    name: /Administração/,
  });
  if ((await administration.getAttribute('aria-expanded')) !== 'true') {
    await administration.click();
  }
  return sidebar.getByRole('link', { name: item });
}

function discardDialog(page: Page): Locator {
  return page.getByRole('alertdialog', { name: 'Descartar as alterações?' });
}

// A criação de usuário com o nome digitado: é a edição não salva dos testes.
// Nada é gravado; o que sai da tela é descartado.
async function startCreatingUser(page: Page, name: string): Promise<void> {
  await expect(page).toHaveURL(/\/users\/create$/);
  const field = page.getByLabel('Nome');
  // O clique dá à página a ativação de usuário que o navegador exige para o
  // aviso nativo ao fechar.
  await field.click();
  await field.pressSequentially(name);
  await expect(
    page.getByRole('button', { name: 'Criar usuário' })
  ).toBeVisible();
}

// O guard de edição não salva contra o app real: o menu lateral, o voltar do
// navegador (uma e duas vezes), a nova guia, o fechar da aba e o "Sair" do
// menu da pessoa. O último teste edita e salva uma
// pessoa criada no preparo (excluída no fim), então o spec roda quantas vezes
// for preciso contra o mesmo banco.
test.describe('Edição não salva', () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  const suffix = uniqueSuffix();
  let admin: APIRequestContext | undefined;
  let person: PreparedUser | undefined;

  test.beforeAll(async () => {
    admin = await newAdminApiContext();
    person = await createUserWithoutRole(admin, `Pessoa Guarda ${suffix}`);
  });

  test.afterAll(async () => {
    if (!admin) return;
    if (person) await deleteUserIfExists(admin, person.id);
    await admin.dispose();
  });

  test('menu lateral: "Continuar editando" fica com a edição, "Descartar alterações" sai', async ({
    page,
  }) => {
    await page.goto('/users/create');
    await startCreatingUser(page, 'Pessoa em edição');

    const audit = await sidebarLink(page, 'Auditoria');
    await audit.click();
    await expect(discardDialog(page)).toBeVisible();
    await discardDialog(page)
      .getByRole('button', { name: 'Continuar editando' })
      .click();

    await expect(discardDialog(page)).toBeHidden();
    await expect(page).toHaveURL(/\/users\/create$/);
    await expect(page.getByLabel('Nome')).toHaveValue('Pessoa em edição');

    await audit.click();
    await discardDialog(page)
      .getByRole('button', { name: 'Descartar alterações' })
      .click();
    await expect(page).toHaveURL(/\/audit-logs/);
    await expect(discardDialog(page)).toBeHidden();
  });

  test('voltar do navegador com edição pergunta; ficar mantém a URL e a edição', async ({
    page,
  }) => {
    await page.goto('/users');
    await page.getByRole('link', { name: 'Novo usuário' }).click();
    await startCreatingUser(page, 'Pessoa em edição');

    await page.goBack();
    await expect(discardDialog(page)).toBeVisible();
    await discardDialog(page)
      .getByRole('button', { name: 'Continuar editando' })
      .click();

    await expect(discardDialog(page)).toBeHidden();
    await expect(page).toHaveURL(/\/users\/create$/);
    await expect(page.getByLabel('Nome')).toHaveValue('Pessoa em edição');

    await page.goBack();
    await discardDialog(page)
      .getByRole('button', { name: 'Descartar alterações' })
      .click();
    await expect(page).toHaveURL(/\/users(\?|$)/);
    await expect(
      page.getByRole('link', { name: 'Novo usuário' })
    ).toBeVisible();
  });

  test('dois voltar com a pergunta aberta: uma pergunta só, e ficar mantém URL e edição', async ({
    page,
  }) => {
    await page.goto('/audit-logs');
    await (await sidebarLink(page, 'Usuários')).click();
    await expect(page).toHaveURL(/\/users(\?|$)/);
    await page.getByRole('link', { name: 'Novo usuário' }).click();
    await startCreatingUser(page, 'Pessoa em edição');

    await page.goBack();
    await expect(discardDialog(page)).toBeVisible();
    await page.goBack();
    // O segundo voltar chega à auditoria, e o navegador volta para onde a
    // pergunta o deixou (a listagem), sem outra pergunta.
    await expect(page).toHaveURL(/\/users(\?|$)/);
    await expect(discardDialog(page)).toHaveCount(1);
    await discardDialog(page)
      .getByRole('button', { name: 'Continuar editando' })
      .click();

    await expect(discardDialog(page)).toBeHidden();
    await expect(page).toHaveURL(/\/users\/create$/);
    await expect(page.getByLabel('Nome')).toHaveValue('Pessoa em edição');

    await page.goBack();
    await discardDialog(page)
      .getByRole('button', { name: 'Descartar alterações' })
      .click();
    await expect(page).toHaveURL(/\/users(\?|$)/);
    await expect(
      page.getByRole('link', { name: 'Novo usuário' })
    ).toBeVisible();
  });

  test('Ctrl+clique no menu abre a tela em nova guia, sem perguntar', async ({
    page,
    context,
  }) => {
    await page.goto('/users/create');
    await startCreatingUser(page, 'Pessoa em edição');

    const audit = await sidebarLink(page, 'Auditoria');
    const opened = context.waitForEvent('page');
    await audit.click({ modifiers: ['Control'] });
    const newTab = await opened;
    await newTab.waitForLoadState();

    expect(newTab.url()).toContain('/audit-logs');
    // Contagem de uma vez, depois de a nova guia já ter aberto.
    expect(await discardDialog(page).count()).toBe(0);
    await expect(page).toHaveURL(/\/users\/create$/);
    await expect(page.getByLabel('Nome')).toHaveValue('Pessoa em edição');
    await newTab.close();
  });

  test('fechar a aba com edição pede o aviso nativo; sem edição, fecha direto', async ({
    page,
    context,
  }) => {
    await page.goto('/users/create');
    await startCreatingUser(page, 'Pessoa em edição');

    const nativeDialog = page.waitForEvent('dialog');
    await page.close({ runBeforeUnload: true });
    const dialog = await nativeDialog;
    expect(dialog.type()).toBe('beforeunload');
    await dialog.accept();
    await expect.poll(() => page.isClosed()).toBe(true);

    const pristine = await context.newPage();
    const dialogs: string[] = [];
    pristine.on('dialog', (shown) => {
      dialogs.push(shown.type());
      void shown.dismiss();
    });
    await pristine.goto('/users/create');
    await pristine.getByLabel('Nome').click();
    const closed = pristine.waitForEvent('close');
    await pristine.close({ runBeforeUnload: true });
    await closed;
    expect(dialogs).toEqual([]);
  });

  // A pergunta vem antes de encerrar a sessão. Sair só apaga o cookie deste
  // navegador: a sessão do admin nos outros specs continua valendo.
  test('"Sair" com edição pergunta antes: "Continuar editando" fica logado na edição, "Descartar alterações" sai', async ({
    page,
  }) => {
    const logouts: string[] = [];
    page.on('request', (request) => {
      if (request.url() === serverApiUrl('/client/session/logout')) {
        logouts.push(request.method());
      }
    });
    await page.goto('/users/create');
    await startCreatingUser(page, 'Pessoa em edição');

    const userMenu = page.getByRole('button', { name: /admin@admin\.com/ });
    await userMenu.click();
    await page.getByRole('menuitem', { name: 'Sair' }).click();
    await expect(discardDialog(page)).toBeVisible();
    await discardDialog(page)
      .getByRole('button', { name: 'Continuar editando' })
      .click();

    await expect(discardDialog(page)).toBeHidden();
    await expect(userMenu).toBeFocused();
    await expect(page).toHaveURL(/\/users\/create$/);
    await expect(page.getByLabel('Nome')).toHaveValue('Pessoa em edição');
    expect(logouts).toEqual([]);

    await userMenu.click();
    await page.getByRole('menuitem', { name: 'Sair' }).click();
    await discardDialog(page)
      .getByRole('button', { name: 'Descartar alterações' })
      .click();
    await expect(page).toHaveURL(/\/login$/);
    expect(logouts).toEqual(['POST']);
  });

  test('depois de salvar, o menu sai sem perguntar', async ({ page }) => {
    if (!person) throw new Error('Pessoa do preparo ausente.');
    await page.goto(`/users/${person.id}`);
    await page.getByLabel('Telefone').fill('(48) 98888-6666');

    const saved = page.waitForResponse(
      (response) =>
        response.request().method() === 'PATCH' &&
        response.url() === serverApiUrl(`/client/users/${person?.id}`)
    );
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    expect((await saved).status()).toBe(200);
    await expect(
      page.getByRole('button', { name: 'Salvar alterações' })
    ).toHaveCount(0);

    await (await sidebarLink(page, 'Cargos')).click();
    await expect(page).toHaveURL(/\/roles/);
    expect(await discardDialog(page).count()).toBe(0);
  });
});
