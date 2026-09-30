import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { axiosApi } from '@/services/api/api';
import { fetchUser } from '@/services/users/userDetailApi';
import { respondWith } from '@/tests/helpers/axiosAdapter';
import { makeCompanyUser } from '@/tests/factories/companyUser';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const defaultAdapter = axiosApi.defaults.adapter;

afterEach(() => {
  axiosApi.defaults.adapter = defaultAdapter;
  vi.clearAllMocks();
});

function answerWith(status: number, data: unknown) {
  const adapter = vi.fn(respondWith(status, data));
  axiosApi.defaults.adapter = adapter;
  return adapter;
}

describe('fetchUser', () => {
  it('lê GET /client/users/:userId e devolve { user }', async () => {
    const user = makeCompanyUser();
    const adapter = answerWith(200, { user });

    await expect(fetchUser(user.id)).resolves.toEqual({ user });
    expect(adapter.mock.lastCall?.[0]).toMatchObject({
      method: 'get',
      url: `/client/users/${user.id}`,
    });
  });

  // A tela mostra "usuário não encontrado": o toast do servidor repetiria.
  it.each([
    [404, 'Usuário não existe na base de dados.'],
    [400, 'userId: Identificador inválido.'],
  ])('rejeita o %i sem toast', async (status, message) => {
    answerWith(status, { message });

    await expect(fetchUser('qualquer')).rejects.toMatchObject({
      response: { status },
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('mantém o toast do servidor nas outras falhas (403)', async () => {
    answerWith(403, { message: 'Você não possui permissão de acesso.' });

    await expect(fetchUser('qualquer')).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledWith(
      'Você não possui permissão de acesso.',
      { id: 'errorToastId' }
    );
  });
});
