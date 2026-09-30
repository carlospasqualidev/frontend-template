import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { UrlTabs } from '@/components/global/tabs/urlTabs';

function setupRouter(
  initialPath: string,
  onBeforeChange?: (next: string, change: () => void) => void
) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <UrlTabs
        defaultValue="profile"
        onBeforeChange={onBeforeChange}
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

  it('com `onBeforeChange`, só troca quando a tela chama `change`', async () => {
    let pendingChange: (() => void) | undefined;
    const onBeforeChange = vi.fn((_next: string, change: () => void) => {
      pendingChange = change;
    });
    const router = setupRouter('/', onBeforeChange);
    render(<RouterProvider router={router} />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('tab', { name: 'Pagamento' }));

    expect(onBeforeChange).toHaveBeenCalledWith(
      'billing',
      expect.any(Function)
    );
    expect(router.state.location.search).toEqual({});
    expect(screen.getByRole('tab', { name: 'Perfil' })).toHaveAttribute(
      'data-state',
      'active'
    );

    await act(async () => pendingChange?.());

    expect(router.state.location.search).toEqual({ tab: 'billing' });
    expect(await screen.findByText('conteudo-billing')).toBeVisible();
  });

  it('abrir em nova guia não passa pelo `onBeforeChange`', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    const onBeforeChange = vi.fn();
    const router = setupRouter('/', onBeforeChange);
    render(<RouterProvider router={router} />);
    const user = userEvent.setup();

    await user.keyboard('{Control>}');
    await user.click(await screen.findByRole('tab', { name: 'Segurança' }));
    await user.keyboard('{/Control}');

    expect(onBeforeChange).not.toHaveBeenCalled();
    expect(window.open).toHaveBeenCalled();
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

  // O Radix troca a aba já no mousedown, e só poupa o Ctrl+clique: Shift e Cmd
  // (Meta) também só abrem a nova guia.
  describe.each([
    ['Shift', 'Shift+clique'],
    ['Meta', 'Cmd+clique'],
  ])('com %s', (modifier, gesture) => {
    it(`${gesture} abre em nova guia sem trocar a aba ativa`, async () => {
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
      const router = setupRouter('/');
      render(<RouterProvider router={router} />);
      const user = userEvent.setup();

      await user.keyboard(`{${modifier}>}`);
      await user.click(await screen.findByRole('tab', { name: 'Pagamento' }));
      await user.keyboard(`{/${modifier}}`);

      expect(openSpy).toHaveBeenCalledTimes(1);
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('tab=billing'),
        '_blank',
        'noopener,noreferrer'
      );
      expect(router.state.location.search).toEqual({});
      expect(screen.getByRole('tab', { name: 'Perfil' })).toHaveAttribute(
        'data-state',
        'active'
      );
    });

    it(`${gesture} não passa pelo \`onBeforeChange\``, async () => {
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
      const onBeforeChange = vi.fn();
      const router = setupRouter('/', onBeforeChange);
      render(<RouterProvider router={router} />);
      const user = userEvent.setup();

      await user.keyboard(`{${modifier}>}`);
      await user.click(await screen.findByRole('tab', { name: 'Segurança' }));
      await user.keyboard(`{/${modifier}}`);

      expect(onBeforeChange).not.toHaveBeenCalled();
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('tab=security'),
        '_blank',
        'noopener,noreferrer'
      );
      expect(router.state.location.search).toEqual({});
    });
  });

  // A ativação é automática: a seta leva o foco e pede a troca; Enter e
  // Espaço na aba focada pedem de novo. Tudo passa pelo `onBeforeChange`.
  describe('teclado', () => {
    it('sem `onBeforeChange`, as setas trocam de aba', async () => {
      const router = setupRouter('/');
      render(<RouterProvider router={router} />);
      const user = userEvent.setup();

      await user.click(await screen.findByRole('tab', { name: 'Perfil' }));
      await user.keyboard('{ArrowRight}');

      await waitFor(() =>
        expect(router.state.location.search).toEqual({ tab: 'security' })
      );
      expect(screen.getByRole('tab', { name: 'Segurança' })).toHaveFocus();

      await user.keyboard('{ArrowLeft}');

      await waitFor(() => expect(router.state.location.search).toEqual({}));
      expect(screen.getByRole('tab', { name: 'Perfil' })).toHaveFocus();
    });

    it('setas, Enter e Espaço passam pelo `onBeforeChange`; só troca com `change`', async () => {
      let pendingChange: (() => void) | undefined;
      const onBeforeChange = vi.fn((_next: string, change: () => void) => {
        pendingChange = change;
      });
      const router = setupRouter('/', onBeforeChange);
      render(<RouterProvider router={router} />);
      const user = userEvent.setup();

      await user.click(await screen.findByRole('tab', { name: 'Perfil' }));
      expect(onBeforeChange).not.toHaveBeenCalled();

      await user.keyboard('{ArrowRight}');

      const security = screen.getByRole('tab', { name: 'Segurança' });
      await waitFor(() => expect(security).toHaveFocus());
      expect(onBeforeChange).toHaveBeenCalledTimes(1);
      expect(onBeforeChange).toHaveBeenLastCalledWith(
        'security',
        expect.any(Function)
      );
      expect(security).toHaveAttribute('data-state', 'inactive');
      expect(router.state.location.search).toEqual({});

      await user.keyboard('{Enter}');
      expect(onBeforeChange).toHaveBeenCalledTimes(2);
      expect(onBeforeChange).toHaveBeenLastCalledWith(
        'security',
        expect.any(Function)
      );

      await user.keyboard(' ');
      expect(onBeforeChange).toHaveBeenCalledTimes(3);
      expect(onBeforeChange).toHaveBeenLastCalledWith(
        'security',
        expect.any(Function)
      );
      expect(router.state.location.search).toEqual({});
      expect(screen.getByRole('tab', { name: 'Perfil' })).toHaveAttribute(
        'data-state',
        'active'
      );

      await act(async () => pendingChange?.());

      expect(router.state.location.search).toEqual({ tab: 'security' });
      expect(await screen.findByText('conteudo-security')).toBeVisible();
    });
  });
});
