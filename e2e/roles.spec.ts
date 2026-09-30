import {
  expect,
  test,
  type APIRequestContext,
  type Page,
  type Response,
} from '@playwright/test';

import {
  createRoleWithPermissions,
  createUserWithoutRole,
  deleteRolesMatching,
  deleteUserIfExists,
  newAdminApiContext,
  readManager,
  serverApiUrl,
  setUserRoles,
  uniqueSuffix,
  type PreparedUser,
} from './helpers/serverApi';
import {
  ADMIN_STORAGE_STATE,
  MANAGER_STORAGE_STATE,
} from './helpers/storageState';

// A linha cujo nome é exatamente `name` (a cópia "X (cópia)" também contém X).
function rowNamed(page: Page, name: string) {
  return page
    .locator('tbody tr')
    .filter({ has: page.getByText(name, { exact: true }) });
}

function toastWith(page: Page, text: string) {
  return page.locator('[data-sonner-toast]', { hasText: text });
}

function rolesUrl(search: string): string {
  return `/roles?filters=${encodeURIComponent(JSON.stringify({ search }))}`;
}

async function chooseRowAction(page: Page, name: string, action: string) {
  await rowNamed(page, name)
    .getByRole('button', { name: 'Abrir menu' })
    .click();
  await page.getByRole('menuitem', { name: action }).click();
}

function isRoleWrite(
  method: string,
  path: string
): (response: Response) => boolean {
  return (response: Response): boolean =>
    response.request().method() === method &&
    response.url() === serverApiUrl(path);
}

function isSessionRead(response: Response): boolean {
  return (
    response.request().method() === 'GET' &&
    response.url() === serverApiUrl('/client/users/me')
  );
}

// Marca o documento aberto: a marca some se a página recarregar.
async function markDocument(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.documentElement.dataset.e2eSameDocument = 'true';
  });
}

async function isSameDocument(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.dataset.e2eSameDocument === 'true'
  );
}

// Abre um item do menu lateral pela navegação do app, sem recarregar.
async function openFromSidebar(page: Page, item: string): Promise<void> {
  const sidebar = page.locator('[data-sidebar="sidebar"]');
  const administration = sidebar.getByRole('button', {
    name: /Administração/,
  });
  if ((await administration.getAttribute('aria-expanded')) !== 'true') {
    await administration.click();
  }
  await sidebar.getByRole('link', { name: item }).click();
}

// O cargo vem da busca do servidor, no campo "Cargos do usuário".
async function pickUserRole(page: Page, roleName: string): Promise<void> {
  await page.getByLabel('Cargos do usuário').click();
  const searched = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      response.url().startsWith(serverApiUrl('/client/roles?')) &&
      new URL(response.url()).searchParams.get('search') === roleName
  );
  await page.getByRole('textbox', { name: 'Buscar...' }).fill(roleName);
  expect((await searched).status()).toBe(200);
  await page.getByRole('checkbox', { name: roleName }).click();
  await page.keyboard.press('Escape');
}

async function searchList(page: Page, term: string): Promise<void> {
  await page.getByLabel('Buscar').fill(term);
  await page.getByRole('button', { name: 'Buscar' }).click();
}

function isCopyResponse(response: Response): boolean {
  return (
    response.request().method() === 'POST' &&
    /\/client\/roles\/[^/]+\/copy$/.test(new URL(response.url()).pathname)
  );
}

