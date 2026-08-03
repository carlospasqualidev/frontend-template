import { z } from 'zod';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DecimalField } from '@/components/global/form/decimalField';
import { useZodForm } from '@/lib/forms/useZodForm';

const schema = z.object({
  value: z.number().optional(),
});

function Harness({
  onValid,
  defaultValue,
}: {
  onValid?: (values: { value?: number }) => void;
  defaultValue?: number;
}) {
  const { control, handleSubmit } = useZodForm({
    schema,
    defaultValues: { value: defaultValue },
  });

  return (
    <form onSubmit={handleSubmit((values) => onValid?.(values))}>
      <DecimalField id="value" name="value" control={control} label="Valor" />
      <button type="submit">Enviar</button>
    </form>
  );
}

describe('DecimalField (global) — digitação livre pt-BR', () => {
  it('mantém a vírgula ONDE o usuário digita (sem máscara "centavos")', async () => {
    render(<Harness />);
    const input = screen.getByLabelText('Valor');

    await userEvent.type(input, '0,0003');

    // O texto é exatamente o digitado — nada de reposicionar a vírgula.
    expect(input).toHaveValue('0,0003');
  });

  it('guarda o NÚMERO no formulário (vírgula → decimal)', async () => {
    const onValid = vi.fn();
    render(<Harness onValid={onValid} />);

    await userEvent.type(screen.getByLabelText('Valor'), '0,0003');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(onValid).toHaveBeenCalledWith(
      expect.objectContaining({ value: 0.0003 })
    );
  });

  it('aceita inteiro sem casas decimais', async () => {
    const onValid = vi.fn();
    render(<Harness onValid={onValid} />);

    await userEvent.type(screen.getByLabelText('Valor'), '200');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(screen.getByLabelText('Valor')).toHaveValue('200');
    expect(onValid).toHaveBeenCalledWith(
      expect.objectContaining({ value: 200 })
    );
  });

  it('ponto digitado (teclado numérico) vira vírgula', async () => {
    render(<Harness />);
    const input = screen.getByLabelText('Valor');

    await userEvent.type(input, '1.5');

    expect(input).toHaveValue('1,5');
  });

  it('ignora uma segunda vírgula', async () => {
    render(<Harness />);
    const input = screen.getByLabelText('Valor');

    await userEvent.type(input, '1,2,3');

    expect(input).toHaveValue('1,23');
  });

  it('inicia com o valor do formulário formatado em pt-BR', () => {
    render(<Harness defaultValue={0.0003} />);

    expect(screen.getByLabelText('Valor')).toHaveValue('0,0003');
  });

  // Regressão: com valor carregado (edição), apagar dígito por dígito até o campo
  // ficar vazio fazia o valor INICIAL reaparecer — o `useController` devolve o
  // default do formulário quando o valor é `undefined`, e o campo lia isso como
  // "mudou por fora" e reescrevia o texto.
  it('apagar dígito por dígito esvazia o campo (não ressuscita o valor inicial)', async () => {
    render(<Harness defaultValue={800} />);
    const input = screen.getByLabelText('Valor');

    await userEvent.click(input);
    await userEvent.type(input, '{Backspace}');
    expect(input).toHaveValue('80');
    await userEvent.type(input, '{Backspace}');
    expect(input).toHaveValue('8');
    await userEvent.type(input, '{Backspace}');
    expect(input).toHaveValue('');
  });

  it('limpar o campo guarda undefined (não 0)', async () => {
    const onValid = vi.fn();
    render(<Harness onValid={onValid} defaultValue={5} />);
    const input = screen.getByLabelText('Valor');

    await userEvent.clear(input);
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(input).toHaveValue('');
    expect(onValid).toHaveBeenCalledWith(
      expect.objectContaining({ value: undefined })
    );
  });
});
