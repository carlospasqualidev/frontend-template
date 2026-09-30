import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useDebouncedValue', () => {
  it('começa com o valor inicial', () => {
    const { result } = renderHook(() => useDebouncedValue('ana', 300));

    expect(result.current).toBe('ana');
  });

  it('só troca depois do intervalo sem mudança', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'an' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'ana' });
    act(() => vi.advanceTimersByTime(200));

    // Cada tecla reinicia a espera: ainda o valor de antes.
    expect(result.current).toBe('a');

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('ana');
  });
});
