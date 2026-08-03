import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NavUser } from '@/components/global/sidebar/navUser';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useSessionStore } from '@/hooks/useSessionStore';
// O menu do usuário embute o `ToggleTheme`, que exige o provider de tema.
import { ThemeProvider } from '@/hooks/useThemeProvider';

const navigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}));

const signOut = vi.fn().mockResolvedValue(undefined);

function setUser() {
  useSessionStore.setState({
    user: {
      id: '1',
      name: 'Maria Silva',
      email: 'maria@example.com',
      image: null,
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
});

afterEach(() => {
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

  it('abre o menu com Conta, Sair e o alternador de tema', async () => {
    setUser();
    renderNavUser();

    await userEvent.click(screen.getByRole('button', { name: /Maria Silva/ }));

    expect(
      await screen.findByRole('menuitem', { name: /Conta/ })
    ).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Sair/ })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Alternar tema' })
    ).toBeInTheDocument();
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
  // "voltar" do navegador reabriria a tela protegida.
  it('"Sair" encerra a sessão e vai para o login com replace', async () => {
    setUser();
    renderNavUser();

    await userEvent.click(screen.getByRole('button', { name: /Maria Silva/ }));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: /Sair/ })
    );

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith({ to: '/login', replace: true });
  });

  // Falha no logout do servidor não pode prender o usuário na tela protegida.
  it('vai para o login mesmo se o signOut falhar', async () => {
    setUser();
    signOut.mockRejectedValueOnce(new Error('offline'));
    renderNavUser();

    await userEvent.click(screen.getByRole('button', { name: /Maria Silva/ }));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: /Sair/ })
    );

    expect(navigate).toHaveBeenCalledWith({ to: '/login', replace: true });
  });
});
