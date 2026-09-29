import { expect, type Page } from '@playwright/test';

/*
 * Helper de autenticação para os E2E: o único ponto de login dos specs.
 *
 * - `npm run test:e2e` (`playwright.config.ts`): MODO FAKE de sessão
 *   (`VITE_SESSION_MODE=fake`, ver `src/services/session/fakeSessionService.ts`).
 *   Não há backend, e o `signIn` aceita QUALQUER e-mail válido + senha não
 *   vazia, gravando um cookie de sessão fictício com as permissões do menu. O
 *   padrão `FAKE_CREDENTIALS` basta.
 * - `npm run test:e2e:api` (`playwright.api.config.ts`, specs em `e2e/api/`):
 *   MODO API, contra o `../server-template` no ar. O login é de verdade e
 *   precisa de credenciais existentes: as do seed (`e2e/helpers/serverApi.ts`)
 *   ou as de um usuário criado no preparo do teste.
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

export const FAKE_CREDENTIALS: LoginCredentials = {
  email: 'tester@example.com',
  password: 'senha-de-teste',
};

/** Preenche e envia o formulário de login, sem esperar o resultado. */
export async function submitLogin(
  page: Page,
  { email, password }: LoginCredentials
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

export async function login(
  page: Page,
  credentials: LoginCredentials = FAKE_CREDENTIALS
): Promise<void> {
  await submitLogin(page, credentials);

  // O login redireciona para a home; espere sair da tela de login.
  await expect(page).not.toHaveURL(/\/login$/);
}
