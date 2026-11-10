/** Nome acessível de um controle indisponível: "rótulo: motivo" (só o rótulo sem motivo). */
export function disabledName(label: string, reason?: string): string {
  return reason ? `${label}: ${reason}` : label;
}
