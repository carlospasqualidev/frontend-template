import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  DataTableFilters,
  multiSelectFilter,
} from '@/components/global/dataTable/filters';

function renderFilter(
  minChars?: number,
  onSearchChange: (search: string) => void = () => undefined
): void {
  render(
    <DataTableFilters
      onSearch={() => undefined}
      filters={[
        multiSelectFilter({
          key: 'owner',
          label: 'Responsável',
          options: [],
          searchable: true,
          onSearchChange,
          emptyText: 'Nada por aqui.',
          minChars,
        }),
      ]}
    />
  );
}

describe('multiSelectFilter com minChars', () => {
  it('repassa minChars ao MultiSelect: termo curto pede mais caracteres', async () => {
    renderFilter(3);

    await userEvent.click(screen.getByRole('combobox'));

    expect(screen.getByText('Digite ao menos 3 caracteres.')).toBeVisible();
  });

  it('sem minChars mostra direto o emptyText', async () => {
    renderFilter(undefined);

    await userEvent.click(screen.getByRole('combobox'));

    expect(screen.getByText('Nada por aqui.')).toBeVisible();
  });

  it('não chama onSearchChange com termo não vazio abaixo do mínimo', async () => {
    const onSearchChange = vi.fn();
    renderFilter(3, onSearchChange);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.type(screen.getByRole('textbox'), 'ab');

    expect(onSearchChange).not.toHaveBeenCalled();

    await userEvent.type(screen.getByRole('textbox'), 'c');

    expect(onSearchChange).toHaveBeenCalledTimes(1);
    expect(onSearchChange).toHaveBeenCalledWith('abc');
  });

  it('termo vazio chega ao onSearchChange para limpar a busca', async () => {
    const onSearchChange = vi.fn();
    renderFilter(3, onSearchChange);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.type(screen.getByRole('textbox'), 'abc');
    onSearchChange.mockClear();
    await userEvent.clear(screen.getByRole('textbox'));

    expect(onSearchChange).toHaveBeenCalledWith('');
  });

  it('sem minChars chama onSearchChange a cada digitação', async () => {
    const onSearchChange = vi.fn();
    renderFilter(undefined, onSearchChange);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.type(screen.getByRole('textbox'), 'ab');

    expect(onSearchChange).toHaveBeenCalledTimes(2);
  });
});
