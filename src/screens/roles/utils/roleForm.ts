import { z } from 'zod';

import { normalizeIds } from '@/screens/roles/utils/permissionTree';
import { type SaveRoleBody } from '@/services/roles/roleFormApi';
import { type Role } from '@/services/roles/types';

/*
 * Formulário de cargo, o mesmo na criação (`/roles/create`) e no detalhe
 * (Detalhe = Edição). As regras de formato espelham as do servidor
 * (`POST /client/roles` e `PUT /client/roles/:roleId`, com as mesmas
 * mensagens): a tela recusa antes de enviar o que o servidor recusaria. Regra
 * de negócio (nome repetido, o `Administrador`, o que o autor pode conceder)
 * continua só no servidor.
 */

export const roleFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome.')
    .min(2, 'O nome precisa ter pelo menos 2 caracteres.')
    .max(120, 'O nome deve ter no máximo 120 caracteres.'),
  /** Vazio = sem descrição (vai como `null`). */
  description: z
    .string()
    .trim()
    .max(500, 'A descrição deve ter no máximo 500 caracteres.'),
  permissionIds: z
    .array(z.string())
    .min(1, 'Selecione ao menos uma permissão para o cargo.'),
  /** Usuários do cargo (ids): a aba "Usuários" do detalhe; a criação não os envia. */
  userIds: z.array(z.string()),
});

export type RoleFormValues = z.input<typeof roleFormSchema>;
export type RoleFormOutput = z.output<typeof roleFormSchema>;

export const EMPTY_ROLE_FORM_VALUES: RoleFormValues = {
  name: '',
  description: '',
  permissionIds: [],
  userIds: [],
};

/**
 * O que o formulário do detalhe tem como ponto de partida: o cargo do cache e
 * os usuários dele (os ids, também do cache).
 */
export interface RoleFormReference {
  role: Role;
  userIds: string[];
}

/** Cargo do servidor → valores do formulário (o que os campos produzem). */
export function roleToFormValues({
  role,
  userIds,
}: RoleFormReference): RoleFormValues {
  return {
    name: role.name,
    description: role.description ?? '',
    permissionIds: normalizeIds(
      role.permissions.map((permission) => permission.id)
    ),
    userIds: normalizeIds(userIds),
  };
}

/** Valores do formulário → corpo de `POST`/`PUT /client/roles`. */
export function toSaveRoleBody(values: RoleFormOutput): SaveRoleBody {
  return {
    name: values.name,
    description: values.description || null,
    permissionIds: values.permissionIds,
  };
}

/** Os dois conjuntos de ids são iguais? */
export function hasSameIds(
  first: readonly string[],
  second: readonly string[]
): boolean {
  const firstSet = new Set(first);
  const secondSet = new Set(second);
  return (
    firstSet.size === secondSet.size &&
    [...secondSet].every((id) => firstSet.has(id))
  );
}

/** Campos que a pessoa edita no detalhe. */
export type EditableRoleField =
  'name' | 'description' | 'permissionIds' | 'userIds';

const EDITABLE_ROLE_FIELDS: readonly EditableRoleField[] = [
  'name',
  'description',
  'permissionIds',
  'userIds',
];

// O valor do campo é o do ponto de partida? Com a mesma normalização do
// envio: nome e descrição sem espaços nas pontas, descrição vazia = `null`,
// permissões e usuários como conjunto.
function matchesReference(
  field: EditableRoleField,
  values: RoleFormValues,
  { role, userIds }: RoleFormReference
): boolean {
  switch (field) {
    case 'name':
      return values.name.trim() === role.name;
    case 'description':
      return (values.description.trim() || null) === role.description;
    case 'permissionIds':
      return hasSameIds(
        values.permissionIds,
        role.permissions.map((permission) => permission.id)
      );
    case 'userIds':
      return hasSameIds(values.userIds, userIds);
  }
}

/** Nome, descrição ou permissões mudaram em relação ao cargo gravado? */
export function hasRoleChanges(
  reference: RoleFormReference,
  values: RoleFormValues
): boolean {
  return (['name', 'description', 'permissionIds'] as const).some(
    (field) => !matchesReference(field, values, reference)
  );
}

/** Os usuários do cargo mudaram em relação aos gravados? */
export function hasMemberChanges(
  reference: RoleFormReference,
  values: RoleFormValues
): boolean {
  return !matchesReference('userIds', values, reference);
}

/**
 * O formulário que partia de `start` passa a partir de `next` (o cargo e os
 * usuários que o cache passou a ter). Devolve os campos que continuam
 * pendentes: os que a pessoa alterou em relação a `start` e que `next` não
 * tem; os outros ficam com o valor de `next`. `undefined` quando `next` não
 * muda nenhum campo do formulário.
 */
export function pendingRoleFieldsOnRebase(
  values: RoleFormValues,
  start: RoleFormReference,
  next: RoleFormReference
): EditableRoleField[] | undefined {
  const nextValues = roleToFormValues(next);
  if (
    EDITABLE_ROLE_FIELDS.every((field) =>
      matchesReference(field, nextValues, start)
    )
  ) {
    return undefined;
  }
  return EDITABLE_ROLE_FIELDS.filter(
    (field) =>
      !matchesReference(field, values, start) &&
      !matchesReference(field, values, next)
  );
}
