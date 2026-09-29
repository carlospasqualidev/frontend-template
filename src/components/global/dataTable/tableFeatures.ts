import {
  columnVisibilityFeature,
  createExpandedRowModel,
  metaHelper,
  rowExpandingFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  type CellData,
  type Column,
  type ColumnDef,
  type RowData,
  type Table,
} from '@tanstack/react-table';

/**
 * `meta` aceito por toda coluna da `DataTable`.
 */
export interface DataTableColumnMeta {
  /**
   * Classes Tailwind para o `<th>`/`<td>` — alinhamento, largura mínima e
   * estilo. Não use para esconder colunas em breakpoints estreitos: a regra do
   * projeto é rolagem horizontal do container (`overflow-x-auto`), não ocultar
   * informação em mobile.
   *
   * Truncamento: por padrão cada célula do corpo é truncada com reticências
   * (`truncate` sobre uma largura máxima) — texto longo, com ou sem espaços,
   * não estoura nem invade a coluna vizinha. Para dar mais largura a uma
   * coluna, passe `max-w-*` aqui (o tailwind-merge substitui o default); para
   * permitir quebra em múltiplas linhas, passe `whitespace-normal`; para largura
   * livre, `max-w-none`.
   */
  className?: string;
  /**
   * Nome da coluna no menu "Colunas" (`columnVisibilityKey`). Obrigatório
   * quando o `header` não é texto (ex.: `SortableHeader`) — sem ele a coluna
   * não pode ser ocultada pelo usuário.
   */
  label?: string;
}

/**
 * Features do TanStack Table usadas pela `DataTable`. A ordenação é server-side
 * (`manualSorting`), então não há `sortedRowModel`; a expansão precisa do seu
 * row model para montar as sub-linhas do `renderSubRow`.
 */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
  columnMeta: metaHelper<DataTableColumnMeta>(),
});

export type DataTableFeatures = typeof dataTableFeatures;

/** Definição de coluna da `DataTable` — use nas `columns` das telas. */
export type DataTableColumnDef<
  TData extends RowData,
  TValue extends CellData = CellData,
> = ColumnDef<DataTableFeatures, TData, TValue>;

export type DataTableColumn<
  TData extends RowData,
  TValue extends CellData = CellData,
> = Column<DataTableFeatures, TData, TValue>;

export type DataTableInstance<TData extends RowData> = Table<
  DataTableFeatures,
  TData
>;
