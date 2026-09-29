import { describe, expect, it } from 'vitest';

import { type DataTableQuery } from '@/components/global/dataTable/useDataTableQuery';
import {
  buildAuditListParams,
  fetchAuditLogDetail,
  fetchAuditLogs,
  fetchAuditUserOptions,
} from '@/services/audit/auditApi';

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

describe('fetchAuditLogs', () => {
  it('retorna a primeira página ordenada por data (mais recente primeiro) por padrão', async () => {
    const { logs, count } = await fetchAuditLogs({ page: 0, pageSize: 5 });
    expect(logs).toHaveLength(5);
    expect(count).toBeGreaterThan(5);
    // Sem sort explícito → createdAt desc: os timestamps já vêm decrescentes.
    const times = logs.map((log) => new Date(log.createdAt).getTime());
    const descending = [...times].sort((a, b) => b - a);
    expect(times).toEqual(descending);
  });

  it('filtra por conteúdo com match parcial (contains), não exato', async () => {
    const { logs, count } = await fetchAuditLogs({
      page: 0,
      pageSize: 10,
      search: 'Marina',
    });
    expect(count).toBe(1);
    expect(logs[0].description).toContain('Marina');
  });

  it('some com o registro que não casa a busca', async () => {
    const { logs } = await fetchAuditLogs({
      page: 0,
      pageSize: 50,
      search: 'inexistente-xyz',
    });
    expect(logs).toHaveLength(0);
  });

  it('filtra por módulo via CSV', async () => {
    const { logs, count } = await fetchAuditLogs({
      page: 0,
      pageSize: 50,
      module: 'USERS',
    });
    expect(count).toBe(logs.length);
    expect(logs.every((log) => log.module === 'USERS')).toBe(true);
  });

  it('pagina: a página 1 traz registros diferentes da página 0', async () => {
    const first = await fetchAuditLogs({ page: 0, pageSize: 5 });
    const second = await fetchAuditLogs({ page: 1, pageSize: 5 });
    const firstIds = new Set(first.logs.map((log) => log.id));
    expect(second.logs.some((log) => firstIds.has(log.id))).toBe(false);
  });

  // Página 0-based: a página 0 começa no primeiro registro (não pula nenhum) e
  // a página 1 continua exatamente de onde ela parou.
  it('pagina a partir do primeiro registro (0-based)', async () => {
    const all = await fetchAuditLogs({ page: 0, pageSize: 10 });
    const first = await fetchAuditLogs({ page: 0, pageSize: 5 });
    const second = await fetchAuditLogs({ page: 1, pageSize: 5 });

    expect(first.logs.map((log) => log.id)).toEqual(
      all.logs.slice(0, 5).map((log) => log.id)
    );
    expect(second.logs.map((log) => log.id)).toEqual(
      all.logs.slice(5, 10).map((log) => log.id)
    );
  });

  it('ordena por módulo em ordem crescente quando solicitado', async () => {
    const { logs } = await fetchAuditLogs({
      page: 0,
      pageSize: 50,
      orderBy: 'module',
      order: 'asc',
    });
    const modules = logs.map((log) => log.module);
    const sorted = [...modules].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    expect(modules).toEqual(sorted);
  });
});

describe('fetchAuditLogDetail', () => {
  it('retorna o antes/depois do registro existente', async () => {
    const { logs } = await fetchAuditLogs({
      page: 0,
      pageSize: 1,
      module: 'USERS',
      action: 'update',
    });
    const detail = await fetchAuditLogDetail(logs[0].id);
    expect(detail.id).toBe(logs[0].id);
    expect(detail).toHaveProperty('before');
    expect(detail).toHaveProperty('after');
  });

  it('lança para um id inexistente', async () => {
    await expect(fetchAuditLogDetail('log_inexistente')).rejects.toThrow();
  });
});

describe('fetchAuditUserOptions', () => {
  it('retorna as opções de usuário para o filtro', async () => {
    const options = await fetchAuditUserOptions();
    expect(options.length).toBeGreaterThan(0);
    expect(options[0]).toHaveProperty('id');
    expect(options[0]).toHaveProperty('name');
  });
});
