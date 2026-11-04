import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Card } from '@/components/global/card/card';
import { AppSidebar } from '@/components/global/sidebar/appSidebar';
import { SidebarBrand } from '@/components/global/sidebar/sidebarBrand';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Typography } from '@/components/ui/typography';
import { useSessionStore } from '@/hooks/useSessionStore';

const meta = {
  title: 'Globais/Sidebar',
  component: AppSidebar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Navegação do sistema. Os itens vêm de `sidebarData` (`lib/constants/sidebar.tsx`): cada **módulo** é um grupo colapsável e as telas são suas filhas. O `NavMain` filtra por permissão (`permission` / `anyPermission`), ordena alfabeticamente (pt-BR) e, com a sidebar recolhida em ícones, troca o submenu por um flyout. Não monte navegação na tela — declare o item em `sidebarData`.',
      },
    },
  },
} satisfies Meta<typeof AppSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A sidebar mostra o usuário no rodapé (`NavUser`), que só renderiza com sessão.
 * A vitrine injeta um usuário fake com todas as permissões do `sidebarData` do
 * template para os itens aparecerem.
 */
function withFakeSession() {
  useSessionStore.setState({
    user: {
      id: '1',
      name: 'Maria Silva',
      email: 'maria@example.com',
      image: null,
      permissions: [
        'backoffice.audit.read',
        'backoffice.systemConfigs.read',
        'backoffice.users.read',
      ],
      idleTimeoutMinutes: 20,
    },
  });
}

/**
 * A sidebar é `position: fixed` com `h-svh`: sem containing block ela escapa da
 * caixa e as instâncias se empilham sobre a página (visível no Docs).
 * `transform-gpu` cria o containing block e a altura passa a ser a da caixa.
 */
function SidebarFrame({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="h-112 transform-gpu overflow-hidden rounded-lg border **:data-[slot=sidebar-container]:h-full [&>div]:min-h-0">
      {children}
    </div>
  );
}

export const Vitrine: Story = {
  render: () => {
    withFakeSession();

    return (
      <div className="space-y-4">
        <Card
          title="Expandida"
          description="Módulo colapsável com as telas dentro; o grupo abre sozinho quando a rota ativa é uma das suas."
        >
          <SidebarFrame>
            <SidebarProvider defaultOpen>
              <AppSidebar />
            </SidebarProvider>
          </SidebarFrame>
        </Card>

        <Card
          title="Recolhida em ícones"
          description="Só os ícones do módulo. Clicar abre um flyout à direita com as telas — sem ele os filhos ficariam inalcançáveis neste modo."
        >
          <SidebarFrame>
            <SidebarProvider defaultOpen={false}>
              <AppSidebar />
            </SidebarProvider>
          </SidebarFrame>
        </Card>

        <Card
          title="SidebarBrand"
          description="Cabeçalho da sidebar: iniciais do projeto, nome e AMBIENTE (Sandbox/Produção). O ambiente à vista evita agir num ambiente achando que é outro."
        >
          <div className="max-w-64 rounded-lg border p-2">
            <SidebarBrand />
          </div>
          <Typography variant="muted" className="mt-2">
            Nome e ambiente vêm de `VITE_PROJECT_NAME` /
            `VITE_PROJECT_ENVIRONMENT`; as iniciais são derivadas do nome.
          </Typography>
        </Card>
      </div>
    );
  },
};
