import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type DataTableQuery } from '@/components/global/dataTable/useDataTableQuery';
import { axiosApi } from '@/services/api/api';
import {
  buildAuditListParams,
  fetchAuditFilterOptions,
  fetchAuditLogDetail,
  fetchAuditLogs,
  fetchEntityAuditLogs,
} from '@/services/audit/auditApi';
import { respondWith } from '@/tests/helpers/axiosAdapter';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const defaultAdapter = axiosApi.defaults.adapter;

afterEach(() => {
  axiosApi.defaults.adapter = defaultAdapter;
  vi.clearAllMocks();
});

function makeQuery(overrides: Partial<DataTableQuery> = {}): DataTableQuery {
  return {
    page: 0,
    pageSize: 10,
    sort: [],
    filters: {},
    ...overrides,
  };
}

describe('buildAuditListParams', () => {
  // DataTable e backend são 0-based: a página passa sem conversão.
  it('repassa a página 0-based da DataTable sem conversão', () => {
    expect(buildAuditListParams(makeQuery({ page: 0 })).page).toBe(0);
    expect(buildAuditListParams(makeQuery({ page: 2 })).page).toBe(2);
  });

  it('repassa a busca de texto e ignora string vazia', () => {
    expect(
      buildAuditListParams(makeQuery({ filters: { search: 'maria' } })).search
    ).toBe('maria');
    expect(
      buildAuditListParams(makeQuery({ filters: { search: '' } })).search
    ).toBeUndefined();
  });

  it('junta filtros de múltipla escolha em CSV e descarta arrays vazios', () => {
    const params = buildAuditListParams(
      makeQuery({ filters: { module: ['USERS', 'SECURITY'], action: [] } })
    );
    expect(params.module).toBe('USERS,SECURITY');
    expect(params.action).toBeUndefined();
  });

  it('resolve a ordenação do primeiro sort para orderBy/order da allowlist', () => {
    const asc = buildAuditListParams(
      makeQuery({ sort: [{ id: 'module', desc: false }] })
    );
    expect(asc).toMatchObject({ orderBy: 'module', order: 'asc' });

    const desc = buildAuditListParams(
      makeQuery({ sort: [{ id: 'createdAt', desc: true }] })
    );
    expect(desc).toMatchObject({ orderBy: 'createdAt', order: 'desc' });
  });

  it('ignora ordenação por coluna fora da allowlist (ex.: userName)', () => {
    const params = buildAuditListParams(
      makeQuery({ sort: [{ id: 'userName', desc: true }] })
    );
    expect(params.orderBy).toBeUndefined();
    expect(params.order).toBeUndefined();
  });

  it('traduz o intervalo de datas em bordas de início/fim', () => {
    const params = buildAuditListParams(
      makeQuery({
        filters: { createdAt: { from: '2026-07-01', to: '2026-07-10' } },
      })
    );
    expect(params.createdFrom).toBeDefined();
    expect(params.createdTo).toBeDefined();
  });

  it('não define bordas de data quando o intervalo está vazio', () => {
    const params = buildAuditListParams(
      makeQuery({ filters: { createdAt: { from: '', to: '' } } })
    );
    expect(params.createdFrom).toBeUndefined();
    expect(params.createdTo).toBeUndefined();
  });
});

// Transporte sem rede: o adapter do `axiosApi` responde, e os interceptors e o
// `.parse` rodam como em produção. O adapter guarda o pedido para conferir
// caminho e parâmetros.
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

const LIST_ITEM = {
  id: '01a0f254-6532-70d9-ae6f-8583c9a52cbc',
  module: 'USERS',
  entity: 'User',
  entityId: '01a0f253-fc4e-745c-b069-dff39ba3116e',
  action: 'statusChange',
  description: 'Bloqueou o usuário "Maria Alves".',
  changedFields: ['isActive'],
  userId: '01a0f253-fc4e-745c-b069-dff39ba31170',
  userName: 'Admin',
  createdAt: '2026-09-30T12:40:12.338Z',
};

const FIELD_CHANGES = [
  { field: 'isActive', label: 'Ativo', from: 'Sim', to: 'Não' },
];

describe('fetchAuditFilterOptions', () => {
  it('lê as opções com rótulo em GET /client/audit-logs/options', async () => {
    const options = {
      modules: [{ value: 'USERS', label: 'Usuários' }],
      actions: [{ value: 'login', label: 'Login' }],
      entities: [{ value: 'User', label: 'Usuário' }],
    };
    const adapter = answerWith(200, options);

    await expect(fetchAuditFilterOptions()).resolves.toEqual(options);
    expect(requestOf(adapter)).toMatchObject({
      method: 'get',
      url: '/client/audit-logs/options',
    });
  });
});

