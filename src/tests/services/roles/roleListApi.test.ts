import { afterEach, describe, expect, it, vi } from 'vitest';

import { axiosApi } from '@/services/api/api';
import {
  buildRoleListParams,
  fetchRoles,
  searchRoleOptions,
} from '@/services/roles/roleListApi';
import { respondWith } from '@/tests/helpers/axiosAdapter';
import { makeRoleListItem } from '@/tests/factories/role';

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

describe('buildRoleListParams', () => {
  it('traduz a página, a busca e a ordenação da tela', () => {
    expect(
      buildRoleListParams({
        page: 2,
        pageSize: 25,
        filters: { search: 'sup' },
        sort: [{ id: 'createdAt', desc: true }],
      })
    ).toEqual({
      page: 2,
      pageSize: 25,
      search: 'sup',
      orderBy: 'createdAt',
      order: 'desc',
    });
  });

  it('sem busca nem ordenação, vale o padrão do servidor', () => {
    expect(
      buildRoleListParams({ page: 0, pageSize: 25, filters: {}, sort: [] })
    ).toEqual({ page: 0, pageSize: 25, search: undefined });
  });

  // A allowlist do servidor é `name | createdAt`: outra coluna não vai.
  it('ignora a ordenação por uma coluna fora da allowlist', () => {
    expect(
      buildRoleListParams({
        page: 0,
        pageSize: 25,
        filters: {},
        sort: [{ id: 'usersCount', desc: false }],
      })
    ).toEqual({ page: 0, pageSize: 25, search: undefined });
  });
});

describe('fetchRoles', () => {
  it('lê a página em GET /client/roles com os parâmetros da tela', async () => {
    const role = makeRoleListItem({ permissionsCount: 3, usersCount: 2 });
    const adapter = answerWith(200, { roles: [role], count: 1 });

    await expect(
      fetchRoles({ page: 0, pageSize: 25, search: 'sup', orderBy: 'name' })
    ).resolves.toEqual({ roles: [role], count: 1 });
    expect(requestOf(adapter)).toMatchObject({
      method: 'get',
      url: '/client/roles',
      params: { page: 0, pageSize: 25, search: 'sup', orderBy: 'name' },
    });
  });

  it('recusa a resposta fora do contrato', async () => {
    answerWith(200, { roles: [{ id: 'role-1' }], count: 1 });

    await expect(fetchRoles({ page: 0, pageSize: 25 })).rejects.toThrow();
  });
});

describe('searchRoleOptions', () => {
  it('busca os cargos pelo nome no servidor, uma página por nome', async () => {
    const adapter = answerWith(200, {
      roles: [makeRoleListItem({ id: 'role-1', description: null })],
      count: 1,
    });

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
