import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@/hooks/useSessionStore';
import { axiosApi } from '@/services/api/api';
import { sessionService } from '@/services/session/sessionService';
import {
  failWithNetworkError,
  respondWith,
} from '@/tests/helpers/axiosAdapter';
import type { IUser } from '@/types/user/types';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const defaultAdapter = axiosApi.defaults.adapter;

const MARIA: IUser = {
  id: 'b6f1c7a2-0000-4000-8000-000000000001',
  name: 'Maria Silva',
  email: 'maria@example.com',
  image: null,
  permissions: ['backoffice.roles.read', 'backoffice.roles.update'],
  idleTimeoutMinutes: 30,
};

beforeEach(() => {
  useSessionStore.setState({ user: MARIA });
});

afterEach(() => {
  axiosApi.defaults.adapter = defaultAdapter;
  useSessionStore.setState({ user: null });
  vi.mocked(toast.error).mockClear();
  vi.restoreAllMocks();
});

// `refreshUser` pelo cliente `api` real (interceptors e `.parse`), sem rede:
// relê a pessoa da sessão depois de uma gravação que mudou as permissões dela.
describe('useSessionStore.refreshUser', () => {
  it('troca a pessoa da sessão pela relida, com as permissões novas', async () => {
    const reread = { ...MARIA, permissions: ['backoffice.roles.read'] };
    axiosApi.defaults.adapter = respondWith(200, { user: reread });

    await useSessionStore.getState().refreshUser();

    expect(useSessionStore.getState().user).toEqual(reread);
  });

  // A gravação já teve o toast dela: a falha da releitura não soma outro, não
  // encerra a sessão e não rejeita.
  it.each([
    [
      'sem sessão (401)',
      respondWith(401, { message: 'Sessão expirada.' }),
      401,
    ],
    [
      'servidor com erro (5xx)',
      respondWith(503, { message: 'Serviço indisponível.' }),
      503,
    ],
    ['servidor fora (rede)', failWithNetworkError(), undefined],
  ])(
    '%s: mantém a sessão, sem toast e sem sair',
    async (_, adapter, status) => {
      axiosApi.defaults.adapter = adapter;
      const info = vi
        .spyOn(console, 'info')
        .mockImplementation(() => undefined);
      const signOut = vi.spyOn(sessionService, 'signOut');

      await expect(
        useSessionStore.getState().refreshUser()
      ).resolves.toBeUndefined();

      expect(useSessionStore.getState().user).toBe(MARIA);
      expect(toast.error).not.toHaveBeenCalled();
      expect(signOut).not.toHaveBeenCalled();
      expect(info).toHaveBeenCalledWith(
        'Não foi possível reler as permissões da sessão.',
        { status }
      );
    }
  );

  it('resposta fora do contrato: mantém a sessão e registra como inesperada', async () => {
    axiosApi.defaults.adapter = respondWith(200, { user: { id: MARIA.id } });
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await useSessionStore.getState().refreshUser();

    expect(useSessionStore.getState().user).toBe(MARIA);
    expect(toast.error).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      'Resposta inesperada ao reler a sessão.',
      expect.anything()
    );
  });

  // A sessão saiu (inatividade, "Sair") enquanto a leitura corria.
  it('não devolve a sessão que saiu durante a leitura', async () => {
    axiosApi.defaults.adapter = async (config) => {
      useSessionStore.setState({ user: null });
      return respondWith(200, { user: MARIA })(config);
    };

    await useSessionStore.getState().refreshUser();

    expect(useSessionStore.getState().user).toBeNull();
  });
});
