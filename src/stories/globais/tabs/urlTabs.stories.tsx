import { useState } from 'react';
import { Activity, UserCog } from 'lucide-react';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Card } from '@/components/global/card/card';
import { Switch } from '@/components/global/form/switch';
import { UnsavedChangesDialog } from '@/components/global/layout/unsavedChangesDialog';
import { UrlTabs } from '@/components/global/tabs/urlTabs';
import { Typography } from '@/components/ui/typography';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

const meta = {
  title: 'Globais/UrlTabs',
  component: UrlTabs,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Abas com o valor ativo sincronizado a um search param da URL (`?tab=...`). Quando o valor é o `defaultValue`, a chave é removida (mantém a URL limpa). As abas são separadas por um pipe decorativo e, por padrão, sem ícone. A lista rola horizontalmente quando não cabe na largura (responsivo, sem esconder abas) e cada aba pode ser aberta em nova guia do navegador com o clique do meio (scroll) ou Ctrl/Cmd/Shift+clique.',
      },
    },
  },
  args: {
    items: [],
    defaultValue: '',
  },
} satisfies Meta<typeof UrlTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

function withRouter(Story: () => React.ReactElement) {
  const rootRoute = createRootRoute({ component: () => <Story /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <Outlet />,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return <RouterProvider router={router} />;
}

export const Vitrine: Story = {
  render: () => (
    <div className="grid gap-6">
      <Card
        title="Padrão de página com abas"
        description="Rótulo no trigger, pipe entre as abas e conteúdo correspondente abaixo. Sincroniza com `?tab=...` (a aba padrão fica sem param na URL)."
      >
        <UrlTabs
          defaultValue="profile"
          items={[
            {
              value: 'profile',
              label: 'Perfil',
              content: (
                <Typography variant="muted">
                  Dados pessoais, foto e preferências do usuário logado.
                </Typography>
              ),
            },
            {
              value: 'security',
              label: 'Segurança',
              content: (
                <Typography variant="muted">
                  Senha, autenticação em 2 fatores e sessões ativas.
                </Typography>
              ),
            },
            {
              value: 'notifications',
              label: 'Notificações',
              content: (
                <Typography variant="muted">
                  Canais e tipos de evento que disparam notificações.
                </Typography>
              ),
            },
            {
              value: 'billing',
              label: 'Pagamento',
              content: (
                <Typography variant="muted">
                  Plano atual, método de pagamento e histórico de faturas.
                </Typography>
              ),
            },
          ]}
        />
      </Card>

      <Card
        title="Com ícone (opcional)"
        description="O `icon` continua aceito na API e é desenhado antes do rótulo, mas o padrão das telas é sem ícone."
      >
        <UrlTabs
          defaultValue="overview"
          searchKey="view"
          items={[
            {
              value: 'overview',
              icon: <UserCog />,
              label: 'Visão geral',
              content: (
                <Typography variant="muted">
                  Resumo do espaço, métricas principais e atividade recente.
                </Typography>
              ),
            },
            {
              value: 'activity',
              icon: <Activity />,
              label: 'Atividade',
              content: (
                <Typography variant="muted">
                  Histórico cronológico de eventos.
                </Typography>
              ),
            },
          ]}
        />
      </Card>

      <Card
        title="Muitas abas (scroll horizontal)"
        description="Quando as abas não cabem na largura, a lista rola lateralmente — nenhuma aba é escondida. Reduza a janela para ver o scroll; use o clique do meio numa aba para abri-la em nova guia."
      >
        <UrlTabs
          defaultValue="general"
          searchKey="section"
          items={[
            {
              value: 'general',
              label: 'Geral',
              content: (
                <Typography variant="muted">Configurações gerais.</Typography>
              ),
            },
            {
              value: 'members',
              label: 'Membros',
              content: (
                <Typography variant="muted">Membros do espaço.</Typography>
              ),
            },
            {
              value: 'security',
              label: 'Segurança',
              content: (
                <Typography variant="muted">Políticas de acesso.</Typography>
              ),
            },
            {
              value: 'access',
              label: 'Chaves de acesso',
              content: (
                <Typography variant="muted">Tokens e chaves de API.</Typography>
              ),
            },
            {
              value: 'integrations',
              label: 'Integrações',
              content: (
                <Typography variant="muted">Apps conectados.</Typography>
              ),
            },
            {
              value: 'activity',
              label: 'Atividade',
              content: (
                <Typography variant="muted">Eventos recentes.</Typography>
              ),
            },
            {
              value: 'billing',
              label: 'Faturamento',
              content: (
                <Typography variant="muted">Plano e faturas.</Typography>
              ),
            },
            {
              value: 'payment',
              label: 'Métodos de pagamento',
              content: (
                <Typography variant="muted">Cartões e cobrança.</Typography>
              ),
            },
            {
              value: 'notifications',
              label: 'Notificações',
              content: (
                <Typography variant="muted">Preferências de aviso.</Typography>
              ),
            },
          ]}
        />
      </Card>
    </div>
  ),
  decorators: [withRouter],
  parameters: {
    docs: {
      description: {
        story:
          'Padrão usado em `screens/account` e `screens/users/details`. Os search params alheios à aba (filtros, paginação) ficam preservados ao trocar de aba.',
      },
    },
  },
};

// O conteúdo da aba desmonta ao trocar: a "edição" some junto, como o
// formulário do perfil em `screens/account`.
function DirtyTabContent() {
  const [dirty, setDirty] = useState(true);
  useUnsavedChangesGuard(dirty, { searchKey: 'tab' });

  return (
    <Switch
      id="story-url-tabs-dirty"
      label="Edição não salva"
      description="Ligado, trocar de aba pede confirmação."
      checked={dirty}
      onCheckedChange={setDirty}
    />
  );
}

function ConfirmBeforeChangeDemo() {
  return (
    <Card
      title="Confirmação antes de trocar"
      description="A troca de aba é uma navegação do roteador (`?tab=`): com edição não salva na aba, o guard da tela (`useUnsavedChangesGuard` com `searchKey: 'tab'`) abre a confirmação global antes. Padrão de `screens/account` (o perfil alterado)."
    >
      <UrlTabs
        defaultValue="profile"
        items={[
          {
            value: 'profile',
            label: 'Perfil',
            content: <DirtyTabContent />,
          },
          {
            value: 'security',
            label: 'Segurança',
            content: (
              <Typography variant="muted">
                Senha, autenticação em 2 fatores e sessões ativas.
              </Typography>
            ),
          },
        ]}
      />
      <UnsavedChangesDialog />
    </Card>
  );
}

export const ConfirmacaoAntesDeTrocar: Story = {
  name: 'Confirmação antes de trocar',
  render: () => <ConfirmBeforeChangeDemo />,
  decorators: [withRouter],
};
