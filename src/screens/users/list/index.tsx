import { useNavigate } from '@tanstack/react-router';
import { type ColumnDef } from '@tanstack/react-table';
import { Copy, Trash2, UserPlus, UserX } from 'lucide-react';
import { toast } from 'sonner';

import {
  actionsColumn,
  SortableHeader,
} from '@/components/global/dataTable/columnHelpers';
import { DataTable } from '@/components/global/dataTable/dataTable';
import {
  dateRangeFilter,
  multiSelectFilter,
  selectFilter,
  textFilter,
} from '@/components/global/dataTable/filters';
import { useDataTableUrlQuery } from '@/components/global/dataTable/useDataTableUrlQuery';
import { UserAvatar } from '@/components/global/avatar/userAvatar';
import { Button } from '@/components/global/button/button';
import { PageActions } from '@/components/global/layout/pageActions';
import { Badge } from '@/components/ui/badge';
import { Typography } from '@/components/ui/typography';
import { dateFormatter } from '@/lib/dateTime/dateFormatter';
import { queryUsers } from '@/screens/users/utils/mockUsers';
import {
  roleBadgeVariants,
  statusBadgeVariants,
} from '@/screens/users/list/userBadges';
import {
  userRoleLabels,
  USER_ROLE_OPTIONS,
  userStatusLabels,
  USER_STATUS_OPTIONS,
  type ManagedUser,
} from '@/screens/users/utils/types';

const filters = [
  textFilter({
    key: 'q',
    label: 'Buscar',
    placeholder: 'Nome ou e-mail...',
  }),
  multiSelectFilter({
    key: 'role',
    label: 'Papel',
    placeholder: 'Todos os papéis',
    options: USER_ROLE_OPTIONS,
  }),
  selectFilter({
    key: 'status',
    label: 'Status',
    options: USER_STATUS_OPTIONS,
  }),
  dateRangeFilter({
    key: 'createdAt',
    label: 'Cadastrado em',
  }),
];

const PAGE_SIZE = 25;

export function UsersPage() {
  const navigate = useNavigate();

  const { query, tableProps } = useDataTableUrlQuery({
    pageSize: PAGE_SIZE,
    defaultSorting: [{ id: 'createdAt', desc: true }],
  });

  const data = queryUsers({
    filters: query.filters,
    sort: query.sort,
    page: query.page,
    pageSize: PAGE_SIZE,
  });

  const columns: ColumnDef<ManagedUser>[] = [
    {
      id: 'user',
      header: ({ column }) => (
        <SortableHeader column={column}>Usuário</SortableHeader>
      ),
      accessorKey: 'name',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <UserAvatar name={user.name} />
            <div className="min-w-0">
              <Typography as="span" variant="small" className="block truncate">
                {user.name}
              </Typography>
              <Typography
                as="span"
                variant="muted"
                className="block truncate text-xs"
              >
                {user.email}
              </Typography>
            </div>
          </div>
        );
      },
      meta: { label: 'Usuário', className: 'min-w-[260px]' },
    },
    {
      accessorKey: 'role',
      header: 'Papel',
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <Badge variant={roleBadgeVariants.get(role)}>
            {userRoleLabels.get(role)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={statusBadgeVariants.get(status)}>
            {userStatusLabels.get(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <SortableHeader column={column}>Cadastrado em</SortableHeader>
      ),
      meta: { label: 'Cadastrado em' },
      cell: ({ row }) =>
        dateFormatter({ date: row.original.createdAt, hasTimeStamp: false }),
    },
    {
      accessorKey: 'lastLoginAt',
      header: ({ column }) => (
        <SortableHeader column={column}>Último acesso</SortableHeader>
      ),
      meta: { label: 'Último acesso' },
      cell: ({ row }) => {
        const value = row.original.lastLoginAt;
        if (!value) {
          return (
            <Typography as="span" variant="muted">
              Nunca acessou
            </Typography>
          );
        }
        return dateFormatter({ date: value, hasTimeStamp: false });
      },
    },
    actionsColumn<ManagedUser>({
      label: 'Ações',
      actions: (user) => [
        {
          label: 'Copiar e-mail',
          icon: <Copy />,
          onSelect: () => {
            void navigator.clipboard.writeText(user.email);
            toast.success('E-mail copiado para a área de transferência.');
          },
        },
        // Sem "Editar" no menu: editar é sempre pelo clique na linha (abre o
        // detalhe). O "⋯" fica só com ações que não sejam abrir/editar.
        {
          label: user.status === 'active' ? 'Desativar' : 'Reativar',
          icon: <UserX />,
          separatorBefore: true,
          onSelect: () =>
            toast(
              user.status === 'active'
                ? `${user.name} foi desativado.`
                : `${user.name} foi reativado.`
            ),
        },
        {
          label: 'Excluir',
          icon: <Trash2 />,
          destructive: true,
          onSelect: () => toast(`Excluir ${user.name}.`),
        },
      ],
    }),
  ];

  return (
    <>
      <PageActions>
        <Button
          aria-label="Novo usuário"
          onClick={() => toast('Abrir formulário de novo usuário.')}
        >
          <UserPlus />
          <span className="hidden sm:inline">Novo usuário</span>
        </Button>
      </PageActions>

      <DataTable
        columns={columns}
        data={data}
        filters={filters}
        emptyMessage="Nenhum usuário encontrado."
        columnVisibilityKey="users"
        onRowClick={(user) =>
          navigate({
            to: '/users/$userId',
            params: { userId: user.id },
          })
        }
        getRowHref={(user) => `/users/${user.id}`}
        {...tableProps}
      />
    </>
  );
}
