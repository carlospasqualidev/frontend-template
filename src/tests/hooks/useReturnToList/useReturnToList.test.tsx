import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useReturnToList } from '@/hooks/useReturnToList';
import { rememberSearch } from '@/lib/navigation/searchMemory';

const navigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}));

beforeEach(() => {
  navigate.mockClear();
});

describe('useReturnToList', () => {
  it('volta para a listagem reaplicando os filtros lembrados', () => {
    rememberSearch('/users', { filters: 'status:active', page: 2 });

    const { result } = renderHook(() => useReturnToList('/users'));
    result.current();

    expect(navigate).toHaveBeenCalledWith({
      to: '/users',
      search: { filters: 'status:active', page: 2 },
      ignoreBlocker: true,
    });
  });

  // Deep link/F5 direto no detalhe: a memória reinicia no reload, então a
  // listagem abre limpa e a URL volta a ser a fonte de verdade.
  it('abre a listagem sem filtro quando não há search lembrado', () => {
    const { result } = renderHook(() => useReturnToList('/audit-logs'));
    result.current();

    expect(navigate).toHaveBeenCalledWith({
      to: '/audit-logs',
      search: {},
      ignoreBlocker: true,
    });
  });

  // O search é lido no MOMENTO do retorno, não na renderização do hook: entre
  // montar a tela de detalhe e salvar, o usuário pode ter mudado a lista.
  it('lê o search no momento da chamada, não na renderização', () => {
    rememberSearch('/users', { page: 1 });
    const { result } = renderHook(() => useReturnToList('/users'));

    rememberSearch('/users', { page: 5 });
    result.current();

    expect(navigate).toHaveBeenCalledWith({
      to: '/users',
      search: { page: 5 },
      ignoreBlocker: true,
    });
  });

  it('normaliza a barra final do caminho ao consultar a memória', () => {
    rememberSearch('/settings', { tab: 'geral' });

    const { result } = renderHook(() => useReturnToList('/settings/'));
    result.current();

    expect(navigate).toHaveBeenCalledWith({
      to: '/settings/',
      search: { tab: 'geral' },
      ignoreBlocker: true,
    });
  });

  // O retorno é uma saída que a tela pediu (salvou, criou, excluiu, cancelou):
  // não passa pelo guard de edição não salva.
  it('não passa pelo guard de edição não salva', () => {
    const { result } = renderHook(() => useReturnToList('/roles'));
    result.current();

    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/roles', ignoreBlocker: true })
    );
  });

  it('mantém a identidade do callback entre renders (não invalida memo do consumidor)', () => {
    const { result, rerender } = renderHook(() => useReturnToList('/users'));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
