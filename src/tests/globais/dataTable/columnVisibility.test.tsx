import { render, screen, waitFor, within } from '@testing-library/react';
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

function storedKeys(): string[] {
  return Object.keys(localStorage).filter((key) =>
    key.startsWith('dataTable:hiddenColumns:')
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
  it('depois do Esc o foco volta ao botão e o tooltip não abre', async () => {
    const user = userEvent.setup();
    renderTable();
    await openMenu(user);
    await user.keyboard('{Escape}');

    const trigger = screen.getByRole('button', { name: 'Configurar colunas' });
    await waitFor(() => expect(trigger).toHaveFocus());
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('depois do Esc, voltar ao botão com Tab abre o tooltip', async () => {
    const user = userEvent.setup();
    renderTable();
    await openMenu(user);
    await user.keyboard('{Escape}');
    const trigger = screen.getByRole('button', { name: 'Configurar colunas' });
    await waitFor(() => expect(trigger).toHaveFocus());
    await new Promise((resolve) => setTimeout(resolve, 50));

    await user.tab();
    expect(trigger).not.toHaveFocus();
    await user.tab({ shift: true });

    expect(trigger).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Configurar colunas'
    );
  });

  it('mostra o menu sem columnVisibilityKey e não grava nada', async () => {
    const user = userEvent.setup();
    renderTable(null);
    await openMenu(user);
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'E-mail' }));

    expect(screen.queryByText('ana@example.com')).not.toBeInTheDocument();
    expect(storedKeys()).toEqual([]);
  });

  it('com disableColumnVisibility não há menu nem coluna do menu', () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        pageIndex={0}
        onPageChange={() => undefined}
        columnVisibilityKey={TABLE_KEY}
        disableColumnVisibility
      />
    );

    expect(
      screen.queryByRole('button', { name: 'Configurar colunas' })
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(4);
  });

  it('com disableColumnVisibility o skeleton não ganha célula do menu', () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={[]}
        pageIndex={0}
        onPageChange={() => undefined}
        disableColumnVisibility
        isLoading
      />
    );

    const row = container.querySelector('tbody tr') as HTMLElement;
    expect(within(row).getAllByRole('cell')).toHaveLength(4);
  });

  describe('defaultHiddenColumnIds', () => {
    function renderWithDefaults(
      hidden: string[],
      key: string | undefined = TABLE_KEY
    ) {
      return render(
        <DataTable
          columns={columns}
          data={rows}
          pageIndex={0}
          onPageChange={() => undefined}
          columnVisibilityKey={key}
          defaultHiddenColumnIds={hidden}
        />
      );
    }

    it('oculta as colunas listadas sem gravar nada', () => {
      renderWithDefaults(['email', 'inexistente']);

      expect(screen.queryByText('ana@example.com')).not.toBeInTheDocument();
      expect(screen.getByText('Ana Souza')).toBeInTheDocument();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('a escolha gravada vence, inclusive para mostrar uma coluna oculta por padrão', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['name']));
      renderWithDefaults(['email']);

      expect(screen.getByText('ana@example.com')).toBeInTheDocument();
      expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument();
    });

    it('"Mostrar todas" grava [] e o padrão não volta no próximo carregamento', async () => {
      const user = userEvent.setup();
      const { unmount } = renderWithDefaults(['email']);
      await openMenu(user);
      await user.click(screen.getByRole('menuitem', { name: 'Mostrar todas' }));

      expect(screen.getByText('ana@example.com')).toBeInTheDocument();
      expect(localStorage.getItem(STORAGE_KEY)).toBe('[]');

      unmount();
      renderWithDefaults(['email']);
      expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    });

    it('array novo de mesmo conteúdo não refaz o listener de storage nem reinicia a escolha', async () => {
      const user = userEvent.setup();
      const addSpy = vi.spyOn(window, 'addEventListener');
      const storageSubscriptions = () =>
        addSpy.mock.calls.filter(([type]) => type === 'storage').length;
      const { rerender } = renderWithDefaults(['email']);
      await openMenu(user);
      await user.click(
        screen.getByRole('menuitemcheckbox', { name: 'E-mail' })
      );
      expect(screen.getByText('ana@example.com')).toBeInTheDocument();
      const before = storageSubscriptions();

      rerender(
        <DataTable
          columns={columns}
          data={rows}
          pageIndex={0}
          onPageChange={() => undefined}
          columnVisibilityKey={TABLE_KEY}
          defaultHiddenColumnIds={['email']}
        />
      );

      expect(storageSubscriptions()).toBe(before);
      expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    });

    it('padrão que esconderia todas as colunas ocultáveis é ignorado', () => {
      renderWithDefaults(['name', 'email', 'role']);

      expect(screen.getByText('Ana Souza')).toBeInTheDocument();
      expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    });
  });

  describe('columnVisibility controlada', () => {
    it('reflete o valor recebido, avisa a mudança e não grava nada', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <DataTable
          columns={columns}
          data={rows}
          pageIndex={0}
          onPageChange={() => undefined}
          columnVisibilityKey={TABLE_KEY}
          columnVisibility={{ email: false }}
          onColumnVisibilityChange={onChange}
        />
      );

      expect(screen.queryByText('ana@example.com')).not.toBeInTheDocument();

      await openMenu(user);
      await user.click(
        screen.getByRole('menuitemcheckbox', { name: 'E-mail' })
      );

      expect(onChange).toHaveBeenCalledWith({ email: true });
      // A tela não atualizou o valor: a tabela segue refletindo o recebido.
      expect(screen.queryByText('ana@example.com')).not.toBeInTheDocument();
      expect(storedKeys()).toEqual([]);
    });
  });

  it('hidePagination remove o rodapé e mantém as linhas', () => {
    render(<DataTable columns={columns} data={rows} hidePagination />);

    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Próxima' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Anterior' })
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
