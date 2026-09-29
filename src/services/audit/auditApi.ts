import { z } from 'zod';

import { type DateRangeValue } from '@/components/global/dataTable/filters';
import { type DataTableQuery } from '@/components/global/dataTable/useDataTableQuery';
import { transformIntoDatabaseQueryDate } from '@/lib/dateTime/transformIntoDatabaseQueryDate';

/*
 * Trilha de auditoria — versão TEMPLATE com dados MOCK (não há backend real).
 * A forma das funções e os tipos espelham um serviço de verdade
 * (`services/<módulo>/` com schema Zod), então trocar o mock por chamadas ao
 * `api` é só reimplementar as funções `fetch*`/`update*` mantendo a assinatura.
 * O filtro/ordenação/paginação — que num serviço real ficariam no backend —
 * aqui são resolvidos em memória para a tela ficar funcional na demo.
 */

// Num serviço real estas opções (com rótulos pt-BR) viriam do backend, para que
// uma entidade nova auditada apareça sem o frontend precisar conhecê-la.
const auditFilterOptionSchema = z.object({ value: z.string(), label: z.string() });

const auditFilterOptionsSchema = z.object({
  modules: z.array(auditFilterOptionSchema),
  actions: z.array(auditFilterOptionSchema),
  entities: z.array(auditFilterOptionSchema),
});

export type AuditFilterOption = z.infer<typeof auditFilterOptionSchema>;
export type AuditFilterOptions = z.infer<typeof auditFilterOptionsSchema>;

export const auditLogListItemSchema = z.object({
  id: z.string(),
  module: z.string(),
  entity: z.string(),
  entityId: z.string().nullable(),
  action: z.string(),
  description: z.string().nullable(),
  changedFields: z.array(z.string()).default([]),
  userId: z.string().nullable(),
  userName: z.string().nullable(),
  createdAt: z.string(),
});

export type AuditLogListItem = z.infer<typeof auditLogListItemSchema>;

const auditListResponseSchema = z.object({
  logs: z.array(auditLogListItemSchema),
  count: z.number(),
});

export const auditLogDetailSchema = auditLogListItemSchema.omit({ userName: true }).extend({
  before: z.record(z.string(), z.unknown()).nullable(),
  after: z.record(z.string(), z.unknown()).nullable(),
  user: z.object({ id: z.string(), name: z.string(), email: z.string() }).nullable(),
});

export type AuditLogDetail = z.infer<typeof auditLogDetailSchema>;

// Campos ordenáveis (num serviço real, allowlist espelhada no backend).
export type AuditListOrderBy = 'createdAt' | 'module' | 'entity' | 'action' | 'description';

export interface AuditListParams {
  /** 0-based, como a DataTable e o backend (`GET /client/audit-logs`). */
  page: number;
  pageSize: number;
  module?: string;
  entity?: string;
  action?: string;
  userId?: string;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  orderBy?: AuditListOrderBy;
  order?: 'asc' | 'desc';
}

function toOrderBy(columnId: string): AuditListOrderBy | undefined {
  switch (columnId) {
    case 'createdAt':
    case 'module':
    case 'entity':
    case 'action':
    case 'description':
      return columnId;
    default:
      return undefined;
  }
}

function resolveSort(sort: DataTableQuery['sort']): Pick<AuditListParams, 'orderBy' | 'order'> {
  const first = sort[0];
  if (!first) return {};

  const orderBy = toOrderBy(first.id);
  if (!orderBy) return {};

  return { orderBy, order: first.desc ? 'desc' : 'asc' };
}

function getRange(value: unknown): DateRangeValue {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as DateRangeValue)
    : { from: '', to: '' };
}

function toBound(date: string, type: 'start' | 'end'): string | undefined {
  if (!date) return undefined;
  return (
    transformIntoDatabaseQueryDate({ date, type, hasTimeStamp: false, databaseDateHasTimeStamp: true }) || undefined
  );
}

/** Junta um filtro de múltipla escolha (array) em `a,b,c` para a query. */
function joinMulti(value: unknown): string | undefined {
  if (Array.isArray(value) && value.length > 0) return value.filter(Boolean).join(',');
  if (typeof value === 'string' && value) return value;
  return undefined;
}

