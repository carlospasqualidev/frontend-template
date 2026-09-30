import { z } from 'zod';

import { api } from '@/services/api';
import {
  roleMutationResponseSchema,
  type RoleMutationResponse,
} from '@/services/roles/types';

/*
 * Usuários de um cargo (`../server-template/docs/openapi.json`). A leitura
 * (`GET /client/roles/:roleId/users`) exige `backoffice.roles.read` e
 * `backoffice.users.read` (expõe nome e e-mail); a troca
 * (`PUT /client/roles/:roleId/users`), `backoffice.roles.update` e
 * `backoffice.users.update`.
 */

/** Usuário do cargo, no formato da listagem do servidor. */
const roleMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  /** `true` ativo, `false` bloqueado (os bloqueados continuam no cargo). */
  isActive: z.boolean(),
});

export type RoleMember = z.infer<typeof roleMemberSchema>;

const roleMembersPageSchema = z.object({
  users: z.array(roleMemberSchema),
  count: z.number(),
});

/** O servidor aceita no máximo 1000 ids no corpo do `PUT`. */
export const MAX_ROLE_MEMBERS = 1000;

// A página máxima do servidor; as páginas se somam até o total.
const MEMBERS_PAGE_SIZE = 100;

export interface RoleMembers {
  /** Os usuários do cargo, em ordem de nome (até `MAX_ROLE_MEMBERS`). */
  users: RoleMember[];
  /** O total do servidor: maior que `users.length` quando passou do máximo. */
  count: number;
}

function roleUsersPath(roleId: string): string {
  return `/client/roles/${encodeURIComponent(roleId)}/users`;
}

/**
 * Todos os usuários do cargo, página a página (`GET
 * /client/roles/:roleId/users`, 100 por vez), até `MAX_ROLE_MEMBERS`: a troca
 * (`setRoleUsers`) manda o conjunto completo. O 400 e o 404 (cargo que não
 * existe) voltam sem toast, como a leitura do cargo, que a tela mostra como
 * "Cargo não encontrado".
 */
export async function fetchAllRoleUsers(roleId: string): Promise<RoleMembers> {
  const users: RoleMember[] = [];
  let count = 0;

  for (let page = 0; page * MEMBERS_PAGE_SIZE < MAX_ROLE_MEMBERS; page += 1) {
    const response = await api.get<unknown>(roleUsersPath(roleId), {
      params: {
        page,
        pageSize: MEMBERS_PAGE_SIZE,
        orderBy: 'name',
        order: 'asc',
      },
      silentError: [400, 404],
    });
    const result = roleMembersPageSchema.parse(response);
    users.push(...result.users);
    count = result.count;

    if (result.users.length < MEMBERS_PAGE_SIZE || users.length >= count) {
      break;
    }
  }

  return { users, count };
}

/**
 * Define os usuários do cargo (conjunto completo): `PUT
 * /client/roles/:roleId/users` → `{ message, role }`. As recusas (incluir ou
 * retirar a si mesmo, o `Administrador`, incluir alguém num cargo com
 * permissão que o autor não tem) chegam com `message` e viram o toast.
 */
export async function setRoleUsers(
  roleId: string,
  userIds: string[]
): Promise<RoleMutationResponse> {
  const response = await api.put<unknown>(roleUsersPath(roleId), { userIds });
  return roleMutationResponseSchema.parse(response);
}
