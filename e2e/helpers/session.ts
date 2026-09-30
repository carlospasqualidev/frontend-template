import {
  expect,
  request,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

import { serverApiUrl } from './serverApi';

/*
 * Autenticação dos E2E, contra o `../server-template` no ar: o login é de
 * verdade e precisa de credenciais existentes, as do seed
 * (`e2e/helpers/serverApi.ts`) ou as de um usuário criado no preparo do teste.
 *
 * - Sem login, o padrão: `test.use({ storageState: ADMIN_STORAGE_STATE })` (o
 *   admin do seed) ou `MANAGER_STORAGE_STATE` (o gestor, que recebe do spec o
 *   cargo de que ele precisa), de `e2e/helpers/storageState.ts`: as sessões
 *   que o `globalSetup` abriu uma vez. Não gastam o limite de login do server
 *   (10 por minuto por IP).
 * - `login(page, credenciais)`: o login pela tela, só para o spec que prova o
 *   próprio login (a tela, a pessoa sem cargo). Cada chamada soma em
 *   `SPEC_LOGIN_COUNT` (`e2e/globalSetup.ts`), como cada `submitLogin`
 *   recusado de propósito.
 * - `signInThroughApi(credenciais)` + `openSession(page, sessão)`: a sessão de
 *   uma pessoa preparada que não pode ser o gestor (a que troca a própria
 *   senha), aberta uma vez pela API e reaproveitada pelos testes do spec (um
 *   login só, também contado em `SPEC_LOGIN_COUNT`).
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

export type SessionState = Awaited<
  ReturnType<APIRequestContext['storageState']>
>;

/**
 * Abre pela API a sessão de um usuário preparado pelo spec (o cookie
 * HTTP-only que o server grava no login), para vários testes entrarem com ela
 * sem passar pela tela. Gasta UM login do limite do server: soma em
 * `SPEC_LOGIN_COUNT` (`e2e/globalSetup.ts`).
 */
export async function signInThroughApi(
  credentials: LoginCredentials
): Promise<SessionState> {
  const context = await request.newContext();
  try {
    const response = await context.post(serverApiUrl('/client/session/login'), {
      data: credentials,
    });
    await expect(response).toBeOK();
    return await context.storageState();
  } finally {
    await context.dispose();
  }
}

/** Põe no navegador a sessão aberta por `signInThroughApi`. */
export async function openSession(
  page: Page,
  session: SessionState
): Promise<void> {
  await page.context().addCookies(session.cookies);
}
