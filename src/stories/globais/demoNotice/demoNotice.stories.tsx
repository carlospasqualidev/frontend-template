import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Button } from '@/components/global/button/button';
import { Card } from '@/components/global/card/card';
import { DemoNotice } from '@/components/global/demoNotice/demoNotice';
import { notifyDemoAction } from '@/components/global/demoNotice/notifyDemoAction';
import { Typography } from '@/components/ui/typography';

const meta = {
  title: 'Globais/DemoNotice',
  component: DemoNotice,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Aviso de **dados de demonstração**: toda aba, bloco ou card que ainda não fala com o servidor usa este componente, com o mesmo texto em todo o sistema. `badge` (padrão) no `action` do `Card`; `banner` no topo de uma aba inteira de demonstração. Ação dentro da parte de demonstração chama `notifyDemoAction` (toast "nada foi alterado") em vez de simular uma confirmação. Confira nos dois temas pela barra do Storybook.',
      },
    },
  },
} satisfies Meta<typeof DemoNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vitrine: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card
        title="Sessões ativas"
        description="Badge no cabeçalho do card que continua com dados fixos."
        action={<DemoNotice />}
      >
        <div className="flex items-center justify-between gap-3">
          <Typography variant="small">MacBook Pro · Chrome</Typography>
          <Button variant="outline" size="sm" onClick={notifyDemoAction}>
            Encerrar
          </Button>
        </div>
      </Card>

      <div className="grid gap-4">
        <DemoNotice variant="banner" />
        <Card
          title="Pagamento"
          description="Banner no topo de uma aba que é toda exemplo de tela."
        >
          <Typography variant="muted">Plano Pro · R$ 149,00/mês</Typography>
        </Card>
      </div>

      <Card
        title="Banner com explicação própria"
        description="A `description` diz o que falta no servidor naquela parte."
      >
        <DemoNotice
          variant="banner"
          description="O servidor ainda não guarda preferências de notificação por pessoa: os canais abaixo são um exemplo."
        />
      </Card>
    </div>
  ),
};

export const Badge: Story = { args: { variant: 'badge' } };

export const Banner: Story = { args: { variant: 'banner' } };
