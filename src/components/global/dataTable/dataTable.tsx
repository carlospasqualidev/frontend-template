import * as React from 'react';
import {
  type ColumnDef,
  type ExpandedState,
  type RowData,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Eraser, Search } from 'lucide-react';

import { expandColumn } from './columnHelpers';
import { withColumnVisibilityMenu } from './columnVisibilityMenu';
import { useColumnVisibility } from './useColumnVisibility';
import {
  DataTableFilters,
  type DataTableFilter,
  type DataTableFilterValues,
} from './filters';

import { Empty } from '@/components/global/empty/empty';
import { SkeletonText } from '@/components/global/skeleton/skeleton';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const SKELETON_WIDTHS = ['w-20', 'w-32', 'w-24', 'w-28', 'w-16'];

/**
 * Quantidade fixa de linhas exibidas no estado de carregamento. Não acompanha
 * o `pageSize` — preencher uma página inteira (ex.: 25/50 linhas) de skeletons
 * deixa a tela alta demais e ruidosa. Um punhado de linhas já comunica "tabela
 * carregando" sem custo visual.
 */
export const SKELETON_ROW_COUNT = 8;

declare module '@tanstack/react-table' {
  // Permite que cada coluna passe classes Tailwind para o `<th>`/`<td>` —
  // útil para alinhamento, largura mínima e estilo. Não use para esconder
  // colunas em breakpoints estreitos: a regra do projeto é rolagem horizontal
  // do container (`overflow-x-auto`), não ocultar informação em mobile.
  // Os generics replicam a assinatura original do `ColumnMeta` no tanstack.
  //
  // Truncamento: por padrão cada célula do corpo é truncada com reticências
  // (`truncate` sobre uma largura máxima) — texto longo, com ou sem espaços,
  // não estoura nem invade a coluna vizinha. Para dar mais largura a uma
  // coluna, passe `max-w-*` aqui (o tailwind-merge substitui o default); para
  // permitir quebra em múltiplas linhas, passe `whitespace-normal`; para largura
  // livre, `max-w-none`.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
    /**
     * Nome da coluna no menu "Colunas" (`columnVisibilityKey`). Obrigatório
     * quando o `header` não é texto (ex.: `SortableHeader`) — sem ele a coluna
     * não pode ser ocultada pelo usuário.
     */
    label?: string;
  }
}

/**
 * Largura máxima padrão de uma célula do corpo. Acima disso o conteúdo é
 * truncado com reticências em vez de empurrar a coluna (o que estoura o layout
 * e faz o texto invadir a coluna vizinha). Colunas que precisam de mais espaço
 * sobrescrevem via `meta.className` (ex.: `max-w-[600px]`, `max-w-none`).
 */
const CELL_MAX_WIDTH = 'max-w-[400px]';

/**
 * Há uma seleção de texto ativa no momento? Numa linha clicável, arrastar para
 * selecionar texto dispara o `click` logo depois — sem este guard a tabela
 * navegaria e o usuário nunca conseguiria copiar o conteúdo da célula. Um clique
 * simples primeiro colapsa qualquer seleção anterior (no `mousedown`), então no
 * `click` a seleção só é não-vazia quando o gesto foi de fato selecionar texto.
 */
