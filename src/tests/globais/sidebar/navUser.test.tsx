import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NavUser } from '@/components/global/sidebar/navUser';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useSessionStore } from '@/hooks/useSessionStore';
// O rodapé da sidebar embute o `ToggleTheme`, que exige o provider de tema.
import { ThemeProvider } from '@/hooks/useThemeProvider';

const navigate = vi.fn();
const location = { pathname: '/users', searchStr: '' };

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  useLocation: () => location,
}));

const signOut = vi.fn().mockResolvedValue(undefined);

// A confirmação de edição não salva é do guard (testada com ele); aqui, só a
// resposta dela.
const { confirmLeaveIfDirty } = vi.hoisted(() => ({
  confirmLeaveIfDirty: vi.fn<() => Promise<boolean>>(),
}));

vi.mock('@/hooks/useUnsavedChangesGuard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useUnsavedChangesGuard')>()),
  confirmLeaveIfDirty,
}));

function setUser() {
  useSessionStore.setState({
    user: {
      id: '1',
      name: 'Maria Silva',
      email: 'maria@example.com',
      image: null,
      permissions: [],
      idleTimeoutMinutes: 20,
    },
    signOut,
  });
}

function renderNavUser() {
  return render(
    <ThemeProvider storageKey="test-theme">
      <SidebarProvider>
        <NavUser />
      </SidebarProvider>
    </ThemeProvider>
  );
}

beforeEach(() => {
  navigate.mockClear();
  signOut.mockClear();
  confirmLeaveIfDirty.mockReset();
  confirmLeaveIfDirty.mockResolvedValue(true);
});

async function clickSignOut() {
  await userEvent.click(screen.getByRole('button', { name: /Maria Silva/ }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /Sair/ }));
}

afterEach(() => {
  document.documentElement.classList.remove('dark', 'light');
  localStorage.clear();
  useSessionStore.setState({ user: null });
});

describe('NavUser', () => {
  // Sem usuário o componente retorna `null` — nenhum gatilho de menu, para o
  // rodapé da sidebar não mostrar um card de usuário vazio.
  it('sem usuário na sessão, não renderiza o gatilho', () => {
    useSessionStore.setState({ user: null });
    renderNavUser();

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('exibe nome e e-mail do usuário logado', () => {
    setUser();
    renderNavUser();

    expect(screen.getAllByText('Maria Silva').length).toBeGreaterThan(0);
    expect(screen.getAllByText('maria@example.com').length).toBeGreaterThan(0);
  });

  it('abre o menu com Conta e Sair, sem o alternador de tema dentro', async () => {
    setUser();
    renderNavUser();

    await userEvent.click(screen.getByRole('button', { name: /Maria Silva/ }));

    const menu = await screen.findByRole('menu');
    expect(
      within(menu).getByRole('menuitem', { name: /Conta/ })
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole('menuitem', { name: /Sair/ })
    ).toBeInTheDocument();
    expect(
      within(menu).queryByRole('button', { name: 'Alternar tema' })
    ).not.toBeInTheDocument();
  });

  it('mantém o alternador de tema à vista, fora do menu, e ele troca o tema', async () => {
    setUser();
    renderNavUser();

    const toggle = screen.getByRole('button', { name: 'Alternar tema' });
    expect(toggle).toHaveAttribute('data-variant', 'ghost');

    await userEvent.click(toggle);
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Escuro' })
    );

    expect(document.documentElement).toHaveClass('dark');
  });

  it('"Conta" navega para a tela de conta', async () => {
    setUser();
    renderNavUser();

    await userEvent.click(screen.getByRole('button', { name: /Maria Silva/ }));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: /Conta/ })
    );

    expect(navigate).toHaveBeenCalledWith({ to: '/account' });
  });

  // Sair encerra a sessão E manda para o login com `replace` — sem replace, o
  // "voltar" do navegador reabriria a tela protegida. A pergunta da edição
  // não salva vem antes, então a saída não passa pelo guard de novo.
  it('"Sair" encerra a sessão e vai para o login com replace', async () => {
    setUser();
    renderNavUser();

    await clickSignOut();

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/login',
        replace: true,
        ignoreBlocker: true,
      })
    );
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  // A sessão só acaba depois da resposta à pergunta da edição não salva
  // (sem edição, ela responde "sair" sem perguntar).
  it('"Sair" pergunta pela edição não salva antes de encerrar a sessão', async () => {
    setUser();
    renderNavUser();

    await clickSignOut();

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
    expect(confirmLeaveIfDirty).toHaveBeenCalledTimes(1);
    expect(confirmLeaveIfDirty.mock.invocationCallOrder[0]).toBeLessThan(
      signOut.mock.invocationCallOrder[0] ?? 0
    );
  });

  it('"Continuar editando" no "Sair" não encerra a sessão nem navega', async () => {
    setUser();
    confirmLeaveIfDirty.mockResolvedValue(false);
    renderNavUser();

    await clickSignOut();

    await waitFor(() => expect(confirmLeaveIfDirty).toHaveBeenCalledTimes(1));
    await act(async () => {
      await Promise.resolve();
    });
    expect(signOut).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  // Falha no logout do servidor não pode prender o usuário na tela protegida.
  it('vai para o login mesmo se o signOut falhar', async () => {
    setUser();
    signOut.mockRejectedValueOnce(new Error('offline'));
    renderNavUser();

    await clickSignOut();

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/login',
        replace: true,
        ignoreBlocker: true,
      })
    );
  });
});
