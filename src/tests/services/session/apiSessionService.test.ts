import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/services/api';
import { apiSessionService } from '@/services/session/apiSessionService';

vi.mock('@/services/api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const get = vi.mocked(api.get);
const post = vi.mocked(api.post);

// `user` da sessão como o backend entrega (openapi: login, register, users/me).
function makeServerUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'b6f1c7a2-0000-4000-8000-000000000001',
    name: 'Maria Silva',
    email: 'maria@example.com',
    image: null,
    permissions: ['backoffice.audit.read', 'backoffice.users.read'],
    idleTimeoutMinutes: 30,
    ...overrides,
  };
}

beforeEach(() => {
  get.mockReset();
  post.mockReset();
});

describe('apiSessionService.signIn', () => {
  it('autentica em POST /client/session/login e devolve o usuário com permissões e inatividade', async () => {
    post.mockResolvedValue({ success: true, user: makeServerUser() });

    const response = await apiSessionService.signIn({
      email: 'maria@example.com',
      password: 'segredo-123',
    });

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/client/session/login', {
      email: 'maria@example.com',
      password: 'segredo-123',
    });
    expect(response).toEqual({ success: true, user: makeServerUser() });
  });

  // Credencial errada: o 401 chega como rejeição do `api` (o toast é do
  // interceptor) e não pode virar sessão.
  it('propaga a falha do backend', async () => {
    const error = new Error('401');
    post.mockRejectedValue(error);

    await expect(
      apiSessionService.signIn({ email: 'maria@example.com', password: 'x' })
    ).rejects.toBe(error);
  });

  // Fronteira: resposta fora do contrato não chega ao store.
  it('rejeita resposta sem `permissions` ou sem `idleTimeoutMinutes`', async () => {
    const { permissions: _permissions, ...withoutPermissions } =
      makeServerUser();
    post.mockResolvedValueOnce({ success: true, user: withoutPermissions });
    await expect(
      apiSessionService.signIn({ email: 'maria@example.com', password: 'x' })
    ).rejects.toThrow();

    post.mockResolvedValueOnce({
      success: true,
      user: makeServerUser({ idleTimeoutMinutes: null }),
    });
    await expect(
      apiSessionService.signIn({ email: 'maria@example.com', password: 'x' })
    ).rejects.toThrow();
  });
});

describe('apiSessionService.signUp', () => {
  it('cria a conta em POST /client/session/register', async () => {
    post.mockResolvedValue({ success: true, user: makeServerUser() });

    const response = await apiSessionService.signUp({
      name: 'Maria Silva',
      email: 'maria@example.com',
      password: 'segredo-123',
    });

    expect(post).toHaveBeenCalledWith('/client/session/register', {
      name: 'Maria Silva',
      email: 'maria@example.com',
      password: 'segredo-123',
    });
    expect(response.user.permissions).toEqual([
      'backoffice.audit.read',
      'backoffice.users.read',
    ]);
  });
});

describe('apiSessionService.signOut', () => {
  it('encerra a sessão em POST /client/session/logout', async () => {
    post.mockResolvedValue({ success: true });

    await expect(apiSessionService.signOut()).resolves.toEqual({
      success: true,
    });
    expect(post).toHaveBeenCalledWith('/client/session/logout');
  });
});

describe('apiSessionService.validate', () => {
  // `silentError`: abrir o app sem sessão (401) não mostra toast de erro.
  it('lê o usuário da sessão em GET /client/users/me, sem toast de erro', async () => {
    get.mockResolvedValue({ user: makeServerUser() });

    await expect(apiSessionService.validate()).resolves.toEqual({
      user: makeServerUser(),
    });
    expect(get).toHaveBeenCalledWith('/client/users/me', {
      silentError: true,
    });
  });

  // Sem cookie válido o backend responde 401: `SessionValidation` depende da
  // rejeição para mandar ao login.
  it('rejeita quando a sessão é inválida', async () => {
    get.mockRejectedValue(new Error('401'));

    await expect(apiSessionService.validate()).rejects.toThrow('401');
  });
});
