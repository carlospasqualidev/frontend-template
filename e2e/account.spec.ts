import {
  expect,
  request,
  test,
  type APIRequestContext,
  type Page,
  type Response,
} from '@playwright/test';

import {
  createUserWithoutRole,
  deleteUser,
  newAdminApiContext,
  readSystemConfigValue,
  serverApiUrl,
  uniqueSuffix,
  type PreparedUser,
} from './helpers/serverApi';
import {
  openSession,
  signInThroughApi,
  type SessionState,
} from './helpers/session';

function toastWith(page: Page, text: string) {
  return page.locator('[data-sonner-toast]', { hasText: text });
}

function cardTitled(page: Page, title: string) {
  return page.locator('[data-slot="card"]', {
    has: page.locator('[data-slot="card-title"]', { hasText: title }),
  });
}

function isMeResponse(method: string, path: string) {
  return (response: Response) =>
    response.request().method() === method &&
    response.url() === serverApiUrl(path);
}

/**
 * Volta à senha original pela API, com a sessão da pessoa, quando o teste
 * parou antes de a tela destrocar. Idempotente: o 400 ("Senha atual
 * incorreta.") diz que a troca não chegou a acontecer, e a senha já é a
 * original. A conferência é `expect.soft`, para não esconder a falha que
 * interrompeu o teste.
 */
async function restorePassword(
  session: SessionState,
  changedTo: string,
  original: string
): Promise<void> {
  const context = await request.newContext({ storageState: session });
  try {
    const response = await context.put(
      serverApiUrl('/client/users/me/password'),
      {
        data: {
          currentPassword: changedTo,
          password: original,
          confirmPassword: original,
        },
      }
    );
    expect.soft([200, 400]).toContain(response.status());
  } finally {
    await context.dispose();
  }
}

