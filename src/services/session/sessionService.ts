/* -----------------------------------------------------------------------------
 * Ponto de entrada da sessão: exporta a implementação escolhida por
 * `VITE_SESSION_MODE` (validada em `lib/env.ts`).
 * -----------------------------------------------------------------------------
 *   - `api` (padrão) → `apiSessionService.ts`: autentica no backend irmão
 *     `../server-template` (`POST /client/session/login`, `/register`,
 *     `/logout` e `GET /client/users/me`), com cookie HTTP-only. Suba-o com
 *     `npm run db:up && npm run dev` lá dentro e aponte `VITE_API_URL` para ele.
 *   - `fake` → `fakeSessionService.ts`: sessão fictícia em cookie comum, sem
 *     backend. É o modo da suíte (`vitest.config.ts`) e dos E2E
 *     (`playwright.config.ts`), e serve para demonstração.
 *
 * As duas cumprem `ISessionService` e devolvem o mesmo shape do contrato do
 * servidor; o resto do app importa só `sessionService` daqui.
 * -------------------------------------------------------------------------- */

import { apiSessionService } from './apiSessionService';
import { fakeSessionService } from './fakeSessionService';

import { env, type SessionMode } from '@/lib/env';
import type { ISessionService } from '@/services/session/types';

export function selectSessionService(mode: SessionMode): ISessionService {
  switch (mode) {
    case 'fake':
      return fakeSessionService;
    case 'api':
      return apiSessionService;
  }
}

export const sessionService = selectSessionService(env.VITE_SESSION_MODE);
