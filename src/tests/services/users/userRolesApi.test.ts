import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { axiosApi } from '@/services/api/api';
import {
  fetchPermissionCatalog,
  fetchRoleDetail,
  searchRoleOptions,
  setUserRoles,
} from '@/services/users/userRolesApi';
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

const ROLE = {
  id: 'role-1',
  name: 'Suporte',
  description: null,
  isSystem: false,
  usersCount: 2,
  permissionsCount: 1,
  createdAt: '2026-09-01T12:00:00.000Z',
  updatedAt: '2026-09-01T12:00:00.000Z',
};

describe('searchRoleOptions', () => {
  it('busca os cargos pelo nome no servidor, uma página por nome', async () => {
    const adapter = answerWith(200, { roles: [ROLE], count: 1 });

    await expect(searchRoleOptions('sup')).resolves.toEqual([
      { id: 'role-1', name: 'Suporte', description: null, isSystem: false },
    ]);
    expect(requestOf(adapter)).toMatchObject({
      method: 'get',
      url: '/client/roles',
      params: {
        page: 0,
        pageSize: 20,
        search: 'sup',
        orderBy: 'name',
        order: 'asc',
      },
    });
  });

  it('sem termo, não manda `search` (os primeiros por nome)', async () => {
    const adapter = answerWith(200, { roles: [], count: 0 });

    await searchRoleOptions('');
    expect(requestOf(adapter).params?.search).toBeUndefined();
  });
});

describe('fetchRoleDetail', () => {
  it('lê o cargo com as permissões em GET /client/roles/:roleId', async () => {
    const permissions = [{ id: 'perm-1', name: 'backoffice.users.read' }];
    const adapter = answerWith(200, { role: { ...ROLE, permissions } });

    await expect(fetchRoleDetail('role-1')).resolves.toMatchObject({
      id: 'role-1',
      permissions,
    });
    expect(requestOf(adapter).url).toBe('/client/roles/role-1');
  });

  // O cargo de um link antigo (o filtro da URL) pode não existir mais.
  it('o 404 volta sem toast', async () => {
    answerWith(404, { message: 'Cargo não encontrado.' });

    await expect(fetchRoleDetail('role-x')).rejects.toMatchObject({
      response: { status: 404 },
    });
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe('fetchPermissionCatalog', () => {
  it('lê o catálogo com o rótulo de cada permissão', async () => {
    const catalog = {
      modules: [
        {
          module: 'backoffice',
          moduleLabel: 'Backoffice',
          groups: [
            {
              groupLabel: 'Usuários',
              permissions: [
                {
                  id: 'perm-1',
                  name: 'backoffice.users.read',
                  action: 'read',
                  label: 'Visualizar usuários',
                },
              ],
            },
          ],
        },
      ],
    };
    const adapter = answerWith(200, catalog);

    await expect(fetchPermissionCatalog()).resolves.toEqual(catalog);
    expect(requestOf(adapter).url).toBe('/client/roles/permissions');
  });
});

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
