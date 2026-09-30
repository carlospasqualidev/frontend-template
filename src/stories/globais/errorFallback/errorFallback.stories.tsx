import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { ErrorFallback } from '@/components/global/errorFallback';

const meta = {
  title: 'Globais/ErrorFallback',
  component: ErrorFallback,
  parameters: {
    docs: {
      description: {
        component:
          'Tela de erro do projeto. `screen` (padrão) é a tela cheia: o `ErrorBoundary` do app e as rotas públicas. `content` fica no lugar do conteúdo de uma tela do layout protegido, com o menu visível e o link para o início (que some quando a tela já é o início). O título só diz que a equipe foi notificada com `reported`, que marca quem de fato chamou o `sendErrorMessage` (o `RouteErrorFallback`, o `ErrorBoundary` do app); sem ela, o título é neutro. "Tentar novamente" chama o `onRetry` (sem argumentos; com promessa, o botão fica em carregamento até ela terminar) ou, sem ele, o `resetErrorBoundary`; sem nenhum dos dois, o botão não aparece. Nas rotas, o `RouteErrorFallback` liga o `errorComponent` do TanStack Router a ela: o botão refaz o carregamento da rota e desenha a tela de novo. Numa tela com o erro de query tratado nela, `onRetry={refetch}`.',
      },
    },
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ErrorFallback>;

export default meta;
type Story = StoryObj<typeof meta>;

// Como no `ErrorBoundary` do app, que reporta o erro no `onError`.
export const Padrao: Story = {
  args: {
    error: new Error('Erro simulado'),
    resetErrorBoundary: () => undefined,
    reported: true,
  },
};

// Como o erro de query tratado numa tela (`onRetry={refetch}`), sem reporte:
// título neutro. Fora do início, para mostrar o link para ele.
export const Conteudo: Story = {
  args: {
    onRetry: () => undefined,
    variant: 'content',
  },
  parameters: {
    layout: 'padded',
    tanstack: { router: { route: { path: '/settings' } } },
  },
};
