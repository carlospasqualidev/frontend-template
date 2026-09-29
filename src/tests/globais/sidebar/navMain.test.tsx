import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NavMain } from '@/components/global/sidebar/navMain';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useSessionStore } from '@/hooks/useSessionStore';
import type { IUser } from '@/types/user/types';

// Router: `Link` vira uma âncora real (a navegação não é o assunto aqui) e
// `useMatchRoute` reporta a rota ativa configurada por teste.
const activePath = { current: '' };

vi.mock('@tanstack/react-router', () => ({
  // Repassa o resto das props (`role`, `data-*`, handlers) como o `Link` real:
  // o `DropdownMenuItem asChild` injeta `role="menuitem"` no filho, e um mock que
  // só lê `to`/`children` mataria a semântica do flyout.
  Link: ({
    to,
    children,
    ...props
  }: { to: string; children: ReactNode } & Record<string, unknown>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useMatchRoute:
    () =>
    ({ to }: { to: string }) =>
      activePath.current === to ? {} : false,
}));

// Fixture própria: o teste valida o COMPORTAMENTO do NavMain (filtro, ordem,
// flyout), não o conteúdo real da navegação do projeto.
// O factory é içado acima dos imports: JSX aqui usaria o `react/jsx-runtime`
// antes de ele inicializar, por isso o `createElement` vem do próprio factory.
vi.mock('@/lib/constants/sidebar', async () => {
  const { createElement } = await import('react');
  const icon = (testId?: string) =>
    createElement('span', { 'data-testid': testId });

  return {
    sidebarData: {
      header: { name: 'Projeto', description: 'Teste', logo: 'PR' },
      nav: [
        {
          title: 'Administração',
          icon: icon('icon-admin'),
          items: [
            {
              title: 'Usuários',
              url: '/users',
              icon: icon(),
              permission: 'backoffice.users.read',
            },
            {
              title: 'Auditoria',
              url: '/audit-logs',
              icon: icon(),
              permission: 'backoffice.audit.read',
            },
            { title: 'Configurações', url: '/settings', icon: icon() },
          ],
        },
        {
          title: 'Relatórios',
          icon: icon(),
          items: [
            {
              title: 'Movimentações',
              url: '/reports/movements',
              icon: icon(),
              anyPermission: [
                'backoffice.reportsIn.read',
                'backoffice.reportsOut.read',
              ],
            },
          ],
        },
      ],
      links: [
        { title: 'Início', url: '/', icon: icon() },
        {
          title: 'Admin do sistema',
          url: '/system',
          icon: icon(),
          permission: 'backoffice.system.read',
        },
      ],
    },
  };
});

// Permissões no formato do backend (`modulo.entidade.acao`).
function setUser(permissions: string[]) {
  const user: IUser = {
    id: '1',
    name: 'Maria',
    email: 'maria@example.com',
    image: null,
    permissions,
    idleTimeoutMinutes: 20,
  };
  useSessionStore.setState({ user });
}

function renderNav({ collapsed = false } = {}) {
  return render(
    <SidebarProvider defaultOpen={!collapsed}>
      <NavMain />
    </SidebarProvider>
  );
}

/**
 * Expande o grupo de um módulo. O grupo nasce ABERTO só quando a rota ativa é
 * uma das suas (`defaultOpen={isModuleActive}`) — fechado, o Radix desmonta o
 * conteúdo, então os itens não estão no DOM até o clique.
 */
async function openModule(title: string) {
  // Matcher por função (não `new RegExp(title)`): o nome acessível do gatilho
  // inclui o texto do chevron, e um regex montado a partir de string dispara a
  // regra de segurança do eslint.
  await userEvent.click(
    screen.getByRole('button', { name: (name) => name.includes(title) })
  );
}

beforeEach(() => {
  activePath.current = '';
});

afterEach(() => {
  useSessionStore.setState({ user: null });
});

describe('NavMain', () => {
  it('exibe os módulos e os itens permitidos', async () => {
    setUser(['backoffice.users.read', 'backoffice.audit.read']);
    renderNav();

    expect(screen.getByText('Administração')).toBeInTheDocument();

    await openModule('Administração');

    expect(screen.getByRole('link', { name: 'Usuários' })).toHaveAttribute(
      'href',
      '/users'
    );
    expect(screen.getByRole('link', { name: 'Auditoria' })).toBeInTheDocument();
  });

  // Item sem `permission` é público a quem está logado — não some junto com os
  // gateados.
  it('mantém visível o item sem `permission`', async () => {
    setUser([]);
    renderNav();
    await openModule('Administração');

    expect(
      screen.getByRole('link', { name: 'Configurações' })
    ).toBeInTheDocument();
  });

  it('esconde o item cuja permissão o usuário não tem', async () => {
    setUser(['backoffice.audit.read']);
    renderNav();
    await openModule('Administração');

    expect(
      screen.queryByRole('link', { name: 'Usuários' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Auditoria' })).toBeInTheDocument();
  });

  // `anyPermission`: basta UMA das permissões da lista.
  it('exibe o item de `anyPermission` com ao menos uma das permissões', async () => {
    setUser(['backoffice.reportsOut.read']);
    renderNav();
    await openModule('Relatórios');

    expect(
      screen.getByRole('link', { name: 'Movimentações' })
    ).toBeInTheDocument();
  });

  it('esconde o item de `anyPermission` quando não tem nenhuma delas', () => {
    setUser(['backoffice.users.read']);
    renderNav();

    expect(
      screen.queryByRole('link', { name: 'Movimentações' })
    ).not.toBeInTheDocument();
  });

  // Módulo sem nenhum item visível não deixa um grupo vazio na sidebar.
  it('remove o módulo que fica sem itens visíveis', () => {
    setUser(['backoffice.users.read']);
    renderNav();

    expect(screen.queryByText('Relatórios')).not.toBeInTheDocument();
    expect(screen.getByText('Administração')).toBeInTheDocument();
  });

  // A ordem de exibição é alfabética (pt-BR) e NÃO a da lista de origem — a
  // fixture declara Usuários, Auditoria, Configurações nessa ordem.
  it('ordena os itens alfabeticamente (pt-BR), ignorando a ordem da lista', async () => {
    setUser(['backoffice.users.read', 'backoffice.audit.read']);
    renderNav();
    await openModule('Administração');

    const titles = screen
      .getAllByRole('link')
      .map((link) => link.textContent?.trim())
      .filter((title) => title !== 'Início');

    expect(titles).toEqual(['Auditoria', 'Configurações', 'Usuários']);
  });

  it('gateia também os `links` de topo, mantendo os sem permissão', () => {
    setUser([]);
    renderNav();

    expect(screen.getByRole('link', { name: 'Início' })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Admin do sistema' })
    ).not.toBeInTheDocument();
  });

  it('marca o módulo da rota ativa e abre o grupo por padrão', () => {
    setUser(['backoffice.users.read']);
    activePath.current = '/users';
    renderNav();

    expect(screen.getByRole('link', { name: 'Usuários' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Administração/ })
    ).toBeInTheDocument();
  });

  // Recolhida em ícones, o `SidebarMenuSub` fica escondido: sem o flyout os
  // itens-filho ficariam inalcançáveis.
  it('recolhida em ícones, os filhos vão para um flyout acessível', async () => {
    setUser(['backoffice.users.read', 'backoffice.audit.read']);
    renderNav({ collapsed: true });

    // Fora do flyout, os itens do módulo não estão no documento.
    expect(
      screen.queryByRole('menuitem', { name: 'Usuários' })
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /Administração/ })
    );

    expect(
      await screen.findByRole('menuitem', { name: 'Usuários' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Auditoria' })
    ).toBeInTheDocument();
  });

  it('sem usuário, mostra só os itens sem permissão', async () => {
    useSessionStore.setState({ user: null });
    renderNav();
    await openModule('Administração');

    expect(
      screen.getByRole('link', { name: 'Configurações' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Usuários' })
    ).not.toBeInTheDocument();
  });
});
