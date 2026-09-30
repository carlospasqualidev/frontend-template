import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ActivityTab } from '@/screens/users/details/activityTab';
import {
  fetchEntityAuditLogs,
  type EntityAuditLog,
} from '@/services/audit/auditApi';

// Mocka só o transporte da linha do tempo; o resto do serviço é o real.
vi.mock('@/services/audit/auditApi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/audit/auditApi')>();
  return { ...actual, fetchEntityAuditLogs: vi.fn() };
});

const USER = {
  id: '01a0f253-fc4e-745c-b069-dff39ba3116e',
  name: 'Camila Oliveira',
};

function makeLog(overrides: Partial<EntityAuditLog> = {}): EntityAuditLog {
  return {
    id: 'log_001',
    module: 'SECURITY',
    entity: 'User',
    entityId: USER.id,
    action: 'statusChange',
    description: 'Bloqueou o usuário "Camila Oliveira".',
    changedFields: ['isActive'],
    userId: 'u_008',
    userName: 'Henrique Pereira',
    createdAt: '2025-09-02T18:45:00.000Z',
    fieldChanges: [
      { field: 'isActive', label: 'Ativo', from: 'Sim', to: 'Não' },
    ],
    ...overrides,
  };
}

function makeLogs(total: number, offset = 0): EntityAuditLog[] {
  return Array.from({ length: total }, (_, index) =>
    makeLog({
      id: `log_${offset + index}`,
      action: 'login',
      description: `Entrou no sistema (${offset + index}).`,
      changedFields: [],
      fieldChanges: [],
    })
  );
}

let queryClient: QueryClient;

function renderActivity(initialPath = '/') {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <ActivityTab userId={USER.id} />,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
  return router;
}

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  vi.mocked(fetchEntityAuditLogs).mockReset();
});

afterEach(() => {
  queryClient.clear();
});

describe('ActivityTab', () => {
  it('enquanto carrega, mostra o esqueleto dentro do card da linha do tempo', async () => {
    vi.mocked(fetchEntityAuditLogs).mockReturnValue(new Promise(() => {}));
    renderActivity();

    // O card (título e descrição) já aparece; só os itens ficam no esqueleto.
    const card = (await screen.findByText('Linha do tempo')).closest(
      '[data-slot="card"]'
    );
    expect(card).not.toBeNull();
    const skeleton = card?.querySelector('ol[aria-hidden="true"]');
    expect(skeleton).not.toBeNull();
    expect(skeleton?.querySelectorAll('li')).toHaveLength(4);
    // Nada de evento, estado vazio nem paginação antes da resposta.
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Sem atividade registrada')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Próxima' })
    ).not.toBeInTheDocument();
  });

  it('busca a linha do tempo do usuário e mostra frase, autor e o de→para', async () => {
    vi.mocked(fetchEntityAuditLogs).mockResolvedValue({
      logs: [makeLog()],
      count: 1,
    });
    renderActivity();

    expect(
      await screen.findByText('Bloqueou o usuário "Camila Oliveira".')
    ).toBeInTheDocument();
    expect(screen.getByText(/Henrique Pereira ·/)).toBeInTheDocument();
    expect(screen.getByRole('term')).toHaveTextContent('Ativo:');
    expect(screen.getByRole('definition')).toHaveTextContent('de Sim para Não');
    expect(fetchEntityAuditLogs).toHaveBeenCalledWith({
      entity: 'User',
      entityId: USER.id,
      page: 0,
      pageSize: 10,
    });
    // Uma página só: sem paginação.
    expect(
      screen.queryByRole('button', { name: 'Próxima' })
    ).not.toBeInTheDocument();
  });

  it('mostra "Sistema" quando o evento não tem autor e omite o de→para vazio', async () => {
    vi.mocked(fetchEntityAuditLogs).mockResolvedValue({
      logs: [
        makeLog({
          action: 'login',
          description: 'Entrou no sistema.',
          userId: null,
          userName: null,
          changedFields: [],
          fieldChanges: [],
        }),
      ],
      count: 1,
    });
    renderActivity();

    expect(await screen.findByText(/Sistema ·/)).toBeInTheDocument();
    expect(screen.queryByRole('term')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Nenhum campo alterado neste evento.')
    ).not.toBeInTheDocument();
  });

  it('mostra o estado vazio quando o usuário não tem eventos', async () => {
    vi.mocked(fetchEntityAuditLogs).mockResolvedValue({ logs: [], count: 0 });
    renderActivity();

    expect(
      await screen.findByText('Sem atividade registrada')
    ).toBeInTheDocument();
  });

  it('pagina pela URL: "Próxima" grava activityPage e busca a página seguinte', async () => {
    vi.mocked(fetchEntityAuditLogs).mockImplementation(async ({ page }) => ({
      logs: page === 0 ? makeLogs(10) : makeLogs(2, 10),
      count: 12,
    }));
    const router = renderActivity();
    const user = userEvent.setup();

    expect(await screen.findByText('1–10 de 12 eventos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Próxima' }));

    expect(await screen.findByText('11–12 de 12 eventos')).toBeInTheDocument();
    expect(router.state.location.search).toEqual({ activityPage: 1 });
    expect(fetchEntityAuditLogs).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1 })
    );
    expect(screen.getByText('Entrou no sistema (11).')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();

    // Voltar à primeira página limpa o parâmetro da URL.
    await user.click(screen.getByRole('button', { name: 'Anterior' }));
    await waitFor(() => expect(router.state.location.search).toEqual({}));
  });

  it('abre na página indicada pela URL', async () => {
    vi.mocked(fetchEntityAuditLogs).mockResolvedValue({
      logs: makeLogs(2, 10),
      count: 12,
    });
    renderActivity('/?activityPage=1');

    expect(await screen.findByText('11–12 de 12 eventos')).toBeInTheDocument();
    expect(fetchEntityAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 })
    );
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled();
  });

  it('página que não existe mais leva de volta à primeira', async () => {
    vi.mocked(fetchEntityAuditLogs).mockImplementation(async ({ page }) => ({
      logs: page === 0 ? makeLogs(3) : [],
      count: 3,
    }));
    const router = renderActivity('/?activityPage=4');
    const user = userEvent.setup();

    expect(
      await screen.findByText('Nenhum evento nesta página')
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Ir para a primeira página' })
    );

    expect(
      await screen.findByText('Entrou no sistema (0).')
    ).toBeInTheDocument();
    expect(router.state.location.search).toEqual({});
  });

  it('na falha, oferece tentar de novo', async () => {
    vi.mocked(fetchEntityAuditLogs)
      .mockRejectedValueOnce(new Error('falhou'))
      .mockResolvedValue({ logs: [makeLog()], count: 1 });
    renderActivity();
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole('button', { name: 'Tentar novamente' })
    );

    expect(
      await screen.findByText('Bloqueou o usuário "Camila Oliveira".')
    ).toBeInTheDocument();
  });
});
