import { Fragment, type ReactNode } from 'react';
import type { RowData } from '@tanstack/react-table';
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from 'lucide-react';

import type {
  DataTableColumn,
  DataTableColumnDef,
  DataTableInstance,
} from './tableFeatures';

import { cn } from '@/lib/utils';
import {
  RowActions,
  type RowAction,
} from '@/components/global/rowActions/rowActions';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
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

/**
 * Coluna de seleção com checkbox (cabeçalho "selecionar todas" + checkbox por
 * linha). Espalhe no início da lista de `columns` para habilitar a seleção e o
 * rodapé de contagem da `DataTable`.
 *
 * ```tsx
 * export const columns: DataTableColumnDef<Payment>[] = [
 *   selectColumn(),
 *   { accessorKey: 'status', header: 'Status' },
 * ];
 * ```
 */
// eslint-disable-next-line react-refresh/only-export-components
export function selectColumn<
  TData extends RowData,
>(): DataTableColumnDef<TData> {
  return {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todas"
      />
    ),
    cell: ({ row }) => (
      // Wrapper isola o clique do checkbox do `onRowClick`/`getRowHref` da
      // DataTable — marcar/desmarcar uma linha não deve disparar a navegação
      // (nem abrir o detalhe em nova aba com o clique do meio).
      <div
        onClick={(event) => event.stopPropagation()}
        onAuxClick={(event) => event.stopPropagation()}
      >
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selecionar linha"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  };
}

/**
 * Coluna de expansão: um botão de chevron por linha que alterna a sub-linha
 * (`renderSubRow` da `DataTable`). Injetada automaticamente pela `DataTable`
 * quando `renderSubRow` é definido — não precisa espalhá-la nas `columns`.
 *
 * O clique no chevron não dispara `onRowClick`/`getRowHref` da linha (isola a
 * propagação), então expandir e navegar são gestos independentes. Linhas que
 * não podem expandir reservam o mesmo espaço do botão (altura uniforme).
 */
// eslint-disable-next-line react-refresh/only-export-components
export function expandColumn<TData extends RowData>(
  id = 'expander'
): DataTableColumnDef<TData> {
  return {
    id,
    enableSorting: false,
    enableHiding: false,
    meta: { className: 'w-px whitespace-nowrap' },
    cell: ({ row }) => {
      if (!row.getCanExpand()) return <div aria-hidden className="size-8" />;

      const expanded = row.getIsExpanded();
      return (
        <div
          onClick={(event) => event.stopPropagation()}
          onAuxClick={(event) => event.stopPropagation()}
        >
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={expanded ? 'Recolher linha' : 'Expandir linha'}
                  aria-expanded={expanded}
                  onClick={row.getToggleExpandedHandler()}
                >
                  <ChevronRightIcon
                    className={cn(
                      'transition-transform',
                      expanded && 'rotate-90'
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {expanded ? 'Recolher linha' : 'Expandir linha'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
  };
}

interface SortableHeaderProps<TData extends RowData, TValue> {
  column: DataTableColumn<TData, TValue>;
  children: React.ReactNode;
}

/**
 * Cabeçalho de coluna clicável que alterna a ordenação. Use no `header` da
 * coluna:
 *
 * ```tsx
 * {
 *   accessorKey: 'email',
 *   header: ({ column }) => <SortableHeader column={column}>E-mail</SortableHeader>,
 * }
 * ```
 *
 * O primeiro clique ordena em ascendente; a coluna com `sortDescFirst: true`
 * começa em descendente (ex.: um booleano de status que o servidor ordena
 * `false` antes de `true`, quando a tela quer os ativos primeiro). Os cliques
 * seguintes alternam a direção.
 */
export function SortableHeader<TData extends RowData, TValue>({
  column,
  children,
}: SortableHeaderProps<TData, TValue>) {
  const toggle = () => {
    const sorted = column.getIsSorted();
    column.toggleSorting(
      sorted ? sorted === 'asc' : column.columnDef.sortDescFirst === true
    );
  };

  return (
    <Button
      variant="ghost"
      // Cancela o padding-left próprio do botão (px-2.5) para o rótulo alinhar
      // com o conteúdo da célula (TableHead/TableCell usam px-3). Sem isso, o
      // cabeçalho ordenável fica ~10px à direita do dado da coluna.
      className="-ml-2.5"
      onClick={toggle}
    >
      {children}
      <ArrowUpDownIcon />
    </Button>
  );
}

export interface SortMenuOption {
  /** Campo enviado ao backend como `orderBy` — precisa estar na allowlist do serviço. */
  id: string;
  label: string;
}

interface SortMenuHeaderProps<TData extends RowData> {
  table: DataTableInstance<TData>;
  label: string;
  options: SortMenuOption[];
}

/**
 * Cabeçalho de coluna com **menu de ordenação** — para colunas que reúnem vários
 * campos numa só (ex.: uma coluna "Datas" que mostra criação e atualização),
 * onde o `SortableHeader` (um campo só) não dá conta. O menu lista os campos;
 * clicar ordena por aquele campo (ascendente) e clicar de novo no campo ativo
 * inverte a direção. O `id` de cada opção precisa estar na allowlist de `orderBy`
 * do serviço. Como a `DataTable` usa `manualSorting`, a ordenação é feita pelo
 * backend — o menu só ajusta o estado de `sorting`.
 */
export function SortMenuHeader<TData extends RowData>({
  table,
  label,
  options,
}: SortMenuHeaderProps<TData>) {
  // Snapshot sem assinatura: a DataTable já re-renderiza a cada mudança de
  // estado da tabela, e com ela este cabeçalho.
  const active = table.atoms.sorting.get()[0];
  const isActive = options.some((option) => option.id === active?.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="-ml-2.5 data-[state=open]:bg-muted"
          aria-label={`Ordenar por ${label}`}
        >
          {label}
          {isActive ? (
            active!.desc ? (
              <ArrowDownIcon />
            ) : (
              <ArrowUpIcon />
            )
          ) : (
            <ArrowUpDownIcon />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((option) => {
          const optionActive = option.id === active?.id;
          return (
            <DropdownMenuItem
              key={option.id}
              onClick={() =>
                table.setSorting([
                  { id: option.id, desc: optionActive ? !active!.desc : false },
                ])
              }
            >
              {option.label}
              {optionActive ? (
                active!.desc ? (
                  <ArrowDownIcon className="ml-auto size-4" />
                ) : (
                  <ArrowUpIcon className="ml-auto size-4" />
                )
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface RowActionsColumnOptions<TData> {
  /** Ações da linha — lista fixa ou função que recebe a linha. */
  actions: RowAction[] | ((row: TData) => RowAction[]);
  /** id da coluna. Padrão: `'actions'`. */
  id?: string;
  /** Rótulo do cabeçalho. Padrão: `'Ações'`. */
  header?: string;
}

/**
 * Coluna de ações por linha em **botões-ícone visíveis** (um por ação), em vez do
 * menu "⋯" do `actionsColumn`. Use em telas operacionais: as etapas do fluxo são
 * executadas muitas vezes por dia e cada clique extra custa tempo do operador.
 *
 * ```tsx
 * rowActionsColumn<Order>({
 *   actions: (order) => [
 *     { key: 'print', label: 'Imprimir', icon: <Printer />, tone: 'brand', disabled: order.status !== 'ready', onSelect: () => print(order) },
 *     { key: 'delete', label: 'Excluir', icon: <Trash2 />, tone: 'destructive', onSelect: () => remove(order) },
 *   ],
 * })
 * ```
 *
 * Use o `actionsColumn` (menu "⋯") nas demais listas do sistema — ver
 * `docs/conventions/screen-layout.md` → "Ações de item".
 */
// eslint-disable-next-line react-refresh/only-export-components
export function rowActionsColumn<TData extends RowData>({
  actions,
  id = 'actions',
  header = 'Ações',
}: RowActionsColumnOptions<TData>): DataTableColumnDef<TData> {
  return {
    id,
    enableHiding: false,
    enableSorting: false,
    header: () => header,
    // Coluna encolhe até o conteúdo e fica colada na borda direita, como a do "⋯"
    // (`max-w-none` porque a fileira de botões passa da largura máxima padrão das
    // células do corpo).
    meta: { className: 'w-px max-w-none whitespace-nowrap text-right' },
    cell: ({ row }) => (
      <RowActions
        actions={
          typeof actions === 'function' ? actions(row.original) : actions
        }
      />
    ),
  };
}

export interface DataTableRowAction<TData> {
  /** Texto exibido no item do menu. */
  label: string;
  /** Callback executado ao selecionar o item; recebe a linha original. */
  onSelect: (row: TData) => void;
  /** Ícone opcional renderizado antes do label. */
  icon?: ReactNode;
  /** Renderiza um separador acima deste item. */
  separatorBefore?: boolean;
  /** Aplica o estilo destrutivo ao item. */
  destructive?: boolean;
  /** Desabilita o item. */
  disabled?: boolean;
}

interface ActionsColumnOptions<TData> {
  /** Itens do menu — lista fixa ou função que recebe a linha. */
  actions:
    DataTableRowAction<TData>[] | ((row: TData) => DataTableRowAction<TData>[]);
  /** Rótulo opcional exibido no topo do menu (ex.: "Ações"). */
  label?: string;
  /** id da coluna. Padrão: `'actions'`. */
  id?: string;
  /** Texto acessível do botão que abre o menu. Padrão: `'Abrir menu'`. */
  triggerLabel?: string;
}

/**
 * Coluna de ações por linha: um botão "⋯" que abre um menu com os itens
 * informados. Espalhe no fim da lista de `columns`.
 *
 * ```tsx
 * actionsColumn<Payment>({
 *   label: 'Ações',
 *   actions: [
 *     {
 *       label: 'Copiar ID',
 *       onSelect: (payment) => navigator.clipboard.writeText(payment.id),
 *     },
 *     { label: 'Excluir', destructive: true, separatorBefore: true, onSelect: remove },
 *   ],
 * })
 * ```
 *
 * `actions` também aceita uma função da linha, para variar os itens por linha.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function actionsColumn<TData extends RowData>({
  actions,
  label,
  id = 'actions',
  triggerLabel = 'Abrir menu',
}: ActionsColumnOptions<TData>): DataTableColumnDef<TData> {
  return {
    id,
    enableHiding: false,
    enableSorting: false,
    // Coluna encolhe até o conteúdo (`w-px` + `whitespace-nowrap`) e fica alinhada
    // à direita — as demais colunas absorvem a largura restante, então o "⋯" fica
    // sempre colado na borda direita, independente do nº de colunas da tabela.
    meta: { className: 'w-px whitespace-nowrap text-right' },
    cell: ({ row }) => {
      const items =
        typeof actions === 'function' ? actions(row.original) : actions;

      // Sem ações para esta linha → não renderiza o gatilho (evita um menu ⋯
      // vazio, ex.: registros que a tela não permite excluir), mas reserva o mesmo
      // espaço do botão (`size-8`) para que a linha mantenha a MESMA altura das
      // que têm ⋯ (linhas de altura uniforme na tabela).
      if (items.length === 0) return <div aria-hidden className="size-8" />;

      return (
        // Wrapper isola o clique do menu de ações do `onRowClick`/`getRowHref`
        // da DataTable — abrir o menu e selecionar uma ação não devem disparar a
        // navegação (nem abrir o detalhe em nova aba com o clique do meio).
        <div
          className="flex justify-end"
          onClick={(event) => event.stopPropagation()}
          onAuxClick={(event) => event.stopPropagation()}
        >
          <DropdownMenu>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={triggerLabel}
                    >
                      <MoreHorizontalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>{triggerLabel}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="end">
              {label && <DropdownMenuLabel>{label}</DropdownMenuLabel>}
              {items.map((action) => (
                <Fragment key={action.label}>
                  {action.separatorBefore && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    variant={action.destructive ? 'destructive' : 'default'}
                    disabled={action.disabled}
                    onClick={() => action.onSelect(row.original)}
                  >
                    {action.icon}
                    {action.label}
                  </DropdownMenuItem>
                </Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  };
}
