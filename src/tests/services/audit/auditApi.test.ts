import { describe, expect, it } from 'vitest';

import { type DataTableQuery } from '@/components/global/dataTable/useDataTableQuery';
import {
  buildAuditListParams,
  fetchAuditLogDetail,
  fetchAuditLogs,
  fetchAuditUserOptions,
  fetchEntityAuditLogs,
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
      search: 'Priscila',
    });
    expect(count).toBe(1);
    expect(logs[0].description).toBe('Criou o usuário "Priscila Camargo".');
  });

  // A listagem não traz o de→para: ele vem no detalhe e na linha do tempo.
  it('devolve os itens da lista sem `fieldChanges` nem `before`/`after`', async () => {
    const { logs } = await fetchAuditLogs({ page: 0, pageSize: 1 });
    expect(logs[0]).not.toHaveProperty('fieldChanges');
    expect(logs[0]).not.toHaveProperty('before');
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

/** Detalhe do primeiro evento que casa a busca (o mock resolve a busca na descrição). */
async function findDetail(search: string) {
  const { logs } = await fetchAuditLogs({ page: 0, pageSize: 1, search });
  const { auditLog } = await fetchAuditLogDetail(logs[0].id);
  return auditLog;
}

describe('fetchAuditLogDetail', () => {
  it('devolve o envelope `{ auditLog }` com antes/depois crus e o de→para', async () => {
    const { logs } = await fetchAuditLogs({
      page: 0,
      pageSize: 1,
      module: 'USERS',
      action: 'update',
    });
    const response = await fetchAuditLogDetail(logs[0].id);

    expect(Object.keys(response)).toEqual(['auditLog']);
    expect(response.auditLog.id).toBe(logs[0].id);
    expect(response.auditLog).toHaveProperty('before');
    expect(response.auditLog).toHaveProperty('after');
    expect(response.auditLog.fieldChanges.length).toBeGreaterThan(0);
  });

  it('lança para um id inexistente', async () => {
    await expect(fetchAuditLogDetail('log_inexistente')).rejects.toThrow();
  });

  // Criação: todos os campos gravados, partindo de [Vazio]; os vazios dos dois
  // lados (foto, tempo de inatividade) não entram.
  it('na criação, lista os campos gravados sem os vazios', async () => {
    const auditLog = await findDetail('Priscila');

    expect(auditLog.action).toBe('create');
    expect(auditLog.fieldChanges).toEqual([
      { field: 'name', label: 'Nome', from: '[Vazio]', to: 'Priscila Camargo' },
      {
        field: 'email',
        label: 'E-mail',
        from: '[Vazio]',
        to: 'priscila.camargo@example.com',
      },
      { field: 'phone', label: 'Telefone', from: '[Vazio]', to: '11988887777' },
      { field: 'isActive', label: 'Ativo', from: '[Vazio]', to: 'Sim' },
    ]);
  });

  it('na exclusão, termina em [Vazio] e formata booleano e número', async () => {
    const auditLog = await findDetail('Rodrigo');

    expect(auditLog.action).toBe('delete');
    expect(auditLog.after).toBeNull();
    expect(
      auditLog.fieldChanges.map(({ label, from, to }) => [label, from, to])
    ).toEqual([
      ['Nome', 'Rodrigo Teixeira', '[Vazio]'],
      ['E-mail', 'rodrigo.teixeira@example.com', '[Vazio]'],
      ['Ativo', 'Não', '[Vazio]'],
      ['Tempo de inatividade (minutos)', '15', '[Vazio]'],
    ]);
  });

  it('na edição, só os campos alterados, na ordem do catálogo', async () => {
    const auditLog = await findDetail('Suporte');

    expect(auditLog.changedFields).toEqual(['permissions', 'description']);
    expect(auditLog.fieldChanges.map((change) => change.field)).toEqual([
      'description',
      'permissions',
    ]);
  });

  it('formata o valor da configuração pelo tipo da chave', async () => {
    const notifications = await findDetail('Notificações por e-mail');
    expect(notifications.fieldChanges).toEqual([
      { field: 'value', label: 'Valor', from: 'Não', to: 'Sim' },
    ]);

    const idleTimeout = await findDetail('Tempo de inatividade até o logout');
    expect(idleTimeout.fieldChanges).toEqual([
      { field: 'value', label: 'Valor', from: '30', to: '20' },
    ]);
  });

  it('não tem de→para no login nem na exportação', async () => {
    const exportLog = await findDetail('Exportou');
    expect(exportLog.action).toBe('export');
    expect(exportLog.fieldChanges).toEqual([]);
    // Os filtros da exportação ficam no `after` cru.
    expect(exportLog.after).toEqual({ formato: 'CSV', busca: 'oliveira' });

    const { logs } = await fetchAuditLogs({
      page: 0,
      pageSize: 1,
      action: 'login',
    });
    const { auditLog } = await fetchAuditLogDetail(logs[0].id);
    expect(auditLog.fieldChanges).toEqual([]);
  });

  it('traz a descrição com o nome do registro entre aspas', async () => {
    const { logs } = await fetchAuditLogs({
      page: 0,
      pageSize: 50,
      action: 'create,update,delete,statusChange',
    });
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.every((log) => /".+"\.$/.test(log.description ?? ''))).toBe(
      true
    );
  });
});

describe('fetchEntityAuditLogs', () => {
  const camila = { entity: 'User', entityId: 'u_003' } as const;

  it('devolve `{ logs, count }` só do registro, do mais recente para o mais antigo', async () => {
    const { logs, count } = await fetchEntityAuditLogs({
      ...camila,
      page: 0,
      pageSize: 50,
    });

    expect(count).toBe(12);
    expect(logs).toHaveLength(12);
    expect(
      logs.every((log) => log.entity === 'User' && log.entityId === 'u_003')
    ).toBe(true);
    const times = logs.map((log) => log.createdAt);
    expect(times).toEqual([...times].sort().reverse());
    // Cada item é o da lista mais o de→para, sem `before`/`after`.
    expect(logs[0]).toHaveProperty('fieldChanges');
    expect(logs[0]).toHaveProperty('userName');
    expect(logs[0]).not.toHaveProperty('before');
  });

  it('inclui os logins do usuário e a troca de senha como [omitido]', async () => {
    const { logs } = await fetchEntityAuditLogs({
      ...camila,
      page: 0,
      pageSize: 50,
    });

    expect(logs.filter((log) => log.action === 'login')).toHaveLength(5);
    expect(logs.flatMap((log) => log.fieldChanges)).toContainEqual({
      field: 'password',
      label: 'Senha',
      from: '[omitido]',
      to: '[omitido]',
    });
  });

  it('pagina 0-based: a página 1 continua de onde a 0 parou', async () => {
    const all = await fetchEntityAuditLogs({
      ...camila,
      page: 0,
      pageSize: 50,
    });
    const first = await fetchEntityAuditLogs({
      ...camila,
      page: 0,
      pageSize: 10,
    });
    const second = await fetchEntityAuditLogs({
      ...camila,
      page: 1,
      pageSize: 10,
    });

    expect(first.logs.map((log) => log.id)).toEqual(
      all.logs.slice(0, 10).map((log) => log.id)
    );
    expect(second.logs.map((log) => log.id)).toEqual(
      all.logs.slice(10).map((log) => log.id)
    );
    expect(second.count).toBe(12);
  });

  it('registro sem eventos devolve lista vazia, não erro', async () => {
    await expect(
      fetchEntityAuditLogs({
        entity: 'User',
        entityId: 'u_999',
        page: 0,
        pageSize: 10,
      })
    ).resolves.toEqual({ logs: [], count: 0 });
  });

  it('configuração é identificada pela chave', async () => {
    const { logs, count } = await fetchEntityAuditLogs({
      entity: 'SystemConfig',
      entityId: 'notifications.email',
      page: 0,
      pageSize: 10,
    });

    expect(count).toBe(1);
    expect(logs[0].description).toBe(
      'Alterou a configuração "Notificações por e-mail".'
    );
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
