import * as React from 'react';
import { type SortingState } from '@tanstack/react-table';

import { type DataTableFilterValues } from './filters';
import { readStoredPageSize, writeStoredPageSize } from './pageSizeStorage';

export interface DataTableQuery {
  /** Página atual (0-based). */
  page: number;
  /** Linhas por página. */
  pageSize: number;
  /** Ordenação atual (geralmente 0 ou 1 coluna). */
  sort: SortingState;
  /** Filtros aplicados (já sem valores vazios). */
  filters: DataTableFilterValues;
}

interface UseDataTableQueryOptions {
  /**
   * Linhas por página quando não há preferência salva. Padrão: `25`. Vale só
   * como valor **inicial** (lido no mount); mudar a prop depois não tem efeito.
   */
  pageSize?: number;
  /** Ordenação inicial. */
  defaultSorting?: SortingState;
  /** Filtros iniciais. */
  defaultFilters?: DataTableFilterValues;
}

export interface UseDataTableQueryResult {
  /** Estado atual para montar a busca no backend (use na `queryKey`/params). */
  query: DataTableQuery;
  /** Props já prontas para espalhar na `<DataTable />`. */
  tableProps: {
    pageIndex: number;
    onPageChange: (pageIndex: number) => void;
    pageSize: number;
    onPageSizeChange: (pageSize: number) => void;
    onSortingChange: (sorting: SortingState) => void;
    onSearch: (filters: DataTableFilterValues) => void;
    defaultFilterValues?: DataTableFilterValues;
  };
}

/** Alteração parcial do estado, aplicada de uma vez (página/ordenação/filtros). */
export type DataTableQueryPatch = Partial<{
  page: number;
  pageSize: number;
  sort: SortingState;
  filters: DataTableFilterValues;
}>;

/**
 * Monta `query` + `tableProps` a partir do estado atual e de um `patch` que
 * aplica as mudanças (em uma única operação). Compartilhado entre o hook com
 * estado local (`useDataTableQuery`) e o com estado na URL (`useDataTableUrlQuery`).
 */
export function buildDataTableResult(
  state: {
    page: number;
    pageSize: number;
    sort: SortingState;
    filters: DataTableFilterValues;
  },
  patch: (next: DataTableQueryPatch) => void,
  defaultFilterValues?: DataTableFilterValues
): UseDataTableQueryResult {
  return {
    query: {
      page: state.page,
      pageSize: state.pageSize,
      sort: state.sort,
      filters: state.filters,
    },
    tableProps: {
      pageSize: state.pageSize,
      pageIndex: state.page,
      onPageChange: (page) => patch({ page }),
      // Novo tamanho de página também volta para a primeira página.
      onPageSizeChange: (pageSize) => patch({ pageSize, page: 0 }),
      // Nova ordenação/busca sempre volta para a primeira página.
      onSortingChange: (sort) => patch({ sort, page: 0 }),
      onSearch: (filters) => patch({ filters, page: 0 }),
      defaultFilterValues,
    },
  };
}

/**
 * Reúne num só lugar o estado server-side da `DataTable` (página, ordenação e
 * filtros) e os resets de página, devolvendo:
 * - `query`: os valores para montar a busca no backend (`queryKey`/params);
 * - `tableProps`: as props já fiadas para espalhar na `<DataTable />`.
 *
 * Trocar filtros ou ordenação volta automaticamente para a primeira página.
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
export function useDataTableQuery(
  options: UseDataTableQueryOptions = {}
): UseDataTableQueryResult {
  const {
    pageSize: defaultPageSize = 25,
    defaultSorting,
    defaultFilters,
  } = options;

  const [page, setPage] = React.useState(0);
  // Preferência salva neste navegador vale já na primeira renderização.
  const [pageSize, setPageSize] = React.useState<number>(
    () => readStoredPageSize() ?? defaultPageSize
  );
  const [sort, setSort] = React.useState<SortingState>(defaultSorting ?? []);
  const [filters, setFilters] = React.useState<DataTableFilterValues>(
    defaultFilters ?? {}
  );

  const patch = (next: DataTableQueryPatch) => {
    if (next.page !== undefined) setPage(next.page);
    if (next.pageSize !== undefined) {
      setPageSize(next.pageSize);
      writeStoredPageSize(next.pageSize);
    }
    if (next.sort !== undefined) setSort(next.sort);
    if (next.filters !== undefined) setFilters(next.filters);
  };

  return buildDataTableResult(
    { page, pageSize, sort, filters },
    patch,
    defaultFilters
  );
}
