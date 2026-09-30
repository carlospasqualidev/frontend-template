import { Copy, Trash2, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

import { UserAvatar } from '@/components/global/avatar/userAvatar';
import {
  actionsColumn,
  SortableHeader,
  type DataTableRowAction,
} from '@/components/global/dataTable/columnHelpers';
import type { DataTableColumnDef } from '@/components/global/dataTable/tableFeatures';
import { Badge } from '@/components/ui/badge';
import { Typography } from '@/components/ui/typography';
import { dateFormatter } from '@/lib/dateTime/dateFormatter';
import { type UserRowAction } from '@/screens/users/list/userActionDialog';
import { UserStatusBadge } from '@/screens/users/utils/userStatusBadge';
import { type CompanyUser } from '@/services/users/types';

function mutedText(text: string) {
  return (
    <Typography as="span" variant="muted">
      {text}
    </Typography>
  );
}

interface UserColumnsOptions {
  canUpdate: boolean;
  canDelete: boolean;
  onAction: (action: UserRowAction) => void;
}

function rowActions(
  user: CompanyUser,
  { canUpdate, canDelete, onAction }: UserColumnsOptions
): DataTableRowAction<CompanyUser>[] {
  // Sem "Editar" no menu: editar é pelo clique na linha (abre o detalhe).
  return [
    {
      label: 'Copiar e-mail',
      icon: <Copy />,
      onSelect: () => {
        void navigator.clipboard.writeText(user.email);
        toast.success('E-mail copiado para a área de transferência.');
      },
    },
    ...(canUpdate
      ? [
          {
            label: user.isActive ? 'Bloquear' : 'Desbloquear',
            icon: user.isActive ? <UserX /> : <UserCheck />,
            separatorBefore: true,
            onSelect: () =>
              onAction({ type: user.isActive ? 'block' : 'unblock', user }),
          },
        ]
      : []),
    ...(canDelete
      ? [
          {
            label: 'Excluir',
            icon: <Trash2 />,
            destructive: true,
            separatorBefore: !canUpdate,
            onSelect: () => onAction({ type: 'delete', user }),
          },
        ]
      : []),
  ];
}

/**
 * Colunas da listagem. Ordenáveis as que o servidor ordena (`name`, `email`,
 * `isActive`, `lastLoginAt`, `createdAt`); "Cargos" (vários por usuário) não
 * está na allowlist de `orderBy` do servidor.
 */
export function buildUserColumns(
  options: UserColumnsOptions
): DataTableColumnDef<CompanyUser>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <SortableHeader column={column}>Nome</SortableHeader>
      ),
      meta: { label: 'Nome', className: 'min-w-[220px]' },
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={row.original.name} imageUrl={row.original.image} />
          <Typography as="span" variant="small" className="truncate">
            {row.original.name}
          </Typography>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <SortableHeader column={column}>E-mail</SortableHeader>
      ),
      meta: { label: 'E-mail' },
    },
    {
      id: 'roles',
      header: 'Cargos',
      meta: { label: 'Cargos', className: 'max-w-[320px]' },
      cell: ({ row }) =>
        row.original.roles.length === 0 ? (
          mutedText('Sem cargo')
        ) : (
          <div className="flex flex-wrap gap-1">
            {row.original.roles.map((role) => (
              <Badge key={role.id} variant="secondary">
                {role.name}
              </Badge>
            ))}
          </div>
        ),
    },
    {
      accessorKey: 'isActive',
      header: ({ column }) => (
        <SortableHeader column={column}>Status</SortableHeader>
      ),
      // O servidor ordena o booleano com `false` (Bloqueado) antes de `true`:
      // o primeiro clique manda `desc`, para os ativos virem primeiro.
      sortDescFirst: true,
      meta: { label: 'Status' },
      cell: ({ row }) => <UserStatusBadge isActive={row.original.isActive} />,
    },
    {
      accessorKey: 'lastLoginAt',
      header: ({ column }) => (
        <SortableHeader column={column}>Último acesso</SortableHeader>
      ),
      meta: { label: 'Último acesso' },
      cell: ({ row }) =>
        row.original.lastLoginAt
          ? dateFormatter({
              date: row.original.lastLoginAt,
              hasTimeStamp: true,
              showHours: true,
            })
          : mutedText('Nunca acessou'),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <SortableHeader column={column}>Criado em</SortableHeader>
      ),
      meta: { label: 'Criado em' },
      cell: ({ row }) =>
        dateFormatter({
          date: row.original.createdAt,
          hasTimeStamp: true,
          showHours: false,
        }),
    },
    actionsColumn<CompanyUser>({
      label: 'Ações',
      actions: (user) => rowActions(user, options),
    }),
  ];
}
