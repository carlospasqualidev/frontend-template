import { isAxiosError } from 'axios';
import { z } from 'zod';

import { api } from '@/services/api';
import { extractResponseIssues } from '@/services/api/types';
import {
  userMutationResponseSchema,
  type UserMutationResponse,
} from '@/services/users/types';

/*
 * Criação, edição, bloqueio e exclusão de usuários
 * (`../server-template/docs/openapi.json`). O `message` das respostas vira o
 * toast de sucesso no interceptor do `api`: quem chama não soma outro. Regras
 * (último administrador, o próprio usuário, permissões) são do servidor, que
 * responde com `message` pronto para o toast.
 */

const USERS_PATH = '/client/users';

function userPath(userId: string): string {
  return `${USERS_PATH}/${encodeURIComponent(userId)}`;
}

/** Corpo de `POST /client/users`: o usuário nasce ativo e sem cargo. */
export interface CreateUserBody {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string | null;
  /** URL `https:` da foto (o `Location` do upload), ou `null`. */
  image: string | null;
  /** Minutos (1 a 480); `null` herda o da empresa. */
  idleTimeoutMinutes: number | null;
}

/** Corpo de `PATCH /client/users/:userId`: só os campos enviados mudam. */
export interface UpdateUserBody {
  name?: string;
  phone?: string | null;
  image?: string | null;
  idleTimeoutMinutes?: number | null;
}

/**
 * `POST /client/users` → `{ message, user }`. O 400 de validação volta sem
 * toast (`silentError`): o `message` dele abre com o caminho técnico
 * (`email: ...`), e o formulário marca o campo pelos `issues`
 * (`findUserFormIssues`). O 409 (e-mail já cadastrado) e as demais falhas
 * seguem com o toast.
 */
export async function createUser(
  body: CreateUserBody
): Promise<UserMutationResponse> {
  const response = await api.post<unknown>(USERS_PATH, body, {
    silentError: [400],
  });
  return userMutationResponseSchema.parse(response);
}

/** `PATCH /client/users/:userId` com os campos do formulário; 400 como na criação. */
export async function updateUser(
  userId: string,
  body: UpdateUserBody
): Promise<UserMutationResponse> {
  const response = await api.patch<unknown>(userPath(userId), body, {
    silentError: [400],
  });
  return userMutationResponseSchema.parse(response);
}

/**
 * Bloqueia (`false`) ou desbloqueia (`true`): `PATCH /client/users/:userId`
 * só com `isActive`. A recusa (o último administrador ativo) vem com `message`
 * e vira o toast do interceptor.
 */
export async function setUserActive(
  userId: string,
  isActive: boolean
): Promise<UserMutationResponse> {
  const response = await api.patch<unknown>(userPath(userId), { isActive });
  return userMutationResponseSchema.parse(response);
}

const deleteUserResponseSchema = z.object({ message: z.string() });

/**
 * `DELETE /client/users/:userId` (exclusão lógica). O servidor recusa o
 * próprio usuário e o último administrador ativo, com o `message` no toast.
 */
export async function deleteUser(userId: string): Promise<void> {
  const response = await api.delete<unknown>(userPath(userId));
  deleteUserResponseSchema.parse(response);
}

/** Campos do formulário de usuário que o servidor pode apontar num 400. */
export type UserFormField =
  | 'name'
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'phone'
  | 'image'
  | 'idleTimeoutMinutes';

function toUserFormField(path: string): UserFormField | undefined {
  switch (path) {
    case 'name':
    case 'email':
    case 'password':
    case 'confirmPassword':
    case 'phone':
    case 'image':
    case 'idleTimeoutMinutes':
      return path;
    default:
      return undefined;
  }
}

export interface UserFormIssue {
  field: UserFormField;
  message: string;
}

/**
 * Os `issues` de um 400 da criação ou da edição que apontam um campo do
 * formulário (o `path` do contrato é o próprio nome do campo). Lista vazia
 * quando o erro não é HTTP ou nenhum `issue` aponta um campo conhecido: aí
 * quem chama mostra o `message` no toast.
 */
export function findUserFormIssues(error: unknown): UserFormIssue[] {
  if (!isAxiosError(error)) return [];

  return extractResponseIssues(error.response?.data).flatMap(
    ({ path, message }) => {
      const field = toUserFormField(path);
      return field ? [{ field, message }] : [];
    }
  );
}
