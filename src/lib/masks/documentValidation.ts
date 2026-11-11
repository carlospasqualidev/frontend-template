import { onlyDigits } from '@/lib/masks/onlyDigits';

/**
 * CPF e CNPJ válidos: comprimento e dígito verificador. O backend continua
 * sendo a autoridade; isto existe para a tela recusar antes de enviar. Aceita
 * com ou sem pontuação.
 */

/** Dígito verificador por soma ponderada, módulo 11; muda só os pesos. */
function checkDigit(digits: number[], weights: number[]): number {
  const sum = digits.reduce(
    (total, digit, index) => total + digit * (weights.at(index) ?? 0),
    0
  );

  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

/** Dígitos todos iguais passam no módulo 11 por coincidência: recusa antes da conta. */
function allEqual(digits: string): boolean {
  return new Set(digits).size === 1;
}

export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value);

  if (digits.length !== 11 || allEqual(digits)) return false;

  const numbers = [...digits].map(Number);
  const base = numbers.slice(0, 9);

  const first = checkDigit(base, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = checkDigit([...base, first], [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);

  return numbers.at(9) === first && numbers.at(10) === second;
}

export function isValidCnpj(value: string): boolean {
  const digits = onlyDigits(value);

  if (digits.length !== 14 || allEqual(digits)) return false;

  const numbers = [...digits].map(Number);
  const base = numbers.slice(0, 12);

  const first = checkDigit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = checkDigit(
    [...base, first],
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  );

  return numbers.at(12) === first && numbers.at(13) === second;
}

export const INVALID_DOCUMENT = {
  cpf: 'Informe um CPF válido, com 11 dígitos.',
  cnpj: 'Informe um CNPJ válido, com 14 dígitos.',
} as const;