function hasActiveTextSelection(): boolean {
  const selection = window.getSelection();
  return (
    !!selection &&
    !selection.isCollapsed &&
    selection.toString().trim().length > 0
  );
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  /** Linhas da página atual, já paginadas/filtradas/ordenadas pelo backend. */
  data: TData[];
  /** Página atual (0-based), controlada pelo consumidor. */
  pageIndex: number;
  /**
   * Chamado ao navegar; use o novo índice (0-based) para buscar a página
   * correspondente no backend. "Próxima" é desabilitado quando `data` vem com
   * menos de `pageSize` linhas — sinal de que não há mais registros, dispensando
   * um `COUNT` total.
   */
  onPageChange: (pageIndex: number) => void;
  /** Quantidade de linhas por página (usada para detectar a última página). Padrão: `50`. */
  pageSize?: number;
  /**
   * Total de itens no conjunto completo (todas as páginas), quando o backend o
   * fornece. Opt-in: quando definido, "Próxima" é habilitada por
   * `(pageIndex + 1) * pageSize < rowCount` — paginação exata mesmo quando o
   * número de **linhas exibidas** não corresponde ao tamanho da página (ex.: uma
   * linha por item×localização, onde um "item" da página vira várias linhas).
   * Quando omitido, mantém-se a heurística padrão (`data.length < pageSize`), que
   * dispensa `COUNT` no servidor. Aqui, `pageSize` é o número de **itens** por
   * página (não de linhas).
   */
  rowCount?: number;
  /** Mensagem exibida quando não há resultados. */
  emptyMessage?: string;
  /**
   * Chamado quando o usuário clica num cabeçalho ordenável (`SortableHeader`).
   * Use o estado de ordenação para refazer a busca no backend (a tabela não
   * ordena localmente).
   */
  onSortingChange?: (sorting: SortingState) => void;
  /**
   * Cabeçalho de filtros (server-side). Defina os campos de forma declarativa,
   * no mesmo estilo das `columns` (ver `textFilter`, `selectFilter`,
   * `dateFilter`, `dateRangeFilter`). Os valores só são enviados via `onSearch`
   * ao clicar em "Buscar".
   */
  filters?: DataTableFilter[];
  /** Chamado ao clicar em "Buscar"/"Limpar". Use os valores para buscar no backend. */
  onSearch?: (values: DataTableFilterValues) => void;
  /** Valores iniciais dos filtros. */
  defaultFilterValues?: DataTableFilterValues;
  /**
   * Conteúdo opcional à esquerda da linha dos botões "Limpar"/"Buscar" do
   * cabeçalho de filtros (ex.: um aviso/resumo). Só aparece quando há `filters`.
   */
  filtersLeadingActions?: React.ReactNode;
  /**
   * Quando definido, cada linha vira clicável e dispara este callback com a
   * linha original (`row.original`) — útil para navegar para uma tela de
   * detalhes. Botões/menus dentro de células (`actionsColumn`, `selectColumn`)
   * não disparam o clique da linha; eles param a propagação automaticamente.
   */
  onRowClick?: (row: TData) => void;
  /**
   * URL de destino da linha (ex.: `/users/${row.id}`). Complementa `onRowClick`
   * para dar à linha o comportamento de um link nativo: clique do meio (scroll)
   * ou Ctrl/Cmd/Shift+clique abrem a URL em nova aba; o clique normal continua
   * disparando `onRowClick` (navegação SPA pelo consumidor). Forneça os dois
   * juntos quando a linha leva a uma tela de detalhes.
   */
  getRowHref?: (row: TData) => string;
  /**
   * Quando definido, cada linha ganha um chevron (coluna injetada à esquerda)
   * que expande uma sub-linha com este conteúdo — útil para detalhes que não
   * cabem numa célula (ex.: os itens de um pedido). Expandir e
   * clicar na linha (`onRowClick`) são gestos independentes: o chevron isola a
   * propagação. O conteúdo ocupa toda a largura da tabela.
   */
  renderSubRow?: (row: TData) => React.ReactNode;
  /**
   * Classe(s) extra por linha, derivada(s) da linha original — para realce
   * semântico (ex.: registro atrasado em vermelho, vencendo hoje em azul). Retorne
   * `undefined` para as linhas sem realce. Compõe com o estilo de linha clicável.
   */
  rowClassName?: (row: TData) => string | undefined;
  /**
   * Exibe um número fixo de linhas (`SKELETON_ROW_COUNT`) com skeletons no lugar
   * do conteúdo das células. Filtros e cabeçalho permanecem visíveis e
   * interativos; a paginação é desabilitada durante o load para evitar disparos
   * em estado inconsistente.
   */
  isLoading?: boolean;
  /**
   * Liga o menu "Colunas", onde o usuário escolhe quais colunas ver. A escolha
   * fica salva **neste navegador** (`localStorage`) sob esta chave — use um
   * identificador único e estável por tabela (ex.: `'users'`). Colunas com
   * `enableHiding: false` (seleção, ações, expansão) não entram no menu.
   */
  columnVisibilityKey?: string;
}

