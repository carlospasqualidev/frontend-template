import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NavUser } from '@/components/global/sidebar/navUser';
import { Sidebar, SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { useSessionStore } from '@/hooks/useSessionStore';
import { ThemeProvider } from '@/hooks/useThemeProvider';

// Viewport mobile: a sidebar vira Sheet. Arquivo à parte do `navUser.test.tsx`,
// que cobre o menu no desktop.
vi.mock('@/hooks/useMobile', () => ({ useIsMobile: () => true }));

const location = { pathname: '/account', searchStr: '' };

// `navigate` não muda a localização: é a navegação barrada pelo guard.
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
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

async function clickAccount() {
  render(
    <ThemeProvider storageKey="test-theme">
      <SidebarProvider>
        <Probe />
        <Sidebar>
          <NavUser />
        </Sidebar>
      </SidebarProvider>
    </ThemeProvider>
  );
  await userEvent.click(screen.getByText('Abrir menu'));
  expect(screen.getByTestId('state')).toHaveTextContent('aberto');
  await userEvent.click(screen.getByRole('button', { name: /Maria Silva/ }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /Conta/ }));
}

beforeEach(() => {
  location.searchStr = '';
  useSessionStore.setState({
    user: {
      id: '1',
      name: 'Maria Silva',
      email: 'maria@example.com',
      image: null,
      permissions: [],
      idleTimeoutMinutes: 20,
    },
  });
});

afterEach(() => {
  document.documentElement.classList.remove('dark', 'light');
  localStorage.clear();
  useSessionStore.setState({ user: null });
});

describe('NavUser no mobile', () => {
  it('"Conta" na própria página fecha o menu', async () => {
    await clickAccount();

    expect(screen.getByTestId('state')).toHaveTextContent('fechado');
  });

  // /account?tab=profile com o guard barrando a ida a /account: nada navegou,
  // o menu continua aberto onde o usuário estava.
  it('"Conta" com busca diferente e navegação barrada mantém o menu aberto', async () => {
    location.searchStr = '?tab=profile';
    await clickAccount();

    expect(screen.getByTestId('state')).toHaveTextContent('aberto');
  });
});
