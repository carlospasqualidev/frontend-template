import { z } from 'zod';

import { type DateRangeValue } from '@/components/global/dataTable/filters';
import { type DataTableQuery } from '@/components/global/dataTable/useDataTableQuery';
import { transformIntoDatabaseQueryDate } from '@/lib/dateTime/transformIntoDatabaseQueryDate';
import {
  MOCK_AUDIT_AUTHORS,
  MOCK_AUDIT_LOGS,
  MOCK_AUDIT_OPTIONS,
} from '@/services/audit/auditMock';

/*
 * Trilha de auditoria — versão TEMPLATE com dados MOCK (`auditMock.ts`), já no
 * contrato do backend (`GET /client/audit-logs`, `/options`, `/:auditLogId` e
 * `/entities/:entity/:entityId`, ver `../server-template/docs/openapi.json`).
 * Para trocar pelo backend, reimplemente o corpo das funções `fetch*` com o
 * `api` e o `.parse` do schema, sem mudar a assinatura, e apague o `auditMock.ts`
 * e o `sleep`. O filtro, a ordenação e a paginação — que no serviço real ficam
 * no backend — aqui são resolvidos em memória para a tela ficar funcional.
 */

// As opções (com rótulos pt-BR) vêm do backend, para que uma entidade nova
// auditada apareça sem o frontend precisar conhecê-la.
const auditFilterOptionSchema = z.object({ value: z.string(), label: z.string() });

const auditFilterOptionsSchema = z.object({
  modules: z.array(auditFilterOptionSchema),
  actions: z.array(auditFilterOptionSchema),
  entities: z.array(auditFilterOptionSchema),
});

export type AuditFilterOption = z.infer<typeof auditFilterOptionSchema>;
export type AuditFilterOptions = z.infer<typeof auditFilterOptionsSchema>;

/**
 * De→para legível de um campo, pronto para exibir (`label: from → to`). O
 * servidor é dono do rótulo e da formatação: `[Vazio]` e `[omitido]` são textos
 * para mostrar como estão. `field` é o nome técnico, só para chave de lista.
 */
export const auditFieldChangeSchema = z.object({
  field: z.string(),
  label: z.string(),
  from: z.string(),
  to: z.string(),
});

export type AuditFieldChange = z.infer<typeof auditFieldChangeSchema>;

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

export type AuditListResponse = z.infer<typeof auditListResponseSchema>;

// `before`/`after` só com valores primitivos, dados pessoais inclusive.
const auditValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const auditLogDetailSchema = auditLogListItemSchema.omit({ userName: true }).extend({
  before: z.record(z.string(), auditValueSchema).nullable(),
  after: z.record(z.string(), auditValueSchema).nullable(),
  user: z.object({ id: z.string(), name: z.string(), email: z.string() }).nullable(),
  fieldChanges: z.array(auditFieldChangeSchema),
});

export type AuditLogDetail = z.infer<typeof auditLogDetailSchema>;

const auditLogDetailResponseSchema = z.object({ auditLog: auditLogDetailSchema });

export type AuditLogDetailResponse = z.infer<typeof auditLogDetailResponseSchema>;

/** Item da linha do tempo: o da listagem mais o de→para (sem `before`/`after`). */
export const entityAuditLogSchema = auditLogListItemSchema.extend({
  fieldChanges: z.array(auditFieldChangeSchema),
});

export type EntityAuditLog = z.infer<typeof entityAuditLogSchema>;

const entityAuditLogsResponseSchema = z.object({
  logs: z.array(entityAuditLogSchema),
  count: z.number(),
});

export type EntityAuditLogsResponse = z.infer<typeof entityAuditLogsResponseSchema>;

/** Entidades com linha do tempo (`entity` da rota; os `value` de `options.entities`). */
export type AuditEntity = 'User' | 'Role' | 'SystemConfig';

export interface EntityAuditLogsParams {
  entity: AuditEntity;
  /** O id exato do registro; em configuração, a chave (`security.idleTimeoutMinutes`). */
  entityId: string;
  /** 0-based, como a listagem. */
  page: number;
  /** Máximo 100 no backend. */
  pageSize: number;
}

// Campos ordenáveis (allowlist espelhada no backend).
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
// Resolução em memória do MOCK (sai inteira ao trocar pelo `api`)
// ---------------------------------------------------------------------------

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
  const haystack = [log.description ?? '', log.entity, log.module, log.entityId ?? '', log.user?.name ?? '']
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

function toListItem(log: AuditLogDetail): AuditLogListItem {
  return {
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
  };
}

/** `GET /client/audit-logs/options` → `{ modules, actions, entities }`. */
export async function fetchAuditFilterOptions(): Promise<AuditFilterOptions> {
  await sleep(MOCK_DELAY_MS);
  return auditFilterOptionsSchema.parse(MOCK_AUDIT_OPTIONS);
}

/** `GET /client/audit-logs` → `{ logs, count }` (sem `fieldChanges`, que vêm no detalhe). */
export async function fetchAuditLogs(params: AuditListParams): Promise<AuditListResponse> {
  await sleep(MOCK_DELAY_MS);

  const filtered = MOCK_AUDIT_LOGS.filter(
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
  const pageLogs = sorted.slice(start, start + params.pageSize).map(toListItem);

  return auditListResponseSchema.parse({ logs: pageLogs, count: filtered.length });
}

/** `GET /client/audit-logs/:auditLogId` → `{ auditLog }`, com `before`/`after` crus e `fieldChanges`. */
export async function fetchAuditLogDetail(id: string): Promise<AuditLogDetailResponse> {
  await sleep(MOCK_DELAY_MS);
  const log = MOCK_AUDIT_LOGS.find((item) => item.id === id);
  if (!log) throw new Error('Registro de auditoria não encontrado.');
  return auditLogDetailResponseSchema.parse({ auditLog: log });
}

/**
 * `GET /client/audit-logs/entities/:entity/:entityId` → `{ logs, count }`: a
 * linha do tempo de um registro, mais recente primeiro (desempate pelo id), cada
 * evento com o de→para. Registro sem eventos (ou de outra empresa) → lista vazia,
 * nunca 404.
 */
export async function fetchEntityAuditLogs({
  entity,
  entityId,
  page,
  pageSize,
}: EntityAuditLogsParams): Promise<EntityAuditLogsResponse> {
  await sleep(MOCK_DELAY_MS);

  const timeline = MOCK_AUDIT_LOGS.filter((log) => log.entity === entity && log.entityId === entityId).sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)
  );

  const start = page * pageSize;
  const logs = timeline
    .slice(start, start + pageSize)
    .map((log) => ({ ...toListItem(log), fieldChanges: log.fieldChanges }));

  return entityAuditLogsResponseSchema.parse({ logs, count: timeline.length });
}

/** Opções de usuário para o filtro (num serviço real, reusa a listagem de usuários). */
export async function fetchAuditUserOptions(): Promise<{ id: string; name: string }[]> {
  await sleep(MOCK_DELAY_MS);
  return MOCK_AUDIT_AUTHORS.map((user) => ({ id: user.id, name: user.name }));
}

export const auditKeys = {
  all: ['audit-logs'] as const,
  list: (params: AuditListParams) => [...auditKeys.all, 'list', params] as const,
  detail: (id: string) => [...auditKeys.all, id] as const,
  entity: (params: EntityAuditLogsParams) => [...auditKeys.all, 'entity', params] as const,
  userOptions: ['audit-logs', 'user-options'] as const,
  options: ['audit-logs', 'options'] as const,
};
