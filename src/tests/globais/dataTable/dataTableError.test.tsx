import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DataTable } from '@/components/global/dataTable/dataTable';
import type { DataTableColumnDef } from '@/components/global/dataTable/tableFeatures';

interface Item {
  id: string;
  name: string;
}

const columns: DataTableColumnDef<Item>[] = [
  { accessorKey: 'name', header: 'Nome', meta: { label: 'Nome' } },
];

describe('DataTable — estado de erro', () => {
  it('mostra o erro no corpo, mantém o cabeçalho e chama o retry', async () => {
    const onRetry = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={[]}
        errorMessage="Não foi possível carregar os itens"
        onRetry={onRetry}
        hidePagination
      />
    );

    expect(
      screen.getByText('Não foi possível carregar os itens')
    ).toBeInTheDocument();
    expect(screen.queryByText('Nenhum resultado.')).not.toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Nome' })
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Tentar novamente' })
    );
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('enquanto a promessa do retry não termina, o botão fica desabilitado', async () => {
    let finish: () => void = () => undefined;
    const onRetry = vi.fn(
      () => new Promise<void>((resolve) => (finish = resolve))
    );
    render(
      <DataTable
        columns={columns}
        data={[]}
        errorMessage="Não foi possível carregar os itens"
        onRetry={onRetry}
        hidePagination
      />
    );

    const button = screen.getByRole('button', { name: 'Tentar novamente' });
    await userEvent.click(button);
    expect(button).toBeDisabled();

    finish();
    await waitFor(() => expect(button).toBeEnabled());
  });

  it('sem errorMessage, o vazio segue o de sempre', () => {
    render(<DataTable columns={columns} data={[]} hidePagination />);

    expect(screen.getByText('Nenhum resultado.')).toBeInTheDocument();
  });
});
