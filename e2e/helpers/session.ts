import { expect, type Page } from '@playwright/test';

/*
 * Helper de autenticação para os E2E.
 *
 * Os E2E rodam em MODO FAKE de sessão: o `webServer` do `playwright.config.ts`
 * sobe o Vite com `VITE_SESSION_MODE=fake` (ver
 * `src/services/session/fakeSessionService.ts`). Não há backend, e o `signIn`
 * aceita QUALQUER e-mail válido + senha não vazia, gravando um cookie de sessão
 * fictício com as permissões do menu. Portanto o login no E2E é só preencher o
 * formulário — sem seed de banco, sem usuário fixo, sem stack externa.
 *
 * Para rodar contra o backend real (`VITE_SESSION_MODE=api`), este helper passa
 * a exercitar o login de verdade e precisa de credenciais existentes no seed;
 * mantenha-o como o único ponto de autenticação dos specs.
 */
export async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('tester@example.com');
  await page.getByLabel('Senha').fill('senha-de-teste');
  await page.getByRole('button', { name: 'Entrar' }).click();

  // O login redireciona para a home; espere sair da tela de login.
  await expect(page).not.toHaveURL(/\/login$/);
}
