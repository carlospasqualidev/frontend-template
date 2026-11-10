import { Download, Trash2 } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { ActionMenu } from '@/components/global/actionMenu/actionMenu';
import { Card } from '@/components/global/card/card';

const meta = {
  title: 'Globais/ActionMenu',
  component: ActionMenu,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Botão de barra que abre um menu de ações agrupado. Opção indisponível fica visível com o motivo; `checked` vira alternância e não fecha o menu; fechar por escolha não devolve o foco ao botão. Sem `items`, não renderiza.',
      },
    },
  },
  args: { label: 'Outras opções', items: [] },
} satisfies Meta<typeof ActionMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = (): void => {};

export const Vitrine: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Agrupado, com destrutiva">
        <ActionMenu
          label="Outras opções"
          items={[
            {
              key: 'export',
              label: 'Exportar',
              icon: <Download />,
              onSelect: noop,
            },
            {
              key: 'delete',
              label: 'Excluir',
              icon: <Trash2 />,
              destructive: true,
              separatorBefore: true,
              onSelect: noop,
            },
          ]}
        />
      </Card>
      <Card title="Indisponível com motivo e alternância">
        <ActionMenu
          label="Outras opções"
          menuLabel="Seleção"
          items={[
            {
              key: 'export',
              label: 'Exportar selecionados',
              disabled: true,
              disabledReason: 'Selecione ao menos um registro',
              onSelect: noop,
            },
            {
              key: 'auto',
              label: 'Atualizar sozinho',
              checked: true,
              separatorBefore: true,
              onSelect: noop,
            },
          ]}
        />
      </Card>
    </div>
  ),
};
