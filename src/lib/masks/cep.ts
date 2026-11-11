import { onlyDigits } from '@/lib/masks/onlyDigits';

/** `00000000` → `00000-000` (aplica parcial se incompleto). */
export function formatCep(value: string): string {
  return onlyDigits(value)
    .slice(0, 8)
    .replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}

/** CEP completo: oito dígitos, com ou sem pontuação. */
export function isValidCep(value: string): boolean {
  return onlyDigits(value).length === 8;
}

export const INVALID_CEP = 'Informe o CEP completo, com 8 dígitos.';
