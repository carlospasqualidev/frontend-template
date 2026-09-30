import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { axiosApi } from '@/services/api/api';
import { setUserRoles } from '@/services/users/userRolesApi';
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

function requestOf(adapter: ReturnType<typeof answerWith>) {
  const config = adapter.mock.lastCall?.[0];
  if (!config) throw new Error('Nenhuma chamada ao servidor.');
  return config;
}

describe('setUserRoles', () => {
  it('manda o conjunto completo em PUT /client/users/:userId/roles', async () => {
    const user = makeCompanyUser();
    const adapter = answerWith(200, {
      message: 'Cargos do usuário atualizados.',
      user: {
        ...user,
        roles: user.roles.map((role) => ({ ...role, isSystem: false })),
      },
    });

    const response = await setUserRoles(user.id, ['role-1', 'role-2']);

    expect(requestOf(adapter)).toMatchObject({
      method: 'put',
      url: `/client/users/${user.id}/roles`,
    });
    expect(JSON.parse(String(requestOf(adapter).data))).toEqual({
      roleIds: ['role-1', 'role-2'],
    });
    expect(response.user.roles).toEqual(user.roles);
    expect(toast.success).toHaveBeenCalledWith(
      'Cargos do usuário atualizados.'
    );
  });

  // Anti-escalonamento: quem decide é o servidor, e a recusa é o toast dele.
  it('mostra no toast a recusa do anti-escalonamento', async () => {
    const message = 'Você não pode conceder permissões que não possui.';
    answerWith(403, { message });

    await expect(setUserRoles('u-1', ['role-1'])).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledWith(message, { id: 'errorToastId' });
  });
});
