/**
 * Helpers puros de data para o componente `DateField`.
 *
 * Lida com dois formatos:
 * - "form" (ISO curto): `aaaa-mm-dd`
 * - "display" (pt-BR): `dd/mm/aaaa`
 *
 * Mantidos fora do componente para serem testáveis isoladamente.
 */
export const FORM_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const DISPLAY_DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;

export function createDateFromParts(day: string, month: string, year: string) {
  const parsedDay = Number(day);
  const parsedMonth = Number(month);
  const parsedYear = Number(year);

  if (
    !Number.isInteger(parsedDay) ||
    !Number.isInteger(parsedMonth) ||
    !Number.isInteger(parsedYear)
  ) {
    return undefined;
  }

  const date = new Date(parsedYear, parsedMonth - 1, parsedDay);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== parsedYear ||
    date.getMonth() !== parsedMonth - 1 ||
    date.getDate() !== parsedDay
  ) {
    return undefined;
  }

  return date;
}

export function formatDateForForm(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatDateForDisplay(date: Date) {
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function parseDateValue(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  if (FORM_DATE_PATTERN.test(value)) {
    const [year, month, day] = value.split('-');
    return createDateFromParts(day, month, year);
  }

  if (DISPLAY_DATE_PATTERN.test(value)) {
    const [day, month, year] = value.split('/');
    return createDateFromParts(day, month, year);
  }

  return undefined;
}

export function formatDisplayValue(value: string | undefined) {
  const parsedDate = parseDateValue(value);

  if (parsedDate) {
    return formatDateForDisplay(parsedDate);
  }

  return value ?? '';
}

export function clampDateSegment(value: string, max: number) {
  if (value.length < 2) {
    return value;
  }

  return `${Math.min(Number(value), max)}`.padStart(2, '0');
}

export function maskDisplayValue(
  value: string,
  options?: { shouldAutoStartYear?: boolean }
) {
  const shouldAutoStartYear = options?.shouldAutoStartYear ?? true;
  const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return `${clampDateSegment(day, 31)}/${clampDateSegment(month, 12)}/${year}`;
  }

  const sanitizedWithSeparators = value.replace(/[^\d/]/g, '');
  const hasSeparators = sanitizedWithSeparators.includes('/');

  if (hasSeparators) {
    const segments = sanitizedWithSeparators.split('/').slice(0, 3);
    const [rawDay = '', rawMonth = '', rawYear = ''] = segments;

    const day = clampDateSegment(rawDay.slice(0, 2), 31);
    const month = clampDateSegment(rawMonth.slice(0, 2), 12);
    // Dígito que passa do tamanho do mês SEGUE para o ano em vez de ser
    // descartado. É o que acontece quando o caret está no fim e o ano ainda não
    // começou: o dígito cai no fim do segmento do mês.
    const year = `${rawMonth.slice(2)}${rawYear}`.slice(0, 4);

    let nextValue = day;
    const hasMonthPart =
      segments.length > 1 || sanitizedWithSeparators.endsWith('/');
    const shouldStartYearPart =
      shouldAutoStartYear &&
      day.length === 2 &&
      month.length === 2 &&
      year.length === 0;
    // Barra digitada em cima da que a máscara já inseriu (`28/07/` + `/`): o ano
    // continua começado. Sem isso a barra era removida, o dígito seguinte caía no
    // fim do mês e — antes do carry acima — era engolido.
    const hasYearSeparator =
      sanitizedWithSeparators.endsWith('/') && segments.length > 2;
    const hasYearPart =
      year.length > 0 || shouldStartYearPart || hasYearSeparator;

    if (hasMonthPart) {
      nextValue = `${nextValue}/${month}`;
    }

    if (hasYearPart) {
      nextValue = `${nextValue}/${year}`;
    }

    return nextValue;
  }

  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (!digits) {
    return '';
  }

  const day = clampDateSegment(digits.slice(0, 2), 31);
  const month = clampDateSegment(digits.slice(2, 4), 12);
  const year = digits.slice(4, 8);

  return [day, month, year].filter(Boolean).join('/');
}

export function parseDisplayValueToFormValue(value: string) {
  const parsedDate = parseDateValue(value);

  if (!parsedDate) {
    return undefined;
  }

  return formatDateForForm(parsedDate);
}

export function resolveDateInMonth(monthDate: Date, preferredDay: number) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const maxDay = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(Math.max(preferredDay, 1), maxDay);

  return new Date(year, month, safeDay);
}
