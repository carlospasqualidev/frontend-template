import { describe, expect, it } from 'vitest';

import { dateFormatter } from '@/lib/dateTime/dateFormatter';
import { transformIntoDatabaseDate } from '@/lib/dateTime/transformIntoDatabaseDate';
import { transformIntoDatabaseQueryDate } from '@/lib/dateTime/transformIntoDatabaseQueryDate';
import { transformIntoInputDate } from '@/lib/dateTime/transformIntoInputDate';
import { getCalendarMonthBounds } from '@/lib/dateTime/utils';

describe('getCalendarMonthBounds', () => {
  it('vai de janeiro de 100 anos atrás a dezembro de 50 anos à frente do ano de hoje', () => {
    const { startMonth, endMonth } = getCalendarMonthBounds(
      new Date(2026, 9, 1)
    );

    expect(startMonth).toEqual(new Date(1926, 0, 1));
    expect(endMonth).toEqual(new Date(2076, 11, 1));
  });

  it('acompanha o ano corrente quando não recebe data', () => {
    const currentYear = new Date().getFullYear();
    const { startMonth, endMonth } = getCalendarMonthBounds();

    expect(startMonth.getFullYear()).toBe(currentYear - 100);
    expect(endMonth.getFullYear()).toBe(currentYear + 50);
  });
});

describe('dateFormatter', () => {
  it('retorna "-" para data vazia', () => {
    expect(dateFormatter({ date: null, hasTimeStamp: false })).toBe('-');
    expect(dateFormatter({ date: undefined, hasTimeStamp: false })).toBe('-');
  });

  it('força UTC quando hasTimeStamp=false (evita deslocar de dia)', () => {
    // Backend manda meia-noite UTC; sem forçar UTC, o navegador rebateria
    // para o dia anterior em fusos negativos.
    expect(
      dateFormatter({
        date: '2026-03-31T00:00:00Z',
        hasTimeStamp: false,
      })
    ).toMatch(/31\/03\/2026/);
  });
});

describe('transformIntoInputDate', () => {
  it('retorna string vazia quando não há data', () => {
    expect(transformIntoInputDate({ date: null, hasTimeStamp: true })).toBe('');
  });

  it('mantém apenas a parte de data quando hasTimeStamp=false', () => {
    expect(
      transformIntoInputDate({
        date: '2026-03-31T00:00:00.000Z',
        hasTimeStamp: false,
      })
    ).toBe('2026-03-31');
  });
});

describe('transformIntoDatabaseDate', () => {
  it('retorna null para data vazia', () => {
    expect(
      transformIntoDatabaseDate({ date: null, hasTimeStamp: false })
    ).toBeNull();
  });

  it('preserva instante exato quando hasTimeStamp=true', () => {
    expect(
      transformIntoDatabaseDate({
        date: '2026-03-31T14:30:00.000Z',
        hasTimeStamp: true,
      })
    ).toBe('2026-03-31T14:30:00.000Z');
  });

  it('para input só-data com banco só-data: meia-noite UTC', () => {
    expect(
      transformIntoDatabaseDate({
        date: '2026-03-31',
        hasTimeStamp: false,
        databaseDateHasTimeStamp: false,
      })
    ).toBe('2026-03-31T00:00:00.000Z');
  });
});

describe('transformIntoDatabaseQueryDate', () => {
  it('retorna string vazia para data vazia', () => {
    expect(
      transformIntoDatabaseQueryDate({
        date: null,
        type: 'start',
        hasTimeStamp: false,
      })
    ).toBe('');
  });

  it('para input só-data e banco só-data: bordas em UTC (start 00:00, end 23:59)', () => {
    expect(
      transformIntoDatabaseQueryDate({
        date: '2026-03-31',
        type: 'start',
        hasTimeStamp: false,
        databaseDateHasTimeStamp: false,
      })
    ).toBe('2026-03-31T00:00:00.000Z');

    expect(
      transformIntoDatabaseQueryDate({
        date: '2026-03-31',
        type: 'end',
        hasTimeStamp: false,
        databaseDateHasTimeStamp: false,
      })
    ).toBe('2026-03-31T23:59:59.999Z');
  });

  it('preserva instante exato e ignora o type quando hasTimeStamp=true', () => {
    expect(
      transformIntoDatabaseQueryDate({
        date: '2026-03-31T14:30:00.000Z',
        type: 'end',
        hasTimeStamp: true,
      })
    ).toBe('2026-03-31T14:30:00.000Z');
  });
});
