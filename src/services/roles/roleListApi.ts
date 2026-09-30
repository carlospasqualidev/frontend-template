import { z } from 'zod';

import { type DataTableQuery } from '@/components/global/dataTable/useDataTableQuery';
import { textParam } from '@/lib/listQueryParams';
import { api } from '@/services/api';
import { roleListItemSchema } from '@/services/roles/types';

/*
 * Listagem de cargos (`GET /client/roles`, exige `backoffice.roles.read`).
 * Busca, ordenação e paginação são do servidor: a tela só monta os parâmetros
 * (`buildRoleListParams`) e exibe o que volta, com o `count` para a paginação
 * exata.
 */

const ROLES_PATH = '/client/roles';

const roleListResponseSchema = z.object({
  roles: z.array(roleListItemSchema),
  count: z.number(),
});

export type RoleListResponse = z.infer<typeof roleListResponseSchema>;

/** Campos ordenáveis (allowlist do servidor). */
export type RoleListOrderBy = 'name' | 'createdAt';

export interface RoleListParams {
  /** 0-based, como a `DataTable` e o backend. */
  page: number;
  /** Máximo 100 no backend. */
  pageSize: number;
  /** O nome contém o termo (sem diferenciar maiúsculas). */
  search?: string;
  orderBy?: RoleListOrderBy;
  order?: 'asc' | 'desc';
}

function toOrderBy(columnId: string): RoleListOrderBy | undefined {
  switch (columnId) {
    case 'name':
    case 'createdAt':
      return columnId;
    default:
      return undefined;
  }
}

function resolveSort(
  sort: DataTableQuery['sort']
): Pick<RoleListParams, 'orderBy' | 'order'> {
  const first = sort[0];
  if (!first) return {};

  const orderBy = toOrderBy(first.id);
  if (!orderBy) return {};

  return { orderBy, order: first.desc ? 'desc' : 'asc' };
}

/**
 * Traduz o estado da `DataTable` (URL) para os parâmetros da listagem. O
 * filtro da tela é `search`; sem ordenação na tela, vale a do servidor
 * (`name asc`).
 */
export function buildRoleListParams(query: DataTableQuery): RoleListParams {
  return {
    page: query.page,
    pageSize: query.pageSize,
    search: textParam(query.filters.search),
    ...resolveSort(query.sort),
  };
}

/** `GET /client/roles` → `{ roles, count }`. */
export async function fetchRoles(
  params: RoleListParams
): Promise<RoleListResponse> {
  const response = await api.get<unknown>(ROLES_PATH, { params });
  return roleListResponseSchema.parse(response);
}

const roleOptionSchema = roleListItemSchema.pick({
  id: true,
  name: true,
  description: true,
  isSystem: true,
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
  const response = await api.get<unknown>(ROLES_PATH, {
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
