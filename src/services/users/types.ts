import { z } from 'zod';

/*
 * Usuário do CRUD de usuários (`../server-template/docs/openapi.json`): o mesmo
 * objeto em `GET /client/users` (cada item), `GET /client/users/:userId`,
 * `POST /client/users`, `PATCH /client/users/:userId` e
 * `PUT /client/users/:userId/roles`.
 *
 * Não confunda com o usuário da SESSÃO (`IUser`, `types/user/types.ts`): aqui
 * `idleTimeoutMinutes` é o valor PRÓPRIO do cadastro (`null` herda o da
 * empresa) e não há `permissions`. Nunca grave este usuário no store da sessão.
 */

/** Cargo do usuário: os que valem, em ordem alfabética do nome. */
export const userRoleSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type UserRole = z.infer<typeof userRoleSchema>;

export const companyUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  phone: z.string().nullable(),
  /** Único campo de status: `true` ativo, `false` bloqueado. */
  isActive: z.boolean(),
  /** Tempo de inatividade próprio, em minutos; `null` herda o da empresa. */
  idleTimeoutMinutes: z.number().int().nullable(),
  /** Última abertura de sessão (ISO 8601 UTC); `null` quando nunca acessou. */
  lastLoginAt: z.string().nullable(),
  roles: z.array(userRoleSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CompanyUser = z.infer<typeof companyUserSchema>;

/** Resposta das mutações que devolvem o usuário (`{ message, user }`). */
export const userMutationResponseSchema = z.object({
  message: z.string(),
  user: companyUserSchema,
});

export type UserMutationResponse = z.infer<typeof userMutationResponseSchema>;
