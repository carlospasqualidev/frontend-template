/**
 * Extrai `[ano, mês, dia]` do prefixo `YYYY-MM-DD` de uma string ISO (data ou datetime).
 *
 * Valida o formato e FALHA ALTO quando não é ISO. O antigo `date.substring(0, 10).split('-')`
 * aceitava silenciosamente formatos locais (`31/03/2026`, `2026/03/31`): sem o separador `-`
 * esperado, o `map(Number)` virava `NaN` e gerava um `Invalid Date` que só estourava lá no
 * `toISOString()`, longe da causa. Aqui o erro aparece na origem, com a string problemática.
 *
 * Obs.: valida o FORMATO, não a validade semântica — `2026-13-40` passa no regex e seria
 * normalizado pelo `Date` (rollover). O contrato é receber ISO de input/backend, sempre válido.
 */
function getIsoDateParts(date: string): [number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);

  if (!match) {
    throw new Error(
      `Data em formato inesperado: "${date}". Esperado ISO (YYYY-MM-DD); formatos locais como dd/mm/aaaa não são aceitos.`
    );
  }

  const [, year, month, day] = match;
  return [Number(year), Number(month), Number(day)];
}

/**
 * Lê o dia da string ISO e cria um `Date` na MEIA-NOITE LOCAL desse dia.
 *
 * Usar o construtor `new Date(year, month - 1, day)` (em vez de `new Date(date)`) é proposital:
 * ele não interpreta a string como UTC, então o dia de calendário não desliza pelo fuso. A partir
 * desse ponto, quem chama decide a hora final via `setHours` (local) ou `setUTCHours` (UTC),
 * conforme o destino seja um instante/banco datetime ou um dia de calendário.
 */
export function parseLocalDate(date: string) {
  const [year, month, day] = getIsoDateParts(date);
  return new Date(year, month - 1, day);
}

/**
 * Lê o dia da string ISO e cria um `Date` na MEIA-NOITE UTC desse dia.
 *
 * Espelho de `parseLocalDate` para o caso **dia de calendário**: monta a data direto dos números
 * via `Date.UTC`, sem nunca passar pelo fuso local. Isso garante que o dia não desliza em fusos
 * positivos (a leste de Greenwich) — em UTC+9, por exemplo, a meia-noite local do dia 31 já cai no
 * dia 30 em UTC, e usar `parseLocalDate` + `setUTCHours` gravaria o dia errado.
 */
export function parseUtcDate(date: string) {
  const [year, month, day] = getIsoDateParts(date);
  return new Date(Date.UTC(year, month - 1, day));
}

const CALENDAR_YEARS_BEFORE = 100;
const CALENDAR_YEARS_AFTER = 50;

export interface CalendarMonthBounds {
  startMonth: Date;
  endMonth: Date;
}

/**
 * Faixa navegável do calendário dos campos de data: de janeiro de 100 anos atrás até dezembro de
 * 50 anos à frente do ano de `today`. É ela que monta as opções do seletor de ano.
 */
export function getCalendarMonthBounds(
  today: Date = new Date()
): CalendarMonthBounds {
  const currentYear = today.getFullYear();

  return {
    startMonth: new Date(currentYear - CALENDAR_YEARS_BEFORE, 0, 1),
    endMonth: new Date(currentYear + CALENDAR_YEARS_AFTER, 11, 1),
  };
}
