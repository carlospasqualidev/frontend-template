import {
  expect,
  request,
  type APIRequestContext,
  type Response,
} from '@playwright/test';

import type { LoginCredentials } from './session';

/*
 * Preparo e limpeza de dado dos E2E contra o server real (`e2e/api/`,
 * `npm run test:e2e:api`). Os specs dirigem o app como uma pessoa; só o preparo
 * fala com a API direto, por aqui, com a sessão do admin do seed aberta uma vez
 * pelo `e2e/api/globalSetup.ts`.
 *
 * Tudo o que um spec cria tem sufixo único e é desfeito no `afterAll`: o spec
 * roda quantas vezes for preciso contra o mesmo banco de desenvolvimento.
 */

/** URL da API do server: a mesma que o `playwright.api.config.ts` passa ao Vite. */
export const SERVER_API_URL =
  process.env.VITE_API_URL ?? 'http://localhost:8080/api';

/** Usuários do seed do `../server-template` (`npm run db:seed`). */
export const SEED_ADMIN: LoginCredentials = {
  email: 'admin@admin.com',
  password: '123123123',
};

export const SEED_BLOCKED: LoginCredentials = {
  email: 'blocked@admin.com',
  password: '123123123',
};

/**
 * Guarda a sessão do admin (cookie `token`) aberta pelo `globalSetup`. Vai por
 * `process.env`, que o Playwright repassa aos workers dos specs.
 */
export function storeAdminStorageState(storageState: string): void {
  process.env.E2E_API_ADMIN_STORAGE_STATE = storageState;
}

export function serverApiUrl(path: string): string {
  return `${SERVER_API_URL.replace(/\/+$/, '')}${path}`;
}

/** A resposta é a do login (POST), não a de outra chamada da tela. */
export function isLoginResponse(response: Response): boolean {
  return (
    response.request().method() === 'POST' &&
    response.url() === serverApiUrl('/client/session/login')
  );
}

export function isValidateResponse(response: Response): boolean {
  return (
    response.request().method() === 'GET' &&
    response.url() === serverApiUrl('/client/users/me')
  );
}

/** Cliente HTTP com a sessão do admin do seed, para preparar e limpar dado. */
export async function newAdminApiContext(): Promise<APIRequestContext> {
  const storageState = process.env.E2E_API_ADMIN_STORAGE_STATE;

  if (!storageState) {
    throw new Error(
      'Sessão do admin ausente: rode pelo `npm run test:e2e:api`, que abre a sessão no globalSetup.'
    );
  }

  return request.newContext({ storageState: JSON.parse(storageState) });
}

export interface PreparedUser extends LoginCredentials {
  id: string;
  name: string;
}

function uniqueSuffix(): string {
  return `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Cria, pelo admin, um usuário ativo SEM cargo (`POST /users` não vincula
 * cargo) e sem tempo de inatividade próprio (herda o da empresa).
 */
export async function createUserWithoutRole(
  admin: APIRequestContext
): Promise<PreparedUser> {
  const suffix = uniqueSuffix();
  const name = 'Pessoa Sem Cargo';
  const email = `e2e.sem.cargo.${suffix}@example.com`;
  const password = `senha-${suffix}`;

  const response = await admin.post(serverApiUrl('/client/users'), {
    data: { name, email, password, confirmPassword: password },
  });
  await expect(response).toBeOK();

  const { user } = (await response.json()) as { user: { id: string } };
  return { id: user.id, name, email, password };
}

/** Exclusão lógica do usuário criado no preparo. */
export async function deleteUser(
  admin: APIRequestContext,
  userId: string
): Promise<void> {
  const response = await admin.delete(serverApiUrl(`/client/users/${userId}`));
  await expect(response).toBeOK();
}

export async function readSystemConfigValue(
  admin: APIRequestContext,
  key: string
): Promise<string> {
  const response = await admin.get(serverApiUrl('/client/system-configs'));
  await expect(response).toBeOK();

  const { systemConfigs } = (await response.json()) as {
    systemConfigs: { key: string; value: string }[];
  };
  const config = systemConfigs.find((item) => item.key === key);

  if (!config) {
    throw new Error(`Configuração ${key} ausente em GET /system-configs.`);
  }

  return config.value;
}

export async function writeSystemConfigValue(
  admin: APIRequestContext,
  key: string,
  value: string
): Promise<void> {
  const response = await admin.patch(serverApiUrl('/client/system-configs'), {
    data: { items: [{ key, value }] },
  });
  await expect(response).toBeOK();
}