// Minha conta contra o server real, com uma pessoa criada no preparo (sem
// cargo: o autoatendimento só exige a sessão). Ela edita o próprio perfil e
// troca a própria senha, por isso não é o gestor do `globalSetup`: a sessão
// dela é aberta uma vez pela API (um login, em `SPEC_LOGIN_COUNT`) e
// reaproveitada; a pessoa é excluída no fim, então o spec roda quantas vezes
// for preciso contra o mesmo banco.
test.describe('Minha conta', () => {
  const suffix = uniqueSuffix();

  let admin: APIRequestContext | undefined;
  let person: PreparedUser | undefined;
  let session: SessionState | undefined;

  test.beforeAll(async () => {
    admin = await newAdminApiContext();
    person = await createUserWithoutRole(admin, `Pessoa Conta ${suffix}`);
    session = await signInThroughApi(person);
  });

  test.afterAll(async () => {
    try {
      if (admin && person) await deleteUser(admin, person.id);
    } finally {
      await admin?.dispose();
    }
  });

  test.beforeEach(async ({ page }) => {
    if (!session) throw new Error('Sessão da pessoa preparada ausente.');
    await openSession(page, session);
  });

  test('Perfil: pré-preenche pelo servidor, salva só o que mudou e atualiza a sessão', async ({
    page,
  }) => {
    if (!person) throw new Error('Pessoa do preparo ausente.');

    const profileRead = page.waitForResponse(
      isMeResponse('GET', '/client/users/me/profile')
    );
    await page.goto('/account');
    expect((await profileRead).status()).toBe(200);

    await expect(page.getByLabel('Nome')).toHaveValue(person.name);
    await expect(page.getByLabel('E-mail')).toHaveValue(person.email);
    await expect(page.getByLabel('E-mail')).toHaveAttribute('readonly', '');

    const newName = `Pessoa Conta Editada ${suffix}`;
    await page.getByLabel('Nome').fill(newName);
    await page.getByLabel('Telefone').fill('(48) 99999-1234');

    const saved = page.waitForResponse(
      isMeResponse('PATCH', '/client/users/me')
    );
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    const response = await saved;
    expect(response.status()).toBe(200);
    // Só os campos alterados vão no corpo (o tempo de inatividade não).
    expect(response.request().postDataJSON()).toEqual({
      name: newName,
      phone: '(48) 99999-1234',
    });

    await expect(toastWith(page, 'Perfil atualizado.')).toHaveCount(1);
    // O usuário da sessão veio da resposta: o menu já mostra o nome novo.
    await expect(
      page.locator('[data-sidebar="sidebar"]').getByText(newName)
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Salvar alterações' })
    ).toHaveCount(0);

    await page.reload();
    await expect(page.getByLabel('Nome')).toHaveValue(newName);
    await expect(page.getByLabel('Telefone')).toHaveValue('(48) 99999-1234');
  });

  test('Perfil: tempo acima do limite da empresa é recusado no campo, sem toast', async ({
    page,
  }) => {
    if (!admin) throw new Error('Sessão do admin ausente.');
    const limit = Number(
      await readSystemConfigValue(admin, 'security.idleTimeoutMinutes')
    );
    test.skip(
      limit >= 480,
      'O limite da empresa já é o máximo do campo: não há valor acima dele.'
    );

    await page.goto('/account');
    await page.getByLabel('Tempo de inatividade (min)').fill(String(limit + 1));

    const refused = page.waitForResponse(
      isMeResponse('PATCH', '/client/users/me')
    );
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    const response = await refused;
    expect(response.status()).toBe(400);
    expect(response.request().postDataJSON()).toEqual({
      idleTimeoutMinutes: limit + 1,
    });

    await expect(
      page.getByText(
        `O tempo de inatividade pode ser de no máximo ${limit} minutos, o limite definido pela empresa.`
      )
    ).toBeVisible();
    // Contagem de uma vez, depois de a recusa já estar na tela.
    expect(await page.locator('[data-sonner-toast]').count()).toBe(0);

    await page.getByRole('button', { name: 'Descartar' }).click();
    await expect(page.getByLabel('Tempo de inatividade (min)')).toHaveValue('');
  });

  // A aba inativa desmonta: trocar de aba com o perfil alterado pergunta
  // antes de descartar, pelo mesmo guard de sair da tela. Nada é gravado aqui.
  test('Perfil: trocar de aba com edição não salva pede confirmação', async ({
    page,
  }) => {
    const editedPhone = '(48) 98888-7777';
    await page.goto('/account');
    await page.getByLabel('Telefone').fill(editedPhone);

    const securityTab = page.getByRole('tab', { name: 'Segurança' });
    const dialog = page.getByRole('alertdialog', {
      name: 'Descartar as alterações?',
    });
    await securityTab.click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Continuar editando' }).click();

    await expect(dialog).toBeHidden();
    await expect(page).not.toHaveURL(/tab=security/);
    await expect(page.getByLabel('Telefone')).toHaveValue(editedPhone);

    await securityTab.click();
    await dialog.getByRole('button', { name: 'Descartar alterações' }).click();
    await expect(page).toHaveURL(/tab=security/);
    await expect(
      page.getByRole('button', { name: 'Alterar senha' })
    ).toBeVisible();

    await page.getByRole('tab', { name: 'Perfil' }).click();
    await expect(page.getByLabel('Telefone')).toBeVisible();
    await expect(page.getByLabel('Telefone')).not.toHaveValue(editedPhone);
    await expect(
      page.getByRole('button', { name: 'Salvar alterações' })
    ).toHaveCount(0);
  });

  // A troca é feita e desfeita pela tela; se o teste parar no meio, o
  // `finally` destroca pela API. A pessoa é excluída no fim de qualquer jeito.
  test('Segurança: troca a senha (a atual errada marca o campo) e volta à original', async ({
    page,
  }) => {
    if (!person || !session) throw new Error('Pessoa do preparo ausente.');
    const originalPassword = person.password;
    const newPassword = `nova-${suffix}`;
    let restoredOnScreen = false;

    try {
      await page.goto('/account?tab=security');
      const dialog = page.getByRole('dialog', { name: 'Alterar senha' });

      const changePassword = async (current: string, next: string) => {
        await dialog.getByLabel('Senha atual').fill(current);
        await dialog.getByLabel('Nova senha', { exact: true }).fill(next);
        await dialog.getByLabel('Confirmação da nova senha').fill(next);
        const answered = page.waitForResponse(
          isMeResponse('PUT', '/client/users/me/password')
        );
        await dialog.getByRole('button', { name: 'Alterar senha' }).click();
        return answered;
      };

      await page.getByRole('button', { name: 'Alterar senha' }).click();
      await expect(dialog).toBeVisible();

      const wrong = await changePassword('senha-errada-123', newPassword);
      expect(wrong.status()).toBe(400);
      await expect(dialog.getByText('Senha atual incorreta.')).toBeVisible();
      expect(await page.locator('[data-sonner-toast]').count()).toBe(0);

      const changed = await changePassword(originalPassword, newPassword);
      expect(changed.status()).toBe(200);
      expect(changed.request().postDataJSON()).toEqual({
        currentPassword: originalPassword,
        password: newPassword,
        confirmPassword: newPassword,
      });
      await expect(toastWith(page, 'Senha alterada.')).toBeVisible();
      await expect(dialog).toBeHidden();

      // A sessão continua aberta, e a senha nova é a que o servidor confere.
      await page.getByRole('button', { name: 'Alterar senha' }).click();
      const restored = await changePassword(newPassword, originalPassword);
      restoredOnScreen = restored.status() === 200;
      expect(restored.status()).toBe(200);
      await expect(dialog).toBeHidden();
    } finally {
      if (!restoredOnScreen) {
        await restorePassword(session, newPassword, originalPassword);
      }
    }
  });

  test('o que não tem servidor mostra o aviso de demonstração', async ({
    page,
  }) => {
    await page.goto('/account?tab=security');
    await expect(
      cardTitled(page, 'Autenticação em 2 fatores').getByText(
        'Dados de demonstração'
      )
    ).toBeVisible();
    await expect(
      cardTitled(page, 'Sessões ativas').getByText('Dados de demonstração')
    ).toBeVisible();
    await expect(
      cardTitled(page, 'Senha').getByText('Dados de demonstração')
    ).toHaveCount(0);

    await page.goto('/account?tab=notifications');
    await expect(
      page.getByRole('note', { name: 'Dados de demonstração' })
    ).toBeVisible();

    await page.goto('/account?tab=billing');
    await expect(
      page.getByRole('note', { name: 'Dados de demonstração' })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Baixar' }).first().click();
    await expect(
      toastWith(page, 'Dados de demonstração: nada foi alterado.')
    ).toBeVisible();

    await page.goto('/account');
    await expect(page.getByLabel('Nome')).toBeVisible();
    await expect(page.getByText('Dados de demonstração')).toHaveCount(0);
  });
});
