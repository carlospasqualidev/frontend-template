import { isAxiosError } from 'axios';
import { z } from 'zod';

import { api } from '@/services/api';
import { extractResponseIssues } from '@/services/api/types';
import { sessionUserSchema } from '@/services/session/types';

/*
 * Autoatendimento da conta (`../server-template/docs/openapi.json`): o próprio
 * perfil e a própria senha, só com a sessão (nenhuma permissão de administrar
 * usuários). O id é sempre o da sessão: não vai na URL nem no corpo. O
 * `message` das respostas vira o toast de sucesso no interceptor do `api`.
 */

const ME_PATH = '/client/users/me';

/**
 * Perfil GRAVADO (`GET /client/users/me/profile`), o que o formulário edita.
 * `idleTimeoutMinutes` aqui é o PRÓPRIO do usuário (`null` herda o da
 * empresa), não o resolvido da sessão (`IUser`): não misture os dois.
 */
export const accountProfileSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  image: z.string().nullable(),
  idleTimeoutMinutes: z.number().int().nullable(),
});

export type AccountProfile = z.infer<typeof accountProfileSchema>;

const profileResponseSchema = z.object({ profile: accountProfileSchema });

/** `GET /client/users/me/profile` → o perfil gravado. */
export async function fetchAccountProfile(): Promise<AccountProfile> {
  const response = await api.get<unknown>(`${ME_PATH}/profile`);
  return profileResponseSchema.parse(response).profile;
}

/** Corpo de `PATCH /client/users/me`: só os campos alterados (o e-mail não entra). */
export interface UpdateProfileBody {
  name?: string;
  /** `null` limpa o telefone. */
  phone?: string | null;
  /** URL `https:` da foto (o `Location` do upload); `null` remove. */
  image?: string | null;
  /** De 1 até o limite da empresa; `null` volta a herdar o da empresa. */
  idleTimeoutMinutes?: number | null;
}

/**
 * Resposta de `PATCH /client/users/me`: o `user` no formato da SESSÃO (o de
 * `GET /client/users/me`, com as permissões e o tempo já resolvido), que
 * substitui o usuário do store da sessão.
 */
const updateProfileResponseSchema = z.object({
  message: z.string(),
  user: sessionUserSchema,
});

export type UpdateProfileResponse = z.infer<typeof updateProfileResponseSchema>;

/**
 * `PATCH /client/users/me` → `{ message, user }`. O 400 volta sem toast
 * (`silentError`): o de validação traz `issues` com o nome do campo, e o do
 * tempo acima do limite da empresa vem só com `message`; o formulário marca o
 * campo (`findProfileFormIssues`). As demais falhas seguem com o toast.
 */
export async function updateAccountProfile(
  body: UpdateProfileBody
): Promise<UpdateProfileResponse> {
  const response = await api.patch<unknown>(ME_PATH, body, {
    silentError: [400],
  });
  return updateProfileResponseSchema.parse(response);
}

/** Corpo de `PUT /client/users/me/password`. */
export interface ChangePasswordBody {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

const changePasswordResponseSchema = z.object({ message: z.string() });

/**
 * `PUT /client/users/me/password` → `{ message }`; a sessão continua aberta. O
 * 400 volta sem toast (`silentError`): com `issues` nos campos, ou só com
 * `message` quando a senha atual está errada (`findPasswordFormIssues`). O 409
 * (a senha mudou por outro caminho no meio da troca), o 429 (tentativas
 * demais) e as demais falhas seguem com o toast do servidor.
 */
export async function changeAccountPassword(
  body: ChangePasswordBody
): Promise<void> {
  const response = await api.put<unknown>(`${ME_PATH}/password`, body, {
    silentError: [400],
  });
  changePasswordResponseSchema.parse(response);
}

export type ProfileFormField =
  'name' | 'phone' | 'image' | 'idleTimeoutMinutes';

export type PasswordFormField =
  'currentPassword' | 'password' | 'confirmPassword';

export interface FormIssue<TField extends string> {
  field: TField;
  message: string;
}

function toProfileField(path: string): ProfileFormField | undefined {
  switch (path) {
    case 'name':
    case 'phone':
    case 'image':
    case 'idleTimeoutMinutes':
      return path;
    default:
      return undefined;
  }
}

function toPasswordField(path: string): PasswordFormField | undefined {
  switch (path) {
    case 'currentPassword':
    case 'password':
    case 'confirmPassword':
      return path;
    default:
      return undefined;
  }
}

// O 400 que chegou (sem toast, pelo `silentError`) e o corpo dele.
function badRequestBody(error: unknown): { data: unknown } | undefined {
  if (!isAxiosError(error) || error.response?.status !== 400) return undefined;
  return { data: error.response.data };
}

function responseMessage(data: unknown): string | undefined {
  const parsed = z.object({ message: z.string() }).safeParse(data);
  return parsed.success ? parsed.data.message : undefined;
}

/**
 * Os campos do perfil que um 400 de `PATCH /client/users/me` aponta. Com
 * `issues`, o `path` é o nome do campo. Sem `issues`, o único 400 do contrato é
 * o do tempo de inatividade acima do limite da empresa (o `message` traz o
 * limite), e ele só acontece quando o tempo foi enviado: marca o campo com a
 * mensagem. Lista vazia quando não há campo a marcar: quem chama mostra o
 * `message` no toast.
 */
export function findProfileFormIssues(
  error: unknown,
  body: UpdateProfileBody
): FormIssue<ProfileFormField>[] {
  const badRequest = badRequestBody(error);
  if (!badRequest) return [];

  const issues = extractResponseIssues(badRequest.data);
  if (issues.length > 0) {
    return issues.flatMap(({ path, message }) => {
      const field = toProfileField(path);
      return field ? [{ field, message }] : [];
    });
  }

  const message = responseMessage(badRequest.data);
  return message && 'idleTimeoutMinutes' in body
    ? [{ field: 'idleTimeoutMinutes', message }]
    : [];
}

/**
 * Os campos da troca de senha que um 400 de `PUT /client/users/me/password`
 * aponta. Com `issues`, o `path` é o nome do campo. Sem `issues`, o único 400
 * do contrato é o da senha atual errada ("Senha atual incorreta."): marca a
 * senha atual.
 */
export function findPasswordFormIssues(
  error: unknown
): FormIssue<PasswordFormField>[] {
  const badRequest = badRequestBody(error);
  if (!badRequest) return [];

  const issues = extractResponseIssues(badRequest.data);
  if (issues.length > 0) {
    return issues.flatMap(({ path, message }) => {
      const field = toPasswordField(path);
      return field ? [{ field, message }] : [];
    });
  }

  const message = responseMessage(badRequest.data);
  return message ? [{ field: 'currentPassword', message }] : [];
}
