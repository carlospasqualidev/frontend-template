import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { RowSelectionState, SortingState } from '@tanstack/react-table';
import { describe, expect, it, vi } from 'vitest';

import {
  actionsColumn,
  selectColumn,
  SortableHeader,
} from '@/components/global/dataTable/columnHelpers';
import type { DataTableColumnDef } from '@/components/global/dataTable/tableFeatures';
import { DataTable } from '@/components/global/dataTable/dataTable';
import {
  textFilter,
  type DataTableFilter,
} from '@/components/global/dataTable/filters';

interface Row {
  id: string;
  email: string;
}

const columns: DataTableColumnDef<Row>[] = [
  { accessorKey: 'email', header: 'E-mail' },
];

const filters: DataTableFilter[] = [
  textFilter({
    key: 'email',
    label: 'E-mail',
    placeholder: 'Buscar por e-mail',
  }),
];

describe('DataTable', () => {
  it('mostra o seletor "Itens por página" só com onPageSizeChange e dispara a troca', async () => {
    const user = userEvent.setup();
    const onPageSizeChange = vi.fn();
    const { rerender } = render(
      <DataTable
        columns={columns}
        data={[]}
        pageIndex={0}
        onPageChange={() => undefined}
      />
    );

    expect(screen.queryByText('Itens por página')).not.toBeInTheDocument();

    rerender(
      <DataTable
        columns={columns}
        data={[]}
        pageIndex={0}
        onPageChange={() => undefined}
        pageSize={25}
        onPageSizeChange={onPageSizeChange}
      />
    );

    const trigger = screen.getByRole('combobox', { name: 'Itens por página' });
    expect(trigger).toHaveTextContent('25');

    await user.click(trigger);
    expect(
      screen.getAllByRole('option').map((option) => option.textContent)
    ).toEqual(['25', '50', '100']);
    await user.click(screen.getByRole('option', { name: '100' }));

    expect(onPageSizeChange).toHaveBeenCalledWith(100);
  });

  it('não mostra o seletor quando pageSize está fora das opções', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        pageIndex={0}
        onPageChange={() => undefined}
        pageSize={5}
        onPageSizeChange={() => undefined}
      />
    );

    expect(screen.queryByText('Itens por página')).not.toBeInTheDocument();
  });

  it('renderiza linhas quando há dados', () => {
    const data: Row[] = [
      { id: '1', email: 'ana@example.com' },
      { id: '2', email: 'joao@example.com' },
    ];

    render(
      <DataTable
        columns={columns}
        data={data}
        pageIndex={0}
        onPageChange={() => undefined}
      />
    );

    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    expect(screen.getByText('joao@example.com')).toBeInTheDocument();
  });

  it('mostra empty state sem filtros ativos', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        pageIndex={0}
        onPageChange={() => undefined}
      />
    );

    expect(
      screen.getByText('Ainda não há registros para exibir.')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Limpar filtros' })
    ).not.toBeInTheDocument();
  });

  it('mostra "Limpar filtros" no empty state quando há filtros ativos', async () => {
    const handleSearch = vi.fn();

    render(
      <DataTable
        columns={columns}
        data={[]}
        pageIndex={0}
        onPageChange={() => undefined}
        filters={filters}
        defaultFilterValues={{ email: 'ana@example.com' }}
        onSearch={handleSearch}
      />
    );

    const clearButton = screen.getByRole('button', { name: 'Limpar filtros' });
    expect(clearButton).toBeInTheDocument();

    await userEvent.click(clearButton);
    expect(handleSearch).toHaveBeenCalledWith({});
  });

  describe('isLoading', () => {
    it('renderiza um número fixo de linhas de skeleton (independente do pageSize) e desabilita a paginação', () => {
      const data: Row[] = [{ id: '1', email: 'ana@example.com' }];

      const { container } = render(
        <DataTable
          columns={columns}
          data={data}
          pageIndex={1}
          onPageChange={() => undefined}
          pageSize={50}
          isLoading
        />
      );

      expect(screen.queryByText('ana@example.com')).not.toBeInTheDocument();
      // Uma coluna → uma skeleton por linha; a contagem fixa não acompanha o
      // pageSize (50), evitando uma tela altíssima durante o carregamento.
      expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
        8
      );
      expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();
    });

    it('mantém filtros visíveis e interativos durante o loading', async () => {
      const handleSearch = vi.fn();

      render(
        <DataTable
          columns={columns}
          data={[]}
          pageIndex={0}
          onPageChange={() => undefined}
          filters={filters}
          onSearch={handleSearch}
          isLoading
        />
      );

      const emailInput = screen.getByPlaceholderText('Buscar por e-mail');
      await userEvent.type(emailInput, 'ana');
      await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));

      expect(handleSearch).toHaveBeenCalledWith({ email: 'ana' });
    });
  });

  it('desabilita "Anterior" na primeira página', () => {
    render(
      <DataTable
        columns={columns}
        data={[{ id: '1', email: 'a@b.com' }]}
        pageIndex={0}
        onPageChange={() => undefined}
        pageSize={1}
      />
    );

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
  });

  it('desabilita "Próxima" quando a página vem com menos linhas que pageSize', () => {
    render(
      <DataTable
        columns={columns}
        data={[{ id: '1', email: 'a@b.com' }]}
        pageIndex={0}
        onPageChange={() => undefined}
        pageSize={5}
      />
    );

    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();
  });

  it('com rowCount, habilita "Próxima" por total de itens — ignorando o nº de linhas exibidas', () => {
    // pageSize é em ITENS (2 por página) e rowCount é o total de itens (5),
    // mesmo que a página exiba 3 LINHAS (ex.: itens explodidos). (0+1)*2 < 5.
    render(
      <DataTable
        columns={columns}
        data={[
          { id: '1', email: 'a@b.com' },
          { id: '2', email: 'b@b.com' },
          { id: '3', email: 'c@b.com' },
        ]}
        pageIndex={0}
        onPageChange={() => undefined}
        pageSize={2}
        rowCount={5}
      />
    );

    expect(screen.getByRole('button', { name: 'Próxima' })).toBeEnabled();
  });

  it('com rowCount, desabilita "Próxima" na última página por total de itens', () => {
    // Última página: (2+1)*2 = 6 >= 5 → não há próxima.
    render(
      <DataTable
        columns={columns}
        data={[{ id: '5', email: 'e@b.com' }]}
        pageIndex={2}
        onPageChange={() => undefined}
        pageSize={2}
        rowCount={5}
      />
    );

    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();
  });

  it('actionsColumn: só renderiza o menu ⋯ nas linhas que têm ações', () => {
    const cols: DataTableColumnDef<Row>[] = [
      ...columns,
      actionsColumn<Row>({
        actions: (row) =>
          row.id === '1'
            ? [{ label: 'Excluir', onSelect: () => undefined }]
            : [],
      }),
    ];

    render(
      <DataTable
        columns={cols}
        data={[
          { id: '1', email: 'a@b.com' },
          { id: '2', email: 'b@b.com' },
        ]}
        pageIndex={0}
        onPageChange={() => undefined}
        pageSize={25}
      />
    );

    // A última célula é a do menu de colunas; a de ações é a penúltima.
    // Duas linhas, mas só a primeira tem ação → um único gatilho "Abrir menu".
    expect(screen.getAllByRole('button', { name: 'Abrir menu' })).toHaveLength(
      1
    );

    // A linha sem ação NÃO deixa a célula vazia: reserva o espaço do botão para
    // manter a mesma altura das linhas com ⋯ (linhas de altura uniforme).
    const bodyRows = screen.getAllByRole('row').slice(1);
    const actionsCellWithoutMenu = within(bodyRows[1])
      .getAllByRole('cell')
      .at(-2);
    expect(actionsCellWithoutMenu).not.toBeEmptyDOMElement();
  });

  describe('onRowClick', () => {
    const data: Row[] = [
      { id: '1', email: 'ana@example.com' },
      { id: '2', email: 'joao@example.com' },
    ];

    it('não torna a linha clicável quando onRowClick não é definido', () => {
      render(
        <DataTable
          columns={columns}
          data={data}
          pageIndex={0}
          onPageChange={() => undefined}
        />
      );

      expect(
        screen.queryAllByRole('button', { name: /@example\.com/ })
      ).toHaveLength(0);
    });

    it('dispara onRowClick com a linha original quando a linha é clicada', async () => {
      const handleRowClick = vi.fn();

      render(
        <DataTable
          columns={columns}
          data={data}
          pageIndex={0}
          onPageChange={() => undefined}
          onRowClick={handleRowClick}
        />
      );

      await userEvent.click(screen.getByText('ana@example.com'));

      expect(handleRowClick).toHaveBeenCalledTimes(1);
      expect(handleRowClick).toHaveBeenCalledWith(data[0]);
    });

    it('dispara onRowClick ao pressionar Enter com a linha focada', async () => {
      const handleRowClick = vi.fn();

      render(
        <DataTable
          columns={columns}
          data={data}
          pageIndex={0}
          onPageChange={() => undefined}
          onRowClick={handleRowClick}
        />
      );

      const rows = screen.getAllByRole('button');
      const firstRow = rows.find((el) => el.tagName === 'TR');
      expect(firstRow).toBeDefined();

      firstRow!.focus();
      await userEvent.keyboard('{Enter}');

      expect(handleRowClick).toHaveBeenCalledWith(data[0]);
    });

    it('não dispara onRowClick ao clicar no menu de ações da linha', async () => {
      const handleRowClick = vi.fn();
      const handleAction = vi.fn();

      const columnsWithActions = [
        ...columns,
        actionsColumn<Row>({
          actions: [{ label: 'Editar', onSelect: handleAction }],
        }),
      ];

      render(
        <DataTable
          columns={columnsWithActions}
          data={data}
          pageIndex={0}
          onPageChange={() => undefined}
          onRowClick={handleRowClick}
        />
      );

      const triggers = screen.getAllByRole('button', { name: 'Abrir menu' });
      await userEvent.click(triggers[0]);

      expect(handleRowClick).not.toHaveBeenCalled();

      await userEvent.click(screen.getByRole('menuitem', { name: 'Editar' }));

      expect(handleAction).toHaveBeenCalledWith(data[0]);
      expect(handleRowClick).not.toHaveBeenCalled();
    });

    it('não dispara onRowClick ao clicar no checkbox de seleção', async () => {
      const handleRowClick = vi.fn();

      const columnsWithSelect = [selectColumn<Row>(), ...columns];

      render(
        <DataTable
          columns={columnsWithSelect}
          data={data}
          pageIndex={0}
          onPageChange={() => undefined}
          onRowClick={handleRowClick}
        />
      );

      const rowCheckbox = screen.getAllByRole('checkbox', {
        name: 'Selecionar linha',
      })[0];
      await userEvent.click(rowCheckbox);

      expect(handleRowClick).not.toHaveBeenCalled();
    });

    it('não dispara onRowClick quando há seleção de texto ativa (permite copiar)', async () => {
      const handleRowClick = vi.fn();
      // Simula uma seleção de texto ativa no momento do clique — o usuário
      // arrastou para selecionar o conteúdo da célula e quer copiar, não abrir.
      const selectionSpy = vi.spyOn(window, 'getSelection').mockReturnValue({
        isCollapsed: false,
        toString: () => 'ana@example.com',
      } as unknown as Selection);

      render(
        <DataTable
          columns={columns}
          data={data}
          pageIndex={0}
          onPageChange={() => undefined}
          onRowClick={handleRowClick}
        />
      );

      await userEvent.click(screen.getByText('ana@example.com'));

      expect(handleRowClick).not.toHaveBeenCalled();
      selectionSpy.mockRestore();
    });
  });

  describe('renderSubRow', () => {
    const data: Row[] = [
      { id: '1', email: 'ana@example.com' },
      { id: '2', email: 'joao@example.com' },
    ];

    it('não renderiza o conteúdo expandido até clicar no chevron', async () => {
      render(
        <DataTable
          columns={columns}
          data={data}
          pageIndex={0}
          onPageChange={() => undefined}
          renderSubRow={(row) => <div>Detalhes de {row.email}</div>}
        />
      );

      expect(
        screen.queryByText('Detalhes de ana@example.com')
      ).not.toBeInTheDocument();

      const [firstToggle] = screen.getAllByRole('button', {
        name: 'Expandir linha',
      });
      await userEvent.click(firstToggle);

      expect(
        screen.getByText('Detalhes de ana@example.com')
      ).toBeInTheDocument();
      // Só a linha clicada expande.
      expect(
        screen.queryByText('Detalhes de joao@example.com')
      ).not.toBeInTheDocument();
    });

    it('expandir a linha não dispara onRowClick', async () => {
      const handleRowClick = vi.fn();

      render(
        <DataTable
          columns={columns}
          data={data}
          pageIndex={0}
          onPageChange={() => undefined}
          onRowClick={handleRowClick}
          renderSubRow={(row) => <div>Detalhes de {row.email}</div>}
        />
      );

      await userEvent.click(
        screen.getAllByRole('button', { name: 'Expandir linha' })[0]
      );

      expect(
        screen.getByText('Detalhes de ana@example.com')
      ).toBeInTheDocument();
      expect(handleRowClick).not.toHaveBeenCalled();
    });
  });

  describe('getRowHref', () => {
    const data: Row[] = [
      { id: '1', email: 'ana@example.com' },
      { id: '2', email: 'joao@example.com' },
    ];

    function renderNavigable() {
      const handleRowClick = vi.fn();
      render(
        <DataTable
          columns={columns}
          data={data}
          pageIndex={0}
          onPageChange={() => undefined}
          onRowClick={handleRowClick}
          getRowHref={(row) => `/users/${row.id}`}
        />
      );
      return handleRowClick;
    }

    function firstRow() {
      return screen
        .getAllByRole('link')
        .find((element) => element.tagName === 'TR')!;
    }

    it('expõe cada linha com role="link" quando getRowHref é definido', () => {
      renderNavigable();

      const linkRows = screen
        .getAllByRole('link')
        .filter((element) => element.tagName === 'TR');
      expect(linkRows).toHaveLength(2);
    });

    it('abre o destino em nova aba no clique do meio (scroll)', async () => {
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
      const handleRowClick = renderNavigable();

      await userEvent.pointer({
        keys: '[MouseMiddle]',
        target: firstRow(),
      });

      expect(openSpy).toHaveBeenCalledWith(
        '/users/1',
        '_blank',
        'noopener,noreferrer'
      );
      expect(handleRowClick).not.toHaveBeenCalled();

      openSpy.mockRestore();
    });

    it('abre em nova aba com Ctrl+clique sem disparar a navegação da linha', async () => {
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
      const handleRowClick = renderNavigable();
      const user = userEvent.setup();

      await user.keyboard('{Control>}');
      await user.click(firstRow());
      await user.keyboard('{/Control}');

      expect(openSpy).toHaveBeenCalledWith(
        '/users/1',
        '_blank',
        'noopener,noreferrer'
      );
      expect(handleRowClick).not.toHaveBeenCalled();

      openSpy.mockRestore();
    });

    it('clique normal dispara onRowClick e não abre nova aba', async () => {
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
      const handleRowClick = renderNavigable();

      await userEvent.click(screen.getByText('ana@example.com'));

      expect(handleRowClick).toHaveBeenCalledWith(data[0]);
      expect(openSpy).not.toHaveBeenCalled();

      openSpy.mockRestore();
    });
  });

  describe('ordenação visível', () => {
    const data: Row[] = [
      { id: '1', email: 'ana@example.com' },
      { id: '2', email: 'joao@example.com' },
    ];
    const sortableColumns: DataTableColumnDef<Row>[] = [
      {
        accessorKey: 'email',
        header: ({ column }) => (
          <SortableHeader column={column}>E-mail</SortableHeader>
        ),
      },
      {
        accessorKey: 'id',
        enableSorting: false,
        header: 'Código',
      },
    ];

    const arrow = () =>
      screen.getByRole('button', { name: 'E-mail' }).querySelector('svg');

    function renderSorted(sorting: { id: string; desc: boolean }[]) {
      render(
        <DataTable
          columns={sortableColumns}
          data={data}
          pageIndex={0}
          onPageChange={() => undefined}
          sorting={sorting}
        />
      );
    }

    it('reflete o `sorting` vindo por fora: `aria-sort` e seta para baixo', () => {
      renderSorted([{ id: 'email', desc: true }]);

      expect(
        screen.getByRole('columnheader', { name: 'E-mail' })
      ).toHaveAttribute('aria-sort', 'descending');
      expect(arrow()).toHaveClass('lucide-arrow-down');
    });

    it('`aria-sort` ascending com seta para cima', () => {
      renderSorted([{ id: 'email', desc: false }]);

      expect(
        screen.getByRole('columnheader', { name: 'E-mail' })
      ).toHaveAttribute('aria-sort', 'ascending');
      expect(arrow()).toHaveClass('lucide-arrow-up');
    });

    it('sem ordenação, sem `aria-sort` e com seta dupla', () => {
      renderSorted([]);

      expect(
        screen.getByRole('columnheader', { name: 'E-mail' })
      ).not.toHaveAttribute('aria-sort');
      expect(arrow()).toHaveClass('lucide-arrow-up-down');
    });

    it('`sort` para coluna com `enableSorting: false` não anuncia nada', () => {
      renderSorted([{ id: 'id', desc: false }]);

      expect(
        screen.getByRole('columnheader', { name: 'Código' })
      ).not.toHaveAttribute('aria-sort');
    });

    it('controlada, não guarda cópia: o clique só avisa e a seta segue a prop', async () => {
      const onSortingChange = vi.fn();
      render(
        <DataTable
          columns={sortableColumns}
          data={data}
          pageIndex={0}
          onPageChange={() => undefined}
          sorting={[]}
          onSortingChange={onSortingChange}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: 'E-mail' }));

      expect(onSortingChange).toHaveBeenCalledWith([
        { id: 'email', desc: false },
      ]);
      expect(arrow()).toHaveClass('lucide-arrow-up-down');
    });

    it('com `sorting` em desc, o clique pede asc (alterna a partir do valor de fora)', async () => {
      const onSortingChange = vi.fn();
      render(
        <DataTable
          columns={sortableColumns}
          data={data}
          pageIndex={0}
          onPageChange={() => undefined}
          sorting={[{ id: 'email', desc: true }]}
          onSortingChange={onSortingChange}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: 'E-mail' }));

      expect(onSortingChange).toHaveBeenCalledWith([
        { id: 'email', desc: false },
      ]);
    });

    it('a seta só muda quando o valor novo volta pela prop (rerender)', async () => {
      const props = {
        columns: sortableColumns,
        data,
        pageIndex: 0,
        onPageChange: () => undefined,
        onSortingChange: () => undefined,
      };
      const { rerender } = render(<DataTable {...props} sorting={[]} />);

      await userEvent.click(screen.getByRole('button', { name: 'E-mail' }));
      expect(
        screen.getByRole('columnheader', { name: 'E-mail' })
      ).not.toHaveAttribute('aria-sort');

      rerender(
        <DataTable {...props} sorting={[{ id: 'email', desc: false }]} />
      );
      expect(
        screen.getByRole('columnheader', { name: 'E-mail' })
      ).toHaveAttribute('aria-sort', 'ascending');
    });

    it('ida e volta com o consumidor guardando o estado: asc, desc, asc', async () => {
      function Controlled() {
        const [sorting, setSorting] = useState<SortingState>([]);
        return (
          <DataTable
            columns={sortableColumns}
            data={data}
            pageIndex={0}
            onPageChange={() => undefined}
            sorting={sorting}
            onSortingChange={setSorting}
          />
        );
      }
      render(<Controlled />);
      const header = screen.getByRole('columnheader', { name: 'E-mail' });
      const button = screen.getByRole('button', { name: 'E-mail' });

      await userEvent.click(button);
      expect(header).toHaveAttribute('aria-sort', 'ascending');
      await userEvent.click(button);
      expect(header).toHaveAttribute('aria-sort', 'descending');
      await userEvent.click(button);
      expect(header).toHaveAttribute('aria-sort', 'ascending');
    });

    it('sem a prop, guarda o estado sozinha e a seta muda com `sortDescFirst`', async () => {
      const onSortingChange = vi.fn();
      const descFirstColumns: DataTableColumnDef<Row>[] = [
        { ...sortableColumns[0], sortDescFirst: true },
      ];
      render(
        <DataTable
          columns={descFirstColumns}
          data={data}
          pageIndex={0}
          onPageChange={() => undefined}
          onSortingChange={onSortingChange}
        />
      );
      const header = screen.getByRole('columnheader', { name: 'E-mail' });

      await userEvent.click(screen.getByRole('button', { name: 'E-mail' }));

      expect(onSortingChange).toHaveBeenLastCalledWith([
        { id: 'email', desc: true },
      ]);
      expect(header).toHaveAttribute('aria-sort', 'descending');
      expect(arrow()).toHaveClass('lucide-arrow-down');

      await userEvent.click(screen.getByRole('button', { name: 'E-mail' }));

      expect(header).toHaveAttribute('aria-sort', 'ascending');
      expect(arrow()).toHaveClass('lucide-arrow-up');
    });
  });

  describe('seleção controlada', () => {
    const data: Row[] = [
      { id: '1', email: 'ana@example.com' },
      { id: '2', email: 'joao@example.com' },
    ];

    function renderSelectable(
      rowSelection: RowSelectionState,
      onRowSelectionChange = vi.fn()
    ) {
      render(
        <DataTable
          columns={[
            selectColumn<Row>({ rowLabel: (row) => `Selecionar ${row.email}` }),
            ...columns,
          ]}
          data={data}
          pageIndex={0}
          onPageChange={() => undefined}
          getRowId={(row) => row.id}
          rowSelection={rowSelection}
          onRowSelectionChange={onRowSelectionChange}
        />
      );
      return onRowSelectionChange;
    }

    it('reflete a seleção recebida pelos ids de `getRowId`', () => {
      renderSelectable({ [data[1].id]: true });

      expect(
        screen.getByRole('checkbox', { name: `Selecionar ${data[0].email}` })
      ).not.toBeChecked();
      expect(
        screen.getByRole('checkbox', { name: `Selecionar ${data[1].email}` })
      ).toBeChecked();
    });

    it('avisa a seleção inteira nova e não guarda cópia própria', async () => {
      const onRowSelectionChange = renderSelectable({ [data[1].id]: true });

      await userEvent.click(
        screen.getByRole('checkbox', { name: `Selecionar ${data[0].email}` })
      );

      expect(onRowSelectionChange).toHaveBeenCalledWith({
        [data[1].id]: true,
        [data[0].id]: true,
      });
      expect(
        screen.getByRole('checkbox', { name: `Selecionar ${data[0].email}` })
      ).not.toBeChecked();
    });

    function Controlled({ rows }: { rows: Row[] }) {
      const [selection, setSelection] = useState<RowSelectionState>({});
      return (
        <>
          <output aria-label="Selecionados">
            {Object.keys(selection).sort().join(',')}
          </output>
          <button type="button" onClick={() => setSelection({})}>
            Limpar seleção
          </button>
          <DataTable
            columns={[
              selectColumn<Row>({
                rowLabel: (row) => `Selecionar ${row.email}`,
              }),
              ...columns,
            ]}
            data={rows}
            pageIndex={0}
            onPageChange={() => undefined}
            getRowId={(row) => row.id}
            rowSelection={selection}
            onRowSelectionChange={setSelection}
          />
        </>
      );
    }

    const headerCheckbox = () =>
      screen.getByRole('checkbox', {
        name: 'Selecionar todas as linhas da página',
      });

    it('"selecionar todas" marca as linhas da página e desmarca de volta', async () => {
      render(<Controlled rows={data} />);

      await userEvent.click(headerCheckbox());
      expect(
        screen.getByRole('status', { name: 'Selecionados' })
      ).toHaveTextContent('1,2');
      expect(headerCheckbox()).toBeChecked();

      await userEvent.click(headerCheckbox());
      expect(
        screen.getByRole('status', { name: 'Selecionados' })
      ).toBeEmptyDOMElement();
    });

    it('com uma linha marcada de duas, o cabeçalho fica no estado intermediário', async () => {
      render(<Controlled rows={data} />);

      await userEvent.click(
        screen.getByRole('checkbox', { name: `Selecionar ${data[0].email}` })
      );

      expect(headerCheckbox()).toHaveAttribute('data-state', 'indeterminate');
      expect(headerCheckbox()).toHaveAttribute('aria-checked', 'mixed');
    });

    it('o consumidor limpa a seleção por fora e a tabela reflete', async () => {
      render(<Controlled rows={data} />);

      await userEvent.click(headerCheckbox());
      await userEvent.click(
        screen.getByRole('button', { name: 'Limpar seleção' })
      );

      expect(headerCheckbox()).not.toBeChecked();
      for (const row of data) {
        expect(
          screen.getByRole('checkbox', { name: `Selecionar ${row.email}` })
        ).not.toBeChecked();
      }
    });

    it('com `getRowId`, mesmos ids mantêm a marca e ids novos não herdam', () => {
      const props = {
        columns: [
          selectColumn<Row>({ rowLabel: (row) => `Selecionar ${row.email}` }),
          ...columns,
        ],
        pageIndex: 0,
        onPageChange: () => undefined,
        getRowId: (row: Row) => row.id,
        rowSelection: { '1': true } as RowSelectionState,
      };
      const { rerender } = render(<DataTable {...props} data={data} />);
      expect(
        screen.getByRole('checkbox', { name: `Selecionar ${data[0].email}` })
      ).toBeChecked();

      rerender(
        <DataTable
          {...props}
          data={[{ id: '9', email: 'nova@example.com' }, data[0]]}
        />
      );
      expect(
        screen.getByRole('checkbox', { name: 'Selecionar nova@example.com' })
      ).not.toBeChecked();
      expect(
        screen.getByRole('checkbox', { name: `Selecionar ${data[0].email}` })
      ).toBeChecked();
    });

    it('o cabeçalho usa `headerLabel` e a linha cai no rótulo padrão sem `rowLabel`', () => {
      render(
        <DataTable
          columns={[
            selectColumn<Row>({ headerLabel: 'Marcar tudo' }),
            ...columns,
          ]}
          data={data}
          pageIndex={0}
          onPageChange={() => undefined}
        />
      );

      expect(
        screen.getByRole('checkbox', { name: 'Marcar tudo' })
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole('checkbox', { name: 'Selecionar linha' })
      ).toHaveLength(data.length);
    });
  });

  describe('isRowClickable', () => {
    const data: Row[] = [
      { id: '1', email: 'ana@example.com' },
      { id: '2', email: 'joao@example.com' },
    ];

    it('falso: sem `role`, sem foco, sem cursor e sem disparar `onRowClick`', async () => {
      const handleRowClick = vi.fn();
      render(
        <DataTable
          columns={columns}
          data={data}
          pageIndex={0}
          onPageChange={() => undefined}
          onRowClick={handleRowClick}
          isRowClickable={(row) => row.id !== data[0].id}
        />
      );
      const blockedRow = screen.getByText(data[0].email).closest('tr')!;
      const openRow = screen.getByText(data[1].email).closest('tr')!;

      expect(blockedRow).not.toHaveAttribute('role');
      expect(blockedRow).not.toHaveAttribute('tabindex');
      expect(blockedRow).not.toHaveClass('cursor-pointer');
      expect(openRow).toHaveAttribute('role', 'button');
      expect(openRow).toHaveAttribute('tabindex', '0');

      await userEvent.click(blockedRow);
      expect(handleRowClick).not.toHaveBeenCalled();

      await userEvent.click(openRow);
      expect(handleRowClick).toHaveBeenCalledWith(data[1]);
    });
  });
});
