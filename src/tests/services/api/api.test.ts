import type { InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/services/api';
import { respondWith } from '@/tests/helpers/axiosAdapter';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

afterEach(() => {
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});

describe('interceptor de erro do api', () => {
  it('exibe a mensagem do servidor num toast de erro', async () => {
    await expect(
      api.get('/client/users/me', {
        adapter: respondWith(401, { message: 'Sessão não informada.' }),
      })
    ).rejects.toMatchObject({ response: { status: 401 } });

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('Sessão não informada.', {
      id: 'errorToastId',
    });
  });

  // A falha continua chegando a quem chamou: só o toast é suprimido.
  it('com `silentError: true`, não exibe toast e a rejeição chega a quem chamou', async () => {
    await expect(
      api.get('/client/users/me', {
        silentError: true,
        adapter: respondWith(401, { message: 'Sessão não informada.' }),
      })
    ).rejects.toMatchObject({ response: { status: 401 } });

    expect(toast.error).not.toHaveBeenCalled();
  });

  it('`silentError` vale só para a chamada que o recebe', async () => {
    const adapter = respondWith(500, { message: 'Erro interno.' });

    await expect(
      api.post('/client/session/login', {}, { silentError: true, adapter })
    ).rejects.toBeDefined();
    await expect(
      api.post('/client/session/login', {}, { adapter })
    ).rejects.toBeDefined();

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('Erro interno.', {
      id: 'errorToastId',
    });
  });
});

describe('api.patch', () => {
  it('envia PATCH com o corpo e devolve o `data` da resposta', async () => {
    const responseData = {
      message: 'Configurações atualizadas.',
      systemConfigs: [],
    };
    const adapter = vi.fn(respondWith(200, responseData));
    const items = [{ key: 'security.idleTimeoutMinutes', value: '30' }];

    await expect(
      api.patch('/client/system-configs', { items }, { adapter })
    ).resolves.toEqual(responseData);

    expect(adapter).toHaveBeenCalledTimes(1);
    const [request] = adapter.mock.calls[0] as [InternalAxiosRequestConfig];
    expect(request.method).toBe('patch');
    expect(request.url).toBe('/client/system-configs');
    expect(JSON.parse(request.data as string)).toEqual({ items });
    // Mutation com `message`: o interceptor de sucesso vale para o `patch`.
    expect(toast.success).toHaveBeenCalledWith('Configurações atualizadas.');
  });

  it('propaga a falha e exibe o toast de erro', async () => {
    await expect(
      api.patch(
        '/client/system-configs',
        { items: [] },
        {
          adapter: respondWith(400, {
            message: 'items: Informe ao menos uma configuração.',
          }),
        }
      )
    ).rejects.toMatchObject({ response: { status: 400 } });

    expect(toast.error).toHaveBeenCalledWith(
      'items: Informe ao menos uma configuração.',
      { id: 'errorToastId' }
    );
  });
});