describe('fetchAuditLogs', () => {
  // Filtro, busca, ordenação e paginação são do servidor: os parâmetros vão
  // como a tela os montou, com a página 0-based.
  it('envia os parâmetros da tela em GET /client/audit-logs e devolve `{ logs, count }`', async () => {
    const adapter = answerWith(200, { logs: [LIST_ITEM], count: 31 });
    const params = buildAuditListParams(
      makeQuery({
        page: 2,
        filters: { search: 'maria', module: ['USERS', 'SECURITY'] },
        sort: [{ id: 'module', desc: false }],
      })
    );

    await expect(fetchAuditLogs(params)).resolves.toEqual({
      logs: [LIST_ITEM],
      count: 31,
    });
    expect(requestOf(adapter)).toMatchObject({
      method: 'get',
      url: '/client/audit-logs',
      params: {
        page: 2,
        pageSize: 10,
        search: 'maria',
        module: 'USERS,SECURITY',
        orderBy: 'module',
        order: 'asc',
      },
    });
  });

  it('recusa a resposta fora do contrato (sem `count`)', async () => {
    answerWith(200, { logs: [LIST_ITEM] });

    await expect(fetchAuditLogs({ page: 0, pageSize: 10 })).rejects.toThrow();
  });
});

describe('fetchAuditLogDetail', () => {
  it('lê `{ auditLog }` com antes/depois crus e o de→para em GET /client/audit-logs/:id', async () => {
    const { userName: _userName, ...detailFields } = LIST_ITEM;
    const auditLog = {
      ...detailFields,
      before: { name: 'Maria Alves', isActive: true },
      after: { name: 'Maria Alves', isActive: false },
      user: { id: LIST_ITEM.userId, name: 'Admin', email: 'admin@admin.com' },
      fieldChanges: FIELD_CHANGES,
    };
    const adapter = answerWith(200, { auditLog });

    await expect(fetchAuditLogDetail(LIST_ITEM.id)).resolves.toEqual({
      auditLog,
    });
    expect(requestOf(adapter).url).toBe(`/client/audit-logs/${LIST_ITEM.id}`);
  });

  it('propaga o 404 com o toast do servidor', async () => {
    answerWith(404, { message: 'Registro não encontrado.' });

    await expect(fetchAuditLogDetail(LIST_ITEM.id)).rejects.toMatchObject({
      response: { status: 404 },
    });
    expect(toast.error).toHaveBeenCalledWith('Registro não encontrado.', {
      id: 'errorToastId',
    });
  });
});

describe('fetchEntityAuditLogs', () => {
  it('lê a linha do tempo do registro com a página 0-based', async () => {
    const logs = [{ ...LIST_ITEM, fieldChanges: FIELD_CHANGES }];
    const adapter = answerWith(200, { logs, count: 12 });

    await expect(
      fetchEntityAuditLogs({
        entity: 'User',
        entityId: LIST_ITEM.entityId,
        page: 1,
        pageSize: 10,
      })
    ).resolves.toEqual({ logs, count: 12 });
    expect(requestOf(adapter)).toMatchObject({
      method: 'get',
      url: `/client/audit-logs/entities/User/${LIST_ITEM.entityId}`,
      params: { page: 1, pageSize: 10 },
    });
  });

  // Em configuração o `entityId` é a chave; ela vai codificada no caminho.
  it('identifica o registro pelo id exato, codificado no caminho', async () => {
    const adapter = answerWith(200, { logs: [], count: 0 });

    await expect(
      fetchEntityAuditLogs({
        entity: 'SystemConfig',
        entityId: 'app/name',
        page: 0,
        pageSize: 10,
      })
    ).resolves.toEqual({ logs: [], count: 0 });
    expect(requestOf(adapter).url).toBe(
      '/client/audit-logs/entities/SystemConfig/app%2Fname'
    );
  });

  it('recusa item da linha do tempo sem o de→para', async () => {
    answerWith(200, { logs: [LIST_ITEM], count: 1 });

    await expect(
      fetchEntityAuditLogs({
        entity: 'User',
        entityId: LIST_ITEM.entityId,
        page: 0,
        pageSize: 10,
      })
    ).rejects.toThrow();
  });
});
