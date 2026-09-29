import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { axiosApi } from '@/services/api/api';
import { apiSessionService } from '@/services/session/apiSessionService';
import {
  failWithNetworkError,
  respondWith,
} from '@/tests/helpers/axiosAdapter';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const defaultAdapter = axiosApi.defaults.adapter;

afterEach(() => {
  axiosApi.defaults.adapter = defaultAdapter;
  vi.mocked(toast.error).mockClear();
});

// `validate` pelo cliente `api` real (interceptors e `.parse`), sem rede: o
// toast de erro some só quando não há sessão.
describe('apiSessionService.validate: toast de erro', () => {
  it('sem sessão (401), rejeita sem toast', async () => {
    axiosApi.defaults.adapter = respondWith(401, {
      message: 'Sessão não informada.',
    });

    await expect(apiSessionService.validate()).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('servidor com erro (5xx), rejeita e mostra o toast do servidor', async () => {
    axiosApi.defaults.adapter = respondWith(503, {
      message: 'Serviço indisponível.',
    });

    await expect(apiSessionService.validate()).rejects.toMatchObject({
      response: { status: 503 },
    });
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('Serviço indisponível.', {
      id: 'errorToastId',
    });
  });

  it('servidor fora (rede), rejeita e mostra "Erro de comunicação"', async () => {
    axiosApi.defaults.adapter = failWithNetworkError();

    await expect(apiSessionService.validate()).rejects.toMatchObject({
      code: 'ERR_NETWORK',
    });
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('Erro de comunicação', {
      id: 'errorToastId',
    });
  });
});
