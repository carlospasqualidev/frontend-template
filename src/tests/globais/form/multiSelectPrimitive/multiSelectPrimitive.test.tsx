import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MultiSelect } from '@/components/global/form/multiSelectPrimitive';

const FRUITS = [
  { value: 'apple', label: 'Maçã' },
  { value: 'banana', label: 'Banana' },
  { value: 'orange', label: 'Laranja' },
];

describe('MultiSelect (primitive)', () => {
  it('exibe placeholder quando nada está selecionado', () => {
    render(<MultiSelect options={FRUITS} placeholder="Escolha frutas" />);

    expect(screen.getByText('Escolha frutas')).toBeInTheDocument();
  });

  it('marca opções e propaga onValueChange (uncontrolled)', async () => {
    const handleChange = vi.fn();
    render(
      <MultiSelect
        options={FRUITS}
        placeholder="Escolha"
        onValueChange={handleChange}
      />
    );

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('Maçã'));

    expect(handleChange).toHaveBeenLastCalledWith(['apple']);

    await userEvent.click(screen.getByText('Banana'));
    expect(handleChange).toHaveBeenLastCalledWith(['apple', 'banana']);
  });

  it('respeita value (controlled) e renderiza os rótulos no trigger', () => {
    render(
      <MultiSelect
        options={FRUITS}
        value={['apple', 'orange']}
        onValueChange={() => undefined}
      />
    );

    expect(screen.getByText('Maçã, Laranja')).toBeInTheDocument();
  });

  it('resume quando excede maxDisplay', () => {
    render(
      <MultiSelect
        options={FRUITS}
        value={['apple', 'banana', 'orange']}
        maxDisplay={2}
        onValueChange={() => undefined}
      />
    );

    expect(screen.getByText('3 selecionados')).toBeInTheDocument();
  });

  it('filtra opções quando searchable=true', async () => {
    render(
      <MultiSelect
        options={FRUITS}
        searchable
        searchPlaceholder="Buscar fruta..."
      />
    );

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.type(screen.getByPlaceholderText('Buscar fruta...'), 'maç');

    expect(screen.getByText('Maçã')).toBeInTheDocument();
    expect(screen.queryByText('Banana')).not.toBeInTheDocument();
    expect(screen.queryByText('Laranja')).not.toBeInTheDocument();
  });

  it('renderiza um hidden input por valor quando `name` é informado', () => {
    const { container } = render(
      <MultiSelect
        options={FRUITS}
        name="fruits"
        value={['apple', 'banana']}
        onValueChange={() => undefined}
      />
    );

    const hiddenInputs = container.querySelectorAll('input[type="hidden"]');
    expect(hiddenInputs).toHaveLength(2);
    expect(hiddenInputs[0]).toHaveAttribute('name', 'fruits');
    expect(hiddenInputs[0]).toHaveAttribute('value', 'apple');
    expect(hiddenInputs[1]).toHaveAttribute('value', 'banana');
  });

  it('clearable exibe um "X" no gatilho que limpa toda a seleção sem abrir a lista', async () => {
    const handleChange = vi.fn();
    render(
      <MultiSelect
        options={FRUITS}
        clearable
        value={['apple', 'banana']}
        onValueChange={handleChange}
      />
    );

    // Sem abrir o popover, o "X" do gatilho já limpa.
    await userEvent.click(
      screen.getByRole('button', { name: 'Limpar seleção' })
    );
    expect(handleChange).toHaveBeenCalledWith([]);
  });

  it('clearable não exibe o "X" quando nada está selecionado', () => {
    render(
      <MultiSelect
        options={FRUITS}
        clearable
        value={[]}
        onValueChange={() => undefined}
      />
    );
    expect(
      screen.queryByRole('button', { name: 'Limpar seleção' })
    ).not.toBeInTheDocument();
  });

  it('permite limpar a seleção via botão "Limpar seleção"', async () => {
    const handleChange = vi.fn();
    render(
      <MultiSelect
        options={FRUITS}
        value={['apple']}
        onValueChange={handleChange}
      />
    );

    await userEvent.click(screen.getByRole('combobox'));

    const dialog = screen.getByRole('group');
    void within(dialog);
    await userEvent.click(screen.getByRole('button', { name: /limpar sele/i }));

    expect(handleChange).toHaveBeenCalledWith([]);
  });
});
