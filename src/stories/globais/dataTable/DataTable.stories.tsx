import * as React from 'react';
import { type ColumnDef, type SortingState } from '@tanstack/react-table';
import { toast } from 'sonner';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import {
  actionsColumn,
  selectColumn,
  SortableHeader,
} from '@/components/global/dataTable/columnHelpers';
import { DataTable } from '@/components/global/dataTable/dataTable';
import {
  dateFilter,
  dateRangeFilter,
  multiSelectFilter,
  textFilter,
  type DataTableFilterValues,
  type DateRangeValue,
} from '@/components/global/dataTable/filters';
import { useDataTableQuery } from '@/components/global/dataTable/useDataTableQuery';
import { columnVisibilityStorageKey } from '@/components/global/dataTable/useColumnVisibility';
import { Card } from '@/components/global/card/card';

type Payment = {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  email: string;
  /** Data de criação no formato ISO curto (`aaaa-mm-dd`). */
  createdAt: string;
};

const columns: ColumnDef<Payment>[] = [
  selectColumn(),
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <SortableHeader column={column}>E-mail</SortableHeader>
    ),
    meta: { label: 'E-mail' },
  },
  {
    accessorKey: 'amount',
    header: 'Valor',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(amount);

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <SortableHeader column={column}>Criado em</SortableHeader>
    ),
    meta: { label: 'Criado em' },
    cell: ({ row }) => {
      const [year, month, day] = (row.getValue('createdAt') as string).split(
        '-'
      );
      return `${day}/${month}/${year}`;
    },
  },
  actionsColumn<Payment>({
    label: 'Ações',
    actions: [
      {
        label: 'Copiar ID do pagamento',
        onSelect: (payment) => {
          navigator.clipboard.writeText(payment.id);
          toast.success('ID copiado para a área de transferência.');
        },
      },
      {
        label: 'Ver cliente',
        separatorBefore: true,
        onSelect: (payment) => toast(`Cliente: ${payment.email}`),
      },
      {
        label: 'Ver detalhes do pagamento',
        onSelect: (payment) =>
          toast(`Pagamento ${payment.id}: R$ ${payment.amount}`),
      },
    ],
  }),
];

const filters = [
  textFilter({
    key: 'email',
    label: 'E-mail',
    placeholder: 'Buscar por e-mail...',
  }),
  multiSelectFilter({
    key: 'status',
    label: 'Status',
    placeholder: 'Todos os status',
    options: [
      { value: 'pending', label: 'Pendente' },
      { value: 'processing', label: 'Processando' },
      { value: 'success', label: 'Pago' },
      { value: 'failed', label: 'Falhou' },
    ],
  }),
  dateFilter({ key: 'createdAt', label: 'Criado em' }),
  dateRangeFilter({ key: 'period', label: 'Período' }),
];

const DATABASE: Payment[] = [
  {
    id: '728ed52f',
    amount: 100,
    status: 'pending',
    email: 'm@example.com',
    createdAt: '2026-01-05',
  },
  {
    id: '489e1d42',
    amount: 125,
    status: 'processing',
    email: 'example@gmail.com',
    createdAt: '2026-01-18',
  },
  {
    id: 'a3f9c1b8',
    amount: 250,
    status: 'success',
    email: 'ana.silva@example.com',
    createdAt: '2026-02-02',
  },
  {
    id: 'c7d2e4a1',
    amount: 75,
    status: 'failed',
    email: 'joao@empresa.com.br',
    createdAt: '2026-02-14',
  },
  {
    id: 'f1b6a9e3',
    amount: 320,
    status: 'success',
    email: 'maria@example.com',
    createdAt: '2026-03-01',
  },
  {
    id: 'b2c8d5f7',
    amount: 45,
    status: 'pending',
    email: 'carlos@example.com',
    createdAt: '2026-03-09',
  },
  {
    id: 'e9a4c6b2',
    amount: 180,
    status: 'processing',
    email: 'beatriz@example.com',
    createdAt: '2026-03-22',
  },
  {
    id: 'd5f3b8a6',
    amount: 99,
    status: 'success',
    email: 'pedro@example.com',
    createdAt: '2026-04-04',
  },
  {
    id: 'a8c2e7d9',
    amount: 410,
    status: 'failed',
    email: 'lucas@example.com',
    createdAt: '2026-04-17',
  },
  {
    id: 'c4b9f1e5',
    amount: 60,
    status: 'pending',
    email: 'julia@example.com',
    createdAt: '2026-05-01',
  },
  {
    id: 'f7d3a2c8',
    amount: 215,
    status: 'success',
    email: 'rafael@example.com',
    createdAt: '2026-05-12',
  },
  {
    id: 'b1e6c9a4',
    amount: 88,
    status: 'processing',
    email: 'fernanda@example.com',
    createdAt: '2026-05-20',
  },
];

const PAGE_SIZE = 5;

function sortValue(payment: Payment, columnId: string): string {
  return columnId === 'email' ? payment.email : payment.createdAt;
}

