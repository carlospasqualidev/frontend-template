import { z } from 'zod';

import { api } from '@/services/api';
import { roleSchema, type Role } from '@/services/roles/types';

/*
 * Leituras do cargo e do catálogo de permissões
 * (`../server-template/docs/openapi.json`), ambas com
 * `backoffice.roles.read`.
 */

const roleDetailResponseSchema = z.object({ role: roleSchema });

/**
 * Cargo com as permissões: `GET /client/roles/:roleId`. Id fora do formato
 * (400) e cargo inexistente, excluído ou de outra empresa (404) voltam sem
 * toast (`silentError`): o detalhe diz "Cargo não encontrado", o cargo de um
 * link antigo (o filtro "Cargos" da lista de usuários) sai do filtro e da URL,
 * e a aba "Cargos" do usuário diz na própria seção que não carregou.
 */
export async function fetchRoleDetail(roleId: string): Promise<Role> {
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

export type CatalogPermission = z.infer<typeof catalogPermissionSchema>;

const catalogGroupSchema = z.object({
  groupLabel: z.string(),
  permissions: z.array(catalogPermissionSchema),
});

export type CatalogGroup = z.infer<typeof catalogGroupSchema>;

const permissionCatalogSchema = z.object({
  modules: z.array(
    z.object({
      module: z.string(),
      moduleLabel: z.string(),
      groups: z.array(catalogGroupSchema),
    })
  ),
});

export type PermissionCatalog = z.infer<typeof permissionCatalogSchema>;

export type CatalogModule = PermissionCatalog['modules'][number];

/**
 * Catálogo de permissões (`GET /client/roles/permissions`): módulo → grupo →
 * permissões, na ordem de exibição, com o rótulo pt-BR de cada módulo, grupo e
 * permissão. É a árvore do formulário de cargo e de onde a aba "Cargos" do
 * usuário tira o rótulo das permissões de um cargo. Igual para toda empresa.
 */
export async function fetchPermissionCatalog(): Promise<PermissionCatalog> {
  const response = await api.get<unknown>('/client/roles/permissions');
  return permissionCatalogSchema.parse(response);
}
