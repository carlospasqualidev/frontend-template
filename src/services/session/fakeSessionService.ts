/* -----------------------------------------------------------------------------
 * Sessão FAKE (`VITE_SESSION_MODE=fake`): sem backend
 * -----------------------------------------------------------------------------
 * Usada na demonstração sem servidor, na suíte (Vitest) e nos E2E (Playwright).
 * O "cookie de sessão" aqui é um cookie comum (JS-acessível) que guarda o
 * usuário fictício em base64. Não é HTTP-only — não use em produção.
 *
 * Comportamento:
 *   - signIn(email, password):  aceita QUALQUER credencial válida pelo schema
 *                               (qualquer e-mail e qualquer senha não vazia).
 *                               Grava o cookie e retorna um usuário derivado
 *                               do e-mail informado.
 *   - signUp(name, email, ...): grava o cookie com o nome informado.
 *   - signOut():                limpa o cookie.
 *   - validate():               lê o cookie. Se não houver, lança (assim
 *                               `SessionValidation` redireciona pro /login,
 *                               igual ao backend respondendo 401).
 *
 * O usuário tem o mesmo shape do backend: todas as permissões usadas no menu
 * (`sidebarData`) e `idleTimeoutMinutes` 20 (o padrão do servidor).
 * -------------------------------------------------------------------------- */

import {
  clearFakeSessionCookie,
  readFakeSessionCookie,
  writeFakeSessionCookie,
} from './fakeSessionCookie';

import { sidebarData } from '@/lib/constants/sidebar';
import type {
  ISessionService,
  ISignInService,
  ISignInServiceResponse,
  ISignOutServiceResponse,
  ISignUpService,
  IValidateResponse,
} from '@/services/session/types';
import type { IUser } from '@/types/user/types';

const FAKE_LATENCY_MS = 250;
export const FAKE_IDLE_TIMEOUT_MINUTES = 20;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Todas as permissões que o menu consulta (`permission` e `anyPermission`),
 * sem repetição e em ordem alfabética, como o backend entrega.
 */
function collectMenuPermissions(): string[] {
  const items = [
    ...sidebarData.nav.flatMap((module) => module.items),
    ...sidebarData.links,
  ];
  const permissions = items.flatMap((item) => [
    ...(item.permission ? [item.permission] : []),
    ...(item.anyPermission ?? []),
  ]);
  return [...new Set(permissions)].sort();
}

function deriveNameFromEmail(email: string) {
  const localPart = email.split('@')[0] ?? 'Usuário';
  return localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function buildUser({ name, email }: { name: string; email: string }): IUser {
  return {
    id: `fake-${btoa(email).replace(/=+$/, '')}`,
    name,
    email,
    image: null,
    permissions: collectMenuPermissions(),
    idleTimeoutMinutes: FAKE_IDLE_TIMEOUT_MINUTES,
  };
}

async function signIn({
  email,
  password: _password,
}: ISignInService): Promise<ISignInServiceResponse> {
  await delay(FAKE_LATENCY_MS);
  const user = buildUser({ name: deriveNameFromEmail(email), email });
  writeFakeSessionCookie(user);
  return { success: true, user };
}

async function signUp({
  name,
  email,
  password: _password,
}: ISignUpService): Promise<ISignInServiceResponse> {
  await delay(FAKE_LATENCY_MS);
  const user = buildUser({ name, email });
  writeFakeSessionCookie(user);
  return { success: true, user };
}

async function signOut(): Promise<ISignOutServiceResponse> {
  await delay(FAKE_LATENCY_MS);
  clearFakeSessionCookie();
  return { success: true };
}

async function validate(): Promise<IValidateResponse> {
  await delay(FAKE_LATENCY_MS);
  const user = readFakeSessionCookie();
  if (!user) {
    throw new Error('Sessão fake ausente.');
  }
  return { user };
}

export const fakeSessionService: ISessionService = {
  signIn,
  signUp,
  signOut,
  validate,
};