function queryDatabase(
  filterValues: DataTableFilterValues,
  sorting: SortingState,
  pageIndex: number
): Payment[] {
  const email =
    typeof filterValues.email === 'string'
      ? filterValues.email.toLowerCase()
      : '';
  const statuses = Array.isArray(filterValues.status)
    ? filterValues.status
    : [];
  const createdAt =
    typeof filterValues.createdAt === 'string' ? filterValues.createdAt : '';
  const period: DateRangeValue =
    filterValues.period &&
    !Array.isArray(filterValues.period) &&
    typeof filterValues.period === 'object'
      ? filterValues.period
      : { from: '', to: '' };

  const matches = DATABASE.filter((payment) => {
    if (email && !payment.email.toLowerCase().includes(email)) return false;
    if (statuses.length > 0 && !statuses.includes(payment.status)) return false;
    if (createdAt && payment.createdAt !== createdAt) return false;
    if (period.from && payment.createdAt < period.from) return false;
    if (period.to && payment.createdAt > period.to) return false;
    return true;
  });

  const sort = sorting[0];
  const ordered = sort
    ? [...matches].sort((a, b) => {
        const result = sortValue(a, sort.id).localeCompare(
          sortValue(b, sort.id)
        );
        return sort.desc ? -result : result;
      })
    : matches;

  return ordered.slice(
    pageIndex * PAGE_SIZE,
    pageIndex * PAGE_SIZE + PAGE_SIZE
  );
}

function PaymentsTable() {
  const { query, tableProps } = useDataTableQuery({
    pageSize: PAGE_SIZE,
    defaultFilters: {
      status: ['success', 'pending'],
      period: { from: '2026-02-01', to: '2026-05-31' },
    },
    defaultSorting: [{ id: 'createdAt', desc: true }],
  });

  const pageData = queryDatabase(query.filters, query.sort, query.page);

  return (
    <DataTable
      columns={columns}
      data={pageData}
      filters={filters}
      onRowClick={(payment) =>
        toast(`Abrir detalhes de ${payment.email} (R$ ${payment.amount})`)
      }
      getRowHref={(payment) => `/payments/${payment.id}`}
      columnVisibilityKey="storybook-payments"
      {...tableProps}
    />
  );
}

function DataTableDemo() {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:rounded-3xl sm:p-5 dark:shadow-none">
      <PaymentsTable />
    </div>
  );
}

const meta = {
  title: 'Globais/DataTable',
  component: DataTableDemo,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Tabela 100% server-side: filtros, ordenação e paginação são delegados ao backend. Os filtros vão ao servidor ao clicar em **Buscar**, clicar num cabeçalho reordena no servidor, e **Próxima** é desabilitado quando a página vem incompleta. Cada linha é clicável: o clique normal dispara `onRowClick` (aqui, um toast); com `getRowHref`, o clique do meio (scroll) ou Ctrl/Cmd/Shift+clique abrem o destino em nova aba, como um link nativo. O ícone de colunas, no canto direito do cabeçalho, oculta/exibe colunas, e a escolha fica salva neste navegador (`columnVisibilityKey`). Esta story usa `useDataTableQuery` (estado local) em vez de `useDataTableUrlQuery` para não depender do TanStack Router.',
      },
    },
  },
} satisfies Meta<typeof DataTableDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ServerSide: Story = {};

const LOADING_MS = 1500;

function useDeferredQueryDatabase(
  filters: DataTableFilterValues,
  sort: SortingState,
  page: number
) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [data, setData] = React.useState<Payment[]>([]);

  React.useEffect(() => {
    setIsLoading(true);
    const timeout = setTimeout(() => {
      setData(queryDatabase(filters, sort, page));
      setIsLoading(false);
    }, LOADING_MS);
    return () => clearTimeout(timeout);
  }, [filters, sort, page]);

  return { data, isLoading };
}

function DataTableLoadingDemo() {
  const { query, tableProps } = useDataTableQuery({
    pageSize: PAGE_SIZE,
    defaultSorting: [{ id: 'createdAt', desc: true }],
  });

  const { data, isLoading } = useDeferredQueryDatabase(
    query.filters,
    query.sort,
    query.page
  );

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:rounded-3xl sm:p-5 dark:shadow-none">
      <DataTable
        columns={columns}
        data={data}
        filters={filters}
        isLoading={isLoading}
        {...tableProps}
      />
    </div>
  );
}

export const Loading: Story = {
  render: () => <DataTableLoadingDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Quando `isLoading` é `true`, a tabela renderiza `pageSize` linhas de skeleton no lugar das células — header, filtros e paginação permanecem visíveis (a paginação fica desabilitada). Cada troca de filtro, ordenação ou página dispara um novo loading de 1,5s para demonstrar o estado.',
      },
    },
  },
};

type Role = {
  id: string;
  name: string;
  description: string;
  permissions: number;
  users: number;
};

