import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { useZodForm } from '@/lib/forms/useZodForm';

const schema = z.object({ name: z.string().min(1) });

function renderForm(name: string) {
  return renderHook(() => useZodForm({ schema, defaultValues: { name } }));
}

// A trava solta numa tarefa seguinte, depois de a tela renderizar o `loading`.
const nextTask = (): Promise<void> =>
  act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

describe('useZodForm, trava do envio duplo', () => {
  it('dois envios seguidos chamam o callback uma vez', async () => {
    const onValid = vi.fn();
    const { result } = renderForm('Maria');

    await act(async () => {
      const submit = result.current.handleSubmit(onValid);
      await Promise.all([submit(), submit()]);
    });

    expect(onValid).toHaveBeenCalledTimes(1);
  });

  it('o envio ignorado cancela o submit nativo do formulário', async () => {
    const { result } = renderForm('Maria');
    const preventDefault = vi.fn();
    const event = { preventDefault, persist: vi.fn() };

    await act(async () => {
      const submit = result.current.handleSubmit(vi.fn());
      await Promise.all([submit(), submit(event as never)]);
    });

    expect(preventDefault).toHaveBeenCalled();
  });

  it('depois de terminar, um novo envio funciona', async () => {
    const onValid = vi.fn();
    const { result } = renderForm('Maria');

    await act(() => result.current.handleSubmit(onValid)());
    await nextTask();
    await act(() => result.current.handleSubmit(onValid)());

    expect(onValid).toHaveBeenCalledTimes(2);
  });

  it('validação reprovada solta a trava', async () => {
    const onValid = vi.fn();
    const onInvalid = vi.fn();
    const { result } = renderForm('');

    await act(() => result.current.handleSubmit(onValid, onInvalid)());
    expect(onInvalid).toHaveBeenCalledTimes(1);

    act(() => result.current.setValue('name', 'Maria'));
    await nextTask();
    await act(() => result.current.handleSubmit(onValid, onInvalid)());

    expect(onValid).toHaveBeenCalledTimes(1);
  });

  it('callback que lança solta a trava', async () => {
    const onValid = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('falhou');
      })
      .mockImplementation(() => undefined);
    const { result } = renderForm('Maria');

    await act(async () => {
      await expect(result.current.handleSubmit(onValid)()).rejects.toThrow(
        'falhou'
      );
    });
    await nextTask();
    await act(() => result.current.handleSubmit(onValid)());

    expect(onValid).toHaveBeenCalledTimes(2);
  });
});