/** Traduz o estado da DataTable (0-based, filtros) para os params do endpoint. */
export function buildAuditListParams(query: DataTableQuery): AuditListParams {
  const { filters } = query;
  const createdAt = getRange(filters.createdAt);

  return {
    page: query.page,
    pageSize: query.pageSize,
    search: typeof filters.search === 'string' && filters.search ? filters.search : undefined,
    module: joinMulti(filters.module),
    action: joinMulti(filters.action),
    entity: joinMulti(filters.entity),
    userId: joinMulti(filters.userId),
    createdFrom: toBound(createdAt.from, 'start'),
    createdTo: toBound(createdAt.to, 'end'),
    ...resolveSort(query.sort),
  };
}

// ---------------------------------------------------------------------------
// Dados MOCK (substitua por chamadas ao `api` num projeto real)
// ---------------------------------------------------------------------------

const MOCK_USERS = [
  { id: 'usr_ana', name: 'Ana Ribeiro', email: 'ana.ribeiro@example.com' },
  { id: 'usr_bruno', name: 'Bruno Carvalho', email: 'bruno.carvalho@example.com' },
  { id: 'usr_carla', name: 'Carla Nunes', email: 'carla.nunes@example.com' },
] as const;

const MODULE_OPTIONS: AuditFilterOption[] = [
  { value: 'USERS', label: 'Usuários' },
  { value: 'SECURITY', label: 'Segurança' },
  { value: 'BILLING', label: 'Faturamento' },
  { value: 'SETTINGS', label: 'Configurações' },
];

const ENTITY_OPTIONS: AuditFilterOption[] = [
  { value: 'User', label: 'Usuário' },
  { value: 'Role', label: 'Perfil de acesso' },
  { value: 'Invoice', label: 'Fatura' },
  { value: 'ApiKey', label: 'Chave de API' },
  { value: 'Setting', label: 'Configuração' },
];

const ACTION_OPTIONS: AuditFilterOption[] = [
  { value: 'create', label: 'Criação' },
  { value: 'update', label: 'Edição' },
  { value: 'delete', label: 'Exclusão' },
  { value: 'statusChange', label: 'Mudança de status' },
  { value: 'login', label: 'Login' },
];

interface EventSeed {
  module: string;
  entity: string;
  entityId: string | null;
  action: string;
  description: string;
  changedFields: string[];
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  userId: string | null;
}

