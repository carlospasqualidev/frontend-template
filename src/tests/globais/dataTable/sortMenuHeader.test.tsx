import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SortingState, Table } from '@tanstack/react-table';
import { describe, expect, it, vi } from 'vitest';

import { SortMenuHeader } from '@/components/global/dataTable/columnHelpers';

const OPTIONS = [
  { id: 'nextExitDate', label: 'Próxima saída' },
  { id: 'lastExitDate', label: 'Última saída' },
  { id: 'invoicingDate', label: 'Faturamento' },
];

// O SortMenuHeader só usa `getState().sorting` e `setSorting` — mock mínimo tipado.
function makeTable(sorting: SortingState) {
  const setSorting = vi.fn();
  const table = {
    getState: () => ({ sorting }),
    setSorting,
  } as unknown as Table<unknown>;
  return { table, setSorting };
}

describe('SortMenuHeader (global)', () => {
  it('abre o menu e ordena pelo campo escolhido (ascendente)', async () => {
    const user = userEvent.setup();
    const { table, setSorting } = makeTable([]);
    render(<SortMenuHeader table={table} label="Datas" options={OPTIONS} />);

    await user.click(screen.getByRole('button', { name: 'Ordenar por Datas' }));
    await user.click(screen.getByRole('menuitem', { name: 'Última saída' }));

    expect(setSorting).toHaveBeenCalledWith([
      { id: 'lastExitDate', desc: false },
    ]);
  });

  it('clicar no campo ATIVO inverte a direção (asc → desc)', async () => {
    const user = userEvent.setup();
    const { table, setSorting } = makeTable([
      { id: 'lastExitDate', desc: false },
    ]);
    render(<SortMenuHeader table={table} label="Datas" options={OPTIONS} />);

    await user.click(screen.getByRole('button', { name: 'Ordenar por Datas' }));
    await user.click(screen.getByRole('menuitem', { name: 'Última saída' }));

    expect(setSorting).toHaveBeenCalledWith([
      { id: 'lastExitDate', desc: true },
    ]);
  });

  it('trocar para outro campo volta a ascendente', async () => {
    const user = userEvent.setup();
    const { table, setSorting } = makeTable([
      { id: 'lastExitDate', desc: true },
    ]);
    render(<SortMenuHeader table={table} label="Datas" options={OPTIONS} />);

    await user.click(screen.getByRole('button', { name: 'Ordenar por Datas' }));
    await user.click(screen.getByRole('menuitem', { name: 'Faturamento' }));

    expect(setSorting).toHaveBeenCalledWith([
      { id: 'invoicingDate', desc: false },
    ]);
  });
});
