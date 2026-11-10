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
  label = 'Quantidade',
  description,
  grouping,
}: {
  onValid?: (values: { quantity: number }) => void;
  prefix?: string;
  maxDecimals?: number;
  srOnlyLabel?: boolean;
  defaultValue?: number;
  label?: string;
  description?: string;
  grouping?: boolean;
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
        label={label}
        description={description}
        grouping={grouping}
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

const signedSchema = z.object({
  rate: z.number({ error: 'Informe o valor.' }),
});

function SignedHarness({
  onValid,
  allowNegative,
  prefix,
  defaultValue,
}: {
  onValid?: (values: { rate: number }) => void;
  allowNegative?: boolean;
  prefix?: string;
  defaultValue?: number;
}) {
  const { control, handleSubmit } = useZodForm({
    schema: signedSchema,
    defaultValues: { rate: defaultValue },
  });

  return (
    <form onSubmit={handleSubmit((values) => onValid?.(values))}>
      <NumberField
        id="rate"
        name="rate"
        control={control}
        label="Taxa"
        maxDecimals={5}
        prefix={prefix}
        allowNegative={allowNegative}
      />
      <button type="submit">Enviar</button>
    </form>
  );
}

describe('NumberField (global) — allowNegative', () => {
  it('sem allowNegative, o "-" é ignorado (comportamento padrão)', async () => {
    render(<SignedHarness />);
    const input = screen.getByLabelText('Taxa');

    await userEvent.type(input, '-12');

    expect(input).toHaveValue('0,00012');
  });

  it('com allowNegative, "-" antes dos dígitos mascara e guarda número negativo', async () => {
    const onValid = vi.fn();
    render(<SignedHarness allowNegative onValid={onValid} />);
    const input = screen.getByLabelText('Taxa');

    await userEvent.type(input, '-12345');
    expect(input).toHaveValue('-0,12345');

    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(onValid).toHaveBeenCalledWith({ rate: -0.12345 });
  });

  it('negativo com milhar e prefixo põe o sinal antes do prefixo', async () => {
    render(<SignedHarness allowNegative prefix="R$ " defaultValue={-1500.5} />);

    expect(screen.getByLabelText('Taxa')).toHaveValue('-R$ 1.500,50000');
  });

  it('colar valor com sinal mantém o sinal', async () => {
    const user = userEvent.setup();
    const onValid = vi.fn();
    render(<SignedHarness allowNegative onValid={onValid} />);
    const input = screen.getByLabelText('Taxa');

    await user.click(input);
    await user.paste('-1,5');
    expect(input).toHaveValue('-0,00015');

    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(onValid).toHaveBeenCalledWith({ rate: -0.00015 });
  });

  it('"-" isolado vira -0 (sinal pendente) e os dígitos seguintes ficam negativos', async () => {
    const user = userEvent.setup();
    render(<SignedHarness allowNegative />);
    const input = screen.getByLabelText('Taxa');

    await user.type(input, '-');
    expect(input).toHaveValue('-0,00000');
    await user.type(input, '5');
    expect(input).toHaveValue('-0,00005');
  });

  it('apagar o "-" torna o valor positivo', async () => {
    const user = userEvent.setup();
    render(<SignedHarness allowNegative defaultValue={-2.5} />);
    const input = screen.getByLabelText('Taxa');
    expect(input).toHaveValue('-2,50000');

    await user.type(input, '{Delete}', {
      initialSelectionStart: 0,
      initialSelectionEnd: 0,
    });

    expect(input).toHaveValue('2,50000');
  });

  it('apagar dígito a dígito um negativo termina vazio', async () => {
    const user = userEvent.setup();
    render(<SignedHarness allowNegative defaultValue={-0.00001} />);
    const input = screen.getByLabelText('Taxa');
    expect(input).toHaveValue('-0,00001');

    await user.type(input, '{Backspace}');

    expect(input).toHaveValue('');
  });

  it('zero digitado continua válido e sem sinal', async () => {
    const user = userEvent.setup();
    const onValid = vi.fn();
    render(<SignedHarness allowNegative onValid={onValid} />);
    const input = screen.getByLabelText('Taxa');

    await user.type(input, '0');
    expect(input).toHaveValue('0,00000');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(onValid).toHaveBeenCalledWith({ rate: 0 });
  });

  it('"-" digitado no fim ou no meio também torna o valor negativo', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <SignedHarness allowNegative defaultValue={2.5} />
    );
    let input = screen.getByLabelText('Taxa');
    await user.type(input, '-');
    expect(input).toHaveValue('-2,50000');
    unmount();

    render(<SignedHarness allowNegative defaultValue={2.5} />);
    input = screen.getByLabelText('Taxa');
    await user.type(input, '-', {
      initialSelectionStart: 2,
      initialSelectionEnd: 2,
    });
    expect(input).toHaveValue('-2,50000');
  });

  it('colar com o menos tipográfico (U+2212) ou o en-dash (U+2013) vale como sinal', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SignedHarness allowNegative />);
    let input = screen.getByLabelText('Taxa');
    await user.click(input);
    await user.paste('−1,5');
    expect(input).toHaveValue('-0,00015');
    unmount();

    render(<SignedHarness allowNegative />);
    input = screen.getByLabelText('Taxa');
    await user.click(input);
    await user.paste('–1,5');
    expect(input).toHaveValue('-0,00015');
  });

  it('o "-" isolado é enviado e o z.number() o aceita como zero', async () => {
    const user = userEvent.setup();
    const onValid = vi.fn();
    render(<SignedHarness allowNegative onValid={onValid} />);

    await user.type(screen.getByLabelText('Taxa'), '-');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(onValid).toHaveBeenCalledTimes(1);
    // -0 no formulário; no payload (JSON) vira 0.
    expect(JSON.stringify(onValid.mock.calls[0]?.[0])).toBe('{"rate":0}');
  });

  it('inputMode: "decimal" sem a prop, "text" com ela', () => {
    const { unmount } = render(<SignedHarness />);
    expect(screen.getByLabelText('Taxa')).toHaveAttribute(
      'inputmode',
      'decimal'
    );
    unmount();

    render(<SignedHarness allowNegative />);
    expect(screen.getByLabelText('Taxa')).toHaveAttribute('inputmode', 'text');
  });

  it('vazio ainda acusa obrigatório com allowNegative', async () => {
    const user = userEvent.setup();
    render(<SignedHarness allowNegative />);

    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText('Informe o valor.')).toBeInTheDocument();
  });
});

