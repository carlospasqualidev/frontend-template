import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FilterButtons } from '@/components/global/filterButtons/filterButtons';

const OPTIONS = [
  { value: 'all', label: 'Todos', count: 10 },
  { value: 'late', label: 'Atrasados', count: 2 },
  { value: 'done', label: 'Concluídos' },
];

describe('FilterButtons', () => {
  it('marca só o selecionado com aria-pressed', () => {
    render(
      <FilterButtons
        label="Visão"
        options={OPTIONS}
        value="late"
        onValueChange={() => undefined}
      />
    );

    expect(screen.getByRole('group', { name: 'Visão' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Atrasados' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('avisa o valor da opção clicada', async () => {
    const onValueChange = vi.fn();
    render(
      <FilterButtons
        label="Visão"
        options={OPTIONS}
        value="all"
        onValueChange={onValueChange}
      />
    );

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Atrasados' }));

    expect(onValueChange).toHaveBeenCalledWith('late');
  });

  it('mostra o contador só com showCounts, e reticências até ele chegar', () => {
    const { rerender } = render(
      <FilterButtons
        label="Visão"
        options={OPTIONS}
        value="all"
        onValueChange={() => undefined}
      />
    );
    expect(screen.queryByText('10')).not.toBeInTheDocument();

    rerender(
      <FilterButtons
        label="Visão"
        showCounts
        options={OPTIONS}
        value="all"
        onValueChange={() => undefined}
      />
    );
    expect(screen.getByText('10')).toBeVisible();
    expect(screen.getByText('2')).toBeVisible();
    expect(screen.getByText('…')).toBeVisible();
  });

  it('inclui o contador no nome acessível do botão', () => {
    render(
      <FilterButtons
        label="Visão"
        showCounts
        options={OPTIONS}
        value="all"
        onValueChange={() => undefined}
      />
    );

    expect(screen.getByRole('button', { name: 'Todos 10' })).toBeVisible();
  });

  it('opera por teclado: Tab chega ao botão e Enter e Espaço escolhem', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <FilterButtons
        label="Visão"
        options={OPTIONS}
        value="all"
        onValueChange={onValueChange}
      />
    );

    await user.tab();
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Atrasados' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith('late');

    await user.tab();
    expect(screen.getByRole('button', { name: 'Concluídos' })).toHaveFocus();
    await user.keyboard(' ');
    expect(onValueChange).toHaveBeenLastCalledWith('done');
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });
});
