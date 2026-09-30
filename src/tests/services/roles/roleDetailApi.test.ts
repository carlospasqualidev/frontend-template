import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { axiosApi } from '@/services/api/api';
import {
  fetchPermissionCatalog,
  fetchRoleDetail,
} from '@/services/roles/roleDetailApi';
import { respondWith } from '@/tests/helpers/axiosAdapter';
import { makeRole, PERMISSION_CATALOG } from '@/tests/factories/role';

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

describe('fetchRoleDetail', () => {
  it('lê o cargo com as permissões em GET /client/roles/:roleId', async () => {
    const role = makeRole({
      id: 'role-1',
      usersCount: 4,
      permissions: [{ id: 'perm-1', name: 'backoffice.users.read' }],
    });
    const adapter = answerWith(200, { role });

    await expect(fetchRoleDetail('role-1')).resolves.toEqual(role);
    expect(requestOf(adapter).url).toBe('/client/roles/role-1');
  });

  // O cargo de um link antigo pode não existir mais: a tela diz que não achou.
  it.each([400, 404])('o %i volta sem toast', async (status) => {
    answerWith(status, { message: 'Cargo não existe na base de dados.' });

    await expect(fetchRoleDetail('role-x')).rejects.toMatchObject({
      response: { status },
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('as outras falhas mostram o toast do servidor', async () => {
    answerWith(403, { message: 'Você não possui permissão de acesso.' });

    await expect(fetchRoleDetail('role-1')).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledWith(
      'Você não possui permissão de acesso.',
      { id: 'errorToastId' }
    );
  });
});

describe('fetchPermissionCatalog', () => {
  it('lê o catálogo com o rótulo de cada módulo, grupo e permissão', async () => {
    const adapter = answerWith(200, PERMISSION_CATALOG);

    await expect(fetchPermissionCatalog()).resolves.toEqual(PERMISSION_CATALOG);
    expect(requestOf(adapter).url).toBe('/client/roles/permissions');
  });
});
