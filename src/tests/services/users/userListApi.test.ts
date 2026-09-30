import { afterEach, describe, expect, it, vi } from 'vitest';

import { type DataTableQuery } from '@/components/global/dataTable/useDataTableQuery';
import { axiosApi } from '@/services/api/api';
import {
  buildUserListParams,
  fetchUsers,
  searchUserOptions,
} from '@/services/users/userListApi';
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

function makeQuery(overrides: Partial<DataTableQuery> = {}): DataTableQuery {
  return { page: 0, pageSize: 25, sort: [], filters: {}, ...overrides };
}

describe('buildUserListParams', () => {
  it('repassa a página 0-based e o tamanho da página sem conversão', () => {
    expect(buildUserListParams(makeQuery({ page: 2 }))).toMatchObject({
      page: 2,
      pageSize: 25,
    });
  });

  it('traduz os filtros da tela para os parâmetros do servidor', () => {
    const params = buildUserListParams(
      makeQuery({
        filters: {
          search: 'camila',
          roleId: ['role-a', 'role-b'],
          isActive: 'false',
        },
      })
    );

    expect(params).toMatchObject({
      search: 'camila',
      roleId: 'role-a,role-b',
      isActive: 'false',
    });
  });

  it('manda o período de cadastro como as bordas do dia local em ISO UTC', () => {
    const params = buildUserListParams(
      makeQuery({
        filters: { createdAt: { from: '2026-09-01', to: '2026-09-30' } },
      })
    );

    expect(params.createdFrom).toBe(
      new Date(2026, 8, 1, 0, 0, 0, 0).toISOString()
    );
    expect(params.createdTo).toBe(
      new Date(2026, 8, 30, 23, 59, 59, 999).toISOString()
    );
    expect(params.createdFrom).toMatch(/Z$/);
  });

  // Status fora de `true`/`false` (URL editada à mão) não vai ao servidor.
  it('descarta status e ordenação fora da allowlist do servidor', () => {
    const params = buildUserListParams(
      makeQuery({
        filters: { isActive: 'pending' },
        sort: [{ id: 'roles', desc: false }],
      })
    );

    expect(params.isActive).toBeUndefined();
    expect(params.orderBy).toBeUndefined();
    expect(params.order).toBeUndefined();
  });

  it('ordena pelas colunas da allowlist, no sentido do cabeçalho', () => {
    expect(
      buildUserListParams(
        makeQuery({ sort: [{ id: 'lastLoginAt', desc: true }] })
      )
    ).toMatchObject({ orderBy: 'lastLoginAt', order: 'desc' });
    expect(
      buildUserListParams(makeQuery({ sort: [{ id: 'email', desc: false }] }))
    ).toMatchObject({ orderBy: 'email', order: 'asc' });
  });

  it('sem filtros nem ordenação, não manda nada além da página', () => {
    expect(buildUserListParams(makeQuery())).toEqual({
      page: 0,
      pageSize: 25,
      search: undefined,
      roleId: undefined,
      isActive: undefined,
      createdFrom: undefined,
      createdTo: undefined,
    });
  });
});

describe('fetchUsers', () => {
  it('lê GET /client/users com os parâmetros e devolve { users, count }', async () => {
    const user = makeCompanyUser();
    const adapter = answerWith(200, { users: [user], count: 41 });

    await expect(
      fetchUsers({ page: 1, pageSize: 25, isActive: 'true' })
    ).resolves.toEqual({ users: [user], count: 41 });
    expect(requestOf(adapter)).toMatchObject({
      method: 'get',
      url: '/client/users',
      params: { page: 1, pageSize: 25, isActive: 'true' },
    });
  });

  // Resposta fora do contrato (o mock antigo devolvia só o array, sem `count`).
  it('recusa a resposta sem `count`', async () => {
    answerWith(200, { users: [makeCompanyUser()] });

    await expect(fetchUsers({ page: 0, pageSize: 25 })).rejects.toThrow();
  });
});

describe('searchUserOptions', () => {
  it('busca no servidor por nome ou e-mail e devolve id e nome', async () => {
    const adapter = answerWith(200, {
      users: [makeCompanyUser({ id: 'u-1', name: 'Bruno Lima' })],
      count: 1,
    });

    await expect(searchUserOptions('bru')).resolves.toEqual([
      { id: 'u-1', name: 'Bruno Lima' },
    ]);
    expect(requestOf(adapter).params).toEqual({
      page: 0,
      pageSize: 20,
      search: 'bru',
      orderBy: 'name',
      order: 'asc',
    });
  });

  it('sem termo, pede os primeiros por nome, sem `search`', async () => {
    const adapter = answerWith(200, { users: [], count: 0 });

    await searchUserOptions('');

    expect(requestOf(adapter).params.search).toBeUndefined();
  });
});
