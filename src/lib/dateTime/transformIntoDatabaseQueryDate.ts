import type { IDateValueWithTimeStamp } from './types';
import { parseLocalDate, parseUtcDate } from './utils';

interface ITransformIntoDatabaseQueryDate extends IDateValueWithTimeStamp {
  type: 'start' | 'end';
  databaseDateHasTimeStamp?: boolean;
}

/**
 * Converte a data vinda do input para ISO (UTC) usado em FILTROS/BUSCAS via query no backend.
 * Aplica o modelo "dia de calendário vs instante" de docs/dates.md à montagem de intervalos:
 * o `type` ("start"/"end") define se a borda do intervalo é o início ou o fim do dia.
 *
 * A natureza do valor é decidida explicitamente por `hasTimeStamp` (obrigatório). Quem chama
 * sabe se o valor é um instante ou um dia de calendário — não há adivinhação por formato de string.
 *
 * Possibilidades atendidas:
 * - Input com data filtra registros com data
 * - Input com data e hora filtra registros com data e hora
 * - Input com data filtra registros com data e hora
 *
 * Regras:
 * - `hasTimeStamp: true` → **instante**: retorna o momento exato em UTC (`type` é ignorado).
 * - `hasTimeStamp: false` + banco datetime (`databaseDateHasTimeStamp: true`) → borda calculada no fuso local
 *   (`start` = 00:00:00.000 local, `end` = 23:59:59.999 local).
 * - `hasTimeStamp: false` + banco date (`databaseDateHasTimeStamp: false`) → **dia de calendário**: borda calculada em UTC
 *   (`start` = 00:00:00.000Z, `end` = 23:59:59.999Z), para o intervalo cobrir o dia certo sem deslocar pelo fuso.
 *
 * @example
 * // Input date filtrando campo date
 * transformIntoDatabaseQueryDate({
 *   date: '2026-03-31',
 *   type: 'start',
 *   hasTimeStamp: false,
 *   databaseDateHasTimeStamp: false,
 * });
 * // → "2026-03-31T00:00:00.000Z"
 *
 * @example
 * // Input date filtrando campo datetime
 * transformIntoDatabaseQueryDate({
 *   date: '2026-03-31',
 *   type: 'end',
 *   hasTimeStamp: false,
 *   databaseDateHasTimeStamp: true,
 * });
 * // → "2026-04-01T02:59:59.999Z"
 */
export function transformIntoDatabaseQueryDate({
  date,
  type,
  hasTimeStamp,
  databaseDateHasTimeStamp = false,
}: ITransformIntoDatabaseQueryDate) {
  if (!date) return '';

  if (hasTimeStamp) {
    return new Date(date).toISOString();
  }

  if (databaseDateHasTimeStamp) {
    const onlyDate = parseLocalDate(date);

    if (type === 'start') {
      onlyDate.setHours(0, 0, 0, 0);
    }

    if (type === 'end') {
      onlyDate.setHours(23, 59, 59, 999);
    }

    return onlyDate.toISOString();
  }

  // dia de calendário: bordas em UTC construídas direto dos números, sem passar pelo fuso local
  const onlyDate = parseUtcDate(date);

  if (type === 'end') {
    onlyDate.setUTCHours(23, 59, 59, 999);
  }

  return onlyDate.toISOString();
}
