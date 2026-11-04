import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  actionsColumn,
  SortableHeader,
} from '@/components/global/dataTable/columnHelpers';
import type { DataTableColumnDef } from '@/components/global/dataTable/tableFeatures';
import { DataTable } from '@/components/global/dataTable/dataTable';
import { columnVisibilityStorageKey } from '@/components/global/dataTable/useColumnVisibility';

interface Row {
  id: string;
  name: string;
  email: string;
  role: string;
}

const rows: Row[] = [
  { id: '1', name: 'Ana Souza', email: 'ana@example.com', role: 'Admin' },
];

const columns: DataTableColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Nome' },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <SortableHeader column={column}>E-mail</SortableHeader>
    ),
    meta: { label: 'E-mail' },
  },
  {
    // Cabeçalho renderizado sem `meta.label` → não entra no menu.
    accessorKey: 'role',
    header: ({ column }) => (
      <SortableHeader column={column}>Papel</SortableHeader>
    ),
  },
  actionsColumn<Row>({
    actions: [{ label: 'Excluir', onSelect: () => undefined }],
  }),
];

const TABLE_KEY = 'test-table';
const STORAGE_KEY = columnVisibilityStorageKey(TABLE_KEY);

function renderTable(columnVisibilityKey: string | null = TABLE_KEY) {
  return render(
    <DataTable
      columns={columns}
      data={rows}
      pageIndex={0}
      onPageChange={() => undefined}
      columnVisibilityKey={columnVisibilityKey ?? undefined}
    />
  );
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Configurar colunas' }));
}

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('DataTable — visibilidade de colunas', () => {
  it('não mostra o menu sem columnVisibilityKey', () => {
    renderTable(null);
    expect(
      screen.queryByRole('button', { name: 'Configurar colunas' })
    ).not.toBeInTheDocument();
  });

  it('lista só colunas ocultáveis com rótulo legível', async () => {
    const user = userEvent.setup();
    renderTable();
    await openMenu(user);

    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Nome' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitemcheckbox', { name: 'E-mail' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitemcheckbox', { name: 'Papel' })
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('menuitemcheckbox')).toHaveLength(2);
  });

  it('oculta a coluna e grava a escolha no localStorage', async () => {
    const user = userEvent.setup();
    renderTable();
    await openMenu(user);

    await user.click(screen.getByRole('menuitemcheckbox', { name: 'E-mail' }));

    expect(screen.queryByText('ana@example.com')).not.toBeInTheDocument();
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual([
      'email',
    ]);
    // O menu continua aberto para ajustar outras colunas.
    expect(
      screen.getByRole('menuitemcheckbox', { name: 'E-mail' })
    ).toHaveAttribute('aria-checked', 'false');
  });

  it('restaura a escolha salva ao montar de novo', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['email']));
    renderTable();

    expect(screen.queryByText('ana@example.com')).not.toBeInTheDocument();
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
  });

  it('ignora valor corrompido no localStorage e mostra tudo', () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    localStorage.setItem(STORAGE_KEY, '{não é json');
    renderTable();

    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
  });

  it('ignora valor com formato inesperado', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: false }));
    renderTable();

    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
  });

  it('trava a última coluna visível do menu', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['email']));
    const user = userEvent.setup();
    renderTable();
    await openMenu(user);

    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Nome' })
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('"Mostrar todas" reexibe as colunas e limpa o armazenamento', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['email']));
    const user = userEvent.setup();
    renderTable();
    await openMenu(user);

    await user.click(screen.getByRole('menuitem', { name: 'Mostrar todas' }));

    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('"Mostrar todas" fica desabilitado quando nada está oculto', async () => {
    const user = userEvent.setup();
    renderTable();
    await openMenu(user);

    expect(
      screen.getByRole('menuitem', { name: 'Mostrar todas' })
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('põe o ícone em coluna própria, depois da coluna Ações', () => {
    renderTable();

    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(5);
    expect(
      within(headers.at(-1)!).getByRole('button', {
        name: 'Configurar colunas',
      })
    ).toBeInTheDocument();
    expect(headers.at(-2)).toHaveTextContent('Ações');
    expect(
      within(headers.at(-2)!).queryByRole('button', {
        name: 'Configurar colunas',
      })
    ).not.toBeInTheDocument();
  });

  it('nem Ações nem a coluna do ícone aparecem no menu de colunas', async () => {
    const user = userEvent.setup();
    renderTable();
    await openMenu(user);

    expect(
      screen.queryByRole('menuitemcheckbox', { name: 'Ações' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('menuitemcheckbox', { name: 'Configurar colunas' })
    ).not.toBeInTheDocument();
  });

  it('carregando, a coluna do ícone não desenha skeleton', () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={[]}
        pageIndex={0}
        onPageChange={() => undefined}
        columnVisibilityKey={TABLE_KEY}
        isLoading
      />
    );

    const row = container.querySelector('tbody tr')!;
    const cells = within(row as HTMLElement).getAllByRole('cell');
    expect(cells).toHaveLength(5);
    expect(cells.at(-1)).toBeEmptyDOMElement();
    expect(cells.at(0)).not.toBeEmptyDOMElement();
  });

  it('carregando, o skeleton da coluna Ações é centralizado e de largura fixa', () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={[]}
        pageIndex={0}
        onPageChange={() => undefined}
        columnVisibilityKey={TABLE_KEY}
        isLoading
      />
    );

    const row = container.querySelector('tbody tr')!;
    const actionsCell = within(row as HTMLElement)
      .getAllByRole('cell')
      .at(-2)!;
    expect(actionsCell.firstElementChild).toHaveClass('mx-auto', 'w-16');
    const nameCell = within(row as HTMLElement)
      .getAllByRole('cell')
      .at(0)!;
    expect(nameCell.firstElementChild).not.toHaveClass('mx-auto');
  });

  it('o estado vazio ocupa todas as colunas, inclusive a do ícone', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        pageIndex={0}
        onPageChange={() => undefined}
        columnVisibilityKey={TABLE_KEY}
      />
    );

    expect(screen.getByRole('cell')).toHaveAttribute('colspan', '5');
  });

  it('sem coluna de ações, a coluna do ícone existe do mesmo jeito', () => {
    render(
      <DataTable
        columns={columns.slice(0, 2)}
        data={rows}
        pageIndex={0}
        onPageChange={() => undefined}
        columnVisibilityKey={TABLE_KEY}
      />
    );

    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(3);
    expect(
      within(headers.at(-1)!).getByRole('button', {
        name: 'Configurar colunas',
      })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('cell')).toHaveLength(3);
  });
});
