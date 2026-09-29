import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sendErrorMessage } from '@/services/api/errorHandlers';
import { sessionUserRef } from '@/services/api/sessionUserRef';
import type { IUser } from '@/types/user/types';

const ERROR_LOG_URL = 'https://logs.example.com/errors';

// O reporte só sai com `VITE_ERROR_LOG_URL`: a suíte deixa a variável vazia
// (`vitest.config.ts`), então o `env` é substituído aqui.
vi.mock('@/lib/env', () => ({
  env: {
    VITE_API_URL: 'http://localhost:8080/api',
    VITE_PROJECT_NAME: 'Frontend',
    VITE_PROJECT_ENVIRONMENT: 'Test',
    VITE_PROJECT_SIDE: 'Client',
    VITE_ERROR_LOG_URL: 'https://logs.example.com/errors',
    VITE_SESSION_MODE: 'fake',
  },
}));

function makeSessionUser(overrides: Partial<IUser> = {}): IUser {
  return {
    id: 'b6f1c7a2-0000-4000-8000-000000000001',
    name: 'Maria Silva',
    email: 'maria@example.com',
    image: null,
    permissions: ['backoffice.users.read'],
    idleTimeoutMinutes: 20,
    ...overrides,
  };
}

const post = vi.spyOn(axios, 'post');

beforeEach(() => {
  post.mockReset();
  post.mockResolvedValue({ data: {} });
  vi.stubEnv('PROD', true);
});

afterEach(() => {
  sessionUserRef.set(null);
  vi.unstubAllEnvs();
});

describe('sendErrorMessage', () => {
  // LGPD: do usuário da sessão sai só o id opaco, nunca nome nem e-mail.
  it('envia só o id do usuário da sessão, sem nome nem e-mail', async () => {
    const user = makeSessionUser();
    sessionUserRef.set(user);

    await sendErrorMessage({ error: new Error('falha inesperada') });

    expect(post).toHaveBeenCalledTimes(1);
    const [url, body] = post.mock.calls[0] as [string, Record<string, unknown>];
    expect(url).toBe(ERROR_LOG_URL);
    expect(body).toMatchObject({
      projectName: 'Frontend',
      environment: 'Test',
      side: 'Client',
      extraInfo: { url: window.location.href, userId: user.id },
    });
    expect(body.extraInfo).toEqual({
      url: window.location.href,
      userId: user.id,
    });

    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain(user.name);
    expect(serialized).not.toContain(user.email);
  });

  it('sem sessão, não envia identificação de usuário', async () => {
    await sendErrorMessage({ error: new Error('falha inesperada') });

    expect(post).toHaveBeenCalledTimes(1);
    const [, body] = post.mock.calls[0] as [string, Record<string, unknown>];
    expect(JSON.parse(JSON.stringify(body.extraInfo))).toEqual({
      url: window.location.href,
    });
  });

  it('fora de produção, não envia nada', async () => {
    vi.stubEnv('PROD', false);
    sessionUserRef.set(makeSessionUser());

    await sendErrorMessage({ error: new Error('falha inesperada') });

    expect(post).not.toHaveBeenCalled();
  });

  it('falha no envio não lança', async () => {
    post.mockRejectedValue(new Error('log fora do ar'));

    await expect(
      sendErrorMessage({ error: new Error('falha inesperada') })
    ).resolves.toBeUndefined();
  });
});
