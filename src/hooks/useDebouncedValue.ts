import { useEffect, useState } from 'react';

/**
 * Devolve `value` só depois de ele ficar `delayMs` sem mudar. Serve para uma
 * busca no servidor que acompanha a digitação sem disparar uma requisição por
 * tecla: a `queryKey` usa o valor atrasado.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
