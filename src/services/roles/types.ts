import { z } from 'zod';

/*
 * Cargo da empresa (`../server-template/docs/openapi.json`, rotas de
 * `/client/roles`). `isSystem` marca o `Administrador`: o servidor não o
 * edita, não o exclui nem o copia, e os usuários dele só mudam pelos cargos de
 * cada usuário.
 */

const roleBaseShape = {
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
  /** Usuários com o cargo (os bloqueados contam; os excluídos, não). */
  usersCount: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
};

/** Cargo na listagem (`GET /client/roles`), com a contagem de permissões. */
export const roleListItemSchema = z.object({
  ...roleBaseShape,
  permissionsCount: z.number().int(),
});

export type RoleListItem = z.infer<typeof roleListItemSchema>;

/**
 * Cargo com as permissões: o mesmo objeto no detalhe
 * (`GET /client/roles/:roleId`) e na resposta de todas as mutações.
 */
export const roleSchema = z.object({
  ...roleBaseShape,
  /** Em ordem alfabética do nome (`modulo.entidade.acao`). */
  permissions: z.array(z.object({ id: z.string(), name: z.string() })),
});

export type Role = z.infer<typeof roleSchema>;

/** Resposta das mutações que devolvem o cargo (`{ message, role }`). */
export const roleMutationResponseSchema = z.object({
  message: z.string(),
  role: roleSchema,
});

export type RoleMutationResponse = z.infer<typeof roleMutationResponseSchema>;
