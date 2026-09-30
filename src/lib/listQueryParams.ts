import { type DateRangeValue } from '@/components/global/dataTable/filters';
import { transformIntoDatabaseQueryDate } from '@/lib/dateTime/transformIntoDatabaseQueryDate';

/*
 * Tradução dos valores de filtro da `DataTable` (o que fica na URL) para os
 * parâmetros de query das listagens do backend. Valor vazio vira `undefined`,
 * para não ir na query.
 */

/** Filtro de texto ou de escolha única (`textFilter`, `selectFilter`). */
export function textParam(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

/** Filtro de múltipla escolha (array) em `a,b,c`, o formato das listagens. */
export function listParam(value: unknown): string | undefined {
  if (Array.isArray(value) && value.length > 0) {
    const joined = value.filter(Boolean).join(',');
    return joined || undefined;
  }
  return textParam(value);
}

function toRange(value: unknown): DateRangeValue {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as DateRangeValue)
    : { from: '', to: '' };
}

function toBound(date: string, type: 'start' | 'end'): string | undefined {
  if (!date) return undefined;
  return (
    transformIntoDatabaseQueryDate({
      date,
      type,
      hasTimeStamp: false,
      databaseDateHasTimeStamp: true,
    }) || undefined
  );
}

/**
 * Intervalo de datas (`dateRangeFilter`, dias escolhidos na tela) filtrando um
 * instante gravado no backend: o início do primeiro dia e o fim do último, no
 * fuso de quem usa, em ISO 8601 UTC (bordas inclusivas).
 */
export function dateRangeParams(value: unknown): {
  from?: string;
  to?: string;
} {
  const range = toRange(value);
  return { from: toBound(range.from, 'start'), to: toBound(range.to, 'end') };
}
