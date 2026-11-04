import { z } from 'zod';

import { isPageSizeOption } from './pageSizeStorage';

/**
 * Schema dos search params usados pela `DataTable` server-side. Plugue
 * `validateDataTableSearch` no `validateSearch` da rota para persistir
 * página/ordenação/filtros na URL (URLs filtradas compartilháveis).
 */
const filterValueSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.object({ from: z.string(), to: z.string() }),
]);

const sortSchema = z.array(z.object({ id: z.string(), desc: z.boolean() }));

// `?pageSize=` fora das opções é descartado sozinho (vale o storage), sem
// derrubar page/sort/filters da mesma URL.
const pageSizeSchema = z
  .number()
  .refine(isPageSizeOption)
  .optional()
  .catch(undefined);

export const dataTableSearchSchema = z.object({
  page: z.number().optional(),
  pageSize: pageSizeSchema,
  sort: sortSchema.optional(),
  filters: z.record(z.string(), filterValueSchema).optional(),
});

export type DataTableSearch = z.infer<typeof dataTableSearchSchema>;

/**
 * Nomes dos search params para uma tabela. Sem `keyPrefix`, usa as chaves padrão
 * (`page`/`pageSize`/`sort`/`filters`). Com `keyPrefix`, prefixa-as (`byUserPage`,
 * `byUserPageSize`, `byUserSort`, `byUserFilters`) para que mais de uma tabela na mesma rota
 * coexistam na URL sem disputar as mesmas chaves.
 */
export function dataTableSearchKeys(keyPrefix?: string) {
  return {
    page: keyPrefix ? `${keyPrefix}Page` : 'page',
    pageSize: keyPrefix ? `${keyPrefix}PageSize` : 'pageSize',
    sort: keyPrefix ? `${keyPrefix}Sort` : 'sort',
    filters: keyPrefix ? `${keyPrefix}Filters` : 'filters',
  };
}

/**
 * Valida os search params da rota. Em caso de URL inválida, ignora (volta ao
 * estado padrão) em vez de quebrar a navegação.
 *
 * Passe `keyPrefix` quando a rota tiver mais de uma tabela e cada uma precisar
 * persistir seu estado em chaves próprias (ex.: as abas de Denúncias).
 *
 * ```ts
 * createRoute({ validateSearch: validateDataTableSearch, ... });
 * ```
 */
export function validateDataTableSearch(
  search: Record<string, unknown>
): DataTableSearch;
export function validateDataTableSearch(
  search: Record<string, unknown>,
  keyPrefix: string
): Record<string, unknown>;
export function validateDataTableSearch(
  search: Record<string, unknown>,
  keyPrefix?: string
): DataTableSearch | Record<string, unknown> {
  if (!keyPrefix) {
    return dataTableSearchSchema.catch({}).parse(search);
  }

  const keys = dataTableSearchKeys(keyPrefix);
  const prefixedSchema = z.object({
    [keys.page]: z.number().optional(),
    [keys.pageSize]: pageSizeSchema,
    [keys.sort]: sortSchema.optional(),
    [keys.filters]: z.record(z.string(), filterValueSchema).optional(),
  });

  return prefixedSchema.catch({}).parse(search);
}
