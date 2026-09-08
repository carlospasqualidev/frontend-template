import { z } from 'zod';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DateTimeField } from '@/components/global/form/dateTimeField';
import { Modal } from '@/components/global/modal/modal';
import { useZodForm } from '@/lib/forms/useZodForm';

const schema = z.object({
  dateTime: z.string().min(1, 'Informe a data e hora.'),
});

/**
 * Espelha o uso real num formulário: campo obrigatório, SEM
 * `defaultValues` para ele (nasce `undefined`).
 */
function Harness({
  onValid,
}: {
  onValid?: (values: { dateTime: string }) => void;
}) {
  const { control, handleSubmit } = useZodForm({ schema });

  return (
    <form onSubmit={handleSubmit((values) => onValid?.(values))}>
      <DateTimeField
        id="dateTime"
        name="dateTime"
        control={control}
        label="Data e hora"
      />
      {/* Campo vizinho: destino de foco FORA do DateTimeField (sair do campo de verdade). */}
      <label htmlFor="outside">Outro campo</label>
      <input id="outside" />
      <button type="submit">Enviar</button>
    </form>
  );
}

describe('DateTimeField (global) — botão "Definir horário atual"', () => {
  it('preenche a data e hora atual na PRIMEIRA vez, sem exibir erro de validação', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(
      screen.getByRole('button', { name: 'Definir horário atual' })
    );

    const input = screen.getByLabelText<HTMLInputElement>('Data e hora');

    // O campo tem que ficar preenchido no formato pt-BR...
    expect(input.value).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    // ...e NENHUM erro pode aparecer: o valor foi informado no mesmo clique.
    expect(screen.queryByText(/Informe a data e hora/)).not.toBeInTheDocument();
    expect(screen.queryByText(/expected string/i)).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('com o input FOCADO, o clique no botão não deixa erro (blur do input roda antes do clique)', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = screen.getByLabelText<HTMLInputElement>('Data e hora');

    // O Modal dá autofocus no primeiro campo, então no app real o input está
    // focado quando o usuário clica no relógio — o blur dispara antes do clique.
    await user.click(input);
    await user.click(
      screen.getByRole('button', { name: 'Definir horário atual' })
    );

    expect(input.value).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    expect(screen.queryByText(/expected string/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Informe a data e hora/)).not.toBeInTheDocument();
    // O botão é adorno do input: não pode roubar o foco, senão o blur do input
    // valida o campo AINDA vazio e pisca o erro de obrigatório.
    expect(input).toHaveFocus();
  });

  it('com o input FOCADO, abrir o calendário não acusa erro de campo vazio', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByLabelText('Data e hora'));
    await user.click(
      screen.getByRole('button', { name: 'Abrir calendário e horário' })
    );

    expect(screen.queryByText(/expected string/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Informe a data e hora/)).not.toBeInTheDocument();
  });

  it('entrega o valor no submit após um único clique no botão', async () => {
    const user = userEvent.setup();
    const onValid = vi.fn();
    render(<Harness onValid={onValid} />);

    await user.click(
      screen.getByRole('button', { name: 'Definir horário atual' })
    );
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(onValid).toHaveBeenCalledWith(
      expect.objectContaining({
        dateTime: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
      })
    );
  });

  it('mantém o campo válido ao clicar no botão uma segunda vez', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const button = screen.getByRole('button', {
      name: 'Definir horário atual',
    });
    await user.click(button);
    await user.click(button);

    expect(screen.queryByText(/Informe a data e hora/)).not.toBeInTheDocument();
    expect(screen.queryByText(/expected string/i)).not.toBeInTheDocument();
  });

  it('ainda acusa erro ao SAIR do campo em branco (foco vai para fora do campo)', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByLabelText('Data e hora'));
    await user.click(screen.getByLabelText('Outro campo'));

    expect(
      await screen.findByText(/Informe a data e hora|expected string/i)
    ).toBeInTheDocument();
  });

  it('NÃO valida ao tabular do input para os botões do próprio campo', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByLabelText('Data e hora'));
    await user.tab(); // "Definir horário atual" — ainda dentro do campo

    expect(
      screen.getByRole('button', { name: 'Definir horário atual' })
    ).toHaveFocus();
    expect(
      screen.queryByText(/Informe a data e hora|expected string/i)
    ).not.toBeInTheDocument();
  });

  it('limpar o campo preenchido volta a acusar o erro de obrigatório', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(
      screen.getByRole('button', { name: 'Definir horário atual' })
    );
    await user.click(
      screen.getByRole('button', { name: 'Limpar data e horário' })
    );

    expect(
      await screen.findByText(/Informe a data e hora|expected string/i)
    ).toBeInTheDocument();
  });
});

describe('DateTimeField — camadas e portal dentro de Modal', () => {
  // Mesma regressão do `DateField`: dentro de um `Modal` o popover não portala
  // (fica dentro do dialog) e, no eixo z, `--z-floating` > `--z-overlay`.
  it('renderiza o calendário DENTRO do dialog do modal (não portala para o body)', async () => {
    const user = userEvent.setup();
    render(
      <Modal
        open
        setOpen={() => undefined}
        title="Agendar coleta"
        description="Descrição"
      >
        <DateTimeField id="coleta" label="Data e hora" />
      </Modal>
    );

    const modal = screen.getByRole('dialog', { name: 'Agendar coleta' });
    await user.click(
      within(modal).getByRole('button', { name: 'Abrir calendário e horário' })
    );

    expect(await within(modal).findByRole('grid')).toBeInTheDocument();
  });
});
