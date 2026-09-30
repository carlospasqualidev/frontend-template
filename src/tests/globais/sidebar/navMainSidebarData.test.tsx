import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NavMain } from '@/components/global/sidebar/navMain';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useSessionStore } from '@/hooks/useSessionStore';
import type { IUser } from '@/types/user/types';

/*
 * O menu REAL do projeto (`sidebarData` sem mock), contra as permissões do
 * backend. O comportamento genérico do `NavMain` (ordem, flyout,
 * `anyPermission`) é coberto em `navMain.test.tsx`, com fixture própria.
 */

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...props
  }: { to: string; children: ReactNode } & Record<string, unknown>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useMatchRoute: () => () => false,
}));

const ADMIN_ITEMS = ['Usuários', 'Cargos', 'Auditoria', 'Configurações'];

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

function renderNav() {
  return render(
    <SidebarProvider>
      <NavMain />
    </SidebarProvider>
  );
}

afterEach(() => {
  useSessionStore.setState({ user: null });
});

describe('NavMain com o menu do projeto', () => {
  // Usuário sem cargo chega do backend com `[]`.
  it('usuário sem permissões não vê Usuários, Cargos, Auditoria nem Configurações', () => {
    setUser([]);
    renderNav();

    expect(screen.queryByText('Administração')).not.toBeInTheDocument();
    for (const title of ADMIN_ITEMS) {
      expect(
        screen.queryByRole('link', { name: title })
      ).not.toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: 'Início' })).toBeInTheDocument();
  });

  it.each([
    { permission: 'backoffice.users.read', title: 'Usuários', url: '/users' },
    { permission: 'backoffice.roles.read', title: 'Cargos', url: '/roles' },
    {
      permission: 'backoffice.audit.read',
      title: 'Auditoria',
      url: '/audit-logs',
    },
    {
      permission: 'backoffice.systemConfigs.read',
      title: 'Configurações',
      url: '/settings',
    },
  ])(
    'com `$permission`, vê só o item $title',
    async ({ permission, title, url }) => {
      setUser([permission]);
      renderNav();

      // O grupo nasce fechado fora das rotas dele: abre para ler os itens.
      await userEvent.click(
        screen.getByRole('button', {
          name: (name) => name.includes('Administração'),
        })
      );

      expect(screen.getByRole('link', { name: title })).toHaveAttribute(
        'href',
        url
      );
      for (const other of ADMIN_ITEMS.filter((item) => item !== title)) {
        expect(
          screen.queryByRole('link', { name: other })
        ).not.toBeInTheDocument();
      }
    }
  );
});
