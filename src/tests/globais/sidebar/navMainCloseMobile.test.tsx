import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { NavMain } from '@/components/global/sidebar/navMain';
import { Sidebar, SidebarProvider, useSidebar } from '@/components/ui/sidebar';

// Viewport mobile: a sidebar vira Sheet. Arquivo à parte do `navMain.test.tsx`,
// que cobre o menu no desktop.
vi.mock('@/hooks/useMobile', () => ({ useIsMobile: () => true }));

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    onClick,
    ...props
  }: {
    to: string;
    children: ReactNode;
    onClick?: (event: React.MouseEvent) => void;
  } & Record<string, unknown>) => (
    <a
      href={to}
      onClick={(event) => {
        onClick?.(event);
        event.preventDefault();
      }}
      {...props}
    >
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: '/users', searchStr: '' }),
  useMatchRoute: () => () => false,
}));

vi.mock('@/lib/constants/sidebar', () => ({
  sidebarData: {
    header: { name: 'Projeto', description: 'Teste', logo: 'PR' },
    nav: [],
    links: [
      { title: 'Usuários', url: '/users', icon: null },
      { title: 'Contas', url: '/accounts', icon: null },
    ],
  },
}));

function Probe() {
  const { openMobile, setOpenMobile } = useSidebar();
  return (
    <>
      <span data-testid="state">{openMobile ? 'aberto' : 'fechado'}</span>
      <button type="button" onClick={() => setOpenMobile(true)}>
        Abrir menu
      </button>
    </>
  );
}

async function openMenu() {
  render(
    <SidebarProvider>
      <Probe />
      <Sidebar>
        <NavMain />
      </Sidebar>
    </SidebarProvider>
  );
  await userEvent.click(screen.getByText('Abrir menu'));
  expect(screen.getByTestId('state')).toHaveTextContent('aberto');
}

describe('NavMain no mobile', () => {
  it('tocar no link da página atual fecha o menu', async () => {
    await openMenu();

    await userEvent.click(screen.getByRole('link', { name: 'Usuários' }));

    expect(screen.getByTestId('state')).toHaveTextContent('fechado');
  });

  // Outro destino: quem fecha é a mudança de caminho, não o clique.
  it('tocar no link de outra página não fecha no clique', async () => {
    await openMenu();

    await userEvent.click(screen.getByRole('link', { name: 'Contas' }));

    expect(screen.getByTestId('state')).toHaveTextContent('aberto');
  });
});
