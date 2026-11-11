/** Só os dígitos de um valor mascarado: é o que o formulário guarda e a API recebe. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}
