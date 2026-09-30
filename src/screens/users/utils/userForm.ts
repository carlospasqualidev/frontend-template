import { z } from 'zod';

import { type CompanyUser } from '@/services/users/types';
import {
  type CreateUserBody,
  type UpdateUserBody,
} from '@/services/users/userFormApi';

/*
 * Formulário de usuário, o mesmo na criação (`/users/create`) e no detalhe
 * (Detalhe = Edição). As regras de formato espelham as do servidor
 * (`POST /client/users` e `PATCH /client/users/:userId`, com as mesmas
 * mensagens): a tela recusa antes de enviar o que o servidor recusaria. Regra
 * de negócio (último administrador, o próprio usuário, cargos que o autor pode
 * dar) continua só no servidor.
 */

const IDLE_TIMEOUT_MESSAGE =
  'Informe um tempo de inatividade inteiro de 1 a 480 minutos.';

// Telefone brasileiro com ou sem máscara (`(48) 99999-9999`, `48999999999`).
const PHONE_PATTERN = /^\(?\d{2}\)? ?\d{4,5}-?\d{4}$/;

const nameField = z
  .string()
  .trim()
  .min(1, 'Informe o nome.')
  .min(2, 'O nome precisa ter pelo menos 2 caracteres.')
  .max(120, 'O nome deve ter no máximo 120 caracteres.');

// Vazio = sem telefone (vai como `null`).
const phoneField = z
  .string()
  .trim()
  .refine(
    (phone) => phone === '' || PHONE_PATTERN.test(phone),
    'O telefone deve possuir o formato (00) 0000-0000 ou (00) 90000-0000.'
  );

// Vazio (`undefined`) = herda o tempo da empresa (vai como `null`).
const idleTimeoutField = z
  .number()
  .int(IDLE_TIMEOUT_MESSAGE)
  .min(1, IDLE_TIMEOUT_MESSAGE)
  .max(480, IDLE_TIMEOUT_MESSAGE)
  .optional();

const sharedShape = {
  name: nameField,
  phone: phoneField,
  /** URL da foto (o `Location` do upload), ou `null`. */
  image: z.string().nullable(),
  idleTimeoutMinutes: idleTimeoutField,
  /** Cargos (ids): editados na aba "Cargos" do detalhe; a criação não os envia. */
  roleIds: z.array(z.string()),
};

export const createUserFormSchema = z
  .object({
    ...sharedShape,
    email: z
      .string()
      .trim()
      .min(1, 'Informe o e-mail.')
      .max(254, 'O e-mail deve ter no máximo 254 caracteres.')
      .pipe(
        z.email({
          message: 'O e-mail deve possuir o formato email@example.com.',
        })
      ),
    password: z
      .string()
      .min(1, 'Informe a senha.')
      .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
      .max(72, 'A senha deve ter no máximo 72 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirme a senha.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As senhas precisam ser iguais.',
    path: ['confirmPassword'],
  });

// No detalhe o e-mail só é exibido (é a identidade de acesso) e não há senha:
// os campos existem para o formulário ter um formato só.
export const editUserFormSchema = z.object({
  ...sharedShape,
  email: z.string(),
  password: z.string(),
  confirmPassword: z.string(),
});

export type UserFormValues = z.input<typeof editUserFormSchema>;
export type UserFormOutput = z.output<typeof editUserFormSchema>;

export const EMPTY_USER_FORM_VALUES: UserFormValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  image: null,
  idleTimeoutMinutes: undefined,
  roleIds: [],
};

/** Usuário do servidor → valores do formulário (o que os campos produzem). */
export function userToFormValues(user: CompanyUser): UserFormValues {
  return {
    name: user.name,
    email: user.email,
    password: '',
    confirmPassword: '',
    phone: user.phone ?? '',
    image: user.image,
    idleTimeoutMinutes: user.idleTimeoutMinutes ?? undefined,
    roleIds: user.roles.map((role) => role.id),
  };
}

export function toCreateUserBody(values: UserFormOutput): CreateUserBody {
  return {
    name: values.name,
    email: values.email,
    password: values.password,
    confirmPassword: values.confirmPassword,
    phone: values.phone || null,
    image: values.image,
    idleTimeoutMinutes: values.idleTimeoutMinutes ?? null,
  };
}

/**
 * Só os campos do cadastro que mudaram em relação ao usuário gravado (o
 * `PATCH` é parcial). `undefined` quando nenhum mudou.
 */
export function changedProfileFields(
  user: CompanyUser,
  values: UserFormOutput
): UpdateUserBody | undefined {
  const phone = values.phone || null;
  const idleTimeoutMinutes = values.idleTimeoutMinutes ?? null;

  const body: UpdateUserBody = {
    ...(values.name !== user.name ? { name: values.name } : {}),
    ...(phone !== user.phone ? { phone } : {}),
    ...(values.image !== user.image ? { image: values.image } : {}),
    ...(idleTimeoutMinutes !== user.idleTimeoutMinutes
      ? { idleTimeoutMinutes }
      : {}),
  };

  return Object.keys(body).length > 0 ? body : undefined;
}

/** O conjunto de cargos escolhido é o mesmo que o usuário já tem? */
export function hasSameRoles(user: CompanyUser, roleIds: string[]): boolean {
  const current = new Set(user.roles.map((role) => role.id));
  const next = new Set(roleIds);
  return current.size === next.size && [...next].every((id) => current.has(id));
}

/** Campos que a pessoa edita no detalhe (o e-mail só aparece; não há senha). */
export type EditableUserField =
  'name' | 'phone' | 'image' | 'idleTimeoutMinutes' | 'roleIds';

const EDITABLE_USER_FIELDS: readonly EditableUserField[] = [
  'name',
  'phone',
  'image',
  'idleTimeoutMinutes',
  'roleIds',
];

// O valor do campo é o que o usuário tem? Com a mesma normalização do envio
// (`changedProfileFields`): nome e telefone sem espaços nas pontas, vazio =
// `null`.
function matchesUser(
  field: EditableUserField,
  values: UserFormValues,
  user: CompanyUser
): boolean {
  switch (field) {
    case 'name':
      return values.name.trim() === user.name;
    case 'phone':
      return (values.phone.trim() || null) === user.phone;
    case 'image':
      return values.image === user.image;
    case 'idleTimeoutMinutes':
      return (values.idleTimeoutMinutes ?? null) === user.idleTimeoutMinutes;
    case 'roleIds':
      return hasSameRoles(user, values.roleIds);
  }
}

/**
 * O formulário que partia de `start` passa a partir de `next` (o usuário que o
 * cache passou a ter). Devolve os campos que continuam pendentes: os que a
 * pessoa alterou em relação a `start` e que `next` não tem; os outros ficam
 * com o valor de `next`. `undefined` quando `next` não muda nenhum campo do
 * formulário.
 */
export function pendingFieldsOnRebase(
  values: UserFormValues,
  start: CompanyUser,
  next: CompanyUser
): EditableUserField[] | undefined {
  const nextValues = userToFormValues(next);
  if (
    EDITABLE_USER_FIELDS.every((field) => matchesUser(field, nextValues, start))
  ) {
    return undefined;
  }
  return EDITABLE_USER_FIELDS.filter(
    (field) =>
      !matchesUser(field, values, start) && !matchesUser(field, values, next)
  );
}
