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
 * Sessão REAL (`VITE_SESSION_MODE=api`, o padrão): autentica no backend
 * `../server-template` pelo cliente `api` (cookie HTTP-only `token`, gravado e
 * limpo pelo servidor). Erros (401 de credencial, 400 de validação, 409 de
 * e-mail já cadastrado) já viram toast pelo interceptor do `api`. A resposta
 * passa pelo schema Zod antes de chegar ao store.
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

// Sem toast de erro: abrir o app sem sessão responde 401, e isso não é erro
// para o usuário. `SessionValidation` trata a rejeição mandando ao login.
async function validate(): Promise<IValidateResponse> {
  const response = await api.get<unknown>('/client/users/me', {
    silentError: true,
  });
  return validateResponseSchema.parse(response);
}

export const apiSessionService: ISessionService = {
  signIn,
  signUp,
  signOut,
  validate,
};
