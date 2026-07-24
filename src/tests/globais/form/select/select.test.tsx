import { z } from 'zod';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Select } from '@/components/global/form/select';
import { useZodForm } from '@/lib/forms/useZodForm';

const OPTIONS = [
  { value: 'AC', label: 'Acre' },
  { value: 'BA', label: 'Bahia' },
  { value: 'SP', label: 'São Paulo' },
];

// Acima do limite (8) a busca liga sozinha.
const LONG_OPTIONS = Array.from({ length: 9 }, (_, index) => ({
  value: `v${index}`,
  label: `Opção ${index + 1}`,
}));

describe('Select (global)', () => {
  describe('modo padrão (Radix)', () => {
    it('renderiza o rótulo e o gatilho', () => {
      render(<Select id="role" label="Papel" options={OPTIONS} />);

      expect(screen.getByText('Papel')).toBeInTheDocument();
      expect(screen.getByLabelText('Papel')).toBeInTheDocument();
    });

    it('com srOnlyLabel, mantém o rótulo acessível mas oculto visualmente', () => {
      render(<Select id="role" label="Papel" srOnlyLabel options={OPTIONS} />);

      // O gatilho continua acessível pelo rótulo (leitor de tela o encontra)...
      expect(screen.getByLabelText('Papel')).toBeInTheDocument();
      // ...mas o rótulo fica visualmente oculto (classe utilitária sr-only).
      expect(screen.getByText('Papel')).toHaveClass('sr-only');
    });

    it('lista curta usa o dropdown do Radix (sem busca automática)', () => {
      render(<Select label="Estado" options={OPTIONS} />);
      expect(screen.getByRole('combobox')).toHaveAttribute(
        'data-slot',
        'select-trigger'
      );
    });
  });

  describe('busca automática', () => {
    it('liga a busca sozinha em listas longas', async () => {
      const user = userEvent.setup();
      render(<Select label="Item" options={LONG_OPTIONS} />);

      // Não é o gatilho do Radix Select — é o núcleo pesquisável.
      expect(screen.getByRole('combobox')).not.toHaveAttribute(
        'data-slot',
        'select-trigger'
      );
      await user.click(screen.getByRole('combobox'));
      expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
    });

    it('`searchable={false}` força o Radix mesmo em lista longa', () => {
      render(<Select label="Item" searchable={false} options={LONG_OPTIONS} />);
      expect(screen.getByRole('combobox')).toHaveAttribute(
        'data-slot',
        'select-trigger'
      );
    });
  });

  describe('modo searchable (explícito)', () => {
    it('associa o rótulo ao gatilho pelo id', () => {
      render(<Select id="state" label="Estado" searchable options={OPTIONS} />);

      expect(screen.getByRole('combobox')).toHaveAttribute('id', 'state');
      expect(screen.getByText('Estado')).toHaveAttribute('for', 'state');
    });

    it('filtra e seleciona uma opção (uncontrolled)', async () => {
      const user = userEvent.setup();
      render(<Select label="Estado" searchable options={OPTIONS} />);

      await user.click(screen.getByRole('combobox'));
      await user.type(screen.getByPlaceholderText('Buscar...'), 'bah');

      // A busca filtra: só "Bahia" permanece.
      expect(
        screen.queryByRole('option', { name: 'Acre' })
      ).not.toBeInTheDocument();
      await user.click(screen.getByRole('option', { name: 'Bahia' }));

      // O rótulo selecionado aparece no gatilho.
      expect(screen.getByRole('combobox')).toHaveTextContent('Bahia');
    });

    it('respeita `disabled` por opção', async () => {
      const user = userEvent.setup();
      render(
        <Select
          label="Estado"
          searchable
          options={[
            { value: 'AC', label: 'Acre' },
            { value: 'BA', label: 'Bahia', disabled: true },
          ]}
        />
      );

      await user.click(screen.getByRole('combobox'));
      expect(screen.getByRole('option', { name: 'Bahia' })).toBeDisabled();
    });

    it('integra com useZodForm (controlled) e entrega o valor no submit', async () => {
      const user = userEvent.setup();
      const onValid = vi.fn();
      const schema = z.object({ state: z.string().min(1, 'Selecione.') });

      function Harness() {
        const { control, handleSubmit } = useZodForm({
          schema,
          defaultValues: { state: '' },
        });
        return (
          <form onSubmit={handleSubmit((values) => onValid(values))}>
            <Select
              label="Estado"
              searchable
              name="state"
              control={control}
              options={OPTIONS}
            />
            <button type="submit">Enviar</button>
          </form>
        );
      }

      render(<Harness />);
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'São Paulo' }));
      await user.click(screen.getByRole('button', { name: 'Enviar' }));

      expect(onValid).toHaveBeenCalledWith(
        expect.objectContaining({ state: 'SP' })
      );
    });
  });
});
