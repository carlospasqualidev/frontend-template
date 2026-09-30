import { api } from '@/services/api';
import {
  userMutationResponseSchema,
  type UserMutationResponse,
} from '@/services/users/types';

/*
 * Cargos do usuário (`../server-template/docs/openapi.json`):
 * `PUT /client/users/:userId/roles` exige só `backoffice.users.update`. Quem
 * pode dar qual cargo (anti-escalonamento, o `Administrador`, os próprios
 * cargos, o último administrador) é do servidor: a recusa chega com `message`
 * e vira o toast do interceptor. As leituras de cargo (opções, detalhe,
 * catálogo de permissões) ficam em `services/roles/`.
 */

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
