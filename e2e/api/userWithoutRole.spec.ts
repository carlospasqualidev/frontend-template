import { expect, test, type APIRequestContext } from '@playwright/test';

import {
  createUserWithoutRole,
  deleteUser,
  isLoginResponse,
  newAdminApiContext,
  type PreparedUser,
} from '../helpers/serverApi';
import { login } from '../helpers/session';

// Usuário sem cargo, criado pelo admin (`POST /client/users`) no preparo e
// excluído no fim: o server devolve `permissions: []` e o menu esconde tudo o
// que é gateado por permissão.
test.describe('Usuário sem cargo', () => {
  let admin: APIRequestContext | undefined;
  let user: PreparedUser | undefined;

  test.beforeAll(async () => {
    admin = await newAdminApiContext();
    user = await createUserWithoutRole(admin);
  });

  test.afterAll(async () => {
    // Sem contexto, o `beforeAll` falhou ao criá-lo: nada a desfazer, e o erro
    // original fica sem um TypeError por cima.
    if (admin && user) await deleteUser(admin, user.id);
    await admin?.dispose();
  });

  test('entra e não vê Usuários, Auditoria nem Configurações', async ({
    page,
  }) => {
    if (!user) throw new Error('Usuário do preparo ausente.');

    const signIn = page.waitForResponse(isLoginResponse);
    await login(page, user);

    const { user: sessionUser } = (await (await signIn).json()) as {
      user: { permissions: string[] };
    };
    expect(sessionUser.permissions).toEqual([]);

    await expect(
      page.getByRole('heading', { level: 1, name: /Pessoa$/ })
    ).toBeVisible();

    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar.getByRole('link', { name: 'Início' })).toBeVisible();
    await expect(
      sidebar.getByRole('button', { name: /Administração/ })
    ).toHaveCount(0);
    for (const item of ['Usuários', 'Auditoria', 'Configurações']) {
      await expect(sidebar.getByRole('link', { name: item })).toHaveCount(0);
    }
  });
});
