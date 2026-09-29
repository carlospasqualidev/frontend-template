import { z } from 'zod';

import type { IUser } from '@/types/user/types';

export interface ISignInService {
  email: string;
  password: string;
}

export interface ISignUpService {
  name: string;
  email: string;
  password: string;
}

/**
 * Shape do usuário da sessão no contrato do backend (`../server-template/docs/openapi.json`,
 * `user` de `/client/session/login`, `/register` e `/client/users/me`). As duas
 * implementações (`api` e `fake`) devolvem exatamente este shape.
 */
export const sessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  permissions: z.array(z.string()),
  idleTimeoutMinutes: z.number().int(),
}) satisfies z.ZodType<IUser>;

/** `POST /client/session/login` e `/register`. */
export const signInResponseSchema = z.object({
  success: z.boolean(),
  user: sessionUserSchema,
});

/** `GET /client/users/me`. */
export const validateResponseSchema = z.object({
  user: sessionUserSchema,
});

/** `POST /client/session/logout`. */
export const signOutResponseSchema = z.object({
  success: z.boolean(),
});

export type ISignInServiceResponse = z.infer<typeof signInResponseSchema>;
export type IValidateResponse = z.infer<typeof validateResponseSchema>;
export type ISignOutServiceResponse = z.infer<typeof signOutResponseSchema>;

/** Contrato comum das implementações da sessão (`api` e `fake`). */
export interface ISessionService {
  signIn: (data: ISignInService) => Promise<ISignInServiceResponse>;
  signUp: (data: ISignUpService) => Promise<ISignInServiceResponse>;
  signOut: () => Promise<ISignOutServiceResponse>;
  validate: () => Promise<IValidateResponse>;
}
