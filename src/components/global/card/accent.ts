/**
 * Filete lateral de severidade, opt-in no `Card` (e usado pelo `ConfirmDialog`).
 * Só usa os tokens semânticos do tema (`destructive`, `warning`, `info`,
 * `success`); nenhuma cor nova. `Map` em vez de objeto indexado por variável,
 * para não disparar a regra de object-injection.
 */
export type CardAccent = 'info' | 'success' | 'warning' | 'destructive';

const accentClasses = new Map<CardAccent, string>([
  ['info', 'border-l-4 border-l-info'],
  ['success', 'border-l-4 border-l-success'],
  ['warning', 'border-l-4 border-l-warning'],
  ['destructive', 'border-l-4 border-l-destructive'],
]);

export function cardAccentClass(accent: CardAccent): string {
  return accentClasses.get(accent) ?? '';
}
