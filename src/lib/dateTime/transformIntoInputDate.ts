import type { IDateValueWithTimeStamp } from './types';

/**
 * Converte uma data vinda do backend para o formato aceito por inputs
 * `date` (`YYYY-MM-DD`) ou `datetime-local` (`YYYY-MM-DDTHH:mm`).
 *
 * Segue o modelo "dia de calendário vs instante" de docs/dates.md, agora no sentido
 * de preencher o formulário (a escolha aqui deve casar com a de gravação/exibição):
 * - **Instante** (`hasTimeStamp: true`): converte o timestamp para o fuso local antes de fatiar
 *   ano/mês/dia/hora, para o input mostrar a hora que o usuário espera ver.
 * - **Dia de calendário** (`hasTimeStamp: false`): pega só a parte `YYYY-MM-DD` da string, SEM instanciar
 *   `Date` nem aplicar fuso — evita que o dia "ande" quando o valor está à meia-noite UTC.
 * - `null | undefined` → `""` (deixa o input vazio).
 *
 * @example
 * // Para input datetime-local
 * transformIntoInputDate({
 *   date: '2026-03-31T14:30:00.000Z',
 *   hasTimeStamp: true
 * });
 * // → "2026-03-31T11:30" (dependendo do timezone)
 *
 * @example
 * // Para input date
 * transformIntoInputDate({
 *   date: '2026-03-31T00:00:00.000Z',
 *   hasTimeStamp: false
 * });
 * // → "2026-03-31"
 *
 * @example
 * // Quando não há data
 * transformIntoInputDate({
 *   date: null,
 *   hasTimeStamp: true
 * });
 * // → ""
 */
export function transformIntoInputDate({
  date,
  hasTimeStamp,
}: IDateValueWithTimeStamp) {
  if (!date) return ''; // Retorna string para deixar o input vazio;

  if (hasTimeStamp) {
    const newDate = new Date(date);
    const year = newDate.getFullYear();
    const month = (newDate.getMonth() + 1).toString().padStart(2, '0');
    const day = newDate.getDate().toString().padStart(2, '0');
    const hour = newDate.getHours().toString().padStart(2, '0');
    const minute = newDate.getMinutes().toString().padStart(2, '0');

    return `${year}-${month}-${day}T${hour}:${minute}`;
  }

  const [datePart = ''] = date.split('T');

  return datePart;
}
