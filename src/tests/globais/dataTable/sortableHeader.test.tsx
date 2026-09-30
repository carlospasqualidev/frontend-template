import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SortableHeader } from '@/components/global/dataTable/columnHelpers';
import type { DataTableColumn } from '@/components/global/dataTable/tableFeatures';

// O SortableHeader só usa `getIsSorted`, `toggleSorting` e o `sortDescFirst`
// da definição da coluna — mock mínimo tipado.
function makeColumn({
  sorted,
  sortDescFirst,
}: {
  sorted: false | 'asc' | 'desc';
  sortDescFirst?: boolean;
}) {
  const toggleSorting = vi.fn();
  const column = {
    getIsSorted: () => sorted,
    toggleSorting,
    columnDef: { sortDescFirst },
  } as unknown as DataTableColumn<object, unknown>;
  return { column, toggleSorting };
}

async function clickHeader(column: DataTableColumn<object, unknown>) {
  const user = userEvent.setup();
  render(<SortableHeader column={column}>Status</SortableHeader>);
  await user.click(screen.getByRole('button', { name: 'Status' }));
}

describe('SortableHeader (global)', () => {
  it('o primeiro clique ordena em ascendente', async () => {
    const { column, toggleSorting } = makeColumn({ sorted: false });
    await clickHeader(column);

    expect(toggleSorting).toHaveBeenCalledWith(false);
  });

  it('com `sortDescFirst`, o primeiro clique ordena em descendente', async () => {
    const { column, toggleSorting } = makeColumn({
      sorted: false,
      sortDescFirst: true,
    });
    await clickHeader(column);

    expect(toggleSorting).toHaveBeenCalledWith(true);
  });

  it('os cliques seguintes alternam a direção, com ou sem `sortDescFirst`', async () => {
    const ascending = makeColumn({ sorted: 'asc', sortDescFirst: true });
    await clickHeader(ascending.column);
    expect(ascending.toggleSorting).toHaveBeenCalledWith(true);

    document.body.innerHTML = '';

    const descending = makeColumn({ sorted: 'desc', sortDescFirst: true });
    await clickHeader(descending.column);
    expect(descending.toggleSorting).toHaveBeenCalledWith(false);
  });
});
