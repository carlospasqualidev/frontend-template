import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { rowActionsColumn } from '@/components/global/dataTable/columnHelpers';
import { DataTable } from '@/components/global/dataTable/dataTable';
import type { RowAction } from '@/components/global/rowActions/rowActions';

interface Item {
  id: string;
}

const actions: RowAction[] = [
  {
    key: 'edit',
    label: 'Editar',
    icon: <span aria-hidden>E</span>,
    onSelect: vi.fn(),
  },
];

function renderCell(column: ReturnType<typeof rowActionsColumn<Item>>) {
  const cell = column.cell as (context: {
    row: { original: Item };
  }) => React.ReactNode;
  return render(<>{cell({ row: { original: { id: '1' } } })}</>);
}

describe('rowActionsColumn', () => {
  it('padrão: centralizado, com `meta.isActions` e cabeçalho "Ações"', () => {
    const column = rowActionsColumn<Item>({ actions });

    expect(column.meta?.isActions).toBe(true);
    expect(column.meta?.className).toContain('text-center');
    expect((column.header as () => string)()).toBe('Ações');

    const { container } = renderCell(column);
    expect(container.firstElementChild).toHaveClass('justify-center');
  });

  it('align right alinha o título e os botões à direita', () => {
    const column = rowActionsColumn<Item>({ actions, align: 'right' });

    expect(column.meta?.isActions).toBe(true);
    expect(column.meta?.className).toContain('text-right');
    expect(column.meta?.actionsAlign).toBe('right');
    expect(column.meta?.className).not.toContain('text-center');

    const { container } = renderCell(column);
    expect(container.firstElementChild).toHaveClass('justify-end');
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
  });

  it.each([
    ['right', 'ml-auto'],
    ['center', 'mx-auto'],
  ] as const)(
    'no carregamento, o skeleton da coluna de ações acompanha align %s',
    (align, expectedClass) => {
      const { container } = render(
        <DataTable<Item>
          columns={[rowActionsColumn<Item>({ actions, align })]}
          data={[]}
          isLoading
          disableColumnVisibility
          hidePagination
        />
      );

      const skeleton = container.querySelector('tbody [data-slot="skeleton"]');
      expect(skeleton).toHaveClass('w-16', expectedClass);
    }
  );

  it('aceita função de linha e, sem ações, reserva o espaço de um botão', () => {
    const column = rowActionsColumn<Item>({ actions: () => [] });

    const { container } = renderCell(column);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('size-7');
  });
});
