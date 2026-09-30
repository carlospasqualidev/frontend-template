import type { ReactNode } from 'react';
import { Home, ScrollText, Settings, Shield, Users } from 'lucide-react';

import { env } from '@/lib/env';

function getDefaultLogo(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (
    parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)
  ).toUpperCase();
}

const projectName = env.VITE_PROJECT_NAME;

export interface SidebarNavItem {
  title: string;
  url: string;
  icon: ReactNode;
  /**
   * Esconde o item de quem não tem esta permissão (filtro no `NavMain`, via
   * `hasPermission`). Formato do backend: `modulo.entidade.acao` (ex.:
   * `backoffice.users.read`). Sem `permission`, o item aparece para todo usuário
   * logado. O backend continua sendo a autoridade — isto só ajusta a navegação.
   */
  permission?: string;
  /** Visível se o usuário tiver AO MENOS UMA destas permissões. */
  anyPermission?: string[];
}

/**
 * Grupo colapsável da navegação. Um módulo = um conjunto de telas sob o mesmo
 * prefixo de URL (ex.: `/admin/...`). O módulo desaparece quando o usuário não
 * tem permissão para nenhum dos seus itens.
 */
export interface SidebarNavModule {
  title: string;
  icon: ReactNode;
  items: SidebarNavItem[];
}

export const sidebarData: {
  header: { name: string; description: string; logo: string };
  nav: SidebarNavModule[];
  links: SidebarNavItem[];
} = {
  header: {
    name: projectName,
    description: env.VITE_PROJECT_ENVIRONMENT ?? 'Template base',
    logo: getDefaultLogo(projectName),
  },
  // Navegação por módulo: cada módulo é um grupo colapsável (shadcn
  // `SidebarMenuSub`) e as rotas são suas filhas, sob o prefixo de URL do módulo.
  // Ao crescer o sistema, cada novo conjunto de telas entra como um módulo com o
  // seu próprio prefixo, em vez de esticar uma lista plana.
  //
  // A ORDEM dos itens é alfabética e é aplicada no `NavMain` (localeCompare
  // pt-BR) — não depende da ordem desta lista.
  nav: [
    {
      title: 'Administração',
      icon: <Settings />,
      items: [
        {
          title: 'Usuários',
          url: '/users',
          icon: <Users />,
          permission: 'backoffice.users.read',
        },
        {
          title: 'Cargos',
          url: '/roles',
          icon: <Shield />,
          permission: 'backoffice.roles.read',
        },
        {
          title: 'Auditoria',
          url: '/audit-logs',
          icon: <ScrollText />,
          permission: 'backoffice.audit.read',
        },
        {
          title: 'Configurações',
          url: '/settings',
          icon: <Settings />,
          permission: 'backoffice.systemConfigs.read',
        },
      ],
    },
  ],
  // Itens de topo, fora de qualquer módulo — recursos transversais ao sistema
  // (Início, Documentação). Sem `permission`: visível a todos os usuários logados.
  links: [{ title: 'Início', url: '/', icon: <Home /> }],
};
