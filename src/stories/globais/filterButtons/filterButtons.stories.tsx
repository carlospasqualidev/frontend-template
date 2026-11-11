import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Card } from '@/components/global/card/card';
import { FilterButtons } from '@/components/global/filterButtons/filterButtons';

const meta = {
  title: 'Global/FilterButtons',
  component: FilterButtons,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Grupo de botões de escolha única, com contador opcional, para as "visões" de uma fila. O selecionado usa a cor primária e anuncia `aria-pressed`; não aplica nada sozinho. Quando não cabe na largura, rola de lado em vez de esconder opção.',
      },
    },
  },
  args: {
    label: 'Visão',
    options: [],
    value: '',
    onValueChange: () => undefined,
  },
} satisfies Meta<typeof FilterButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

const VIEWS = [
  { value: 'all', label: 'Todos', count: 128 },
  { value: 'active', label: 'Ativos', count: 40 },
  { value: 'pending', label: 'Pendentes', count: 12 },
  { value: 'late', label: 'Atrasados', count: 3 },
  { value: 'done', label: 'Concluídos', count: 25 },
  { value: 'archived', label: 'Arquivados', count: 48 },
];

function Interactive({ showCounts }: { showCounts: boolean }) {
  const [value, setValue] = React.useState('all');

  return (
    <FilterButtons
      label="Visão"
      options={VIEWS}
      value={value}
      onValueChange={setValue}
      showCounts={showCounts}
    />
  );
}

export const Showcase: Story = {
  render: () => (
    <div className="grid gap-6">
      <Card
        title="Com contadores"
        description="O contador vem pronto de quem usa; aqui, valores de exemplo."
      >
        <Interactive showCounts />
      </Card>

      <Card
        title="Sem contadores"
        description="Só a escolha: `showCounts` desligado."
      >
        <Interactive showCounts={false} />
      </Card>

      <Card
        title="Contador ainda não chegou"
        description="Sem `count`, o botão mostra reticências em vez de um zero falso."
      >
        <FilterButtons
          label="Visão"
          showCounts
          value="all"
          onValueChange={() => undefined}
          options={VIEWS.map(({ value, label }) => ({ value, label }))}
        />
      </Card>
    </div>
  ),
};
