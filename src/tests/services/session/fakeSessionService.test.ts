import { afterEach, describe, expect, it } from 'vitest';

import {
  FAKE_IDLE_TIMEOUT_MINUTES,
  fakeSessionService,
} from '@/services/session/fakeSessionService';
import { sessionUserSchema } from '@/services/session/types';

function clearCookie() {
  document.cookie = 'fake_session_user=; Path=/; Max-Age=0';
}

afterEach(() => {
  clearCookie();
});

describe('fakeSessionService', () => {
  // Mesmo shape do backend, com tudo o que o menu consulta liberado.
  it('entra com todas as permissões do menu e inatividade de 20 minutos', async () => {
    const { success, user } = await fakeSessionService.signIn({
      email: 'maria.silva@example.com',
      password: 'qualquer',
    });

    expect(success).toBe(true);
    expect(sessionUserSchema.safeParse(user).success).toBe(true);
    expect(user).toMatchObject({
      name: 'Maria Silva',
      email: 'maria.silva@example.com',
    });
    expect(user.permissions).toEqual([
      'backoffice.audit.read',
      'backoffice.systemConfigs.read',
      'backoffice.users.read',
    ]);
    expect(user.idleTimeoutMinutes).toBe(FAKE_IDLE_TIMEOUT_MINUTES);
    expect(FAKE_IDLE_TIMEOUT_MINUTES).toBe(20);
  });

  it('mantém a sessão no cookie até o logout', async () => {
    const { user } = await fakeSessionService.signUp({
      name: 'João Souza',
      email: 'joao@example.com',
      password: 'qualquer',
    });

    await expect(fakeSessionService.validate()).resolves.toEqual({ user });

    await expect(fakeSessionService.signOut()).resolves.toEqual({
      success: true,
    });
    await expect(fakeSessionService.validate()).rejects.toThrow();
  });

  // Cookie gravado por uma versão anterior (sem `permissions` nem
  // `idleTimeoutMinutes`) não vira sessão incompleta: volta para o login.
  it('descarta o cookie de sessão fora do shape atual', async () => {
    const legacyUser = {
      id: 'fake-1',
      name: 'Maria',
      email: 'maria@example.com',
      image: null,
    };
    document.cookie = `fake_session_user=${btoa(JSON.stringify(legacyUser))}; Path=/`;

    await expect(fakeSessionService.validate()).rejects.toThrow();
  });
});
