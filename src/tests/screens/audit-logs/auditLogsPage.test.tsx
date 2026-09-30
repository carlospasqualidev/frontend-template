import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { validateDataTableSearch } from '@/components/global/dataTable/dataTableSearch';
import { useSessionStore } from '@/hooks/useSessionStore';
import { AuditLogsPage } from '@/screens/audit-logs/list';
import {
  fetchAuditFilterOptions,
  fetchAuditLogs,
  fetchAuditUserOptions,
} from '@/services/audit/auditApi';
import type { IUser } from '@/types/user/types';

// Mocka só o transporte; a montagem dos parâmetros é a real.
vi.mock('@/services/audit/auditApi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/audit/auditApi')>();
  return {
    ...actual,
    fetchAuditFilterOptions: vi.fn(),
    fetchAuditLogs: vi.fn(),
    fetchAuditUserOptions: vi.fn(),
  };
});

function sessionUser(permissions: string[]): IUser {
  return {
    id: 'u_admin',
    name: 'Maria Silva',
    email: 'maria@example.com',
    image: null,
    permissions,
    idleTimeoutMinutes: 20,
  };
}

let queryClient: QueryClient;

// A URL como a tabela a grava: `filters` em JSON no search param.
function renderAuditLogs(filters: Record<string, unknown>) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    validateSearch: validateDataTableSearch,
    component: AuditLogsPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({
      initialEntries: [
        `/?filters=${encodeURIComponent(JSON.stringify(filters))}`,
      ],
    }),
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  vi.mocked(fetchAuditFilterOptions).mockResolvedValue({
    modules: [],
    actions: [],
    entities: [],
  });
  vi.mocked(fetchAuditLogs)
    .mockReset()
    .mockResolvedValue({ logs: [], count: 0 });
  vi.mocked(fetchAuditUserOptions)
    .mockReset()
    .mockResolvedValue([{ id: 'u_003', name: 'Camila Oliveira' }]);
});

afterEach(() => {
  queryClient.clear();
  useSessionStore.setState({ user: null });
});

describe('AuditLogsPage — filtro "Usuário"', () => {
  it('com `backoffice.users.read`, filtra pelo `userId` da URL', async () => {
    useSessionStore.setState({
      user: sessionUser(['backoffice.users.read']),
    });
    renderAuditLogs({ userId: ['u_003'], module: ['SECURITY'] });

    await waitFor(() => expect(fetchAuditLogs).toHaveBeenCalled());
    expect(fetchAuditLogs).toHaveBeenLastCalledWith(
      expect.objectContaining({ userId: 'u_003', module: 'SECURITY' })
    );
    expect(fetchAuditUserOptions).toHaveBeenCalledTimes(1);
  });

  // Sem a permissão o filtro não aparece: um `userId` que ficou na URL (link
  // compartilhado por quem tem a permissão) não pode filtrar sem a pessoa ver.
  it('sem `backoffice.users.read`, descarta o `userId` da URL e mantém os outros filtros', async () => {
    useSessionStore.setState({ user: sessionUser([]) });
    renderAuditLogs({ userId: ['u_003'], module: ['SECURITY'] });

    await waitFor(() => expect(fetchAuditLogs).toHaveBeenCalled());
    const params = vi.mocked(fetchAuditLogs).mock.lastCall?.[0];
    expect(params).toMatchObject({ module: 'SECURITY' });
    expect(params?.userId).toBeUndefined();
    expect(fetchAuditUserOptions).not.toHaveBeenCalled();
  });
});
