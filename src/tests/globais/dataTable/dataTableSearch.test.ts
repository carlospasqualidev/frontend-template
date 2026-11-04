import { describe, expect, it } from 'vitest';

import { validateDataTableSearch } from '@/components/global/dataTable/dataTableSearch';

describe('validateDataTableSearch', () => {
  it('aceita um shape vazio', () => {
    expect(validateDataTableSearch({})).toEqual({});
  });

  it('aceita page como número', () => {
    expect(validateDataTableSearch({ page: 2 })).toEqual({ page: 2 });
  });

  it('aceita sort como array de { id, desc }', () => {
    expect(
      validateDataTableSearch({ sort: [{ id: 'email', desc: true }] })
    ).toEqual({ sort: [{ id: 'email', desc: true }] });
  });

  it('aceita filters como Record<string, string | string[] | { from, to }>', () => {
    const search = {
      filters: {
        email: 'ana@example.com',
        status: ['active', 'pending'],
        period: { from: '2026-01-01', to: '2026-01-31' },
      },
    };

    expect(validateDataTableSearch(search)).toEqual(search);
  });

  it('aceita pageSize só entre as opções e descarta o resto sem perder o demais', () => {
    expect(validateDataTableSearch({ pageSize: 50 })).toEqual({ pageSize: 50 });
    expect(validateDataTableSearch({ page: 2, pageSize: 10 })).toEqual({
      page: 2,
    });
  });

  it('com keyPrefix, valida a chave prefixada de pageSize', () => {
    expect(validateDataTableSearch({ byUserPageSize: 100 }, 'byUser')).toEqual({
      byUserPageSize: 100,
    });
    expect(validateDataTableSearch({ byUserPageSize: 7 }, 'byUser')).toEqual(
      {}
    );
  });

  it('reverte para vazio se a URL contém algo inválido', () => {
    expect(validateDataTableSearch({ page: 'abc' })).toEqual({});
    expect(validateDataTableSearch({ sort: 'invalid' })).toEqual({});
  });
});
