import { describe, expect, it } from 'vitest';

import { dateRangeParams, listParam, textParam } from '@/lib/listQueryParams';

describe('textParam', () => {
  it('repassa o texto e descarta o vazio e o que não é texto', () => {
    expect(textParam('maria')).toBe('maria');
    expect(textParam('')).toBeUndefined();
    expect(textParam(['maria'])).toBeUndefined();
    expect(textParam(undefined)).toBeUndefined();
  });
});

describe('listParam', () => {
  it('junta a escolha múltipla em `a,b,c`', () => {
    expect(listParam(['a', 'b', 'c'])).toBe('a,b,c');
  });

  it('aceita um valor único e descarta lista vazia ou só com vazios', () => {
    expect(listParam('a')).toBe('a');
    expect(listParam([])).toBeUndefined();
    expect(listParam([''])).toBeUndefined();
  });
});

describe('dateRangeParams', () => {
  it('manda o início do primeiro dia e o fim do último, do fuso local, em UTC', () => {
    expect(dateRangeParams({ from: '2026-09-01', to: '2026-09-30' })).toEqual({
      from: new Date(2026, 8, 1, 0, 0, 0, 0).toISOString(),
      to: new Date(2026, 8, 30, 23, 59, 59, 999).toISOString(),
    });
  });

  it('aceita uma borda só e nada sem intervalo', () => {
    expect(
      dateRangeParams({ from: '', to: '2026-09-30' }).from
    ).toBeUndefined();
    expect(dateRangeParams(undefined)).toEqual({
      from: undefined,
      to: undefined,
    });
  });
});