// Cargos (`/roles`) contra o server real: lista, criação e edição com a árvore
// de permissões (a expansão para leitura), cópia, vínculo de usuário (também
// pela tela de usuários, sem recarregar), exclusão (a recusa com usuários
// vinculados), o Administrador só leitura e, com o gestor do `globalSetup`, o
// anti-escalonamento e a edição do próprio cargo. O preparo cria pela
// API, com o sufixo único desta execução no nome, os cargos e as pessoas de
// que cada teste precisa; a limpeza exclui pelo sufixo tudo o que o spec (e a
// tela) criou.
test.describe('Cargos', () => {
  const suffix = uniqueSuffix();
  const editableName = `Cargo Editável ${suffix}`;
  const sourceName = `Cargo Origem ${suffix}`;
  const linkedName = `Cargo Vinculado ${suffix}`;
  const doomedName = `Cargo Descartável ${suffix}`;
  const createdName = `Cargo Criado ${suffix}`;
  const transferName = `Cargo Transferência ${suffix}`;
  const managerRoleName = `Cargo Gestão de Cargos ${suffix}`;

  let admin: APIRequestContext | undefined;
  const preparedUsers: PreparedUser[] = [];
  let manager: PreparedUser | undefined;

  let editableRoleId: string;
  let transferRoleId: string;
  let managerRoleId: string;
  let candidate: PreparedUser;
  let transferred: PreparedUser;

  async function prepareUser(name: string): Promise<PreparedUser> {
    if (!admin) throw new Error('Sessão do admin ausente.');
    const user = await createUserWithoutRole(admin, `${name} ${suffix}`);
    preparedUsers.push(user);
    return user;
  }

  test.beforeAll(async () => {
    admin = await newAdminApiContext();

    editableRoleId = await createRoleWithPermissions(admin, editableName, [
      'backoffice.users.read',
    ]);
    // A origem da cópia tem a trilha de auditoria, que o gestor não tem.
    await createRoleWithPermissions(admin, sourceName, [
      'backoffice.audit.read',
    ]);
    const linkedRoleId = await createRoleWithPermissions(admin, linkedName, [
      'backoffice.users.read',
    ]);
    await createRoleWithPermissions(admin, doomedName, [
      'backoffice.users.read',
    ]);

    const member = await prepareUser('Pessoa Vinculada');
    await setUserRoles(admin, member.id, [linkedRoleId]);
    candidate = await prepareUser('Pessoa Candidata');
    transferRoleId = await createRoleWithPermissions(admin, transferName, [
      'backoffice.users.read',
    ]);
    transferred = await prepareUser('Pessoa Transferida');

    // Quem gerencia cargos, sem a trilha de auditoria nem os usuários.
    managerRoleId = await createRoleWithPermissions(admin, managerRoleName, [
      'backoffice.roles.read',
      'backoffice.roles.create',
      'backoffice.roles.update',
    ]);
    manager = readManager();
    await setUserRoles(admin, manager.id, [managerRoleId]);
  });

  test.afterAll(async () => {
    try {
      if (admin) {
        // O gestor segue na suíte: sai sem o cargo, antes de o cargo sair.
        if (manager) await setUserRoles(admin, manager.id, []);
        // Cargo com usuário não é excluído: as pessoas saem antes.
        for (const user of preparedUsers) {
          await deleteUserIfExists(admin, user.id);
        }
        await deleteRolesMatching(admin, suffix);
      }
    } finally {
      await admin?.dispose();
    }
  });

  test.describe('como admin', () => {
    test.use({ storageState: ADMIN_STORAGE_STATE });

    test('lista os cargos do servidor pela busca, com as contagens', async ({
      page,
    }) => {
      const listed = page.waitForResponse(
        (response) =>
          response.request().method() === 'GET' &&
          response.url().startsWith(serverApiUrl('/client/roles?')) &&
          new URL(response.url()).searchParams.get('search') === suffix
      );
      await page.goto(rolesUrl(suffix));
      expect((await listed).status()).toBe(200);

      const linked = rowNamed(page, linkedName);
      await expect(linked).toContainText('1 permissão');
      await expect(linked).toContainText('1 usuário');
      await expect(rowNamed(page, editableName)).toContainText(
        'Nenhum usuário'
      );

      // O que não casa com a busca some.
      await page.goto(rolesUrl(linkedName));
      await expect(rowNamed(page, linkedName)).toBeVisible();
      await expect(rowNamed(page, editableName)).toHaveCount(0);
    });

    test('o item "Cargos" do menu abre a lista', async ({ page }) => {
      await page.goto('/');
      const sidebar = page.locator('[data-sidebar="sidebar"]');
      const administration = sidebar.getByRole('button', {
        name: /Administração/,
      });
      if ((await administration.getAttribute('aria-expanded')) !== 'true') {
        await administration.click();
      }
      await sidebar.getByRole('link', { name: 'Cargos' }).click();

      await expect(page).toHaveURL(/\/roles$/);
      await expect(
        page.getByRole('link', { name: 'Novo cargo' })
      ).toBeVisible();
    });

    test('cria um cargo: marcar uma escrita marca e trava a leitura', async ({
      page,
    }) => {
      await page.goto('/roles');
      await page.getByRole('link', { name: 'Novo cargo' }).click();
      await expect(page).toHaveURL(/\/roles\/create$/);

      await page.getByLabel('Nome').fill(createdName);
      await page.getByLabel('Descrição').fill('Cargo do e2e');
      await page.getByRole('checkbox', { name: 'Editar usuário' }).click();

      const read = page.getByRole('checkbox', { name: 'Visualizar usuários' });
      await expect(read).toBeChecked();
      await expect(read).toBeDisabled();
      await expect(
        page.getByText('Incluída pelas outras ações do grupo.')
      ).toBeVisible();

      const created = page.waitForResponse(
        isRoleWrite('POST', '/client/roles')
      );
      await page.getByRole('button', { name: 'Criar cargo' }).click();
      const response = await created;
      expect(response.status()).toBe(201);
      const body = response.request().postDataJSON() as {
        name: string;
        permissionIds: string[];
      };
      expect(body.name).toBe(createdName);
      expect(body.permissionIds).toHaveLength(2);

      await expect(toastWith(page, 'Cargo criado.')).toBeVisible();
      await expect(page).toHaveURL(/\/roles\/[0-9a-f-]+\?tab=users$/);
      await expect(
        page.getByText('Nenhum usuário com este cargo')
      ).toBeVisible();
    });

    test('recusa o nome repetido com o toast do servidor, um só', async ({
      page,
    }) => {
      await page.goto('/roles/create');
      await page.getByLabel('Nome').fill(editableName);
      await page.getByRole('checkbox', { name: 'Visualizar usuários' }).click();
      await page.getByRole('button', { name: 'Criar cargo' }).click();

      const refusal = toastWith(page, 'Já existe um cargo com este nome.');
      await expect(refusal).toBeVisible();
      expect(await page.locator('[data-sonner-toast]').count()).toBe(1);
      await expect(page).toHaveURL(/\/roles\/create$/);
    });

    test('edita as permissões e o servidor guarda a expansão para leitura', async ({
      page,
    }) => {
      await page.goto(`/roles/${editableRoleId}`);
      await page
        .getByRole('checkbox', { name: 'Editar configurações' })
        .click();
      await expect(
        page.getByRole('checkbox', { name: 'Visualizar configurações' })
      ).toBeChecked();

      const saved = page.waitForResponse(
        isRoleWrite('PUT', `/client/roles/${editableRoleId}`)
      );
      await page.getByRole('button', { name: 'Salvar alterações' }).click();
      const response = await saved;
      expect(response.status()).toBe(200);
      const { role } = (await response.json()) as {
        role: { permissions: { name: string }[] };
      };
      expect(role.permissions.map((permission) => permission.name)).toEqual([
        'backoffice.systemConfigs.read',
        'backoffice.systemConfigs.update',
        'backoffice.users.read',
      ]);
      await expect(toastWith(page, 'Cargo atualizado.')).toHaveCount(1);
      await expect(
        page.getByRole('button', { name: 'Excluir cargo' })
      ).toBeVisible();

      await page.reload();
      const read = page.getByRole('checkbox', {
        name: 'Visualizar configurações',
      });
      await expect(read).toBeChecked();
      await expect(read).toBeDisabled();
      await expect(
        page.getByRole('checkbox', { name: 'Editar configurações' })
      ).toBeChecked();
    });

    test('vincula um usuário pela aba "Usuários", com a busca do servidor', async ({
      page,
    }) => {
      await page.goto(`/roles/${editableRoleId}?tab=users`);
      await page.getByLabel('Usuários do cargo').click();
      const searched = page.waitForResponse(
        (response) =>
          response.request().method() === 'GET' &&
          response.url().startsWith(serverApiUrl('/client/users?')) &&
          new URL(response.url()).searchParams.get('search') === candidate.name
      );
      await page
        .getByRole('textbox', { name: 'Buscar...' })
        .fill(candidate.name);
      expect((await searched).status()).toBe(200);
      await page.getByRole('checkbox', { name: candidate.name }).click();
      await page.keyboard.press('Escape');

      await expect(
        page.locator('tbody tr', { hasText: candidate.email })
      ).toBeVisible();

      const saved = page.waitForResponse(
        isRoleWrite('PUT', `/client/roles/${editableRoleId}/users`)
      );
      await page.getByRole('button', { name: 'Salvar alterações' }).click();
      const response = await saved;
      expect(response.status()).toBe(200);
      expect(response.request().postDataJSON()).toEqual({
        userIds: [candidate.id],
      });
      await expect(
        toastWith(page, 'Usuários do cargo atualizados.')
      ).toBeVisible();

      await page.reload();
      await expect(
        page.locator('tbody tr', { hasText: candidate.email })
      ).toBeVisible();
    });

    // A aba "Usuários" grava o conjunto completo: ela parte do que o servidor
    // tem depois de uma troca feita na tela de usuários, não do que ela leu
    // antes (o cache é relido na troca).
    test('o vínculo feito na tela de usuários aparece no cargo, sem recarregar', async ({
      page,
    }) => {
      await page.goto(`/roles/${transferRoleId}?tab=users`);
      await expect(
        page.getByText('Nenhum usuário com este cargo')
      ).toBeVisible();
      await markDocument(page);

      await openFromSidebar(page, 'Usuários');
      await searchList(page, transferred.name);
      await page.locator('tbody tr', { hasText: transferred.email }).click();
      await page.getByRole('tab', { name: 'Cargos' }).click();
      await pickUserRole(page, transferName);
      const saved = page.waitForResponse(
        isRoleWrite('PUT', `/client/users/${transferred.id}/roles`)
      );
      await page.getByRole('button', { name: 'Salvar alterações' }).click();
      expect((await saved).status()).toBe(200);

      await openFromSidebar(page, 'Cargos');
      await searchList(page, transferName);
      await rowNamed(page, transferName).click();
      await page.getByRole('tab', { name: 'Usuários' }).click();

      await expect(
        page.locator('tbody tr', { hasText: transferred.email })
      ).toBeVisible();
      expect(await isSameDocument(page)).toBe(true);
    });

    test('copia um cargo pela lista e abre a cópia', async ({ page }) => {
      await page.goto(rolesUrl(sourceName));
      const copied = page.waitForResponse(isCopyResponse);
      await chooseRowAction(page, sourceName, 'Copiar');
      expect((await copied).status()).toBe(201);

      await expect(toastWith(page, 'Cargo copiado.')).toBeVisible();
      await expect(page).toHaveURL(/\/roles\/[0-9a-f-]+$/);
      await expect(page.getByLabel('Nome')).toHaveValue(
        `${sourceName} (cópia)`
      );
      await expect(
        page.getByRole('checkbox', { name: 'Visualizar trilha de auditoria' })
      ).toBeChecked();
    });

    // A regra é do servidor: o toast é o dele, um só, e a confirmação fica
    // aberta.
    test('exclui com confirmação, e recusa o cargo com usuários vinculados', async ({
      page,
    }) => {
      await page.goto(rolesUrl(linkedName));
      await chooseRowAction(page, linkedName, 'Excluir');
      const dialog = page.getByRole('alertdialog');
      await expect(dialog).toContainText('Excluir cargo?');
      await dialog.getByRole('button', { name: 'Excluir' }).click();

      await expect(
        toastWith(
          page,
          'Este cargo está vinculado a 1 usuário. Desvincule-os antes de excluir.'
        )
      ).toBeVisible();
      expect(await page.locator('[data-sonner-toast]').count()).toBe(1);
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Cancelar' }).click();
      await expect(rowNamed(page, linkedName)).toBeVisible();

      await page.goto(rolesUrl(doomedName));
      await chooseRowAction(page, doomedName, 'Excluir');
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Excluir' })
        .click();

      await expect(toastWith(page, 'Cargo excluído.')).toBeVisible();
      await expect(rowNamed(page, doomedName)).toHaveCount(0);
      await expect(page.getByText('Nenhum cargo encontrado.')).toBeVisible();
    });

    test('o Administrador aparece só para leitura, sem ações', async ({
      page,
    }) => {
      await page.goto(rolesUrl('Administrador'));
      const row = rowNamed(page, 'Administrador');
      await expect(row).toContainText('Sistema');
      await expect(row.getByRole('button', { name: 'Abrir menu' })).toHaveCount(
        0
      );
      await row.click();

      await expect(page).toHaveURL(/\/roles\/[0-9a-f-]+$/);
      await expect(page.getByText('Cargo do sistema').first()).toBeVisible();
      await expect(page.getByLabel('Nome')).toHaveAttribute('readonly', '');
      await expect(
        page.getByRole('checkbox', { name: 'Editar usuário' })
      ).toBeDisabled();
      for (const action of [
        'Excluir cargo',
        'Copiar cargo',
        'Salvar alterações',
      ]) {
        await expect(page.getByRole('button', { name: action })).toHaveCount(0);
      }
    });
  });

  // Anti-escalonamento: quem gerencia cargos sem ter a trilha de auditoria não
  // a concede. A tela a mostra desabilitada; o caminho que ela não trava (a
  // cópia de um cargo que a tem) é recusado pelo servidor, com o toast dele.
  test.describe('como gestor', () => {
    test.use({ storageState: MANAGER_STORAGE_STATE });

    test('a permissão que o gestor não tem aparece desabilitada, com a explicação', async ({
      page,
    }) => {
      await page.goto('/roles/create');

      await expect(
        page.getByRole('checkbox', { name: 'Visualizar trilha de auditoria' })
      ).toBeDisabled();
      await expect(
        page.getByText('Você não tem esta permissão.').first()
      ).toBeVisible();
      await expect(
        page.getByRole('checkbox', { name: 'Criar cargo' })
      ).toBeEnabled();
    });

    test('o servidor recusa copiar um cargo com permissão que o gestor não tem', async ({
      page,
    }) => {
      await page.goto(rolesUrl(sourceName));
      const refused = page.waitForResponse(isCopyResponse);
      await chooseRowAction(page, sourceName, 'Copiar');
      expect((await refused).status()).toBe(403);

      await expect(
        toastWith(page, 'Você não pode conceder permissões que não possui.')
      ).toBeVisible();
      expect(await page.locator('[data-sonner-toast]').count()).toBe(1);
      await expect(page).toHaveURL(/\/roles\?/);
      // Sem `backoffice.roles.delete`: o menu só copia.
      await rowNamed(page, sourceName)
        .getByRole('button', { name: 'Abrir menu' })
        .click();
      await expect(page.getByRole('menuitem', { name: 'Excluir' })).toHaveCount(
        0
      );
    });

    // Por último: o gestor sai daqui sem `backoffice.roles.create`. Retirar
    // do próprio cargo é permitido; a sessão é relida e a tela segue as
    // permissões novas sem recarregar.
    test('editar o próprio cargo muda na hora o que a tela oferece', async ({
      page,
    }) => {
      await page.goto(`/roles/${managerRoleId}`);
      await expect(page.getByLabel('Nome')).toHaveValue(managerRoleName);
      await expect(
        page.getByRole('button', { name: 'Copiar cargo' })
      ).toBeVisible();
      await markDocument(page);

      await page.getByRole('checkbox', { name: 'Criar cargo' }).click();
      const saved = page.waitForResponse(
        isRoleWrite('PUT', `/client/roles/${managerRoleId}`)
      );
      const reread = page.waitForResponse(isSessionRead);
      await page.getByRole('button', { name: 'Salvar alterações' }).click();
      expect((await saved).status()).toBe(200);
      const session = await reread;
      expect(session.status()).toBe(200);
      const { user } = (await session.json()) as {
        user: { permissions: string[] };
      };
      expect(user.permissions).not.toContain('backoffice.roles.create');

      await expect(toastWith(page, 'Cargo atualizado.')).toHaveCount(1);
      await expect(
        page.getByRole('button', { name: 'Copiar cargo' })
      ).toHaveCount(0);
      const create = page.getByRole('checkbox', { name: 'Criar cargo' });
      await expect(create).toBeDisabled();
      await expect(create).toHaveAccessibleDescription(
        'Você não tem esta permissão.'
      );
      expect(await isSameDocument(page)).toBe(true);
    });
  });
});