const EVENT_SEEDS: EventSeed[] = [
  {
    module: 'USERS', entity: 'User', entityId: 'usr_marina', action: 'create',
    description: 'Cadastrou o usuário Marina Alves',
    changedFields: [], before: null,
    after: { name: 'Marina Alves', email: 'marina.alves@example.com', role: 'Operador' },
    userId: 'usr_ana',
  },
  {
    module: 'USERS', entity: 'User', entityId: 'usr_bruno', action: 'update',
    description: 'Alterou o perfil de acesso de Bruno Carvalho',
    changedFields: ['role'], before: { role: 'Operador' }, after: { role: 'Gestor' },
    userId: 'usr_ana',
  },
  {
    module: 'SECURITY', entity: 'User', entityId: 'usr_carla', action: 'statusChange',
    description: 'Bloqueou o usuário Carla Nunes',
    changedFields: ['isBlocked'], before: { isBlocked: false }, after: { isBlocked: true },
    userId: 'usr_ana',
  },
  {
    module: 'SECURITY', entity: 'Role', entityId: 'role_intern', action: 'delete',
    description: "Excluiu o perfil 'Estagiário'",
    changedFields: [], before: { name: 'Estagiário', usersCount: 0 }, after: null,
    userId: 'usr_bruno',
  },
  {
    module: 'SECURITY', entity: 'Role', entityId: 'role_auditor', action: 'create',
    description: "Criou o perfil 'Auditor'",
    changedFields: [], before: null, after: { name: 'Auditor', permissions: 12 },
    userId: 'usr_bruno',
  },
  {
    module: 'SETTINGS', entity: 'Setting', entityId: 'cfg_session', action: 'update',
    description: 'Alterou o tempo de expiração da sessão',
    changedFields: ['value'], before: { value: '30 min' }, after: { value: '60 min' },
    userId: 'usr_carla',
  },
  {
    module: 'SECURITY', entity: 'User', entityId: 'usr_ana', action: 'login',
    description: 'Entrou no sistema',
    changedFields: [], before: null, after: null, userId: 'usr_ana',
  },
  {
    module: 'BILLING', entity: 'Invoice', entityId: 'inv_0042', action: 'update',
    description: 'Reemitiu a fatura #2025-0042',
    changedFields: ['status'], before: { status: 'Cancelada', amount: 'R$ 1.200,00' },
    after: { status: 'Emitida', amount: 'R$ 1.200,00' }, userId: 'usr_carla',
  },
  {
    module: 'BILLING', entity: 'Invoice', entityId: 'inv_0051', action: 'create',
    description: 'Gerou a fatura #2025-0051',
    changedFields: [], before: null,
    after: { number: '2025-0051', amount: 'R$ 890,50', customer: 'ACME Ltda' },
    userId: 'usr_carla',
  },
  {
    module: 'SECURITY', entity: 'ApiKey', entityId: 'key_cicd', action: 'delete',
    description: "Revogou a chave de API 'CI/CD'",
    changedFields: [], before: { name: 'CI/CD', scope: 'read-write' }, after: null,
    userId: 'usr_bruno',
  },
  {
    module: 'SECURITY', entity: 'ApiKey', entityId: 'key_reports', action: 'create',
    description: "Criou a chave de API 'Relatórios'",
    changedFields: [], before: null, after: { name: 'Relatórios', scope: 'read-only' },
    userId: 'usr_bruno',
  },
  {
    module: 'USERS', entity: 'User', entityId: 'usr_ana', action: 'update',
    description: 'Atualizou o e-mail de contato',
    changedFields: ['email'], before: { email: 'ana.r@example.com' },
    after: { email: 'ana.ribeiro@example.com' }, userId: 'usr_ana',
  },
  {
    module: 'BILLING', entity: 'Invoice', entityId: 'inv_0039', action: 'statusChange',
    description: 'Cancelou a fatura #2025-0039',
    changedFields: ['status'], before: { status: 'Emitida' }, after: { status: 'Cancelada' },
    userId: 'usr_carla',
  },
  {
    module: 'SETTINGS', entity: 'Setting', entityId: 'cfg_notif', action: 'update',
    description: 'Habilitou notificações por e-mail',
    changedFields: ['value'], before: { value: 'false' }, after: { value: 'true' },
    userId: 'usr_carla',
  },
  {
    module: 'USERS', entity: 'User', entityId: 'usr_paulo', action: 'create',
    description: 'Cadastrou o usuário Paulo Freitas',
    changedFields: [], before: null,
    after: { name: 'Paulo Freitas', email: 'paulo.freitas@example.com', role: 'Operador' },
    userId: 'usr_ana',
  },
  {
    module: 'SECURITY', entity: 'Role', entityId: 'role_manager', action: 'update',
    description: "Ajustou as permissões do perfil 'Gestor'",
    changedFields: ['permissions'], before: { permissions: 18 }, after: { permissions: 21 },
    userId: 'usr_bruno',
  },
  {
    module: 'USERS', entity: 'User', entityId: 'usr_temp', action: 'delete',
    description: "Excluiu o usuário de teste 'temp01'",
    changedFields: [], before: { name: 'temp01', email: 'temp01@example.com' }, after: null,
    userId: null,
  },
  {
    module: 'SECURITY', entity: 'User', entityId: 'usr_bruno', action: 'login',
    description: 'Entrou no sistema',
    changedFields: [], before: null, after: null, userId: 'usr_bruno',
  },
];

// createdAt determinístico: mais recente primeiro, 90 min de intervalo entre eventos.
const BASE_TIME = new Date('2026-07-11T18:00:00.000Z').getTime();

