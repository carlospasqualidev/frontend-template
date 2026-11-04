import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useDataTableQuery } from '@/components/global/dataTable/useDataTableQuery';

describe('useDataTableQuery', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('usa a preferência de itens por página salva já na primeira renderização', () => {
    localStorage.setItem('dataTable:pageSize', '100');

    const { result } = renderHook(() => useDataTableQuery({ pageSize: 25 }));

    expect(result.current.query.pageSize).toBe(100);
    expect(result.current.tableProps.pageSize).toBe(100);
  });

  it('trocar itens por página grava no storage e volta para a primeira página', () => {
    const { result } = renderHook(() => useDataTableQuery());

    act(() => result.current.tableProps.onPageChange(3));
    act(() => result.current.tableProps.onPageSizeChange(50));

    expect(result.current.query.pageSize).toBe(50);
    expect(result.current.query.page).toBe(0);
    expect(localStorage.getItem('dataTable:pageSize')).toBe('50');
  });

  it('inicializa com defaults de página, ordenação e filtros', () => {
    const { result } = renderHook(() => useDataTableQuery());

    expect(result.current.query.page).toBe(0);
    expect(result.current.query.pageSize).toBe(25);
    expect(result.current.query.sort).toEqual([]);
    expect(result.current.query.filters).toEqual({});
  });

  it('respeita defaults customizados', () => {
    const { result } = renderHook(() =>
      useDataTableQuery({
        pageSize: 25,
        defaultSorting: [{ id: 'email', desc: true }],
        defaultFilters: { status: 'active' },
      })
    );

    expect(result.current.query.pageSize).toBe(25);
    expect(result.current.query.sort).toEqual([{ id: 'email', desc: true }]);
    expect(result.current.query.filters).toEqual({ status: 'active' });
  });

  it('atualiza a página via onPageChange', () => {
    const { result } = renderHook(() => useDataTableQuery());

    act(() => {
      result.current.tableProps.onPageChange(3);
    });

    expect(result.current.query.page).toBe(3);
  });

  it('volta para a primeira página ao trocar ordenação', () => {
    const { result } = renderHook(() => useDataTableQuery());

    act(() => {
      result.current.tableProps.onPageChange(5);
    });

    expect(result.current.query.page).toBe(5);

    act(() => {
      result.current.tableProps.onSortingChange([{ id: 'email', desc: false }]);
    });

    expect(result.current.query.page).toBe(0);
    expect(result.current.query.sort).toEqual([{ id: 'email', desc: false }]);
  });

  it('volta para a primeira página ao buscar com novos filtros', () => {
    const { result } = renderHook(() => useDataTableQuery());

    act(() => {
      result.current.tableProps.onPageChange(2);
    });

    act(() => {
      result.current.tableProps.onSearch({ email: 'ana@example.com' });
    });

    expect(result.current.query.page).toBe(0);
    expect(result.current.query.filters).toEqual({
      email: 'ana@example.com',
    });
  });
});
