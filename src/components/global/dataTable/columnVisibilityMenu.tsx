import { type RowData } from '@tanstack/react-table';
import { Columns3Cog, RotateCcw } from 'lucide-react';

import type {
  DataTableColumn,
  DataTableColumnDef,
  DataTableInstance,
} from './tableFeatures';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const TRIGGER_LABEL = 'Configurar colunas';

/**
 * Rótulo da coluna no menu: `meta.label` ou, na falta dele, o `header` quando é
 * texto. Coluna com cabeçalho renderizado (ex.: `SortableHeader`) precisa de
 * `meta.label` — sem rótulo legível ela não entra no menu, para nunca expor o
 * id técnico da coluna ao usuário.
 */
function columnLabel<TData extends RowData>(
  column: DataTableColumn<TData>
): string | undefined {
  const { header, meta } = column.columnDef;
  return meta?.label ?? (typeof header === 'string' ? header : undefined);
}

interface ColumnVisibilityMenuProps<TData extends RowData> {
  table: DataTableInstance<TData>;
}

/**
 * Menu de colunas da `DataTable` (ícone no canto direito do cabeçalho): marca/
 * desmarca quais colunas aparecem. A última coluna visível fica travada (a
 * tabela nunca fica sem colunas de dado).
 */
export function ColumnVisibilityMenu<TData extends RowData>({
  table,
}: ColumnVisibilityMenuProps<TData>) {
  const columns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide())
    .flatMap((column) => {
      const label = columnLabel(column);
      return label ? [{ column, label }] : [];
    });

  if (columns.length === 0) return null;

  const visibleCount = columns.filter(({ column }) =>
    column.getIsVisible()
  ).length;
  const hasHidden = visibleCount < columns.length;

  return (
    <DropdownMenu>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={TRIGGER_LABEL}
              >
                <Columns3Cog />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>{TRIGGER_LABEL}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
        {columns.map(({ column, label }) => {
          const visible = column.getIsVisible();
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={visible}
              disabled={visible && visibleCount === 1}
              // Mantém o menu aberto para ajustar várias colunas de uma vez.
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(checked) => column.toggleVisibility(!!checked)}
            >
              {label}
            </DropdownMenuCheckboxItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!hasHidden}
          onSelect={() => table.resetColumnVisibility(true)}
        >
          <RotateCcw />
          Mostrar todas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const MENU_COLUMN_ID = 'columnVisibility';

/**
 * Coloca o menu de colunas numa coluna própria, estreita e à direita, do
 * tamanho do ícone (a coluna "Ações", quando existe, fica sozinha no seu eixo).
 */
// eslint-disable-next-line react-refresh/only-export-components
export function withColumnVisibilityMenu<TData extends RowData>(
  columns: DataTableColumnDef<TData>[]
): DataTableColumnDef<TData>[] {
  return [
    ...columns,
    {
      id: MENU_COLUMN_ID,
      enableHiding: false,
      enableSorting: false,
      meta: { className: 'w-px text-right' },
      header: ({ table }) => <ColumnVisibilityMenu table={table} />,
      cell: () => null,
    },
  ];
}
