/** `00000000` → `00000-000` (aplica parcial se incompleto). */
export function formatCep(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}