/**
 * Tabela de dados server-side construída sobre o TanStack Table, no estilo do
 * shadcn/ui. É um componente de **apresentação + interação**: não pagina, não
 * filtra e não ordena localmente — `data` já vem pronta do backend e cada ação
 * do usuário dispara um callback para você refazer a busca.
 *
 * Normalmente usado com o hook `useDataTableQuery`, que já entrega as props
 * prontas:
 *
 * ```tsx
 * const { query, tableProps } = useDataTableQuery({ pageSize: 50 });
 *
 * const { data } = useQuery({
 *   queryKey: ['payments', query],
 *   queryFn: () => api.get('/payments', { params: query }),
 * });
 *
 * <DataTable columns={columns} data={data ?? []} filters={filters} {...tableProps} />
 * ```
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  pageIndex,
  onPageChange,
  pageSize = 25,
  rowCount,
  emptyMessage = 'Nenhum resultado.',
  onSortingChange,
  filters,
  onSearch,
  defaultFilterValues,
  filtersLeadingActions,
  onRowClick,
  getRowHref,
  renderSubRow,
  rowClassName,
  isLoading = false,
  columnVisibilityKey,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [columnVisibility, setColumnVisibility] =
    useColumnVisibility(columnVisibilityKey);

  const hasActiveFilters =
    !!defaultFilterValues && Object.keys(defaultFilterValues).length > 0;

  // Com `renderSubRow`, injeta a coluna do chevron no início; com
  // `columnVisibilityKey`, o menu de colunas no canto direito do cabeçalho —
  // assim o consumidor declara só as colunas de dado.
  const tableColumns = React.useMemo(() => {
    const withExpand = renderSubRow
      ? [expandColumn<TData>() as ColumnDef<TData, TValue>, ...columns]
      : columns;
    return columnVisibilityKey
      ? withColumnVisibilityMenu(withExpand)
      : withExpand;
  }, [columns, renderSubRow, columnVisibilityKey]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: renderSubRow ? () => true : undefined,
    // Ordenação no servidor: a tabela só guarda o estado (para o indicador no
    // cabeçalho) e avisa o consumidor; não reordena as linhas localmente.
    manualSorting: true,
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(next);
      onSortingChange?.(next);
    },
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      rowSelection,
      expanded,
      columnVisibility,
    },
  });

  const columnCount = table.getVisibleLeafColumns().length;

  return (
    <div>
      {filters?.length ? (
        <DataTableFilters
          // Reseta os campos quando os valores iniciais mudam por fora (ex.:
          // back/forward do navegador com filtros na URL).
          key={JSON.stringify(defaultFilterValues ?? {})}
          filters={filters}
          defaultValues={defaultFilterValues}
          onSearch={(values) => onSearch?.(values)}
          isLoading={isLoading}
          leadingActions={filtersLeadingActions}
        />
      ) : null}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as
                    | { className?: string }
                    | undefined;
                  return (
                    <TableHead key={header.id} className={meta?.className}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: SKELETON_ROW_COUNT }).map((_, rowIndex) => (
                <TableRow
                  key={`skeleton-${rowIndex}`}
                  className="hover:bg-transparent"
                >
                  {table.getVisibleLeafColumns().map((column, colIndex) => {
                    const meta = column.columnDef.meta as
                      | { className?: string }
                      | undefined;
                    const width =
                      SKELETON_WIDTHS[
                        (rowIndex + colIndex) % SKELETON_WIDTHS.length
                      ];
                    return (
                      <TableCell key={column.id} className={meta?.className}>
                        <SkeletonText className={width} />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const href = getRowHref?.(row.original);
                const interactive = !!onRowClick || !!href;

                const openInNewTab = () => {
                  if (href) {
                    window.open(href, '_blank', 'noopener,noreferrer');
                  }
                };

                return (
                  <React.Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() && 'selected'}
                      onClick={
                        interactive
                          ? (event) => {
                              // Selecionar texto para copiar não deve navegar: se há
                              // seleção ativa, o gesto foi copiar, não abrir a linha.
                              if (hasActiveTextSelection()) return;
                              // Ctrl/Cmd/Shift+clique abre em nova aba, como num
                              // link nativo; o clique normal segue a navegação SPA.
                              if (
                                href &&
                                (event.metaKey ||
                                  event.ctrlKey ||
                                  event.shiftKey)
                              ) {
                                openInNewTab();
                                return;
                              }
                              onRowClick?.(row.original);
                            }
                          : undefined
                      }
                      onAuxClick={
                        href
                          ? (event) => {
                              // Botão do meio (scroll) abre o destino em nova aba.
                              if (event.button === 1) {
                                event.preventDefault();
                                openInNewTab();
                              }
                            }
                          : undefined
                      }
                      onMouseDown={
                        href
                          ? (event) => {
                              // Evita o cursor de autoscroll do clique do meio.
                              if (event.button === 1) event.preventDefault();
                            }
                          : undefined
                      }
                      onKeyDown={
                        interactive
                          ? (event) => {
                              // Só dispara quando o foco está na própria linha —
                              // Enter/Espaço em botões/checkboxes dentro de células
                              // têm `event.target` diferente e são ignorados aqui.
                              if (event.target !== event.currentTarget) return;
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onRowClick?.(row.original);
                              }
                            }
                          : undefined
                      }
                      role={href ? 'link' : onRowClick ? 'button' : undefined}
                      tabIndex={interactive ? 0 : undefined}
                      className={cn(
                        interactive &&
                          'cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                        rowClassName?.(row.original)
                      )}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta as
                          | { className?: string }
                          | undefined;
                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              CELL_MAX_WIDTH,
                              'truncate',
                              meta?.className
                            )}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    {renderSubRow && row.getIsExpanded() ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={columnCount}
                          className="bg-muted/30 p-0"
                        >
                          {renderSubRow(row.original)}
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columnCount} className="py-6">
                  <Empty
                    title={emptyMessage}
                    description={
                      hasActiveFilters
                        ? 'Ajuste os filtros ou remova-os para ver os registros.'
                        : 'Ainda não há registros para exibir.'
                    }
                    icon={<Search />}
                  >
                    {hasActiveFilters && onSearch ? (
                      <Button variant="outline" onClick={() => onSearch({})}>
                        <Eraser />
                        Limpar filtros
                      </Button>
                    ) : null}
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={pageIndex === 0 || isLoading}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={
            isLoading ||
            (rowCount != null
              ? (pageIndex + 1) * pageSize >= rowCount
              : data.length < pageSize)
          }
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
