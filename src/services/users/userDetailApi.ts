import { z } from 'zod';

import { api } from '@/services/api';
import { companyUserSchema } from '@/services/users/types';

const userDetailResponseSchema = z.object({ user: companyUserSchema });

export type UserDetailResponse = z.infer<typeof userDetailResponseSchema>;

/**
 * `GET /client/users/:userId` → `{ user }` (exige `backoffice.users.read`).
 *
 * Id fora do formato (400) e usuário inexistente, excluído ou de outra empresa
 * (404) voltam sem toast (`silentError`): quem chama mostra "usuário não
 * encontrado". Outras falhas (403, 5xx, rede) seguem com o toast.
 */
export async function fetchUser(userId: string): Promise<UserDetailResponse> {
  const response = await api.get<unknown>(
    `/client/users/${encodeURIComponent(userId)}`,
    { silentError: [400, 404] }
  );
  return userDetailResponseSchema.parse(response);
}
