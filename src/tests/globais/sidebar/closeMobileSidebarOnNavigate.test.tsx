import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CloseMobileSidebarOnNavigate } from '@/components/global/sidebar/closeMobileSidebarOnNavigate';
import { useCloseMobileSidebarOnSamePage } from '@/components/global/sidebar/useCloseMobileSidebarOnSamePage';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';

// Viewport mobile: a sidebar vira Sheet e `openMobile` é o estado que importa.
vi.mock('@/hooks/useMobile', () => ({ useIsMobile: () => true }));

const location = { pathname: '/users', searchStr: '' };

vi.mock('@tanstack/react-router', () => ({
  useLocation: () => location,
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

function SamePageLinks() {
  const closeOnSamePage = useCloseMobileSidebarOnSamePage();
  return (
    <>
      <button type="button" onClick={() => closeOnSamePage('/users')}>
        Link da página atual
      </button>
      <button type="button" onClick={() => closeOnSamePage('/account')}>
        Link de outra página
      </button>
    </>
  );
}

function tree() {
  return (
    <SidebarProvider>
      <CloseMobileSidebarOnNavigate />
      <Probe />
      <SamePageLinks />
    </SidebarProvider>
  );
}

beforeEach(() => {
  location.pathname = '/users';
  location.searchStr = '';
});

describe('CloseMobileSidebarOnNavigate', () => {
  it('fecha o menu mobile quando o caminho muda', async () => {
    const { rerender } = render(tree());
    await userEvent.click(screen.getByText('Abrir menu'));
    expect(screen.getByTestId('state')).toHaveTextContent('aberto');

    location.pathname = '/account';
    await act(async () => {
      rerender(tree());
    });

    expect(screen.getByTestId('state')).toHaveTextContent('fechado');
  });

  // Item que só expande submenu, ou navegação barrada pelo guard de edição
  // não salva (o caminho não muda), não fecha o menu.
  it('mantém o menu aberto enquanto o caminho não muda', async () => {
    const { rerender } = render(tree());
    await userEvent.click(screen.getByText('Abrir menu'));

    await act(async () => {
      rerender(tree());
    });

    expect(screen.getByTestId('state')).toHaveTextContent('aberto');
  });

  it('fecha o menu ao tocar no link da própria página, sem mudar o caminho', async () => {
    render(tree());
    await userEvent.click(screen.getByText('Abrir menu'));

    await userEvent.click(screen.getByText('Link da página atual'));

    expect(screen.getByTestId('state')).toHaveTextContent('fechado');
  });

  // Com outro destino, quem decide é a navegação (o guard pode barrá-la).
  it('não fecha o menu ao tocar no link de outra página', async () => {
    render(tree());
    await userEvent.click(screen.getByText('Abrir menu'));

    await userEvent.click(screen.getByText('Link de outra página'));

    expect(screen.getByTestId('state')).toHaveTextContent('aberto');
  });

  it('fecha o menu quando só a busca muda', async () => {
    const { rerender } = render(tree());
    await userEvent.click(screen.getByText('Abrir menu'));

    location.searchStr = '?tab=profile';
    await act(async () => {
      rerender(tree());
    });

    expect(screen.getByTestId('state')).toHaveTextContent('fechado');
  });

  // Na página com busca, o link sem busca é outro destino: navega (o guard
  // pode barrar) e o menu só fecha quando a navegação acontece.
  it('não fecha no clique do link da mesma página quando a busca atual difere', async () => {
    location.searchStr = '?tab=profile';
    render(tree());
    await userEvent.click(screen.getByText('Abrir menu'));

    await userEvent.click(screen.getByText('Link da página atual'));

    expect(screen.getByTestId('state')).toHaveTextContent('aberto');
  });
});
