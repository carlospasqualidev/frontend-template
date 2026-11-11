import {
  rowActionsColumn,
  SortableHeader,
} from '@/components/global/dataTable/columnHelpers';
import type { DataTableColumnDef } from '@/components/global/dataTable/tableFeatures';
import {
  copyAction,
  deleteAction,
} from '@/components/global/rowActions/actions';
import type { RowAction } from '@/components/global/rowActions/rowActions';
import { Badge } from '@/components/ui/badge';
import { Typography } from '@/components/ui/typography';
import { dateFormatter } from '@/lib/dateTime/dateFormatter';
import { APP_LOCALE } from '@/lib/locale';
import { type RoleListItem } from '@/services/roles/types';

function mutedText(text: string) {
  return (
    <Typography as="span" variant="muted">
      {text}
    </Typography>
  );
}

function countText(count: number, singular: string, plural: string): string {
  return `${count.toLocaleString(APP_LOCALE)} ${count === 1 ? singular : plural}`;
}

interface RoleColumnsOptions {
  canCreate: boolean;
  canDelete: boolean;
  onCopy: (role: RoleListItem) => void;
  onDelete: (role: RoleListItem) => void;
}

function rowActions(
  role: RoleListItem,
  { canCreate, canDelete, onCopy, onDelete }: RoleColumnsOptions
): RowAction[] {
  // O `Administrador` não é copiado nem excluído: a linha fica sem ações (e
  // reserva o espaço de um botão). Sem `editAction`: editar é pelo clique na linha.
  if (role.isSystem) return [];

  return [
    ...(canCreate ? [copyAction(() => onCopy(role))] : []),
    ...(canDelete ? [deleteAction(() => onDelete(role))] : []),
  ];
}

/**
 * Colunas da listagem. Ordenáveis as que o servidor ordena (`name`,
 * `createdAt`); as contagens de permissões e de usuários não estão na
 * allowlist de `orderBy` do servidor. A coluna de ações só entra com alguma
 * ação permitida (copiar ou excluir).
 */
export function buildRoleColumns(
  options: RoleColumnsOptions
): DataTableColumnDef<RoleListItem>[] {
  const columns: DataTableColumnDef<RoleListItem>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <SortableHeader column={column}>Nome</SortableHeader>
      ),
      meta: { label: 'Nome', className: 'min-w-[200px]' },
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Typography as="span" variant="small" className="truncate">
            {row.original.name}
          </Typography>
          {row.original.isSystem && <Badge variant="outline">Sistema</Badge>}
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Descrição',
      meta: { label: 'Descrição', className: 'max-w-[360px]' },
      cell: ({ row }) =>
        row.original.description ? (
          <span className="line-clamp-2 whitespace-normal">
            {row.original.description}
          </span>
        ) : (
          mutedText('Sem descrição')
        ),
    },
    {
      accessorKey: 'permissionsCount',
      header: 'Permissões',
      meta: { label: 'Permissões' },
      cell: ({ row }) =>
        countText(row.original.permissionsCount, 'permissão', 'permissões'),
    },
    {
      accessorKey: 'usersCount',
      header: 'Usuários',
      meta: { label: 'Usuários' },
      cell: ({ row }) =>
        row.original.usersCount === 0
          ? mutedText('Nenhum usuário')
          : countText(row.original.usersCount, 'usuário', 'usuários'),
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
  ];

  if (!options.canCreate && !options.canDelete) return columns;

  return [
    ...columns,
    rowActionsColumn<RoleListItem>({
      actions: (role) => rowActions(role, options),
    }),
  ];
}
