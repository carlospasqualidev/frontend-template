import { type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { axiosApi } from '@/services/api/api';
import {
  fetchAllRoleUsers,
  MAX_ROLE_MEMBERS,
  setRoleUsers,
} from '@/services/roles/roleUsersApi';
import { respondWith } from '@/tests/helpers/axiosAdapter';
import { makeRole, makeRoleMember } from '@/tests/factories/role';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const defaultAdapter = axiosApi.defaults.adapter;

afterEach(() => {
  axiosApi.defaults.adapter = defaultAdapter;
  vi.clearAllMocks();
});

function members(from: number, length: number) {
  return Array.from({ length }, (_, index) =>
    makeRoleMember({
      id: `u-${from + index}`,
      name: `Pessoa ${from + index}`,
      email: `pessoa.${from + index}@example.com`,
    })
  );
}

// Responde cada página com as pessoas dela, de um total de `count`.
function answerPages(count: number) {
  const adapter = vi.fn((config: InternalAxiosRequestConfig) => {
    const { page, pageSize } = config.params as {
      page: number;
      pageSize: number;
    };
    const from = page * pageSize;
    const length = Math.max(0, Math.min(pageSize, count - from));
    return respondWith(200, { users: members(from, length), count })(config);
  });
  axiosApi.defaults.adapter = adapter;
  return adapter;
}

describe('fetchAllRoleUsers', () => {
  it('junta as páginas de GET /client/roles/:roleId/users até o total', async () => {
    const adapter = answerPages(150);

    const result = await fetchAllRoleUsers('role-1');

    expect(result.count).toBe(150);
    expect(result.users).toHaveLength(150);
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(adapter.mock.calls[0]?.[0]).toMatchObject({
      url: '/client/roles/role-1/users',
      params: { page: 0, pageSize: 100, orderBy: 'name', order: 'asc' },
    });
    expect(adapter.mock.calls[1]?.[0].params).toMatchObject({ page: 1 });
  });

  it('cargo sem usuários: uma página só', async () => {
    const adapter = answerPages(0);

    await expect(fetchAllRoleUsers('role-1')).resolves.toEqual({
      users: [],
      count: 0,
    });
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  // O `PUT` aceita até 1000 ids: além disso a lista não é lida inteira, e o
  // total diz à tela que ela não cabe.
  it('para no máximo que o servidor aceita no corpo', async () => {
    const adapter = answerPages(MAX_ROLE_MEMBERS + 50);

    const result = await fetchAllRoleUsers('role-1');

    expect(result.users).toHaveLength(MAX_ROLE_MEMBERS);
    expect(result.count).toBe(MAX_ROLE_MEMBERS + 50);
    expect(adapter).toHaveBeenCalledTimes(10);
  });

  it('o 404 (cargo que não existe) volta sem toast', async () => {
    axiosApi.defaults.adapter = respondWith(404, {
      message: 'Cargo não existe na base de dados.',
    });

    await expect(fetchAllRoleUsers('role-x')).rejects.toMatchObject({
      response: { status: 404 },
    });
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe('setRoleUsers', () => {
  it('manda o conjunto completo em PUT /client/roles/:roleId/users', async () => {
    const role = makeRole({ id: 'role-1', usersCount: 2 });
    const adapter = vi.fn(
      respondWith(200, { message: 'Usuários do cargo atualizados.', role })
    );
    axiosApi.defaults.adapter = adapter;

    await expect(setRoleUsers('role-1', ['u-1', 'u-2'])).resolves.toEqual({
      message: 'Usuários do cargo atualizados.',
      role,
    });
    const config = adapter.mock.lastCall?.[0];
    expect(config).toMatchObject({
      method: 'put',
      url: '/client/roles/role-1/users',
    });
    expect(JSON.parse(String(config?.data))).toEqual({
      userIds: ['u-1', 'u-2'],
    });
    expect(toast.success).toHaveBeenCalledWith(
      'Usuários do cargo atualizados.'
    );
  });

  it('a recusa (incluir a si mesmo) é o toast do servidor', async () => {
    const message =
      'Você não pode alterar os seus próprios cargos de acesso. Peça a outro administrador.';
    axiosApi.defaults.adapter = respondWith(400, { message });

    await expect(setRoleUsers('role-1', ['u-1'])).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledWith(message, { id: 'errorToastId' });
  });
});
