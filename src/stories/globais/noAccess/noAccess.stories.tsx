import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Card } from '@/components/global/card/card';
import { NoAccess } from '@/components/global/noAccess/noAccess';

const meta = {
  title: 'Globais/NoAccess',
  component: NoAccess,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Estado de "sem acesso" para URL aberta sem permissão (use com `isForbidden(error)`). Só a mensagem: o servidor segue recusando. `description` opcional sobrescreve o texto padrão.',
      },
    },
  },
} satisfies Meta<typeof NoAccess>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vitrine: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Padrão">
        <NoAccess />
      </Card>
      <Card title="Descrição própria">
        <NoAccess description="Peça acesso ao administrador da conta." />
      </Card>
    </div>
  ),
};
