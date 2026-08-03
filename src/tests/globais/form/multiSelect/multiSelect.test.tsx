import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { MultiSelect } from '@/components/global/form/multiSelect';

const options = [
  { value: 'admin', label: 'Administrador' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Leitor' },
];

type Form = { roles: string[] };

function ControlledMultiSelect({
  defaultValues = { roles: [] },
  onValues,
}: {
  defaultValues?: Form;
  onValues?: (values: Form) => void;
}) {
  const { control, handleSubmit } = useForm<Form>({ defaultValues });

  return (
    <form onSubmit={handleSubmit((values) => onValues?.(values))}>
      <MultiSelect
        id="roles"
        control={control}
        name="roles"
        label="Perfis"
        options={options}
        placeholder="Selecione"
      />
      <button type="submit">Enviar</button>
    </form>
  );
}

describe('MultiSelect (global, wrapper de formulário)', () => {
  it('renderiza o rótulo associado ao gatilho', () => {
    render(
      <MultiSelect
        id="roles"
        label="Perfis"
        options={options}
        placeholder="Selecione"
      />
    );

    expect(screen.getByText('Perfis')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('exibe o placeholder quando nada está selecionado', () => {
    render(
      <MultiSelect
        id="roles"
        label="Perfis"
        options={options}
        placeholder="Selecione"
      />
    );

    expect(screen.getByText('Selecione')).toBeInTheDocument();
  });

  it('modo uncontrolled dispara onValueChange com os valores marcados', async () => {
    const onValueChange = vi.fn();
    render(
      <MultiSelect
        id="roles"
        label="Perfis"
        options={options}
        placeholder="Selecione"
        onValueChange={onValueChange}
      />
    );

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByText('Editor'));

    expect(onValueChange).toHaveBeenCalledWith(['editor']);
  });

  // O wrapper guarda um ARRAY de strings no formulário — e um `defaultValue`
  // ausente entra como `[]`, não `undefined` (o primitivo espera array).
  it('modo controlled guarda array de strings no formulário', async () => {
    const onValues = vi.fn();
    render(<ControlledMultiSelect onValues={onValues} />);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByText('Administrador'));
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(onValues).toHaveBeenCalledWith({ roles: ['admin'] });
  });

  it('modo controlled exibe a seleção inicial do formulário', () => {
    render(
      <ControlledMultiSelect defaultValues={{ roles: ['admin', 'viewer'] }} />
    );

    expect(screen.getByRole('combobox')).toHaveTextContent(
      'Administrador, Leitor'
    );
  });

  it('exibe erro e marca o gatilho como inválido', () => {
    render(
      <MultiSelect
        id="roles"
        label="Perfis"
        options={options}
        errors={{ message: 'Selecione ao menos um perfil' }}
      />
    );

    expect(
      screen.getByText('Selecione ao menos um perfil')
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('exibe a descrição auxiliar quando informada', () => {
    render(
      <MultiSelect
        id="roles"
        label="Perfis"
        options={options}
        description="O usuário acumula as permissões dos perfis escolhidos."
      />
    );

    expect(
      screen.getByText('O usuário acumula as permissões dos perfis escolhidos.')
    ).toBeInTheDocument();
  });

  it('desabilitado não abre a lista', async () => {
    render(
      <MultiSelect id="roles" label="Perfis" options={options} disabled />
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();

    await userEvent.click(trigger);
    expect(screen.queryByText('Editor')).not.toBeInTheDocument();
  });
});
