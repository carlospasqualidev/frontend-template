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
      permissions: ['users.read', 'audit.read', 'settings.read'],
    },
  });
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
          <div className="h-[28rem] overflow-hidden rounded-lg border">
            <SidebarProvider defaultOpen>
              <AppSidebar />
            </SidebarProvider>
          </div>
        </Card>

        <Card
          title="Recolhida em ícones"
          description="Só os ícones do módulo. Clicar abre um flyout à direita com as telas — sem ele os filhos ficariam inalcançáveis neste modo."
        >
          <div className="h-[28rem] overflow-hidden rounded-lg border">
            <SidebarProvider defaultOpen={false}>
              <AppSidebar />
            </SidebarProvider>
          </div>
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
