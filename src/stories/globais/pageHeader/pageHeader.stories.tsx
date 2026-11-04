import { Plus, Settings } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { PageHeader } from '@/components/global/pageHeader/pageHeader';
import { Button } from '@/components/global/button/button';

const meta = {
  title: 'Globais/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Cabeçalho padrão para topo de tela: título, descrição e área opcional de ações. Já trata `bg-card` + borda + shadow (light) + `dark:shadow-none`.',
      },
    },
  },
  args: { title: '', description: '' },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vitrine: Story = {
  render: () => (
    <div className="space-y-6">
      <PageHeader title="Pagamentos" />

      <PageHeader
        title="Pagamentos"
        description="Cabeçalho com uma ação primária."
        actions={
          <Button>
            <Plus />
            Novo pagamento
          </Button>
        }
      />

      <PageHeader
        title="Pagamentos"
        description="Cabeçalho com múltiplas ações."
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Settings />
              Configurar
            </Button>
            <Button>
              <Plus />
              Novo
            </Button>
          </div>
        }
      />
    </div>
  ),
};
