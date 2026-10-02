import type { IDateFormatterValue } from './types';

/**
 * Formata datas para EXIBIÇÃO, escolhendo o tratamento de fuso conforme a
 * natureza do valor persistido (ver "Manipulação de Datas" em docs/dates.md).
 *
 * Esta é a única função de exibição da pasta. Ela cobre, via flags, os três
 * casos que o docs/dates.md descreve separadamente:
 * - `hasTimeStamp: false`                  → equivale a `dateFormatter`           (dia de calendário, sem fuso)
 * - `hasTimeStamp: true, showHours: false` → equivale a `localDateFormatter`      (instante, só data, fuso local)
 * - `hasTimeStamp: true, showHours: true`  → equivale a `localDateTimeFormatter`  (instante, data + hora, fuso local)
 *
 * Como escolher a flag (a regra é a natureza do dado, não "quero ver a hora"):
 * - **Dia de calendário** — valor salvo SEM hora útil (`transformIntoDatabaseDate({ hasTimeStamp: false })`
 *   ou conceitualmente um dia: nascimento, competência, vencimento, recebimento). Use `hasTimeStamp: false`:
 *   a data é forçada para UTC, evitando que o dia "ande" para frente/trás na virada da meia-noite.
 * - **Instante** — timestamp real (`createdAt`/`updatedAt` do banco ou enviado com
 *   `transformIntoDatabaseDate({ hasTimeStamp: true })`). Use `hasTimeStamp: true`: a data é exibida
 *   respeitando o fuso local do usuário.
 *
 * ⚠️ Anti-pattern: usar `hasTimeStamp: true` num valor salvo como dia de calendário (meia-noite UTC).
 * Aplicar o fuso local nesse caso pode exibir o dia anterior/seguinte.
 *
 * @param params.date Data a ser formatada
 * @param params.hasTimeStamp `false` para dia de calendário (sem fuso); `true` para instante (fuso local)
 * @param params.showHours Quando `hasTimeStamp` for `true`, define se a hora deve ser exibida
 *
 * @returns Data formatada ou '-' se não informada
 *
 * @example
 * // Dia de calendário (salvo com hasTimeStamp:false, à meia-noite UTC)
 * dateFormatter({
 *   date: '2026-03-31T00:00:00Z',
 *   hasTimeStamp: false,
 * });
 * // → "31/03/2026"
 * // (força UTC para não virar 30/03 por causa do fuso)
 *
 * @example
 * // Instante, exibindo data + hora no fuso local
 * dateFormatter({
 *   date: '2026-03-31T14:35:20Z',
 *   hasTimeStamp: true,
 *   showHours: true,
 * });
 * // → "31/03/2026 11:35" (exemplo em UTC-3)
 *
 * @example
 * // Instante, mas exibindo só a data (ainda no fuso local)
 * dateFormatter({
 *   date: '2026-03-31T14:35:20Z',
 *   hasTimeStamp: true,
 *   showHours: false,
 * });
 * // → "31/03/2026"
 *
 * @example
 * // Dia de calendário sem timezone explícito (YYYY-MM-DD)
 * dateFormatter({
 *   date: '2026-03-31',
 *   hasTimeStamp: false,
 * });
 * // → "31/03/2026"
 *
 * @example
 * // Sem data
 * dateFormatter({
 *   date: null,
 *   hasTimeStamp: false,
 * });
 * // → "-"
 */
export function dateFormatter({
  date,
  hasTimeStamp,
  showHours,
}: IDateFormatterValue) {
  if (!date) return '-';

  const d = new Date(date);

  // feito separado pra garantir que o navegador exiba corretamente
  if (hasTimeStamp) {
    if (!showHours) {
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    }

    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return d.toLocaleDateString(undefined, {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
