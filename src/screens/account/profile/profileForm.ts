import { z } from 'zod';

import {
  type AccountProfile,
  type ProfileFormField,
  type UpdateProfileBody,
} from '@/services/account/accountApi';
import type { IUser } from '@/types/user/types';

/*
 * Formulário do próprio perfil (aba "Perfil" de Minha conta), gravado por
 * `PATCH /client/users/me`. As regras de formato espelham as do servidor, com
 * as mesmas mensagens: a tela recusa antes de enviar o que o servidor
 * recusaria. O limite do tempo de inatividade (o da empresa) é só do servidor:
 * a recusa volta num 400 e marca o campo.
 */

/** Títulos e descrições dos cards do perfil, os mesmos na tela e no skeleton. */
export const PROFILE_SECTIONS = {
  identification: {
    title: 'Identificação',
    description: 'Como você aparece para as outras pessoas do sistema.',
  },
  access: {
    title: 'Acesso',
    description:
      'Tempo até o logout por inatividade, até o limite da empresa. Vazio usa o padrão dela.',
  },
  photo: {
    title: 'Foto',
    description: 'Aparece ao lado do seu nome no sistema.',
  },
} as const;

const IDLE_TIMEOUT_MESSAGE =
  'Informe um tempo de inatividade inteiro de 1 a 480 minutos.';

const IMAGE_URL_MESSAGE = 'A imagem deve ser uma URL https válida.';

const MAX_IMAGE_URL_LENGTH = 2048;

// Telefone brasileiro com ou sem máscara (`(48) 99999-9999`, `48999999999`).
const PHONE_PATTERN = /^\(?\d{2}\)? ?\d{4,5}-?\d{4}$/;

export const profileFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome.')
    .min(2, 'O nome precisa ter pelo menos 2 caracteres.')
    .max(120, 'O nome deve ter no máximo 120 caracteres.'),
  /** Só exibido: o e-mail é a identidade de acesso e não muda por aqui. */
  email: z.string(),
  /** Vazio = sem telefone (vai como `null`). */
  phone: z
    .string()
    .trim()
    .refine(
      (phone) => phone === '' || PHONE_PATTERN.test(phone),
      'O telefone deve possuir o formato (00) 0000-0000 ou (00) 90000-0000.'
    ),
  /** URL da foto (o `Location` do upload), só `https:`; `null` = sem foto. */
  image: z
    .string()
    .max(
      MAX_IMAGE_URL_LENGTH,
      `A URL da imagem deve ter no máximo ${MAX_IMAGE_URL_LENGTH} caracteres.`
    )
    .pipe(z.url({ protocol: /^https$/, message: IMAGE_URL_MESSAGE }))
    .nullable(),
  /** Vazio (`undefined`) = herda o tempo da empresa (vai como `null`). */
  idleTimeoutMinutes: z
    .number()
    .int(IDLE_TIMEOUT_MESSAGE)
    .min(1, IDLE_TIMEOUT_MESSAGE)
    .max(480, IDLE_TIMEOUT_MESSAGE)
    .optional(),
});

export type ProfileFormValues = z.input<typeof profileFormSchema>;
export type ProfileFormOutput = z.output<typeof profileFormSchema>;

/** Perfil gravado → valores do formulário (o que os campos produzem). */
export function profileToFormValues(
  profile: AccountProfile
): ProfileFormValues {
  return {
    name: profile.name,
    email: profile.email,
    phone: profile.phone ?? '',
    image: profile.image,
    idleTimeoutMinutes: profile.idleTimeoutMinutes ?? undefined,
  };
}

/**
 * Só os campos que mudaram em relação ao perfil gravado (o `PATCH` é parcial).
 * Mandar só o alterado importa: um tempo de inatividade que o administrador
 * gravou acima do limite da empresa seria recusado se fosse reenviado igual.
 * `undefined` quando nenhum mudou.
 */
export function changedProfileFields(
  profile: AccountProfile,
  values: ProfileFormOutput
): UpdateProfileBody | undefined {
  const phone = values.phone || null;
  const idleTimeoutMinutes = values.idleTimeoutMinutes ?? null;

  const body: UpdateProfileBody = {
    ...(values.name !== profile.name ? { name: values.name } : {}),
    ...(phone !== profile.phone ? { phone } : {}),
    ...(values.image !== profile.image ? { image: values.image } : {}),
    ...(idleTimeoutMinutes !== profile.idleTimeoutMinutes
      ? { idleTimeoutMinutes }
      : {}),
  };

  return Object.keys(body).length > 0 ? body : undefined;
}

/**
 * O perfil gravado depois de um `PATCH` aceito: o anterior com o que foi
 * enviado, e o nome e a foto como o servidor devolveu no usuário da sessão (o
 * `user` da resposta não traz o telefone nem o tempo próprio).
 */
export function profileAfterSave(
  profile: AccountProfile,
  body: UpdateProfileBody,
  user: IUser
): AccountProfile {
  return { ...profile, ...body, name: user.name, image: user.image };
}

const EDITABLE_PROFILE_FIELDS: readonly ProfileFormField[] = [
  'name',
  'phone',
  'image',
  'idleTimeoutMinutes',
];

// O valor do campo é o do perfil? Com a mesma normalização do envio
// (`changedProfileFields`): nome e telefone sem espaços nas pontas, vazio =
// `null`.
function matchesProfile(
  field: ProfileFormField,
  values: ProfileFormValues,
  profile: AccountProfile
): boolean {
  switch (field) {
    case 'name':
      return values.name.trim() === profile.name;
    case 'phone':
      return (values.phone.trim() || null) === profile.phone;
    case 'image':
      return values.image === profile.image;
    case 'idleTimeoutMinutes':
      return (values.idleTimeoutMinutes ?? null) === profile.idleTimeoutMinutes;
  }
}

/**
 * O formulário que partia de `start` passa a partir de `next` (o perfil que o
 * cache passou a ter). Devolve os campos que continuam pendentes: os que a
 * pessoa alterou em relação a `start` e que `next` não tem; os outros ficam
 * com o valor de `next`. `undefined` quando `next` não muda nenhum campo.
 */
export function pendingProfileFieldsOnRebase(
  values: ProfileFormValues,
  start: AccountProfile,
  next: AccountProfile
): ProfileFormField[] | undefined {
  const nextValues = profileToFormValues(next);
  if (
    EDITABLE_PROFILE_FIELDS.every((field) =>
      matchesProfile(field, nextValues, start)
    )
  ) {
    return undefined;
  }
  return EDITABLE_PROFILE_FIELDS.filter(
    (field) =>
      !matchesProfile(field, values, start) &&
      !matchesProfile(field, values, next)
  );
}