const roleColumns: ColumnDef<Role>[] = [
  { accessorKey: 'name', header: 'Nome' },
  { accessorKey: 'description', header: 'Descrição' },
  { accessorKey: 'permissions', header: 'Permissões' },
  { accessorKey: 'users', header: 'Usuários' },
];

const ROLES: Role[] = [
  {
    id: '1',
    name: 'Administrador',
    description: 'Acesso total a todos os módulos e permissões do sistema.',
    permissions: 81,
    users: 1,
  },
  {
    id: '2',
    name: 'Backoffice — Completo',
    description:
      'Acesso ao Backoffice com CRUD completo de usuários, clientes, indicadores e cargos.',
    permissions: 18,
    users: 4,
  },
  {
    id: '3',
    name: 'Expedição — Completo',
    description:
      'Acesso à Expedição com CRUD completo de pedidos, lotes, faturamento, vendedores, unidades de faturamento e tipos de embalagem.',
    permissions: 29,
    users: 53,
  },
  {
    id: '4',
    name: 'Laboratório — Completo',
    description:
      'Acesso ao Laboratório com CRUD completo de matrizes, equações, perfis de teste, especificações e amostras.',
    permissions: 23,
    users: 53,
  },
];

function RolesDemo() {
  const [pageIndex, setPageIndex] = React.useState(0);
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:rounded-3xl sm:p-5 dark:shadow-none">
      <DataTable
        columns={roleColumns}
        data={ROLES}
        pageIndex={pageIndex}
        onPageChange={setPageIndex}
        pageSize={ROLES.length}
      />
    </div>
  );
}

export const LongText: Story = {
  render: () => <RolesDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Descrições longas (com ou sem espaços) são truncadas com reticências por padrão, respeitando a largura máxima da célula — o texto não estoura nem invade a coluna vizinha. Uma coluna que precise de mais espaço sobrescreve via `meta.className` (`max-w-[600px]`, `max-w-none`).',
      },
    },
  },
};

/**
 * Grava uma escolha de colunas de exemplo ANTES da tabela montar (o
 * inicializador do `useState` roda antes dos filhos), para a vitrine abrir já
 * no estado demonstrado. Recarregar a story volta ao exemplo.
 */
function useSeededHiddenColumns(tableKey: string, hidden: string[]) {
  React.useState(() => {
    try {
      localStorage.setItem(
        columnVisibilityStorageKey(tableKey),
        JSON.stringify(hidden)
      );
    } catch {
      // Armazenamento bloqueado: a tabela abre com todas as colunas.
    }
    return null;
  });
}

function RolesTable({ tableKey }: { tableKey: string }) {
  return (
    <DataTable
      columns={roleColumns}
      data={ROLES}
      pageIndex={0}
      onPageChange={() => undefined}
      pageSize={ROLES.length}
      columnVisibilityKey={tableKey}
    />
  );
}

const SAVED_KEY = 'storybook-roles-saved';
const LAST_COLUMN_KEY = 'storybook-roles-last-column';

function ColumnVisibilityShowcase() {
  useSeededHiddenColumns(SAVED_KEY, ['description', 'permissions']);
  useSeededHiddenColumns(LAST_COLUMN_KEY, [
    'description',
    'permissions',
    'users',
  ]);

  return (
    <div className="space-y-4">
      <Card
        title="Sem coluna de ações"
        description="Quando a última coluna é de dado, a tabela ganha uma coluna estreita no fim só para o ícone de colunas, no canto direito do cabeçalho. A escolha é salva neste navegador."
      >
        <RolesTable tableKey="storybook-roles" />
      </Card>
      <Card
        title="Com coluna de ações"
        description="Quando a última coluna é de sistema (⋯ ou Ações), o ícone entra no cabeçalho dela, sem coluna extra. Age na hora, sem esperar o Buscar. Colunas com SortableHeader precisam de meta.label para aparecer no menu; seleção e ações nunca aparecem."
      >
        <PaymentsTable />
      </Card>
      <Card
        title="Escolha já salva"
        description="A tabela abre com Descrição e Permissões ocultas, lidas do localStorage. Use Mostrar todas para voltar ao padrão."
      >
        <RolesTable tableKey={SAVED_KEY} />
      </Card>
      <Card
        title="Última coluna travada"
        description="Só Nome está visível: o item fica desabilitado no menu para a tabela nunca ficar sem colunas."
      >
        <RolesTable tableKey={LAST_COLUMN_KEY} />
      </Card>
    </div>
  );
}

export const ColumnVisibility: Story = {
  name: 'Colunas',
  render: () => <ColumnVisibilityShowcase />,
  parameters: {
    docs: {
      description: {
        story:
          'Com `columnVisibilityKey`, a tabela ganha o ícone **Configurar colunas** no canto direito do cabeçalho: o usuário escolhe quais colunas ver e a escolha fica salva só neste navegador (`localStorage`), sem ir para a URL. Só as colunas ocultas são gravadas, então uma coluna nova aparece visível para todos.',
      },
    },
  },
};
