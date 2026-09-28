import { useForm } from 'react-hook-form';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { TextArea } from '@/components/global/form/textArea';

describe('TextArea (global)', () => {
  it('renderiza label e aceita digitação em modo uncontrolled', async () => {
    render(
      <TextArea
        id="observations"
        label="Observações"
        placeholder="Descreva..."
      />
    );

    expect(screen.getByText('Observações')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText('Descreva...');
    await userEvent.type(textarea, 'algo');
    expect(textarea).toHaveValue('algo');
  });

  it('exibe description e errors quando fornecidos', () => {
    render(
      <TextArea
        id="bio"
        label="Bio"
        description="Conte um pouco sobre você."
        errors={{ message: 'Campo obrigatório.' }}
      />
    );

    expect(screen.getByText('Conte um pouco sobre você.')).toBeInTheDocument();
    expect(screen.getByText('Campo obrigatório.')).toBeInTheDocument();
  });

  it('integra com react-hook-form em modo controlled', async () => {
    function Harness() {
      const { control, watch } = useForm({
        defaultValues: { notes: '' },
      });
      const notes = watch('notes');

      return (
        <>
          <TextArea
            id="notes"
            name="notes"
            control={control}
            label="Notas"
            placeholder="Escreva..."
          />
          <span data-testid="value">{notes}</span>
        </>
      );
    }

    render(<Harness />);

    await userEvent.type(screen.getByPlaceholderText('Escreva...'), 'oi');
    expect(screen.getByTestId('value')).toHaveTextContent('oi');
  });
});
