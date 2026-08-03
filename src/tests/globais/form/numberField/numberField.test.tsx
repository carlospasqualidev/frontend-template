import { z } from 'zod';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { NumberField } from '@/components/global/form/numberField';
import { useZodForm } from '@/lib/forms/useZodForm';

const schema = z.object({
  quantity: z
    .number({ error: 'Informe uma quantidade.' })
    .positive('Informe uma quantidade maior que zero.'),
});

function Harness({
  onValid,
  prefix,
  maxDecimals,
  srOnlyLabel,
  defaultValue,
}: {
  onValid?: (values: { quantity: number }) => void;
  prefix?: string;
  maxDecimals?: number;
  srOnlyLabel?: boolean;
  defaultValue?: number;
}) {
  const { control, handleSubmit } = useZodForm({
    schema,
    defaultValues: { quantity: defaultValue },
  });

  return (
    <form onSubmit={handleSubmit((values) => onValid?.(values))}>
      <NumberField
        id="quantity"
        name="quantity"
        control={control}
        label="Quantidade"
        prefix={prefix}
        maxDecimals={maxDecimals}
        srOnlyLabel={srOnlyLabel}
      />
      <button type="submit">Enviar</button>
    </form>
  );
}

describe('NumberField (global) — máscara pt-BR na digitação', () => {
  it('mascara os dígitos como centavos (milhar "." e decimal ",")', async () => {
    render(<Harness />);
    const input = screen.getByLabelText('Quantidade');

    await userEvent.type(input, '150000');

    expect(input).toHaveValue('1.500,00');
  });

  it('guarda o valor NUMÉRICO no formulário (não a string mascarada)', async () => {
    const onValid = vi.fn();
    render(<Harness onValid={onValid} />);

    await userEvent.type(screen.getByLabelText('Quantidade'), '150000');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(onValid).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 1500 })
    );
  });

  it('respeita maxDecimals (5 casas) para taxas/índices', async () => {
    const onValid = vi.fn();
    render(<Harness onValid={onValid} maxDecimals={5} />);
    const input = screen.getByLabelText('Quantidade');

    await userEvent.type(input, '512345');
    expect(input).toHaveValue('5,12345');

    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(onValid).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 5.12345 })
    );
  });

  it('aplica prefixo monetário', async () => {
    render(<Harness prefix="R$ " />);
    const input = screen.getByLabelText('Quantidade');

    await userEvent.type(input, '12345');

    expect(input).toHaveValue('R$ 123,45');
  });

  // Regressão: apagar até o campo ficar vazio, num formulário com valor carregado
  // (edição), fazia o valor INICIAL reaparecer — o `useController` devolve o
  // default do formulário quando o valor é `undefined`.
  it('apagar tudo esvazia o campo (não ressuscita o valor inicial)', async () => {
    render(<Harness defaultValue={800} maxDecimals={0} />);
    const input = screen.getByLabelText('Quantidade');

    await userEvent.clear(input);

    expect(input).toHaveValue('');
  });

  it('usa o zero mascarado como placeholder padrão', () => {
    render(<Harness />);
    expect(screen.getByLabelText('Quantidade')).toHaveAttribute(
      'placeholder',
      '0,00'
    );
  });

  it('placeholder padrão respeita prefixo e casas decimais', () => {
    render(<Harness prefix="R$ " maxDecimals={5} />);
    expect(screen.getByLabelText('Quantidade')).toHaveAttribute(
      'placeholder',
      'R$ 0,00000'
    );
  });

  it('com srOnlyLabel, mantém o rótulo acessível mas oculto visualmente', () => {
    render(<Harness srOnlyLabel />);
    // O input continua acessível pelo rótulo (leitor de tela o encontra)...
    expect(screen.getByLabelText('Quantidade')).toBeInTheDocument();
    // ...mas o rótulo fica visualmente oculto (classe utilitária sr-only).
    expect(screen.getByText('Quantidade')).toHaveClass('sr-only');
  });

  it('exibe erro de validação quando vazio no submit', async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(
      await screen.findByText('Informe uma quantidade.')
    ).toBeInTheDocument();
  });
});
