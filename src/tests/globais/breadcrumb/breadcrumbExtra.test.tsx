import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { type ReactElement } from 'react';

import { Breadcrumb } from '@/components/global/layout/breadcrumb';
import {
  useBreadcrumbExtra,
  type BreadcrumbCrumb,
} from '@/hooks/useBreadcrumbExtra';

function ExtraPage({
  crumb,
}: {
  crumb: BreadcrumbCrumb | BreadcrumbCrumb[] | null;
}) {
  useBreadcrumbExtra(crumb);
  return <div>conteúdo do detalhe</div>;
}

function renderAt(component: () => ReactElement, initialPath = '/users/u-1') {
  const rootRoute = createRootRoute({
    component: () => (
      <>
        <Breadcrumb />
        <Outlet />
      </>
    ),
  });
  const usersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'users',
    staticData: { breadcrumb: 'Usuários' },
    component: () => <Outlet />,
  });
  const detailRoute = createRoute({
    getParentRoute: () => usersRoute,
    path: '$userId',
    staticData: { breadcrumb: 'Detalhes do usuário' },
    component,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([usersRoute.addChildren([detailRoute])]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  render(<RouterProvider router={router} />);
  return router;
}

describe('Breadcrumb: crumb dinâmico', () => {
  it('substitui o rótulo da página atual quando o pathname é o dela', async () => {
    renderAt(() => (
      <ExtraPage crumb={{ title: 'Maria Silva', pathname: '/users/u-1' }} />
    ));

    const current = await screen.findByText('Maria Silva');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByText('Detalhes do usuário')).toBeNull();
    expect(screen.getByText('Usuários').closest('a')).toHaveAttribute(
      'href',
      '/users'
    );
  });

  it('insere no meio, como link, o crumb de outro pathname', async () => {
    renderAt(() => (
      <ExtraPage crumb={[{ title: 'Time Alfa', pathname: '/teams/t-1' }]} />
    ));

    const current = await screen.findByText('Detalhes do usuário');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Time Alfa').closest('a')).toHaveAttribute(
      'href',
      '/teams/t-1'
    );
  });

  it('com null, a trilha fica estática', async () => {
    renderAt(() => <ExtraPage crumb={null} />);
    expect(await screen.findByText('Detalhes do usuário')).toBeInTheDocument();
  });

  it('ignora crumb sem título ou sem pathname', async () => {
    renderAt(() => <ExtraPage crumb={{ title: '', pathname: '/users/u-1' }} />);
    expect(await screen.findByText('Detalhes do usuário')).toBeInTheDocument();
  });

  it('limpa ao desmontar a tela e não mostra o registro anterior na rota seguinte', async () => {
    const router = renderAt(() => (
      <ExtraPage crumb={{ title: 'Maria Silva', pathname: '/users/u-1' }} />
    ));
    await screen.findByText('Maria Silva');

    await act(() => router.navigate({ to: '/users' }));

    // Sem waitFor: logo após a navegação a trilha já está limpa.
    expect(screen.queryByText('Maria Silva')).toBeNull();
    expect(screen.getByText('Usuários')).toHaveAttribute(
      'aria-current',
      'page'
    );
  });
});
