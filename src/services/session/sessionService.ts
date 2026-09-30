import { api } from '@/services/api';
import {
  signInResponseSchema,
  signOutResponseSchema,
  validateResponseSchema,
  type ISessionService,
  type ISignInService,
  type ISignInServiceResponse,
  type ISignOutServiceResponse,
  type ISignUpService,
  type IValidateResponse,
} from '@/services/session/types';

/*
 * Sessão no backend `../server-template` pelo cliente `api` (cookie HTTP-only
 * `token`, gravado e limpo pelo servidor): `POST /client/session/login`,
 * `/register`, `/logout` e `GET /client/users/me`. Erros (401 de credencial,
 * 400 de validação, 409 de e-mail já cadastrado) já viram toast pelo
 * interceptor do `api`. A resposta passa pelo schema Zod antes de chegar ao
 * store.
 */

async function signIn(data: ISignInService): Promise<ISignInServiceResponse> {
  const response = await api.post<unknown>('/client/session/login', data);
  return signInResponseSchema.parse(response);
}

async function signUp(data: ISignUpService): Promise<ISignInServiceResponse> {
  const response = await api.post<unknown>('/client/session/register', data);
  return signInResponseSchema.parse(response);
}

async function signOut(): Promise<ISignOutServiceResponse> {
  const response = await api.post<unknown>('/client/session/logout');
  return signOutResponseSchema.parse(response);
}

// Sem toast só no 401: abrir o app sem sessão (ou com ela expirada) não é erro
// para o usuário. 5xx e falha de rede mantêm o toast, para o usuário saber que
// o servidor está fora. Em todos os casos `SessionValidation` trata a rejeição
// mandando ao login.
async function validate(): Promise<IValidateResponse> {
  const response = await api.get<unknown>('/client/users/me', {
    silentError: [401],
  });
  return validateResponseSchema.parse(response);
}

// A mesma leitura, com a sessão já aberta: as permissões mudaram por uma
// gravação que já teve o próprio toast. Nenhuma falha ganha outro toast; quem
// chama decide o que fazer com ela (`refreshUser` do `useSessionStore` mantém
// a sessão como está).
async function refresh(): Promise<IValidateResponse> {
  const response = await api.get<unknown>('/client/users/me', {
    silentError: true,
  });
  return validateResponseSchema.parse(response);
}

export const sessionService: ISessionService = {
  signIn,
  signUp,
  signOut,
  validate,
  refresh,
};
