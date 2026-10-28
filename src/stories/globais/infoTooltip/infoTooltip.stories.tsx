import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { InfoTooltip } from '@/components/global/infoTooltip/infoTooltip';
import { Card } from '@/components/global/card/card';

const meta = {
  title: 'Globais/InfoTooltip',
  component: InfoTooltip,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Ícone de informação que revela um tooltip ao passar o mouse ou focar e, ao clicar, fixa o mesmo conteúdo num popover (fecha com Escape ou clique fora). Traz o próprio `TooltipProvider`.',
      },
    },
  },
  args: { label: 'Texto de ajuda.' },
} satisfies Meta<typeof InfoTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vitrine: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Simples" description="Ao lado de um rótulo.">
        <span className="inline-flex items-center gap-1.5 text-sm">
          Chave de API
          <InfoTooltip label="Usada para autenticar as requisições da integração." />
        </span>
      </Card>

      <Card title="Multilinha" description="Conteúdo com quebras de linha.">
        <span className="inline-flex items-center gap-1.5 text-sm">
          Formato de exportação
          <InfoTooltip
            label={'Formato padrão: CSV\nSeparador padrão: ponto e vírgula'}
          />
        </span>
      </Card>
    </div>
  ),
};

export const ClicarFixaADica: Story = {
  render: () => (
    <Card title="Clique" description="Clique no ícone para fixar a dica.">
      <span className="inline-flex items-center gap-1.5 text-sm">
        Prazo de retenção
        <InfoTooltip label="Dica fixada num popover até Escape ou clique fora." />
      </span>
    </Card>
  ),
};
