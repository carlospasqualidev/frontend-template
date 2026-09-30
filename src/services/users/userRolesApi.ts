import { z } from 'zod';

import { api } from '@/services/api';
import {
  userMutationResponseSchema,
  type UserMutationResponse,
} from '@/services/users/types';

/*
 * Cargos do usuário e os dados de cargo que a tela de usuários lê
 * (`../server-template/docs/openapi.json`). As rotas de `/client/roles` exigem
 * `backoffice.roles.read`; `PUT /client/users/:userId/roles`, só
 * `backoffice.users.update`. Quem pode dar qual cargo (anti-escalonamento, o
 * `Administrador`, os próprios cargos, o último administrador) é do servidor:
 * a recusa chega com `message` e vira o toast do interceptor.
 *
 * Quando existir a tela de cargos, as chamadas de `/client/roles` vão para
 * `services/roles/`.
 */

const roleOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
});

export type RoleOption = z.infer<typeof roleOptionSchema>;

const roleOptionsResponseSchema = z.object({
  roles: z.array(roleOptionSchema),
  count: z.number(),
});

// Uma página de opções por busca: quem procura um cargo digita o nome.
const ROLE_OPTIONS_PAGE_SIZE = 20;

/**
 * Opções de cargo (`GET /client/roles`): os primeiros por nome que casam
 * `search` (o nome contém o termo), pela busca do servidor, para empresa com
 * qualquer número de cargos.
 */
export async function searchRoleOptions(search: string): Promise<RoleOption[]> {
  const response = await api.get<unknown>('/client/roles', {
    params: {
      page: 0,
      pageSize: ROLE_OPTIONS_PAGE_SIZE,
      search: search || undefined,
      orderBy: 'name',
      order: 'asc',
    },
  });
  return roleOptionsResponseSchema.parse(response).roles;
}

const roleDetailSchema = roleOptionSchema.extend({
  /** Em ordem alfabética do nome (`modulo.entidade.acao`). */
  permissions: z.array(z.object({ id: z.string(), name: z.string() })),
});

export type RoleDetail = z.infer<typeof roleDetailSchema>;

const roleDetailResponseSchema = z.object({ role: roleDetailSchema });

/**
 * Cargo com as permissões: `GET /client/roles/:roleId`. Id fora do formato
 * (400) e cargo inexistente ou excluído (404) voltam sem toast
 * (`silentError`): o cargo de um link antigo (o filtro "Cargos" da URL) sai
 * do filtro e da URL, e a aba "Cargos" diz na própria seção que não carregou.
 */
export async function fetchRoleDetail(roleId: string): Promise<RoleDetail> {
  const response = await api.get<unknown>(
    `/client/roles/${encodeURIComponent(roleId)}`,
    { silentError: [400, 404] }
  );
  return roleDetailResponseSchema.parse(response).role;
}

const catalogPermissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  action: z.string(),
  label: z.string(),
});

const permissionCatalogSchema = z.object({
  modules: z.array(
    z.object({
      module: z.string(),
      moduleLabel: z.string(),
      groups: z.array(
        z.object({
          groupLabel: z.string(),
          permissions: z.array(catalogPermissionSchema),
        })
      ),
    })
  ),
});

export type PermissionCatalog = z.infer<typeof permissionCatalogSchema>;

/**
 * Catálogo de permissões (`GET /client/roles/permissions`): módulo → grupo →
 * permissões, na ordem de exibição, com o rótulo pt-BR de cada uma. É de onde
 * a tela tira o rótulo das permissões de um cargo.
 */
export async function fetchPermissionCatalog(): Promise<PermissionCatalog> {
  const response = await api.get<unknown>('/client/roles/permissions');
  return permissionCatalogSchema.parse(response);
}

/**
 * Define os cargos do usuário (conjunto completo): `PUT
 * /client/users/:userId/roles` → `{ message, user }`, com os cargos que valem.
 */
export async function setUserRoles(
  userId: string,
  roleIds: string[]
): Promise<UserMutationResponse> {
  const response = await api.put<unknown>(
    `/client/users/${encodeURIComponent(userId)}/roles`,
    { roleIds }
  );
  return userMutationResponseSchema.parse(response);
}
