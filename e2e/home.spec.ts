import {
  expect,
  test,
  type APIRequestContext,
  type Page,
  type Response,
} from '@playwright/test';

import {
  createUserWithoutRole,
  deleteUser,
  newAdminApiContext,
  serverApiUrl,
  uniqueSuffix,
  type PreparedUser,
} from './helpers/serverApi';
import { ADMIN_STORAGE_STATE } from './helpers/storageState';

function statCard(page: Page, label: string) {
  return page.locator('article', { hasText: label });
}

function cardTitled(page: Page, title: string) {
  return page.locator('[data-slot="card"]', {
    has: page.locator('[data-slot="card-title"]', { hasText: title }),
  });
}

// A leitura de um número da home: `GET /client/users` com uma linha só.
function isUserCountResponse(withCreatedFrom: boolean) {
  return (response: Response) => {
    if (response.request().method() !== 'GET') return false;
    if (!response.url().startsWith(serverApiUrl('/client/users?'))) {
      return false;
    }
    const params = new URL(response.url()).searchParams;
    return (
      params.get('pageSize') === '1' &&
      params.has('createdFrom') === withCreatedFrom
    );
  };
}

async function countOf(response: Response): Promise<number> {
  expect(response.status()).toBe(200);
  const { count } = (await response.json()) as { count: number };
  return count;
}

// Home do admin contra o server real: os números e a atividade recente vêm do
// servidor (conferidos contra a resposta que a própria tela recebeu, sem
// contagem fixa do banco); o que não tem rota mostra o aviso de demonstração.
// O preparo cria uma pessoa, que entra nos novos do mês e na trilha, e a
// exclui no fim.
test.describe('Home', () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  const suffix = uniqueSuffix();

  let admin: APIRequestContext | undefined;
  let person: PreparedUser | undefined;

  test.beforeAll(async () => {
    admin = await newAdminApiContext();
    person = await createUserWithoutRole(admin, `Pessoa Home ${suffix}`);
  });

  test.afterAll(async () => {
    try {
      if (admin && person) await deleteUser(admin, person.id);
    } finally {
      await admin?.dispose();
    }
  });

  test('números de usuários e atividade recente reais', async ({ page }) => {
    if (!person) throw new Error('Pessoa do preparo ausente.');

    const totalRead = page.waitForResponse(isUserCountResponse(false));
    const newRead = page.waitForResponse(isUserCountResponse(true));
    await page.goto('/');

    const total = await countOf(await totalRead);
    const newThisMonth = await countOf(await newRead);
    // A pessoa do preparo foi cadastrada agora: entra nos dois números.
    expect(total).toBeGreaterThanOrEqual(1);
    expect(newThisMonth).toBeGreaterThanOrEqual(1);
    expect(newThisMonth).toBeLessThanOrEqual(total);

    await expect(statCard(page, 'Usuários totais')).toContainText(
      total.toLocaleString('pt-BR')
    );
    await expect(statCard(page, 'Novos este mês')).toContainText(
      newThisMonth.toLocaleString('pt-BR')
    );
    await expect(
      statCard(page, 'Usuários totais').getByText('Dados de demonstração')
    ).toHaveCount(0);

    const activity = cardTitled(page, 'Atividade recente');
    await expect(activity).toContainText(`Criou o usuário "${person.name}".`);
    await expect(
      activity.getByRole('link', { name: 'Ver auditoria' })
    ).toHaveAttribute('href', '/audit-logs');
  });

  test('o que não tem rota mostra o aviso; os atalhos abrem telas reais', async ({
    page,
  }) => {
    await page.goto('/');

    for (const label of ['Sessões ativas', 'Convites pendentes']) {
      await expect(
        statCard(page, label).getByText('Dados de demonstração')
      ).toBeVisible();
    }
    for (const title of ['Atividade da semana', 'Pendências']) {
      await expect(
        cardTitled(page, title).getByText('Dados de demonstração')
      ).toBeVisible();
    }

    const shortcuts = cardTitled(page, 'Acesso rápido');
    await expect(shortcuts.getByText('Dados de demonstração')).toHaveCount(0);
    await expect(
      shortcuts.getByRole('link', { name: /Configurações/ })
    ).toHaveAttribute('href', '/settings');
    await shortcuts.getByRole('link', { name: /Abrir auditoria/ }).click();
    await expect(page).toHaveURL(/\/audit-logs$/);
  });
});
