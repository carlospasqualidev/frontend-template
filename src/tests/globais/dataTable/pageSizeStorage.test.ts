import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isPageSizeOption,
  readStoredPageSize,
  writeStoredPageSize,
} from '@/components/global/dataTable/pageSizeStorage';

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('pageSizeStorage', () => {
  it('aceita só 25, 50 e 100', () => {
    expect([10, 25, 50, 100, 200, '25', null].map(isPageSizeOption)).toEqual([
      false,
      true,
      true,
      true,
      false,
      false,
      false,
    ]);
  });

  it('grava e lê na chave global', () => {
    writeStoredPageSize(50);

    expect(localStorage.getItem('dataTable:pageSize')).toBe('50');
    expect(readStoredPageSize()).toBe(50);
  });

  it('não grava valor fora das opções', () => {
    writeStoredPageSize(10);

    expect(localStorage.getItem('dataTable:pageSize')).toBeNull();
  });

  it('valor salvo inválido ou ausente devolve undefined', () => {
    expect(readStoredPageSize()).toBeUndefined();
    localStorage.setItem('dataTable:pageSize', '10');
    expect(readStoredPageSize()).toBeUndefined();
    localStorage.setItem('dataTable:pageSize', 'abc');
    expect(readStoredPageSize()).toBeUndefined();
  });

  it('storage bloqueado não lança', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(readStoredPageSize()).toBeUndefined();
    expect(() => writeStoredPageSize(50)).not.toThrow();
  });
});
