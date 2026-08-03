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
    render(
      <Combobox
        label="Produto"
        options={OPTIONS}
        value=""
        onValueChange={onValueChange}
      />
    );

    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText('Buscar...'), 'bet');

    // A busca filtra: só "Beta" permanece.
    expect(
      screen.queryByRole('option', { name: 'Alpha' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Beta' }));

    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  it('mostra o rótulo do valor selecionado no gatilho', () => {
    render(
      <Combobox
        label="Produto"
        options={OPTIONS}
        value="c"
        onValueChange={() => undefined}
      />
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('Gamma');
  });

  it('srOnlyLabel mantém o rótulo acessível mas oculto visualmente', () => {
    render(
      <Combobox
        label="Produto"
        srOnlyLabel
        options={OPTIONS}
        value=""
        onValueChange={() => undefined}
      />
    );
    const label = screen.getByText('Produto');
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass('sr-only');
  });

  it('clearable exibe o botão de limpar e volta o valor para vazio', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Combobox
        label="Produto"
        options={OPTIONS}
        value="c"
        onValueChange={onValueChange}
        clearable
      />
    );

    await user.click(screen.getByRole('button', { name: 'Limpar seleção' }));
    expect(onValueChange).toHaveBeenCalledWith('');
  });

  it('não exibe o botão de limpar quando não há valor selecionado', () => {
    render(
      <Combobox
        label="Produto"
        options={OPTIONS}
        value=""
        onValueChange={() => undefined}
        clearable
      />
    );
    expect(
      screen.queryByRole('button', { name: 'Limpar seleção' })
    ).not.toBeInTheDocument();
  });

  it('não exibe o botão de limpar quando desabilitado', () => {
    render(
      <Combobox
        label="Produto"
        options={OPTIONS}
        value="c"
        onValueChange={() => undefined}
        clearable
        disabled
      />
    );
    expect(
      screen.queryByRole('button', { name: 'Limpar seleção' })
    ).not.toBeInTheDocument();
  });

  it('integra com useZodForm (controlled) e entrega o valor no submit', async () => {
    const user = userEvent.setup();
    const onValid = vi.fn();
    const schema = z.object({ matrixId: z.string().min(1, 'Selecione.') });

    function Harness() {
      const { control, handleSubmit } = useZodForm({
        schema,
        defaultValues: { matrixId: '' },
      });
      return (
        <form onSubmit={handleSubmit((values) => onValid(values))}>
          <Combobox
            label="Produto"
            name="matrixId"
            control={control}
            options={OPTIONS}
          />
          <button type="submit">Enviar</button>
        </form>
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Alpha' }));
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(onValid).toHaveBeenCalledWith(
      expect.objectContaining({ matrixId: 'a' })
    );
  });
});
