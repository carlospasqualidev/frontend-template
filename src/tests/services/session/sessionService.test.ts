import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiSessionService } from '@/services/session/apiSessionService';
import { fakeSessionService } from '@/services/session/fakeSessionService';
import {
  selectSessionService,
  sessionService,
} from '@/services/session/sessionService';

describe('selectSessionService', () => {
  it('`api` usa a sessão real (backend)', () => {
    expect(selectSessionService('api')).toBe(apiSessionService);
  });

  it('`fake` usa a sessão fictícia (sem backend)', () => {
    expect(selectSessionService('fake')).toBe(fakeSessionService);
  });

  // A suíte fixa `VITE_SESSION_MODE=fake` no `vitest.config.ts`.
  it('exporta a implementação escolhida pela variável', () => {
    expect(sessionService).toBe(fakeSessionService);
  });
});

// `lib/env.ts` valida no import: cada caso recarrega o módulo com a variável
// ajustada.
describe('VITE_SESSION_MODE', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  async function loadSessionMode(): Promise<string> {
    vi.resetModules();
    const { env } = await import('@/lib/env');
    return env.VITE_SESSION_MODE;
  }

  it('sem valor, o padrão é `api`', async () => {
    vi.stubEnv('VITE_SESSION_MODE', undefined);
    await expect(loadSessionMode()).resolves.toBe('api');
  });

  it('vazio também cai no padrão `api`', async () => {
    vi.stubEnv('VITE_SESSION_MODE', '');
    await expect(loadSessionMode()).resolves.toBe('api');
  });

  it('aceita `fake`', async () => {
    vi.stubEnv('VITE_SESSION_MODE', 'fake');
    await expect(loadSessionMode()).resolves.toBe('fake');
  });

  it('recusa valor fora de `api` | `fake`', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubEnv('VITE_SESSION_MODE', 'mock');
    await expect(loadSessionMode()).rejects.toThrow(
      'Variáveis de ambiente inválidas'
    );
  });
});
