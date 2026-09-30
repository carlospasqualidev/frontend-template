import { z } from 'zod';

import { type DataTableQuery } from '@/components/global/dataTable/useDataTableQuery';
import { dateRangeParams, listParam, textParam } from '@/lib/listQueryParams';
import { api } from '@/services/api';
import { companyUserSchema } from '@/services/users/types';

/*
 * Listagem de usuários (`GET /client/users`, exige `backoffice.users.read`).
 * Busca, filtros, ordenação e paginação são do servidor: a tela só monta os
 * parâmetros (`buildUserListParams`) e exibe o que volta, com o `count` para a
 * paginação exata.
 */

const userListResponseSchema = z.object({
  users: z.array(companyUserSchema),
  count: z.number(),
});

export type UserListResponse = z.infer<typeof userListResponseSchema>;

// Campos ordenáveis (allowlist do servidor).
export type UserListOrderBy = 'name' | 'email' | 'createdAt' | 'lastLoginAt';

export interface UserListParams {
  /** 0-based, como a `DataTable` e o backend. */
  page: number;
  /** Máximo 100 no backend. */
  pageSize: number;
  /** Nome ou e-mail (contém, sem diferenciar maiúsculas). */
  search?: string;
  /** Ids de cargo em `a,b,c`: quem tem qualquer um deles. */
  roleId?: string;
  isActive?: 'true' | 'false';
  /** Cadastrados a partir de (ISO 8601 UTC, inclusivo). */
  createdFrom?: string;
  /** Cadastrados até (ISO 8601 UTC, inclusivo). */
  createdTo?: string;
  orderBy?: UserListOrderBy;
  order?: 'asc' | 'desc';
}

function toOrderBy(columnId: string): UserListOrderBy | undefined {
  switch (columnId) {
    case 'name':
    case 'email':
    case 'createdAt':
    case 'lastLoginAt':
      return columnId;
    default:
      return undefined;
  }
}

function toIsActive(value: unknown): UserListParams['isActive'] {
  switch (value) {
    case 'true':
    case 'false':
      return value;
    default:
      return undefined;
  }
}

function resolveSort(
  sort: DataTableQuery['sort']
): Pick<UserListParams, 'orderBy' | 'order'> {
  const first = sort[0];
  if (!first) return {};

  const orderBy = toOrderBy(first.id);
  if (!orderBy) return {};

  return { orderBy, order: first.desc ? 'desc' : 'asc' };
}

/**
 * Traduz o estado da `DataTable` (URL) para os parâmetros da listagem. As
 * chaves dos filtros da tela: `search`, `roleId`, `isActive` e `createdAt`
 * (intervalo, vira `createdFrom`/`createdTo`). Sem ordenação na tela, vale a do
 * servidor (`name asc`).
 */
export function buildUserListParams(query: DataTableQuery): UserListParams {
  const { filters } = query;
  const createdAt = dateRangeParams(filters.createdAt);

  return {
    page: query.page,
    pageSize: query.pageSize,
    search: textParam(filters.search),
    roleId: listParam(filters.roleId),
    isActive: toIsActive(filters.isActive),
    createdFrom: createdAt.from,
    createdTo: createdAt.to,
    ...resolveSort(query.sort),
  };
}

const USERS_PATH = '/client/users';

/** `GET /client/users` → `{ users, count }`. */
export async function fetchUsers(
  params: UserListParams
): Promise<UserListResponse> {
  const response = await api.get<unknown>(USERS_PATH, { params });
  return userListResponseSchema.parse(response);
}

export interface UserOption {
  id: string;
  name: string;
}

// Opções de um campo de escolha de usuário: poucas por vez, a busca refina.
const USER_OPTIONS_PAGE_SIZE = 20;

/**
 * Opções de um campo que escolhe usuários (ex.: o filtro "Usuário" da
 * auditoria): os primeiros por nome que casam `search` (nome ou e-mail), pela
 * busca do servidor, para empresa com qualquer número de usuários.
 */
export async function searchUserOptions(search: string): Promise<UserOption[]> {
  const { users } = await fetchUsers({
    page: 0,
    pageSize: USER_OPTIONS_PAGE_SIZE,
    search: search || undefined,
    orderBy: 'name',
    order: 'asc',
  });
  return users.map(({ id, name }) => ({ id, name }));
}
