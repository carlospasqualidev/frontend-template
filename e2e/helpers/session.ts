import { expect, type Page } from '@playwright/test';

import { readAdminStorageState } from './serverApi';

/*
 * Autenticação dos E2E, contra o `../server-template` no ar: o login é de
 * verdade e precisa de credenciais existentes, as do seed
 * (`e2e/helpers/serverApi.ts`) ou as de um usuário criado no preparo do teste.
 *
 * - `openAdminSession(page)`: entra como o admin do seed sem passar pela tela,
 *   com a sessão que o `globalSetup` abriu. É o padrão dos specs que só
 *   precisam de alguém com todas as permissões, e não gasta o limite de login
 *   do server (10 por minuto por IP).
 * - `login(page, credenciais)`: o login pela tela, para o spec que prova o
 *   próprio login ou precisa de outro usuário. Cada chamada soma em
 *   `SPEC_LOGIN_COUNT` (`e2e/globalSetup.ts`).
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

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
  credentials: LoginCredentials
): Promise<void> {
  await submitLogin(page, credentials);

  // O login redireciona para a home; espere sair da tela de login.
  await expect(page).not.toHaveURL(/\/login$/);
}

/**
 * Põe no navegador o cookie HTTP-only da sessão do admin aberta pelo
 * `globalSetup`: a próxima navegação já entra autenticada.
 */
export async function openAdminSession(page: Page): Promise<void> {
  await page.context().addCookies(readAdminStorageState().cookies);
}
