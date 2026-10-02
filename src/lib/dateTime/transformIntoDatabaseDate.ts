import type { IDateValueWithTimeStamp } from './types';
import { parseLocalDate, parseUtcDate } from './utils';

interface ITransformIntoDatabaseDate extends IDateValueWithTimeStamp {
  databaseDateHasTimeStamp?: boolean;
}

/**
 * Converte a data vinda do input para ISO (UTC) usado ao PERSISTIR via body no backend.
 * Contraparte de gravação do modelo "dia de calendário vs instante" de docs/dates.md:
 * a mesma decisão tomada aqui é a que governa, depois, como exibir o valor (`dateFormatter`).
 *
 * A natureza do valor é decidida explicitamente por `hasTimeStamp` (obrigatório). Quem chama
 * sabe se o valor é um instante ou um dia de calendário — não há adivinhação por formato de string.
 *
 * Regras:
 * - `hasTimeStamp: true` → **instante**: salva o momento exato em UTC, respeitando o fuso local de origem.
 * - `hasTimeStamp: false` + banco datetime (`databaseDateHasTimeStamp: true`) → meia-noite no fuso local.
 * - `hasTimeStamp: false` + banco date (`databaseDateHasTimeStamp: false`) → **dia de calendário**: meia-noite UTC.
 *   Salvar assim é o que permite exibir depois com `dateFormatter({ hasTimeStamp: false })` sem o dia "andar".
 *
 * @example
 * // Input date salvando em campo date
 * transformIntoDatabaseDate({
 *   date: '2026-03-31',
 *   hasTimeStamp: false,
 *   databaseDateHasTimeStamp: false,
 * });
 * // → "2026-03-31T00:00:00.000Z"
 *
 * @example
 * // Input datetime-local salvando em campo datetime
 * transformIntoDatabaseDate({
 *   date: '2026-03-31T14:30',
 *   hasTimeStamp: true,
 * });
 * // → "2026-03-31T17:30:00.000Z"
 *
 * @example
 * // Input date salvando em campo datetime
 * transformIntoDatabaseDate({
 *   date: '2026-03-31',
 *   hasTimeStamp: false,
 *   databaseDateHasTimeStamp: true,
 * });
 * // → "2026-03-31T03:00:00.000Z"
 *
 * @example
 * // String ISO do backend, tratada explicitamente como dia de calendário
 * transformIntoDatabaseDate({
 *   date: '2026-03-31T00:00:00.000Z',
 *   hasTimeStamp: false,
 *   databaseDateHasTimeStamp: false,
 * });
 * // → "2026-03-31T00:00:00.000Z"
 */
export function transformIntoDatabaseDate({
  date,
  hasTimeStamp,
  databaseDateHasTimeStamp = false,
}: ITransformIntoDatabaseDate) {
  if (!date) return null;

  if (hasTimeStamp) {
    return new Date(date).toISOString();
  }

  if (databaseDateHasTimeStamp) {
    const onlyDate = parseLocalDate(date);
    onlyDate.setHours(0, 0, 0, 0);
    return onlyDate.toISOString();
  }

  // dia de calendário: meia-noite UTC construída direto dos números, sem passar pelo fuso local
  return parseUtcDate(date).toISOString();
}
