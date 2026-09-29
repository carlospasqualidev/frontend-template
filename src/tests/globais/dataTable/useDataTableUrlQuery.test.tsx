import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDataTableUrlQuery } from '@/components/global/dataTable/useDataTableUrlQuery';

/**
 * Simula a URL: `useSearch` devolve os params atuais e `navigate` aplica o
 * updater de `search` sobre eles — como o TanStack Router faz. Assim o teste
 * verifica o CONTRATO com a URL (o que entra, o que sai, o que é omitido).
 */
let search: Record<string, unknown> = {};
const navigate = vi.fn((options: { search?: unknown }) => {
  if (typeof options.search === 'function') {
    search = (
      options.search as (
        previous: Record<string, unknown>
      ) => Record<string, unknown>
    )(search);
  }
  return Promise.resolve();
});

vi.mock('@tanstack/react-router', () => ({
  useSearch: () => search,
  useNavigate: () => navigate,
}));

beforeEach(() => {
  search = {};
  navigate.mockClear();
});

describe('useDataTableUrlQuery', () => {
  it('sem params na URL, começa na primeira página sem filtro/ordenação', () => {
    const { result } = renderHook(() => useDataTableUrlQuery());

    expect(result.current.query.page).toBe(0);
    expect(result.current.query.pageSize).toBe(50);
    expect(result.current.query.sort).toEqual([]);
    expect(result.current.query.filters).toEqual({});
  });

  it('lê o estado da URL (recarregar/compartilhar restaura a visão)', () => {
    search = {
      page: 2,
      sort: [{ id: 'name', desc: true }],
      filters: { status: 'active' },
    };

    const { result } = renderHook(() => useDataTableUrlQuery());

    expect(result.current.query.page).toBe(2);
    expect(result.current.query.sort).toEqual([{ id: 'name', desc: true }]);
    expect(result.current.query.filters).toEqual({ status: 'active' });
    // Os campos do cabeçalho de filtros abrem preenchidos com o que está na URL.
    expect(result.current.tableProps.defaultFilterValues).toEqual({
      status: 'active',
    });
  });

  it('mudar de página grava `page` na URL', () => {
    const { result } = renderHook(() => useDataTableUrlQuery());

    act(() => result.current.tableProps.onPageChange(3));

    expect(search.page).toBe(3);
  });

  // URL limpa: valor padrão não polui o link (`page=0` não aparece).
  it('omite os valores padrão para manter a URL curta', () => {
    search = { page: 3 };
    const { result } = renderHook(() => useDataTableUrlQuery());

    act(() => result.current.tableProps.onPageChange(0));

    expect(search.page).toBeUndefined();
  });

  it('buscar grava os filtros e volta para a primeira página', () => {
    search = { page: 4 };
    const { result } = renderHook(() => useDataTableUrlQuery());

    act(() => result.current.tableProps.onSearch?.({ status: 'active' }));

    expect(search.filters).toEqual({ status: 'active' });
    expect(search.page).toBeUndefined();
  });

  it('"Limpar" remove os filtros da URL', () => {
    search = { filters: { status: 'active' } };
    const { result } = renderHook(() => useDataTableUrlQuery());

    act(() => result.current.tableProps.onSearch?.({}));

    expect(search.filters).toBeUndefined();
  });

  it('ordenar grava `sort` na URL', () => {
    const { result } = renderHook(() => useDataTableUrlQuery());

    act(() =>
      result.current.tableProps.onSortingChange?.([
        { id: 'email', desc: false },
      ])
    );

    expect(search.sort).toEqual([{ id: 'email', desc: false }]);
  });

  // O hook não pode engolir params de outras coisas da rota (aba ativa, etc.).
  it('preserva os demais search params da rota', () => {
    search = { tab: 'ativos' };
    const { result } = renderHook(() => useDataTableUrlQuery());

    act(() => result.current.tableProps.onPageChange(2));

    expect(search.tab).toBe('ativos');
    expect(search.page).toBe(2);
  });

  it('semeia os defaults na URL no mount quando ela está vazia', () => {
    renderHook(() =>
      useDataTableUrlQuery({
        defaultSorting: [{ id: 'name', desc: false }],
        defaultFilters: { status: 'active' },
      })
    );

    expect(search.sort).toEqual([{ id: 'name', desc: false }]);
    expect(search.filters).toEqual({ status: 'active' });
  });

  // Regra dura do hook: depois do seed, a URL é a única fonte de verdade — os
  // defaults NÃO podem ressuscitar, senão "Limpar" nunca fica limpo.
  it('não ressuscita os defaults depois de o usuário limpar', async () => {
    const { result, rerender } = renderHook(() =>
      useDataTableUrlQuery({ defaultFilters: { status: 'active' } })
    );
    // Aguarda a navegação que semeia os defaults concluir.
    await act(async () => {});

    act(() => result.current.tableProps.onSearch?.({}));
    // O router re-renderiza a tela com o novo search; aqui isso é explícito
    // porque a URL é um mock (não um estado do React).
    rerender();

    expect(search.filters).toBeUndefined();
    expect(result.current.query.filters).toEqual({});
  });

  it('não sobrescreve o que já está na URL com os defaults', () => {
    search = { filters: { status: 'inactive' } };

    const { result } = renderHook(() =>
      useDataTableUrlQuery({ defaultFilters: { status: 'active' } })
    );

    expect(result.current.query.filters).toEqual({ status: 'inactive' });
  });

  // `keyPrefix` isola duas tabelas na mesma rota (ex.: uma por aba).
  it('com `keyPrefix`, usa chaves próprias na URL', () => {
    const { result } = renderHook(() =>
      useDataTableUrlQuery({ keyPrefix: 'users' })
    );

    act(() => result.current.tableProps.onPageChange(2));

    expect(search.usersPage).toBe(2);
    expect(search.page).toBeUndefined();
  });
});
