import * as React from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { type SortingState } from '@tanstack/react-table';

import { dataTableSearchKeys } from './dataTableSearch';
import { type DataTableFilterValues } from './filters';
import {
  isPageSizeOption,
  readStoredPageSize,
  writeStoredPageSize,
} from './pageSizeStorage';
import {
  buildDataTableResult,
  type DataTableQueryPatch,
  type UseDataTableQueryResult,
} from './useDataTableQuery';

interface UseDataTableUrlQueryOptions {
  /**
   * Linhas por página quando não há `?pageSize=` nem preferência salva.
   * Padrão: `25`.
   */
  pageSize?: number;
  /** Ordenação inicial; gravada na URL no mount se ela estiver vazia. */
  defaultSorting?: SortingState;
  /** Filtros iniciais; gravados na URL no mount se ela estiver vazia. */
  defaultFilters?: DataTableFilterValues;
  /**
   * Prefixo das chaves na URL. Sem ele, usa `page`/`pageSize`/`sort`/`filters`. Use quando
   * a rota tem mais de uma tabela (ex.: abas) e cada uma precisa do seu próprio
   * estado na URL sem colidir com as demais. A rota deve validar essas chaves
   * com `validateDataTableSearch(search, keyPrefix)`.
   */
  keyPrefix?: string;
}

/**
 * Igual ao `useDataTableQuery`, mas o estado (página/tamanho/ordenação/filtros) vive nos
 * **search params da URL** — permitindo recarregar e compartilhar URLs filtradas.
 *
 * A rota precisa declarar `validateSearch: validateDataTableSearch`.
 *
 * `defaultSorting`/`defaultFilters` são gravados na URL **uma única vez ao
 * montar** (se os params correspondentes estiverem ausentes), e a partir daí a
 * URL é a única fonte da verdade. Isso garante que "Limpar" fique limpo
 * de verdade — os defaults não voltam na próxima navegação.
 */
export function useDataTableUrlQuery({
  pageSize: defaultPageSize = 25,
  defaultSorting,
  defaultFilters,
  keyPrefix,
}: UseDataTableUrlQueryOptions = {}): UseDataTableQueryResult {
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const navigate = useNavigate();
  const keys = dataTableSearchKeys(keyPrefix);
  // Preferência salva neste navegador, lida uma vez: já vale na primeira
  // renderização (sem requisição extra com o padrão). A URL vence.
  const [storedPageSize, setStoredPageSize] =
    React.useState(readStoredPageSize);

  // Lê via `Map` para não indexar o objeto por variável (object injection).
  const params = new Map(Object.entries(search));
  const rawPage = params.get(keys.page);
  const rawPageSize = params.get(keys.pageSize);
  const urlPageSize = isPageSizeOption(rawPageSize) ? rawPageSize : undefined;
  const rawSort = params.get(keys.sort) as SortingState | undefined;
  const rawFilters = params.get(keys.filters) as
    DataTableFilterValues | undefined;

  // Grava os defaults na URL apenas no primeiro render, e somente para os
  // params ausentes. Depois disso, `seeded` impede que os defaults voltem
  // como fallback ao ler o estado.
  const seedSort =
    rawSort === undefined && !!defaultSorting && defaultSorting.length > 0;
  const seedFilters =
    rawFilters === undefined &&
    !!defaultFilters &&
    Object.keys(defaultFilters).length > 0;
  const [seeded, setSeeded] = React.useState(() => !seedSort && !seedFilters);

  React.useEffect(() => {
    if (seeded) return;

    void navigate({
      to: '.',
      replace: true,
      search: (previous: Record<string, unknown>) => ({
        ...previous,
        ...(seedSort ? { [keys.sort]: defaultSorting } : {}),
        ...(seedFilters ? { [keys.filters]: defaultFilters } : {}),
      }),
    }).then(() => setSeeded(true));
    // Roda apenas no mount: os defaults só entram na URL se ela já estiver
    // vazia. Depois disso, a URL é a fonte da verdade e não queremos que
    // mudanças em `defaultSorting`/`defaultFilters` ressuscitem os defaults.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Antes do seed (primeiro render), aplica defaults; depois, URL é a verdade.
  const page = typeof rawPage === 'number' ? rawPage : 0;
  const pageSize = urlPageSize ?? storedPageSize ?? defaultPageSize;
  const sort = rawSort ?? (seeded ? [] : (defaultSorting ?? []));
  const filters = rawFilters ?? (seeded ? {} : (defaultFilters ?? {}));

  const patch = (next: DataTableQueryPatch) => {
    // Usa apenas o que está REALMENTE na URL como base — sem fallback para
    // defaults — para que valores removidos pelo usuário permaneçam removidos.
    const urlPage = typeof rawPage === 'number' ? rawPage : 0;
    const urlSort = rawSort ?? [];
    const urlFilters = rawFilters ?? {};
    const merged = {
      page: next.page !== undefined ? next.page : urlPage,
      pageSize: next.pageSize !== undefined ? next.pageSize : urlPageSize,
      sort: next.sort !== undefined ? next.sort : urlSort,
      filters: next.filters !== undefined ? next.filters : urlFilters,
    };

    if (next.pageSize !== undefined) {
      writeStoredPageSize(next.pageSize);
    }

    const navigation = navigate({
      to: '.',
      // Trocar o tamanho substitui a entrada do histórico: no Voltar, a URL antiga
      // (com `page=N`) não pode reaparecer com o tamanho novo e cair em página vazia.
      replace: next.pageSize !== undefined,
      search: (previous: Record<string, unknown>) => {
        // Remove as chaves desta tabela antes de regravá-las (sem `delete` por
        // variável), preservando os demais params da rota (ex.: `tab`).
        const rest = Object.fromEntries(
          Object.entries(previous).filter(
            ([key]) =>
              key !== keys.page &&
              key !== keys.pageSize &&
              key !== keys.sort &&
              key !== keys.filters
          )
        );

        // Omite valores padrão/vazios para manter a URL limpa.
        return {
          ...rest,
          ...(merged.page ? { [keys.page]: merged.page } : {}),
          ...(merged.pageSize !== undefined &&
          merged.pageSize !== defaultPageSize
            ? { [keys.pageSize]: merged.pageSize }
            : {}),
          ...(merged.sort.length ? { [keys.sort]: merged.sort } : {}),
          ...(Object.keys(merged.filters).length
            ? { [keys.filters]: merged.filters }
            : {}),
        };
      },
    });

    // A preferência só entra no estado depois de a URL mudar: aplicá-la antes
    // renderizaria o tamanho novo ainda na página antiga, com uma requisição
    // intermediária.
    if (next.pageSize !== undefined) {
      void navigation.then(() => setStoredPageSize(readStoredPageSize()));
    }
  };

  // `defaultFilterValues` reflete os filtros atuais da URL, para os campos do
  // cabeçalho abrirem preenchidos (inclusive ao recarregar/compartilhar).
  return buildDataTableResult(
    { page, pageSize, sort, filters },
    patch,
    filters
  );
}
