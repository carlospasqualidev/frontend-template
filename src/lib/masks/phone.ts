import { onlyDigits } from '@/lib/masks/onlyDigits';

/**
 * Os dígitos de um telefone brasileiro: DDD + número, no máximo onze.
 *
 * O prefixo sai antes do corte: `+55` (país) e `0` de discagem (mais a
 * operadora de dois dígitos que pode vir depois) só são removidos quando o
 * valor passa de onze dígitos. Com onze ou menos, `55` pode ser o DDD de
 * verdade e nada é removido. O que ainda passar de onze é descartado do fim.
 */
export function normalizePhone(value: string): string {
  let digits = onlyDigits(value);

  if (digits.length > 11 && digits.startsWith('55')) {
    digits = digits.slice(2);
  }

  if (digits.length > 11 && digits.startsWith('0')) {
    digits = digits.slice(1);

    if (digits.length > 11) digits = digits.slice(2);
  }

  return digits.slice(0, 11);
}

/**
 * `(00) 0000-0000` com dez dígitos, `(00) 00000-0000` com onze (aplica parcial
 * se incompleto). A posição do traço só se decide no nono dígito: fixo tem
 * oito depois do DDD, celular tem nove.
 */
export function formatPhone(value: string): string {
  const digits = normalizePhone(value);

  if (digits.length <= 2) return digits;

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (rest.length <= 4) return `(${ddd}) ${rest}`;

  const cutoff = rest.length > 8 ? 5 : 4;

  return `(${ddd}) ${rest.slice(0, cutoff)}-${rest.slice(cutoff)}`;
}

/** Telefone completo: DDD mais oito (fixo) ou nove (celular) dígitos. */
export function isValidPhone(value: string): boolean {
  const digits = onlyDigits(value);
  return digits.length === 10 || digits.length === 11;
}

export const INVALID_PHONE =
  'Informe o telefone com DDD: 10 dígitos para fixo, 11 para celular.';
