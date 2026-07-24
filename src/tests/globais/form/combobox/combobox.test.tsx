import { z } from 'zod';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Combobox } from '@/components/global/form/combobox';
import { useZodForm } from '@/lib/forms/useZodForm';

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

describe('Combobox (global)', () => {
  it('busca e seleciona uma opção (uncontrolled)', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Combobox label="Item" options={OPTIONS} value="" onValueChange={onValueChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText('Buscar...'), 'bet');

    // A busca filtra: só "Beta" permanece.
    expect(screen.queryByRole('option', { name: 'Alpha' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Beta' }));

    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  it('mostra o rótulo do valor selecionado no gatilho', () => {
    render(<Combobox label="Item" options={OPTIONS} value="c" onValueChange={() => undefined} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Gamma');
  });

  it('integra com useZodForm (controlled) e entrega o valor no submit', async () => {
    const user = userEvent.setup();
    const onValid = vi.fn();
    const schema = z.object({ itemId: z.string().min(1, 'Selecione.') });

    function Harness() {
      const { control, handleSubmit } = useZodForm({ schema, defaultValues: { itemId: '' } });
      return (
        <form onSubmit={handleSubmit((values) => onValid(values))}>
          <Combobox label="Item" name="itemId" control={control} options={OPTIONS} />
          <button type="submit">Enviar</button>
        </form>
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Alpha' }));
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(onValid).toHaveBeenCalledWith(expect.objectContaining({ itemId: 'a' }));
  });
});
