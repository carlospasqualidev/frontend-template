import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { SortableHeader } from '@/components/global/dataTable/columnHelpers';
import type { DataTableColumnDef } from '@/components/global/dataTable/tableFeatures';
import { DataTable } from '@/components/global/dataTable/dataTable';
import {
  dateRangeFilter,
  multiSelectFilter,
  textFilter,
  type DataTableFilter,
} from '@/components/global/dataTable/filters';
import { useDataTableUrlQuery } from '@/components/global/dataTable/useDataTableUrlQuery';
import { Badge } from '@/components/ui/badge';
import { Typography } from '@/components/ui/typography';
import { useSessionStore } from '@/hooks/useSessionStore';
import { dateFormatter } from '@/lib/dateTime/dateFormatter';
import { hasPermission } from '@/lib/permissions';
import { AuditLogDetailModal } from '@/screens/audit-logs/list/auditLogDetail';
import { useAuditOptions } from '@/screens/audit-logs/utils/useAuditOptions';
import { useAuditUserFilter } from '@/screens/audit-logs/utils/useAuditUserFilter';
import {
  auditKeys,
  buildAuditListParams,
  fetchAuditLogs,
  type AuditLogListItem,
} from '@/services/audit/auditApi';

const PAGE_SIZE = 10;

type BadgeVariant = React.ComponentProps<typeof Badge>['variant'];

// Ação → variante do badge (Map: sem object-injection). create=verde, edição=azul,
// exclusão/estorno=vermelho, demais=cinza.
const ACTION_VARIANT = new Map<string, BadgeVariant>([
  ['create', 'success'],
  ['update', 'info'],
  ['statusChange', 'info'],
  ['delete', 'destructive'],
  ['login', 'secondary'],
]);

function EmptyValue() {
  return (
    <Typography as="span" variant="muted">
      —
    </Typography>
  );
}

export function AuditLogsPage() {
  const [detailId, setDetailId] = useState<string | null>(null);

  const { query, tableProps } = useDataTableUrlQuery({ pageSize: PAGE_SIZE });

  const { options, moduleLabel, actionLabel, entityLabel } = useAuditOptions();

  // As opções do filtro "Usuário" vêm da busca na listagem de usuários, que
  // exige `backoffice.users.read`: sem ela, o filtro não aparece.
  const canReadUsers = useSessionStore((state) =>
    hasPermission(state.user, 'backoffice.users.read')
  );

  const listParams = buildAuditListParams(query);
  const userFilter = useAuditUserFilter({
    enabled: canReadUsers,
    selectedIds: listParams.userId?.split(',') ?? [],
  });

  const filters = useMemo<DataTableFilter[]>(
    () => [
      textFilter({
        key: 'search',
        label: 'Buscar no conteúdo',
        placeholder: 'Nome, registro, valor...',
      }),
      multiSelectFilter({
        key: 'module',
        label: 'Módulo',
        placeholder: 'Todos',
        searchable: true,
        options: options.modules,
      }),
      multiSelectFilter({
        key: 'action',
        label: 'Ação',
        placeholder: 'Todas',
        searchable: true,
        options: options.actions,
      }),
      multiSelectFilter({
        key: 'entity',
        label: 'Entidade',
        placeholder: 'Todas',
        searchable: true,
        options: options.entities,
      }),
      ...(canReadUsers
        ? [
            multiSelectFilter({
              key: 'userId',
              label: 'Usuário',
              placeholder: 'Selecione',
              options: userFilter.options,
              onSearchChange: userFilter.onSearchChange,
              loading: userFilter.loading,
              emptyText: 'Nenhum usuário encontrado.',
            }),
          ]
        : []),
      dateRangeFilter({ key: 'createdAt', label: 'Período' }),
    ],
    [
      canReadUsers,
      userFilter.options,
      userFilter.onSearchChange,
      userFilter.loading,
      options,
    ]
  );

  // Sem o filtro "Usuário" na tela, um `userId` que ficou na URL não filtra a
  // lista: a pessoa não teria como ver nem limpar esse filtro.
  const params = canReadUsers
    ? listParams
    : { ...listParams, userId: undefined };

  const { data, isPending } = useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () => fetchAuditLogs(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const columns: DataTableColumnDef<AuditLogListItem>[] = [
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <SortableHeader column={column}>Data/hora</SortableHeader>
      ),
      meta: { label: 'Data/hora', className: 'min-w-[150px]' },
      cell: ({ row }) =>
        dateFormatter({
          date: row.original.createdAt,
          hasTimeStamp: true,
          showHours: true,
        }),
    },
    {
      accessorKey: 'module',
      header: ({ column }) => (
        <SortableHeader column={column}>Módulo</SortableHeader>
      ),
      meta: { label: 'Módulo' },
      cell: ({ row }) => moduleLabel(row.original.module),
    },
    {
      accessorKey: 'entity',
      header: ({ column }) => (
        <SortableHeader column={column}>Entidade</SortableHeader>
      ),
      meta: { label: 'Entidade' },
      cell: ({ row }) => entityLabel(row.original.entity),
    },
    {
      accessorKey: 'action',
      header: ({ column }) => (
        <SortableHeader column={column}>Ação</SortableHeader>
      ),
      meta: { label: 'Ação' },
      cell: ({ row }) => (
        <Badge variant={ACTION_VARIANT.get(row.original.action) ?? 'secondary'}>
          {actionLabel(row.original.action)}
        </Badge>
      ),
    },
    {
      // O nome do autor vem do cadastro (não é coluna da trilha) → não ordenável.
      id: 'userName',
      header: 'Usuário',
      cell: ({ row }) => row.original.userName ?? <EmptyValue />,
    },
    {
      accessorKey: 'description',
      header: ({ column }) => (
        <SortableHeader column={column}>Resumo</SortableHeader>
      ),
      meta: { label: 'Resumo', className: 'max-w-[420px]' },
      cell: ({ row }) => row.original.description ?? <EmptyValue />,
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data?.logs ?? []}
        filters={filters}
        isLoading={isPending}
        emptyMessage="Nenhum registro de auditoria encontrado."
        columnVisibilityKey="audit-logs"
        onRowClick={(log) => setDetailId(log.id)}
        {...tableProps}
      />

      <AuditLogDetailModal
        logId={detailId}
        open={!!detailId}
        setOpen={(value) => {
          const next = typeof value === 'function' ? value(!!detailId) : value;
          if (!next) setDetailId(null);
        }}
      />
    </>
  );
}
