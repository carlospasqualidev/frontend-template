import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AsyncCombobox } from '@/components/global/form/asyncCombobox';

const RESULT = [
  { value: 'u1', label: 'Ana Souza' },
  { value: 'u2', label: 'Ana Lima' },
];

describe('AsyncCombobox', () => {
  it('pede mais caracteres antes de consultar e depois busca no servidor', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn().mockResolvedValue(RESULT);
    const onValueChange = vi.fn();
    render(
      <AsyncCombobox
        id="owner"
        label="Responsável"
        value=""
        onValueChange={onValueChange}
        onSearch={onSearch}
      />
    );

    await user.click(screen.getByRole('combobox'));
    expect(
      screen.getByText('Digite ao menos 3 caracteres.')
    ).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Buscar...'), 'Ana');
    // O servidor recortou: nenhuma opção some pelo rótulo.
    const option = await screen.findByRole('option', { name: 'Ana Lima' });
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('Ana');

    await user.click(option);
    expect(onValueChange).toHaveBeenCalledWith('u2');
  });

  it('escolher outra opção com selectedLabel antigo mostra o rótulo da nova', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn().mockResolvedValue(RESULT);
    function Harness() {
      const [value, setValue] = useState('u9');
      return (
        <AsyncCombobox
          id="owner"
          label="Responsável"
          value={value}
          selectedLabel="Bruno Dias"
          onValueChange={setValue}
          onSearch={onSearch}
        />
      );
    }
    render(<Harness />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Bruno Dias');

    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText('Buscar...'), 'Ana');
    await user.click(await screen.findByRole('option', { name: 'Ana Lima' }));

    expect(screen.getByRole('combobox')).toHaveTextContent('Ana Lima');
  });

  it('mostra no gatilho o rótulo informado para um valor que nunca foi buscado', () => {
    render(
      <AsyncCombobox
        id="owner"
        label="Responsável"
        value="u9"
        selectedLabel="Bruno Dias"
        onValueChange={() => undefined}
        onSearch={vi.fn().mockResolvedValue([])}
      />
    );

    expect(screen.getByRole('combobox')).toHaveTextContent('Bruno Dias');
  });

  it('sem selectedLabel cai no próprio valor', () => {
    render(
      <AsyncCombobox
        id="owner"
        label="Responsável"
        value="u9"
        onValueChange={() => undefined}
        onSearch={vi.fn().mockResolvedValue([])}
      />
    );

    expect(screen.getByRole('combobox')).toHaveTextContent('u9');
  });

  it('associa a label ao campo, mostra description e erro', () => {
    render(
      <AsyncCombobox
        id="owner"
        label="Responsável"
        description="Só usuários ativos."
        errors={{ message: 'Selecione o responsável.' }}
        value=""
        onValueChange={() => undefined}
        onSearch={vi.fn().mockResolvedValue([])}
      />
    );

    expect(screen.getByLabelText('Responsável')).toBe(
      screen.getByRole('combobox')
    );
    expect(screen.getByText('Só usuários ativos.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Selecione o responsável.'
    );
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('clearable limpa o valor', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <AsyncCombobox
        id="owner"
        label="Responsável"
        value="u1"
        selectedLabel="Ana Souza"
        clearable
        onValueChange={onValueChange}
        onSearch={vi.fn().mockResolvedValue([])}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Limpar seleção' }));

    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith(''));
  });
});
