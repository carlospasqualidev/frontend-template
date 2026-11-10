import * as React from 'react';

const DEBOUNCE_MS = 300;

export interface AsyncOption {
  value: string;
  label: string;
}

export interface UseAsyncOptionsParams {
  /**
   * Recebe o termo e devolve as opções já recortadas pelo servidor. Precisa ter
   * identidade estável (`useCallback` no chamador): uma função nova a cada
   * render recria `search` e perde o debounce em andamento.
   */
  onSearch: (term: string) => Promise<AsyncOption[]>;
  /** Caracteres antes de consultar. Padrão: 3 — com menos, a busca traz a base inteira. */
  minChars?: number;
  /**
   * Rótulos de valores que já chegam selecionados sem ter passado por uma busca
   * (tipicamente vindos da URL). Chamado uma vez por valor desconhecido, por
   * `hydrate`. Também precisa de identidade estável.
   */
  resolveLabels?: (values: string[]) => Promise<AsyncOption[]>;
}

/**
 * Mecânica de um campo cuja lista vem do SERVIDOR a cada termo digitado:
 *
 * 1. **Debounce** de 300 ms: uma consulta por pausa de digitação, não por tecla.
 * 2. **Resposta velha é descartada** por um contador de geração; termo curto
 *    (abaixo de `minChars`) também invalida a consulta já disparada.
 * 3. **Rótulos já vistos são lembrados**: o selecionado não está no resultado da
 *    busca atual, e sem a memória o gatilho mostraria o identificador interno.
 * 4. **Rótulos nunca vistos são buscados uma vez** (`resolveLabels` via
 *    `hydrate`): um valor vindo da URL nunca passou por uma busca. O rótulo não
 *    viaja na URL de propósito: nome é dado pessoal.
 *
 * `withSelected` é puro; chame `hydrate(selected)` num efeito quando houver
 * `resolveLabels`.
 */
export function useAsyncOptions({
  onSearch,
  minChars = 3,
  resolveLabels,
}: UseAsyncOptionsParams) {
  const [options, setOptions] = React.useState<AsyncOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [knownLabels, setKnownLabels] = React.useState<
    ReadonlyMap<string, string>
  >(() => new Map());

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const generationRef = React.useRef(0);

  const remember = React.useCallback((result: AsyncOption[]) => {
    setKnownLabels((previous) => {
      const next = new Map(previous);
      for (const option of result) next.set(option.value, option.label);
      return next;
    });
  }, []);

  React.useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      generationRef.current += 1;
    },
    []
  );

  const search = React.useCallback(
    (term: string) => {
      clearTimeout(timerRef.current);
      const generation = ++generationRef.current;
      const trimmed = term.trim();

      if (trimmed.length < minChars) {
        setOptions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      timerRef.current = setTimeout(() => {
        void onSearch(trimmed)
          .then((result) => {
            if (generation !== generationRef.current) return;
            remember(result);
            setOptions(result);
          })
          .catch(() => {
            if (generation === generationRef.current) setOptions([]);
          })
          .finally(() => {
            if (generation === generationRef.current) setLoading(false);
          });
      }, DEBOUNCE_MS);
    },
    [onSearch, minChars, remember]
  );

  const requestedRef = React.useRef(new Set<string>());

  const hydrate = React.useCallback(
    (selected: string[]) => {
      if (!resolveLabels) return;

      const missing = selected.filter(
        (item) => !knownLabels.has(item) && !requestedRef.current.has(item)
      );
      if (missing.length === 0) return;

      for (const item of missing) requestedRef.current.add(item);
      void resolveLabels(missing)
        .then(remember)
        .catch(() => {
          // Falha permite nova tentativa no próximo `hydrate`.
          for (const item of missing) requestedRef.current.delete(item);
        });
    },
    [resolveLabels, knownLabels, remember]
  );

  /** O rótulo de um valor já visto; o próprio valor quando nunca passou por aqui. */
  const labelOf = React.useCallback(
    (value: string) => knownLabels.get(value) ?? value,
    [knownLabels]
  );

  /**
   * As opções a exibir: o que está selecionado primeiro (para não sumir entre
   * buscas), depois o resultado atual sem repetir o que já está em cima.
   */
  const withSelected = React.useCallback(
    (selected: string[]): AsyncOption[] => [
      ...selected.map((value) => ({ value, label: labelOf(value) })),
      ...options.filter((option) => !selected.includes(option.value)),
    ],
    [options, labelOf]
  );

  return {
    options,
    loading,
    search,
    labelOf,
    withSelected,
    hydrate,
    minChars,
  };
}
