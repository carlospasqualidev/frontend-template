import * as React from 'react';
import {
  type ColumnVisibilityState,
  type ExpandedState,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Updater,
  flexRender,
  useTable,
} from '@tanstack/react-table';
import { CircleAlert, Eraser, Loader2, RefreshCw, Search } from 'lucide-react';

import { expandColumn } from './columnHelpers';
import {
  MENU_COLUMN_ID,
  withColumnVisibilityMenu,
} from './columnVisibilityMenu';
import {
  dataTableFeatures,
  type DataTableColumn,
  type DataTableColumnDef,
} from './tableFeatures';
import { useColumnVisibility } from './useColumnVisibility';
import {
  DataTableFilters,
  type DataTableFilter,
  type DataTableFilterValues,
} from './filters';

import { Empty } from '@/components/global/empty/empty';
import { SkeletonText } from '@/components/global/skeleton/skeleton';
import { PaginationFooter } from '@/components/global/paginationFooter/paginationFooter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
function RetryButton({ onRetry }: { onRetry: () => unknown }) {
  const [isRetrying, setIsRetrying] = React.useState(false);

  async function handleRetry() {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <Button
      variant="outline"
      disabled={isRetrying}
      onClick={() => void handleRetry()}
    >
      {isRetrying ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      Tentar novamente
    </Button>
  );
}

function hasActiveTextSelection(): boolean {
  const selection = window.getSelection();
  return (
    !!selection &&
    !selection.isCollapsed &&
    selection.toString().trim().length > 0
  );
}

function hideableColumnIds<TData extends RowData>(
  columns: DataTableColumnDef<TData>[]
): string[] {
  return columns.flatMap((column) => {
    if (column.enableHiding === false) return [];
    const id =
      column.id ??
      ('accessorKey' in column && typeof column.accessorKey === 'string'
        ? column.accessorKey
        : undefined);
    return id ? [id] : [];
  });
}

/**
 * `aria-sort` do `<th>`: o leitor de tela anuncia a direção da coluna ordenada.
 * Só em coluna que ordena: um `sort` na URL para coluna com `enableSorting:
 * false` não deve anunciar uma ordenação que a tela não oferece.
 */
function ariaSortOf<TData extends RowData>(
  column: DataTableColumn<TData>
): 'ascending' | 'descending' | undefined {
  if (!column.getCanSort()) return undefined;
  switch (column.getIsSorted()) {
    case 'asc':
      return 'ascending';
    case 'desc':
      return 'descending';
    default:
      return undefined;
  }
}

type DataTablePaginationProps =
  | {
      /** Remove o rodapé de paginação (tabela com tudo em memória). */
      hidePagination?: false;
      /** Página atual (0-based), controlada pelo consumidor. */
      pageIndex: number;
      /**
       * Chamado ao navegar; use o novo índice (0-based) para buscar a página
       * correspondente no backend. "Próxima" é desabilitado quando `data` vem com
       * menos de `pageSize` linhas — sinal de que não há mais registros,
       * dispensando um `COUNT` total.
       */
      onPageChange: (pageIndex: number) => void;
    }
  | {
      hidePagination: true;
      pageIndex?: number;
      onPageChange?: (pageIndex: number) => void;
    };

type DataTableBaseProps<TData extends RowData> = {
  columns: DataTableColumnDef<TData>[];
  /** Linhas da página atual, já paginadas/filtradas/ordenadas pelo backend. */
  data: TData[];
  /** Quantidade de linhas por página (usada para detectar a última página). Padrão: `25`. */
  pageSize?: number;
  /**
   * Chamado ao escolher outro "Itens por página" (25, 50 ou 100). Opt-in: sem
   * ele, ou com `pageSize` fora dessas opções, o seletor não aparece. Já vem
   * fiado em `tableProps` pelos hooks `useDataTableQuery`/
   * `useDataTableUrlQuery`, que também guardam a escolha.
   */
  onPageSizeChange?: (pageSize: number) => void;
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
   * Título do estado de erro (ex.: "Não foi possível carregar os usuários"). Com
   * ele, o corpo mostra um `Empty` de erro no lugar das linhas e do vazio; filtros,
   * cabeçalho e ações seguem na tela. A tela passa só quando a query falhou e não
   * há dado a mostrar: se a recarga falha com linhas já carregadas, as linhas
   * ficam (o interceptor já avisou o erro).
   */
  errorMessage?: string;
  /**
   * Botão "Tentar novamente" do estado de erro, chamado sem argumentos. Se
   * devolver uma promessa (ex.: `refetch`), o botão fica desabilitado, em
   * carregamento, até ela terminar.
   */
  onRetry?: () => unknown;
  /**
   * Ordenação atual, **controlada** por fora (ex.: o `sort` da URL, já fiado em
   * `tableProps` pelos hooks). O indicador do cabeçalho e o `aria-sort` seguem
   * este valor. Sem ela, a tabela guarda a ordenação sozinha.
   */
  sorting?: SortingState;
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
   * Decide por linha se `onRowClick` vale. Falso: a linha não ganha `role`,
   * foco por teclado nem cursor de clique e não dispara `onRowClick`. Sem a
   * prop, toda linha é clicável quando há `onRowClick`. Não afeta `getRowHref`.
   */
  isRowClickable?: (row: TData) => boolean;
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
   * Id estável de cada linha (ex.: `(row) => row.id`). Sem ele, o TanStack usa
   * o índice da linha na página, e a linha 0 da página 2 herdaria a marca da
   * linha 0 da página 1. Com seleção controlada, passe sempre: é por este id que
   * `rowSelection` identifica as linhas marcadas. Ids repetidos marcam juntos.
   */
  getRowId?: (row: TData, index: number) => string;
  /**
   * Seleção atual, **controlada** por fora (`{ [rowId]: true }`, ids vindos de
   * `getRowId`). Com ela, a tabela reflete o valor recebido, avisa a mudança e
   * não guarda cópia própria. A tabela **não** limpa a seleção ao paginar,
   * filtrar ou ordenar: quem limpa é o consumidor. Sem ela, a seleção fica num
   * estado interno.
   */
  rowSelection?: RowSelectionState;
  /** Chamado a cada marcar/desmarcar com a seleção inteira nova. */
  onRowSelectionChange?: (rowSelection: RowSelectionState) => void;
  /**
   * Guarda a escolha do menu "Configurar colunas" **neste navegador**
   * (`localStorage`) sob esta chave — use um identificador único e estável por
   * tabela (ex.: `'users'`). Sem ela o menu continua aparecendo, mas a escolha
   * vale só em memória. Colunas com `enableHiding: false` (seleção, ações,
   * expansão) não entram no menu.
   */
  columnVisibilityKey?: string;
  /**
   * Ids das colunas que nascem ocultas enquanto o usuário não escolheu nada. A
   * escolha gravada (inclusive "mostrar todas") vence o padrão. Ids que não
   * existem são ignorados.
   */
  defaultHiddenColumnIds?: readonly string[];
  /** Remove o menu "Configurar colunas" e a coluna que o hospeda. */
  disableColumnVisibility?: boolean;
  /**
   * Visibilidade controlada pela tela (id da coluna -> visível). Use junto de
   * `onColumnVisibilityChange`; neste modo a tabela não grava nada por conta
   * própria e `columnVisibilityKey`/`defaultHiddenColumnIds` não valem.
   */
  columnVisibility?: ColumnVisibilityState;
  /** Chamado com o novo estado quando o usuário mexe no menu de colunas. */
  onColumnVisibilityChange?: (visibility: ColumnVisibilityState) => void;
};

type DataTableProps<TData extends RowData> = DataTableBaseProps<TData> &
  DataTablePaginationProps;

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
export function DataTable<TData extends RowData>({
  columns,
  data,
  pageIndex = 0,
  onPageChange,
  pageSize = 25,
  onPageSizeChange,
  rowCount,
  emptyMessage = 'Nenhum resultado.',
  errorMessage,
  onRetry,
  sorting: controlledSorting,
  onSortingChange,
  isRowClickable,
  getRowId,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
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
  defaultHiddenColumnIds,
  disableColumnVisibility = false,
  columnVisibility: controlledVisibility,
  onColumnVisibilityChange,
  hidePagination = false,
}: DataTableProps<TData>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>(
    []
  );
  const [internalRowSelection, setInternalRowSelection] =
    React.useState<RowSelectionState>({});
  const sorting = controlledSorting ?? internalSorting;
  const rowSelection = controlledRowSelection ?? internalRowSelection;
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const isVisibilityControlled = controlledVisibility !== undefined;
  const [storedVisibility, setStoredVisibility] = useColumnVisibility(
    isVisibilityControlled ? undefined : columnVisibilityKey,
    defaultHiddenColumnIds
  );
  // Um padrão (ou valor gravado) que esconderia todas as colunas ocultáveis
  // deixaria a tabela sem dado: nesse caso vale tudo visível.
  const hidesEveryColumn = React.useMemo(() => {
    const ids = hideableColumnIds(columns);
    const hidden = new Set(
      Object.entries(storedVisibility)
        .filter(([, visible]) => !visible)
        .map(([id]) => id)
    );
    return ids.length > 0 && ids.every((id) => hidden.has(id));
  }, [columns, storedVisibility]);
  const columnVisibility =
    controlledVisibility ?? (hidesEveryColumn ? {} : storedVisibility);

  const handleColumnVisibilityChange = (
    updater: Updater<ColumnVisibilityState>
  ) => {
    const next =
      typeof updater === 'function' ? updater(columnVisibility) : updater;
    if (!isVisibilityControlled) setStoredVisibility(next);
    onColumnVisibilityChange?.(next);
  };

  const hasActiveFilters =
    !!defaultFilterValues && Object.keys(defaultFilterValues).length > 0;

  // Com `renderSubRow`, injeta a coluna do chevron no início; salvo
  // `disableColumnVisibility`, o menu de colunas no canto direito do
  // cabeçalho — assim o consumidor declara só as colunas de dado.
  const tableColumns = React.useMemo(() => {
    const withExpand = renderSubRow
      ? [expandColumn<TData>(), ...columns]
      : columns;
    return disableColumnVisibility
      ? withExpand
      : withColumnVisibilityMenu(withExpand);
  }, [columns, renderSubRow, disableColumnVisibility]);

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns: tableColumns,
    getRowCanExpand: renderSubRow ? () => true : undefined,
    // Ordenação no servidor: a tabela só guarda o estado (para o indicador no
    // cabeçalho) e avisa o consumidor; não reordena as linhas localmente.
    manualSorting: true,
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      // Controlada, quem guarda é o consumidor: gravar aqui criaria uma
      // segunda fonte da verdade que divergiria da URL.
      if (controlledSorting === undefined) setInternalSorting(next);
      onSortingChange?.(next);
    },
    getRowId,
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(rowSelection) : updater;
      if (controlledRowSelection === undefined) setInternalRowSelection(next);
      onRowSelectionChange?.(next);
    },
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    state: {
      sorting,
      rowSelection,
      expanded,
      columnVisibility,
    },
  });

  const columnCount = table.getVisibleLeafColumns().length;
  const hasFooter = table
    .getVisibleLeafColumns()
    .some((column) => column.columnDef.footer !== undefined);

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
                  const meta = header.column.columnDef.meta;
                  return (
                    <TableHead
                      key={header.id}
                      className={meta?.className}
                      aria-sort={ariaSortOf(header.column)}
                    >
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
                    const meta = column.columnDef.meta;
                    // Coluna de ações: largura fixa no mesmo eixo do título e
                    // dos botões, para não alargar a coluna ao carregar.
                    const width = meta?.isActions
                      ? cn(
                          'w-16',
                          meta.actionsAlign === 'right' ? 'ml-auto' : 'mx-auto'
                        )
                      : SKELETON_WIDTHS[
                          (rowIndex + colIndex) % SKELETON_WIDTHS.length
                        ];
                    return (
                      <TableCell key={column.id} className={meta?.className}>
                        {column.id === MENU_COLUMN_ID ? null : (
                          <SkeletonText className={width} />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const href = getRowHref?.(row.original);
                const clickable =
                  !!onRowClick && (isRowClickable?.(row.original) ?? true);
                const interactive = clickable || !!href;

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
                              if (clickable) onRowClick?.(row.original);
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
                                if (clickable) onRowClick?.(row.original);
                              }
                            }
                          : undefined
                      }
                      role={href ? 'link' : clickable ? 'button' : undefined}
                      tabIndex={interactive ? 0 : undefined}
                      className={cn(
                        interactive &&
                          'cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                        rowClassName?.(row.original)
                      )}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta;
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
            ) : errorMessage ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columnCount} className="py-6">
                  <Empty
                    title={errorMessage}
                    description="Tente novamente em instantes."
                    icon={<CircleAlert />}
                  >
                    {onRetry ? <RetryButton onRetry={onRetry} /> : null}
                  </Empty>
                </TableCell>
              </TableRow>
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
          {hasFooter && !isLoading ? (
            <TableFooter>
              {table.getFooterGroups().map((footerGroup) => (
                <TableRow key={footerGroup.id} className="hover:bg-transparent">
                  {footerGroup.headers.map((header) => (
                    <TableCell
                      key={header.id}
                      className={header.column.columnDef.meta?.className}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.footer,
                            header.getContext()
                          )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableFooter>
          ) : null}
        </Table>
      </div>

      {hidePagination ? null : (
        <PaginationFooter
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageChange={(next) => onPageChange?.(next)}
          onPageSizeChange={onPageSizeChange}
          hasNextPage={
            rowCount != null
              ? (pageIndex + 1) * pageSize < rowCount
              : data.length >= pageSize
          }
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
