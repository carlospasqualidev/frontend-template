import { useCallback, useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { UserPlus } from 'lucide-react';

import { Button } from '@/components/global/button/button';
import { DataTable } from '@/components/global/dataTable/dataTable';
import {
  dateRangeFilter,
  multiSelectFilter,
  selectFilter,
  textFilter,
  type DataTableFilter,
  type DataTableFilterValues,
} from '@/components/global/dataTable/filters';
import { useDataTableUrlQuery } from '@/components/global/dataTable/useDataTableUrlQuery';
import { PageActions } from '@/components/global/layout/pageActions';
import { Link } from '@/components/global/link/link';
import { useSessionStore } from '@/hooks/useSessionStore';
import { isUuid } from '@/lib/ids';
import { listParam } from '@/lib/listQueryParams';
import { hasPermission } from '@/lib/permissions';
import {
  UserActionDialog,
  type UserRowAction,
} from '@/screens/users/list/userActionDialog';
import { buildUserColumns } from '@/screens/users/list/userColumns';
import { useRoleOptions } from '@/screens/users/utils/useRoleOptions';
import { userKeys } from '@/services/users/queryKeys';
import { buildUserListParams, fetchUsers } from '@/services/users/userListApi';

const PAGE_SIZE = 25;

const STATUS_OPTIONS = [
  { value: 'true', label: 'Ativo' },
  { value: 'false', label: 'Bloqueado' },
];

// Tira do filtro "Cargos" da URL os ids fora do formato e os que o servidor
// não tem mais, mantendo os outros filtros e parâmetros; sem filtro nenhum,
// sai o `filters`.
function withoutRoleIds(
  search: Record<string, unknown>,
  missingIds: string[]
): Record<string, unknown> {
  const { filters, ...rest } = search as {
    filters?: DataTableFilterValues;
  };
  const roleIds = (listParam(filters?.roleId)?.split(',') ?? []).filter(
    (roleId) => !missingIds.includes(roleId)
  );
  const nextFilters = {
    ...Object.fromEntries(
      Object.entries(filters ?? {}).filter(([key]) => key !== 'roleId')
    ),
    ...(roleIds.length > 0 ? { roleId: roleIds } : {}),
  };
  return Object.keys(nextFilters).length > 0
    ? { ...rest, filters: nextFilters }
    : rest;
}

export function UsersPage() {
  const navigate = useNavigate();
  const sessionUser = useSessionStore((state) => state.user);
  const canCreate = hasPermission(sessionUser, 'backoffice.users.create');
  const canUpdate = hasPermission(sessionUser, 'backoffice.users.update');
  const canDelete = hasPermission(sessionUser, 'backoffice.users.delete');
  // As opções do filtro "Cargos" vêm de `GET /client/roles`, que exige
  // `backoffice.roles.read`: sem ela, o filtro não aparece.
  const canReadRoles = useSessionStore((state) =>
    hasPermission(state.user, 'backoffice.roles.read')
  );

  const { query, tableProps } = useDataTableUrlQuery({ pageSize: PAGE_SIZE });

  const listParams = buildUserListParams(query);
  // Um id fora do formato (link editado à mão ou de outro sistema) nunca vai
  // ao servidor, que recusaria a listagem inteira com 400 e um toast.
  const urlRoleIds = listParams.roleId?.split(',') ?? [];
  const validRoleIds = urlRoleIds.filter(isUuid);
  const invalidRoleIds = urlRoleIds.filter((roleId) => !isUuid(roleId));
  // Busca no servidor; os cargos aplicados pela URL entram pela leitura de
  // cada um, para o filtro mostrar o nome deles.
  const {
    options: roleOptions,
    onSearchChange: onRoleSearchChange,
    loading: rolesLoading,
    missingIds: missingRoleIds,
  } = useRoleOptions({ enabled: canReadRoles, selectedIds: validRoleIds });

  // O id fora do formato e o cargo que o servidor não tem mais (excluído, num
  // link antigo) saem da URL, sem toast: o filtro mostra só os que existem.
  const droppedRoleKey = [...invalidRoleIds, ...missingRoleIds].join(',');
  useEffect(() => {
    if (!droppedRoleKey) return;
    const droppedIds = droppedRoleKey.split(',');
    void navigate({
      to: '.',
      replace: true,
      search: (previous: Record<string, unknown>) =>
        withoutRoleIds(previous, droppedIds),
    });
  }, [droppedRoleKey, navigate]);

  const filters = useMemo<DataTableFilter[]>(
    () => [
      textFilter({
        key: 'search',
        label: 'Buscar',
        placeholder: 'Nome ou e-mail...',
      }),
      ...(canReadRoles
        ? [
            multiSelectFilter({
              key: 'roleId',
              label: 'Cargos',
              placeholder: 'Todos',
              options: roleOptions,
              onSearchChange: onRoleSearchChange,
              loading: rolesLoading,
              emptyText: 'Nenhum cargo encontrado.',
            }),
          ]
        : []),
      selectFilter({
        key: 'isActive',
        label: 'Status',
        placeholder: 'Todos',
        options: STATUS_OPTIONS,
      }),
      dateRangeFilter({ key: 'createdAt', label: 'Criado em' }),
    ],
    [canReadRoles, roleOptions, onRoleSearchChange, rolesLoading]
  );

  // Sem o filtro "Cargos" na tela, um `roleId` que ficou na URL não filtra a
  // lista: a pessoa não teria como ver nem limpar esse filtro. O cargo que o
  // servidor não tem mais também não: a lista viria vazia sem explicação.
  const roleIds = canReadRoles
    ? validRoleIds.filter((roleId) => !missingRoleIds.includes(roleId))
    : [];
  const params = { ...listParams, roleId: roleIds.join(',') || undefined };

  const { data, isPending } = useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => fetchUsers(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const [dialog, setDialog] = useState<{
    open: boolean;
    action: UserRowAction | null;
  }>({ open: false, action: null });

  const openAction = useCallback(
    (action: UserRowAction) => setDialog({ open: true, action }),
    []
  );

  const columns = useMemo(
    () => buildUserColumns({ canUpdate, canDelete, onAction: openAction }),
    [canUpdate, canDelete, openAction]
  );

  return (
    <>
      {canCreate && (
        <PageActions>
          <Button asChild aria-label="Novo usuário">
            <Link
              href="/users/create"
              newTabIcon={false}
              className="no-underline hover:text-primary-foreground"
            >
              <UserPlus />
              <span className="hidden sm:inline">Novo usuário</span>
            </Link>
          </Button>
        </PageActions>
      )}

      <DataTable
        columns={columns}
        data={data?.users ?? []}
        rowCount={data?.count}
        filters={filters}
        isLoading={isPending}
        emptyMessage="Nenhum usuário encontrado."
        columnVisibilityKey="users"
        onRowClick={(user) =>
          navigate({ to: '/users/$userId', params: { userId: user.id } })
        }
        getRowHref={(user) => `/users/${user.id}`}
        {...tableProps}
      />

      <UserActionDialog
        action={dialog.action}
        open={dialog.open}
        setOpen={(next) =>
          setDialog((previous) => ({
            ...previous,
            open: typeof next === 'function' ? next(previous.open) : next,
          }))
        }
      />
    </>
  );
}