/**
 * **APAGAR ATÉ O ZERO É ESVAZIAR.** Com as casas fixas, o Backspace em "0,00"
 * deixava "0,0" — ainda zero — e a máscara devolvia "0,00": apagar dígito por
 * dígito nunca chegava ao vazio, e quem achava que tinha limpado gravava zero.
 * Digitar zero continua sendo zero.
 */
describe('NumberField (global) — apagar × zero', () => {
  it('Backspace a partir de 0,00 esvazia o campo', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('Quantidade');

    await user.type(input, '0');
    expect(input).toHaveValue('0,00');
    await user.type(input, '{Backspace}');

    expect(input).toHaveValue('');
  });

  it('apagar dígito por dígito um valor carregado termina vazio, não em 0,00', async () => {
    const user = userEvent.setup();
    render(<Harness defaultValue={2} />);
    const input = screen.getByLabelText('Quantidade');

    await user.type(input, '{Backspace}');
    expect(input).toHaveValue('0,20');
    await user.type(input, '{Backspace}');
    expect(input).toHaveValue('0,02');
    await user.type(input, '{Backspace}');

    expect(input).toHaveValue('');
  });

  it('Delete no início de 0,00 também esvazia', async () => {
    const user = userEvent.setup();
    render(<Harness defaultValue={0} />);
    const input = screen.getByLabelText('Quantidade');
    expect(input).toHaveValue('0,00');

    await user.type(input, '{Delete}', {
      initialSelectionStart: 0,
      initialSelectionEnd: 0,
    });

    expect(input).toHaveValue('');
  });

  it('apagar sem chegar a zero mantém o número', async () => {
    const user = userEvent.setup();
    render(<Harness defaultValue={1.5} />);
    const input = screen.getByLabelText('Quantidade');

    await user.type(input, '{Backspace}');

    expect(input).toHaveValue('0,15');
  });

  it('zero DIGITADO continua sendo zero, inclusive por cima de uma seleção', async () => {
    const user = userEvent.setup();
    render(<Harness defaultValue={5} prefix="R$ " />);
    const input = screen.getByLabelText('Quantidade');

    await user.type(input, '0', {
      initialSelectionStart: 0,
      initialSelectionEnd: 'R$ 5,00'.length,
    });

    expect(input).toHaveValue('R$ 0,00');
  });

  it('obrigatório apagado pelo Backspace acusa "vazio" no campo, e não "zero"', async () => {
    const user = userEvent.setup();
    const onValid = vi.fn();
    render(<Harness onValid={onValid} />);
    const input = screen.getByLabelText('Quantidade');

    await user.type(input, '0{Backspace}');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(
      await screen.findByText('Informe uma quantidade.')
    ).toBeInTheDocument();
    expect(onValid).not.toHaveBeenCalled();
  });

  it('obrigatório com zero digitado acusa o zero, e não o vazio', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText('Quantidade'), '0');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(
      await screen.findByText('Informe uma quantidade maior que zero.')
    ).toBeInTheDocument();
  });
});

describe('NumberField (global) — rótulo, descrição e agrupamento', () => {
  it('sem id, o rótulo oculto continua ligado ao input', () => {
    function NoId() {
      const { control } = useZodForm({ schema, defaultValues: {} });
      return (
        <NumberField
          name="quantity"
          control={control}
          label="Quantidade"
          srOnlyLabel
        />
      );
    }
    render(<NoId />);

    expect(screen.getByLabelText('Quantidade')).toBeInTheDocument();
    expect(screen.getByText('Quantidade')).toHaveClass('sr-only');
  });

  it('sem rótulo, não renderiza o <label>', () => {
    const { container } = render(<Harness label="" />);

    expect(container.querySelector('label')).toBeNull();
  });

  it('mostra a descrição abaixo do campo', () => {
    render(<Harness description="Informe a quantidade em unidades." />);

    expect(
      screen.getByText('Informe a quantidade em unidades.')
    ).toBeInTheDocument();
  });

  it('grouping={false} não coloca o separador de milhar', async () => {
    render(<Harness grouping={false} maxDecimals={0} />);
    const input = screen.getByLabelText('Quantidade');

    await userEvent.type(input, '2018');

    expect(input).toHaveValue('2018');
  });
});
