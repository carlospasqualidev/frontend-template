import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  type AnyRouter,
  type RouteComponent,
} from '@tanstack/react-router';
import { render } from '@testing-library/react';

import { PageActionsSlot } from '@/components/global/layout/pageActions';
import { UnsavedChangesDialog } from '@/components/global/layout/unsavedChangesDialog';

export interface TestRoute {
  path: string;
  component: RouteComponent;
  validateSearch?: (search: Record<string, unknown>) => Record<string, unknown>;
}

/**
 * Monta telas com o roteador em memória, o `QueryClient` do teste, o slot do
 * `PageActions` (as ações do topo) e a confirmação do guard de edição não
 * salva (os dois são do `Layout` no app), abrindo em `initialUrl`. Devolve o roteador
 * para conferir a navegação (`router.state.location`).
 */
export function renderRoutes({
  routes,
  initialUrl,
  queryClient,
}: {
  routes: TestRoute[];
  initialUrl: string;
  queryClient: QueryClient;
}): { router: AnyRouter } {
  const rootRoute = createRootRoute({
    component: () => (
      <>
        <PageActionsSlot />
        <UnsavedChangesDialog />
        <Outlet />
      </>
    ),
  });
  const children = routes.map((route) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path: route.path,
      validateSearch: route.validateSearch,
      component: route.component,
    })
  );
  const router = createRouter({
    routeTree: rootRoute.addChildren(children),
    history: createMemoryHistory({ initialEntries: [initialUrl] }),
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );

  return { router };
}

/** `QueryClient` de teste: sem nova tentativa, para a falha aparecer na hora. */
export function makeTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}
