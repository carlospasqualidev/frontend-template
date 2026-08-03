import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { UrlTabs } from '@/components/global/tabs/urlTabs';

function setupRouter(initialPath: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <UrlTabs
        defaultValue="profile"
        items={[
          {
            value: 'profile',
            label: 'Perfil',
            content: <span>conteudo-profile</span>,
          },
          {
            value: 'security',
            label: 'Segurança',
            content: <span>conteudo-security</span>,
          },
          {
            value: 'billing',
            label: 'Pagamento',
            content: <span>conteudo-billing</span>,
          },
        ]}
      />
    ),
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  return router;
}

describe('UrlTabs', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ativa a aba padrão quando a URL não tem o search param', async () => {
    const router = setupRouter('/');
    render(<RouterProvider router={router} />);

    const profileTab = await screen.findByRole('tab', { name: 'Perfil' });
    expect(profileTab).toHaveAttribute('data-state', 'active');
    expect(screen.getByText('conteudo-profile')).toBeVisible();
  });

  it('ativa a aba indicada pelo search param', async () => {
    const router = setupRouter('/?tab=security');
    render(<RouterProvider router={router} />);

    const securityTab = await screen.findByRole('tab', { name: 'Segurança' });
    expect(securityTab).toHaveAttribute('data-state', 'active');
    expect(screen.getByText('conteudo-security')).toBeVisible();
  });

  it('cai para o defaultValue quando o search param é desconhecido', async () => {
    const router = setupRouter('/?tab=invalida');
    render(<RouterProvider router={router} />);

    const profileTab = await screen.findByRole('tab', { name: 'Perfil' });
    expect(profileTab).toHaveAttribute('data-state', 'active');
  });

  it('escreve o search param ao mudar para uma aba não-default', async () => {
    const router = setupRouter('/');
    render(<RouterProvider router={router} />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('tab', { name: 'Pagamento' }));

    expect(router.state.location.search).toEqual({ tab: 'billing' });
  });

  it('remove o search param ao voltar para a aba padrão', async () => {
    const router = setupRouter('/?tab=security');
    render(<RouterProvider router={router} />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('tab', { name: 'Perfil' }));

    expect(router.state.location.search).toEqual({});
  });

  it('abre a aba em nova guia no clique do meio sem trocar a aba ativa', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const router = setupRouter('/');
    render(<RouterProvider router={router} />);
    const user = userEvent.setup();

    await user.pointer({
      keys: '[MouseMiddle]',
      target: await screen.findByRole('tab', { name: 'Segurança' }),
    });

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('tab=security'),
      '_blank',
      'noopener,noreferrer'
    );
    expect(router.state.location.search).toEqual({});
  });

  it('abre a aba em nova guia com Ctrl+clique sem trocar a aba ativa', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const router = setupRouter('/');
    render(<RouterProvider router={router} />);
    const user = userEvent.setup();

    await user.keyboard('{Control>}');
    await user.click(await screen.findByRole('tab', { name: 'Pagamento' }));
    await user.keyboard('{/Control}');

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('tab=billing'),
      '_blank',
      'noopener,noreferrer'
    );
    expect(router.state.location.search).toEqual({});
  });
});
