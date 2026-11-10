import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { Checkbox } from '@/components/global/form/checkbox';

type Form = { terms: boolean };

function ControlledCheckbox({
  defaultValues = { terms: false },
  onValues,
}: {
  defaultValues?: Form;
  onValues?: (values: Form) => void;
}) {
  const { control, handleSubmit } = useForm<Form>({ defaultValues });

  return (
    <form onSubmit={handleSubmit((values) => onValues?.(values))}>
      <Checkbox
        id="terms"
        control={control}
        name="terms"
        label="Aceito os termos"
      />
      <button type="submit">Enviar</button>
    </form>
  );
}

describe('Checkbox (global)', () => {
  it('associa o rótulo ao controle (clicar no texto alterna)', async () => {
    render(<Checkbox id="active" label="Ativo" />);

    const checkbox = screen.getByRole('checkbox', { name: 'Ativo' });
    expect(checkbox).not.toBeChecked();

    await userEvent.click(screen.getByText('Ativo'));

    expect(checkbox).toBeChecked();
  });

  it('exibe a descrição auxiliar quando informada', () => {
    render(
      <Checkbox
        id="notify"
        label="Notificações"
        description="Enviaremos um e-mail a cada novo registro."
      />
    );

    expect(
      screen.getByText('Enviaremos um e-mail a cada novo registro.')
    ).toBeInTheDocument();
  });

  // O leitor de tela lê a descrição junto do rótulo (ex.: por que o item está
  // desabilitado), não só quem vê a tela.
  it('a descrição é a descrição acessível do controle', () => {
    render(
      <Checkbox
        id="audit"
        label="Visualizar auditoria"
        description="Você não tem esta permissão."
        disabled
      />
    );

    expect(
      screen.getByRole('checkbox', {
        name: 'Visualizar auditoria',
        description: 'Você não tem esta permissão.',
      })
    ).toBeDisabled();
  });

  it('soma a descrição a um `aria-describedby` de quem usa', () => {
    render(
      <>
        <p id="terms-note">Leia antes de aceitar.</p>
        <Checkbox
          id="terms"
          label="Aceito os termos"
          description="Obrigatório para continuar."
          aria-describedby="terms-note"
        />
      </>
    );

    expect(screen.getByRole('checkbox')).toHaveAccessibleDescription(
      'Obrigatório para continuar. Leia antes de aceitar.'
    );
  });

  it('sem descrição, o controle não aponta para nenhuma', () => {
    render(<Checkbox id="active" label="Ativo" />);

    expect(screen.getByRole('checkbox')).not.toHaveAttribute(
      'aria-describedby'
    );
  });

  it('modo uncontrolled dispara onCheckedChange', async () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox id="x" label="Ativo" onCheckedChange={onCheckedChange} />);

    await userEvent.click(screen.getByRole('checkbox'));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  // O modo controlled guarda um BOOLEAN no formulário (não o `'on'` do input
  // nativo, nem `indeterminate`).
  it('modo controlled guarda boolean no formulário', async () => {
    const onValues = vi.fn();
    render(<ControlledCheckbox onValues={onValues} />);

    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Aceito os termos' })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(onValues).toHaveBeenCalledWith({ terms: true });
  });

  it('modo controlled reflete o valor inicial do formulário', () => {
    render(<ControlledCheckbox defaultValues={{ terms: true }} />);

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('desabilitado não alterna', async () => {
    const onCheckedChange = vi.fn();
    render(
      <Checkbox
        id="x"
        label="Ativo"
        disabled
        onCheckedChange={onCheckedChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();

    await userEvent.click(checkbox);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('labelHint rende um tooltip de informação nomeado pelo rótulo', () => {
    render(
      <Checkbox
        id="notify"
        label="Receber avisos"
        labelHint="Envia um aviso a cada alteração."
      />
    );

    expect(
      screen.getByRole('button', { name: 'Sobre Receber avisos' })
    ).toBeInTheDocument();
    // A dica fica fora do <label>: não entra no nome do controle.
    expect(
      screen.getByRole('checkbox', { name: 'Receber avisos' })
    ).toBeInTheDocument();
  });

  it('sem `id`, o rótulo continua alcançando o controle', async () => {
    render(<Checkbox label="Selecionar linha" />);

    const controlEl = screen.getByLabelText('Selecionar linha');
    await userEvent.click(screen.getByText('Selecionar linha'));
    expect(controlEl).toBeChecked();
  });

  it('`id` do chamador vence o derivado', () => {
    render(<Checkbox id="my-id" label="Ativo" />);

    expect(screen.getByLabelText('Ativo')).toHaveAttribute('id', 'my-id');
  });

  it('srOnlyLabel esconde o rótulo do olho, e não do leitor de tela', () => {
    render(<Checkbox id="row-1" label="Selecionar a linha 001" srOnlyLabel />);

    expect(screen.getByLabelText('Selecionar a linha 001')).toBeInTheDocument();
    expect(screen.getByText('Selecionar a linha 001')).toHaveClass('sr-only');
  });

  it('sem srOnlyLabel o rótulo fica visível', () => {
    render(<Checkbox id="visible" label="Aceito os termos" />);

    expect(screen.getByText('Aceito os termos')).not.toHaveClass('sr-only');
  });

  it('exibe erro e marca o controle como inválido', () => {
    render(
      <Checkbox
        id="terms"
        label="Aceito os termos"
        errors={{ message: 'Campo obrigatório' }}
      />
    );

    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });
});