const MOCK_LOGS: AuditLogDetail[] = EVENT_SEEDS.map((seed, index) => ({
  id: `log_${String(index + 1).padStart(3, '0')}`,
  module: seed.module,
  entity: seed.entity,
  entityId: seed.entityId,
  action: seed.action,
  description: seed.description,
  changedFields: seed.changedFields,
  userId: seed.userId,
  createdAt: new Date(BASE_TIME - index * 90 * 60_000).toISOString(),
  before: seed.before,
  after: seed.after,
  user: seed.userId ? (MOCK_USERS.find((user) => user.id === seed.userId) ?? null) : null,
}));

const MOCK_DELAY_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function csvIncludes(csv: string | undefined, value: string): boolean {
  if (!csv) return true;
  return csv.split(',').includes(value);
}

function matchesSearch(log: AuditLogDetail, search: string | undefined): boolean {
  if (!search) return true;
  const needle = search.toLowerCase();
  const haystack = [
    log.description ?? '',
    log.entity,
    log.module,
    log.entityId ?? '',
    log.user?.name ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

function withinRange(createdAt: string, from: string | undefined, to: string | undefined): boolean {
  const time = new Date(createdAt).getTime();
  if (from && time < new Date(from).getTime()) return false;
  if (to && time > new Date(to).getTime()) return false;
  return true;
}

function sortValue(log: AuditLogDetail, orderBy: AuditListOrderBy): string {
  switch (orderBy) {
    case 'module':
      return log.module;
    case 'entity':
      return log.entity;
    case 'action':
      return log.action;
    case 'description':
      return log.description ?? '';
    case 'createdAt':
    default:
      return log.createdAt;
  }
}

export async function fetchAuditFilterOptions(): Promise<AuditFilterOptions> {
  await sleep(MOCK_DELAY_MS);
  return auditFilterOptionsSchema.parse({
    modules: MODULE_OPTIONS,
    actions: ACTION_OPTIONS,
    entities: ENTITY_OPTIONS,
  });
}

export async function fetchAuditLogs(params: AuditListParams): Promise<z.infer<typeof auditListResponseSchema>> {
  await sleep(MOCK_DELAY_MS);

  const filtered = MOCK_LOGS.filter(
    (log) =>
      matchesSearch(log, params.search) &&
      csvIncludes(params.module, log.module) &&
      csvIncludes(params.action, log.action) &&
      csvIncludes(params.entity, log.entity) &&
      csvIncludes(params.userId, log.userId ?? '') &&
      withinRange(log.createdAt, params.createdFrom, params.createdTo)
  );

  const orderBy = params.orderBy ?? 'createdAt';
  const direction = params.order ?? 'desc';
  const sorted = [...filtered].sort((a, b) => {
    const comparison = sortValue(a, orderBy).localeCompare(sortValue(b, orderBy), 'pt-BR');
    return direction === 'desc' ? -comparison : comparison;
  });

  const start = params.page * params.pageSize;
  const pageLogs = sorted.slice(start, start + params.pageSize).map((log) => ({
    id: log.id,
    module: log.module,
    entity: log.entity,
    entityId: log.entityId,
    action: log.action,
    description: log.description,
    changedFields: log.changedFields,
    userId: log.userId,
    userName: log.user?.name ?? null,
    createdAt: log.createdAt,
  }));

  return auditListResponseSchema.parse({ logs: pageLogs, count: filtered.length });
}

export async function fetchAuditLogDetail(id: string): Promise<AuditLogDetail> {
  await sleep(MOCK_DELAY_MS);
  const log = MOCK_LOGS.find((item) => item.id === id);
  if (!log) throw new Error('Registro de auditoria não encontrado.');
  return auditLogDetailSchema.parse(log);
}

/** Opções de usuário para o filtro (num serviço real, reusa a listagem de usuários). */
export async function fetchAuditUserOptions(): Promise<{ id: string; name: string }[]> {
  await sleep(MOCK_DELAY_MS);
  return MOCK_USERS.map((user) => ({ id: user.id, name: user.name }));
}

export const auditKeys = {
  all: ['audit-logs'] as const,
  list: (params: AuditListParams) => [...auditKeys.all, 'list', params] as const,
  detail: (id: string) => [...auditKeys.all, id] as const,
  userOptions: ['audit-logs', 'user-options'] as const,
  options: ['audit-logs', 'options'] as const,
};
