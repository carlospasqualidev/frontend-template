/**
 * Formatação de documentos (exibição). Recebe o valor cru (só dígitos, como o
 * backend guarda) e devolve mascarado. Entrada não-numérica é limpa antes.
 */

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** `00000000000` → `000.000.000-00` (aplica parcial se incompleto). */
export function formatCpf(value: string): string {
  return onlyDigits(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/** `00000000000000` → `00.000.000/0000-00` (aplica parcial se incompleto). */
export function formatCnpj(value: string): string {
  return onlyDigits(value)
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/** Máscara viva de documento: até 11 dígitos formata como CPF; acima, CNPJ. */
export function formatCpfOrCnpj(value: string): string {
  return onlyDigits(value).length <= 11 ? formatCpf(value) : formatCnpj(value);
}
