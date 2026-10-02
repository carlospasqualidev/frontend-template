import { z } from 'zod';

import { type DataTableQuery } from '@/components/global/dataTable/useDataTableQuery';
import { dateRangeParams, listParam, textParam } from '@/lib/listQueryParams';
import { api } from '@/services/api';

/*
 * Trilha de auditoria no backend (`GET /client/audit-logs`, `/options`,
 * `/:auditLogId` e `/entities/:entity/:entityId`, ver
 * `../server-template/docs/openapi.json`). Filtro, busca, ordenação,
 * paginação, rótulos, frases e de→para são do servidor: a tela só monta os
 * parâmetros (`buildAuditListParams`) e exibe o que volta.
 */

// As opções (com rótulos pt-BR) vêm do backend, para que uma entidade nova
// auditada apareça sem o frontend precisar conhecê-la.
const auditFilterOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

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
const auditValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const auditLogDetailSchema = auditLogListItemSchema
  .omit({ userName: true })
  .extend({
    before: z.record(z.string(), auditValueSchema).nullable(),
    after: z.record(z.string(), auditValueSchema).nullable(),
    user: z
      .object({ id: z.string(), name: z.string(), email: z.string() })
      .nullable(),
    fieldChanges: z.array(auditFieldChangeSchema),
  });

export type AuditLogDetail = z.infer<typeof auditLogDetailSchema>;

const auditLogDetailResponseSchema = z.object({
  auditLog: auditLogDetailSchema,
});

export type AuditLogDetailResponse = z.infer<
  typeof auditLogDetailResponseSchema
>;

/** Item da linha do tempo: o da listagem mais o de→para (sem `before`/`after`). */
export const entityAuditLogSchema = auditLogListItemSchema.extend({
  fieldChanges: z.array(auditFieldChangeSchema),
});

export type EntityAuditLog = z.infer<typeof entityAuditLogSchema>;

const entityAuditLogsResponseSchema = z.object({
  logs: z.array(entityAuditLogSchema),
  count: z.number(),
});

export type EntityAuditLogsResponse = z.infer<
  typeof entityAuditLogsResponseSchema
>;

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
export type AuditListOrderBy =
  'createdAt' | 'module' | 'entity' | 'action' | 'description';

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

function resolveSort(
  sort: DataTableQuery['sort']
): Pick<AuditListParams, 'orderBy' | 'order'> {
  const first = sort[0];
  if (!first) return {};

  const orderBy = toOrderBy(first.id);
  if (!orderBy) return {};

  return { orderBy, order: first.desc ? 'desc' : 'asc' };
}

/** Traduz o estado da DataTable (0-based, filtros) para os params do endpoint. */
export function buildAuditListParams(query: DataTableQuery): AuditListParams {
  const { filters } = query;
  const createdAt = dateRangeParams(filters.createdAt);

  return {
    page: query.page,
    pageSize: query.pageSize,
    search: textParam(filters.search),
    module: listParam(filters.module),
    action: listParam(filters.action),
    entity: listParam(filters.entity),
    userId: listParam(filters.userId),
    createdFrom: createdAt.from,
    createdTo: createdAt.to,
    ...resolveSort(query.sort),
  };
}

const AUDIT_LOGS_PATH = '/client/audit-logs';

/** `GET /client/audit-logs/options` → `{ modules, actions, entities }`. */
export async function fetchAuditFilterOptions(): Promise<AuditFilterOptions> {
  const response = await api.get<unknown>(`${AUDIT_LOGS_PATH}/options`);
  return auditFilterOptionsSchema.parse(response);
}

/** `GET /client/audit-logs` → `{ logs, count }` (sem `fieldChanges`, que vêm no detalhe). */
export async function fetchAuditLogs(
  params: AuditListParams
): Promise<AuditListResponse> {
  const response = await api.get<unknown>(AUDIT_LOGS_PATH, { params });
  return auditListResponseSchema.parse(response);
}

/** `GET /client/audit-logs/:auditLogId` → `{ auditLog }`, com `before`/`after` crus e `fieldChanges`. */
export async function fetchAuditLogDetail(
  id: string
): Promise<AuditLogDetailResponse> {
  const response = await api.get<unknown>(
    `${AUDIT_LOGS_PATH}/${encodeURIComponent(id)}`
  );
  return auditLogDetailResponseSchema.parse(response);
}

/**
 * `GET /client/audit-logs/entities/:entity/:entityId` → `{ logs, count }`: a
 * linha do tempo de um registro, mais recente primeiro, cada evento com o
 * de→para. Registro sem eventos (ou de outra empresa) → lista vazia, nunca 404.
 */
export async function fetchEntityAuditLogs({
  entity,
  entityId,
  page,
  pageSize,
}: EntityAuditLogsParams): Promise<EntityAuditLogsResponse> {
  const response = await api.get<unknown>(
    `${AUDIT_LOGS_PATH}/entities/${entity}/${encodeURIComponent(entityId)}`,
    { params: { page, pageSize } }
  );
  return entityAuditLogsResponseSchema.parse(response);
}

export const auditKeys = {
  all: ['audit-logs'] as const,
  list: (params: AuditListParams) =>
    [...auditKeys.all, 'list', params] as const,
  detail: (id: string) => [...auditKeys.all, id] as const,
  entity: (params: EntityAuditLogsParams) =>
    [...auditKeys.all, 'entity', params] as const,
  options: ['audit-logs', 'options'] as const,
};
