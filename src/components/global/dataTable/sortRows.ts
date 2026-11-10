import { type SortingState } from '@tanstack/react-table';

/** Valor que uma coluna entrega para ordenar; vazio (`null`/`undefined`) é permitido. */
export type SortValue = string | number | null | undefined;

/**
 * Como cada coluna lê o valor que ordena a lista. `Map`, e nunca objeto indexado
 * por variável: o id da coluna vem do estado de ordenação (dado de fora), e
 * indexar objeto com ele abre object injection.
 */
export type SortAccessors<TRow> = ReadonlyMap<string, (row: TRow) => SortValue>;

/** Vazio vai para o fim; número antes de texto (o `desc` inverte); senão compara o par do mesmo tipo. */
function compareValues(a: SortValue, b: SortValue): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b, 'pt-BR');
  }
  return (typeof a === 'number' ? 0 : 1) - (typeof b === 'number' ? 0 : 1);
}

/**
 * Ordena em memória a lista que a tela já carregou inteira, conforme o `sorting`
 * da `DataTable`. A tabela nunca reordena sozinha (`manualSorting: true`): em
 * lista paginada quem ordena é o backend; em lista pequena carregada por
 * completo, a própria tela, e este helper evita que cada uma escreva o seu
 * comparador.
 *
 * Número ordena por subtração; texto por `localeCompare('pt-BR')`. Valor vazio
 * (`null`/`undefined`) vai para o fim nos dois sentidos; número e texto na mesma
 * coluna não são comparados entre si (número vem antes em ordem crescente e depois em decrescente). Empates mantêm a ordem
 * de entrada. Sem regra de ordenação, ou sem acessor para a coluna, devolve a
 * mesma lista recebida. Não muta a entrada.
 */
export function sortRows<TRow>(
  rows: TRow[],
  sorting: SortingState,
  accessors: SortAccessors<TRow>
): TRow[] {
  const [rule] = sorting;
  const accessor = rule && accessors.get(rule.id);
  if (!rule || !accessor) return rows;

  const factor = rule.desc ? -1 : 1;
  return [...rows].sort((a, b) => {
    const va = accessor(a);
    const vb = accessor(b);
    const aEmpty = va === null || va === undefined;
    const bEmpty = vb === null || vb === undefined;
    if (aEmpty || bEmpty) return Number(aEmpty) - Number(bEmpty);
    return compareValues(va, vb) * factor;
  });
}
