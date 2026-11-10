import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useAsyncOptions,
  type AsyncOption,
} from '@/components/global/form/useAsyncOptions';

interface Deferred {
  promise: Promise<AsyncOption[]>;
  resolve: (value: AsyncOption[]) => void;
}

function defer(): Deferred {
  let resolve: (value: AsyncOption[]) => void = () => undefined;
  const promise = new Promise<AsyncOption[]>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const ALPHA: AsyncOption[] = [{ value: 'a', label: 'Alpha' }];
const BETA: AsyncOption[] = [{ value: 'b', label: 'Beta' }];

describe('useAsyncOptions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('só consulta depois de 300 ms sem digitar e uma vez por pausa', async () => {
    const onSearch = vi.fn().mockResolvedValue(ALPHA);
    const { result } = renderHook(() => useAsyncOptions({ onSearch }));

    act(() => result.current.search('alp'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => result.current.search('alph'));
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(onSearch).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('alph');
    expect(result.current.options).toEqual(ALPHA);
    expect(result.current.loading).toBe(false);
  });

  it('abaixo de minChars limpa a lista e não consulta', async () => {
    const onSearch = vi.fn().mockResolvedValue(ALPHA);
    const { result } = renderHook(() => useAsyncOptions({ onSearch }));

    act(() => result.current.search('alp'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(result.current.options).toEqual(ALPHA);

    act(() => result.current.search('al'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.options).toEqual([]);
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('termo curto invalida a consulta já disparada: a resposta velha não grava', async () => {
    const pending = defer();
    const onSearch = vi.fn().mockReturnValue(pending.promise);
    const { result } = renderHook(() => useAsyncOptions({ onSearch }));

    act(() => result.current.search('alp'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(onSearch).toHaveBeenCalledTimes(1);

    act(() => result.current.search('a'));
    await act(async () => {
      pending.resolve(ALPHA);
      await pending.promise;
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('descarta a resposta de uma busca anterior que chega depois da nova', async () => {
    const first = defer();
    const second = defer();
    const onSearch = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useAsyncOptions({ onSearch }));

    act(() => result.current.search('alp'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    act(() => result.current.search('bet'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    await act(async () => {
      second.resolve(BETA);
      await second.promise;
    });
    await act(async () => {
      first.resolve(ALPHA);
      await first.promise;
    });

    expect(result.current.options).toEqual(BETA);
  });

  it('não consulta se desmontar com o timer pendente', async () => {
    const onSearch = vi.fn().mockResolvedValue(ALPHA);
    const { result, unmount } = renderHook(() => useAsyncOptions({ onSearch }));

    act(() => result.current.search('alp'));
    unmount();
    await vi.advanceTimersByTimeAsync(500);

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('lembra o rótulo visto e o devolve em withSelected mesmo fora do resultado', async () => {
    const onSearch = vi
      .fn()
      .mockResolvedValueOnce(ALPHA)
      .mockResolvedValueOnce(BETA);
    const { result } = renderHook(() => useAsyncOptions({ onSearch }));

    act(() => result.current.search('alp'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    act(() => result.current.search('bet'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.labelOf('a')).toBe('Alpha');
    expect(result.current.labelOf('zzz')).toBe('zzz');
    expect(result.current.withSelected(['a'])).toEqual([
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ]);
    expect(result.current.withSelected(['b'])).toEqual(BETA);
  });

  it('hydrate tenta de novo depois que resolveLabels rejeita', async () => {
    const onSearch = vi.fn().mockResolvedValue([]);
    const resolveLabels = vi
      .fn()
      .mockRejectedValueOnce(new Error('falha'))
      .mockResolvedValueOnce(ALPHA);
    const { result } = renderHook(() =>
      useAsyncOptions({ onSearch, resolveLabels })
    );

    await act(async () => {
      result.current.hydrate(['a']);
      await Promise.resolve();
    });
    await act(async () => {
      result.current.hydrate(['a']);
      await Promise.resolve();
    });

    expect(resolveLabels).toHaveBeenCalledTimes(2);
    expect(result.current.labelOf('a')).toBe('Alpha');
  });

  it('hydrate pergunta uma vez só pelos valores desconhecidos', async () => {
    const onSearch = vi.fn().mockResolvedValue([]);
    const resolveLabels = vi.fn().mockResolvedValue(ALPHA);
    const { result } = renderHook(() =>
      useAsyncOptions({ onSearch, resolveLabels })
    );

    await act(async () => {
      result.current.hydrate(['a']);
      result.current.hydrate(['a']);
      await Promise.resolve();
    });

    expect(resolveLabels).toHaveBeenCalledTimes(1);
    expect(resolveLabels).toHaveBeenCalledWith(['a']);
    expect(result.current.labelOf('a')).toBe('Alpha');

    await act(async () => {
      result.current.hydrate(['a']);
      await Promise.resolve();
    });
    expect(resolveLabels).toHaveBeenCalledTimes(1);
  });
});
