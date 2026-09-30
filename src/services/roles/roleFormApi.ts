import { isAxiosError } from 'axios';
import { z } from 'zod';

import { api } from '@/services/api';
import { extractResponseIssues } from '@/services/api/types';
import {
  roleMutationResponseSchema,
  type RoleMutationResponse,
} from '@/services/roles/types';

/*
 * Criação, edição, cópia e exclusão de cargos
 * (`../server-template/docs/openapi.json`). O `message` das respostas vira o
 * toast de sucesso no interceptor do `api`: quem chama não soma outro. As
 * regras são do servidor, que responde com `message` pronto para o toast: nome
 * repetido (409), o `Administrador` protegido (400), cargo com usuários
 * vinculados (400), conceder permissão que o autor não tem (403).
 */

const ROLES_PATH = '/client/roles';

function rolePath(roleId: string): string {
  return `${ROLES_PATH}/${encodeURIComponent(roleId)}`;
}

/**
 * Corpo de `POST /client/roles` e de `PUT /client/roles/:roleId` (a edição
 * substitui o cargo inteiro: nome, descrição e o conjunto de permissões).
 */
export interface SaveRoleBody {
  name: string;
  /** `null` = sem descrição. */
  description: string | null;
  /** Ao menos uma; o servidor inclui o `read` do grupo de cada escrita. */
  permissionIds: string[];
}

/**
 * `POST /client/roles` → `{ message, role }`. O 400 de validação volta sem
 * toast (`silentError`): o `message` dele abre com o caminho técnico
 * (`name: ...`), e o formulário marca o campo pelos `issues`
 * (`findRoleFormIssues`). O 409 (nome repetido), o 403 (anti-escalonamento) e
 * as demais falhas seguem com o toast.
 */
export async function createRole(
  body: SaveRoleBody
): Promise<RoleMutationResponse> {
  const response = await api.post<unknown>(ROLES_PATH, body, {
    silentError: [400],
  });
  return roleMutationResponseSchema.parse(response);
}

/** `PUT /client/roles/:roleId` com o cargo inteiro; 400 como na criação. */
export async function updateRole(
  roleId: string,
  body: SaveRoleBody
): Promise<RoleMutationResponse> {
  const response = await api.put<unknown>(rolePath(roleId), body, {
    silentError: [400],
  });
  return roleMutationResponseSchema.parse(response);
}

/**
 * `POST /client/roles/:roleId/copy` → `{ message, role }`: um cargo novo com a
 * descrição e as permissões do original, sem os usuários, com o nome
 * `"<nome> (cópia)"` dado pelo servidor.
 */
export async function copyRole(roleId: string): Promise<RoleMutationResponse> {
  const response = await api.post<unknown>(`${rolePath(roleId)}/copy`);
  return roleMutationResponseSchema.parse(response);
}

const deleteRoleResponseSchema = z.object({ message: z.string() });

/**
 * `DELETE /client/roles/:roleId` (exclusão lógica; o nome continua reservado).
 * O servidor recusa o `Administrador` e o cargo com usuários vinculados, com o
 * `message` no toast.
 */
export async function deleteRole(roleId: string): Promise<void> {
  const response = await api.delete<unknown>(rolePath(roleId));
  deleteRoleResponseSchema.parse(response);
}

/** Campos do formulário de cargo que o servidor pode apontar num 400. */
export type RoleFormField = 'name' | 'description' | 'permissionIds';

function toRoleFormField(path: string): RoleFormField | undefined {
  switch (path) {
    case 'name':
    case 'description':
    case 'permissionIds':
      return path;
    default:
      // Um id do lote (`permissionIds.3`) é o campo das permissões.
      return path.startsWith('permissionIds.') ? 'permissionIds' : undefined;
  }
}

export interface RoleFormIssue {
  field: RoleFormField;
  message: string;
}

/**
 * Os `issues` de um 400 da criação ou da edição que apontam um campo do
 * formulário. Lista vazia quando o erro não é HTTP ou nenhum `issue` aponta um
 * campo conhecido: aí quem chama mostra o `message` no toast.
 */
export function findRoleFormIssues(error: unknown): RoleFormIssue[] {
  if (!isAxiosError(error)) return [];

  return extractResponseIssues(error.response?.data).flatMap(
    ({ path, message }) => {
      const field = toRoleFormField(path);
      return field ? [{ field, message }] : [];
    }
  );
}
