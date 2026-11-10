import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { AutoRefreshIndicator } from '@/components/global/autoRefreshIndicator/autoRefreshIndicator';
import { Card } from '@/components/global/card/card';

const meta = {
  title: 'Globais/AutoRefreshIndicator',
  component: AutoRefreshIndicator,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Anel que se preenche ao longo do intervalo de um polling; vira spinner enquanto a consulta roda. `cycleKey` (ex.: `dataUpdatedAt`) reinicia o anel; `tooltip` é opcional. Com `prefers-reduced-motion`, o anel fica parado.',
      },
    },
  },
  args: { intervalMs: 5000, cycleKey: 1, fetching: false },
} satisfies Meta<typeof AutoRefreshIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vitrine: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card title="Aguardando">
        <AutoRefreshIndicator intervalMs={5000} cycleKey={1} fetching={false} />
      </Card>
      <Card title="Consultando">
        <AutoRefreshIndicator intervalMs={5000} cycleKey={1} fetching />
      </Card>
      <Card title="Tooltip próprio">
        <AutoRefreshIndicator
          intervalMs={10000}
          cycleKey={1}
          fetching={false}
          tooltip="A lista é atualizada a cada 10 segundos."
        />
      </Card>
    </div>
  ),
};
