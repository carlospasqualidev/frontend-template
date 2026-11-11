import { useForm } from 'react-hook-form';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { RadioGroup } from '@/components/global/form/radioGroup';
import { Card } from '@/components/global/card/card';

const channelOptions = [
  { value: 'email', label: 'E-mail' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Notificação no aplicativo' },
];

const meta = {
  title: 'Formulário/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Escolha de uma opção entre poucas, integrada ao `react-hook-form`. O rótulo do grupo é a legenda do `fieldset` e o nome acessível; `rules` e `defaultValue` valem no modo controlado.',
      },
    },
  },
  args: { label: '', options: [] },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledDemo() {
  const { control } = useForm<{ channel: string }>();

  return (
    <RadioGroup
      name="channel"
      control={control}
      defaultValue="email"
      rules={{ required: 'Escolha um canal.' }}
      label="Canal de contato"
      options={channelOptions}
    />
  );
}

export const Vitrine: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Padrão" description="Uncontrolled simples.">
        <RadioGroup
          label="Canal de contato"
          options={channelOptions}
          defaultValue="sms"
        />
      </Card>

      <Card title="Com descrição" description="Texto auxiliar por opção.">
        <RadioGroup
          label="Plano"
          options={[
            {
              value: 'monthly',
              label: 'Mensal',
              description: 'Cobrança todo mês, sem fidelidade.',
            },
            {
              value: 'yearly',
              label: 'Anual',
              description: 'Cobrança única, com desconto.',
            },
          ]}
        />
      </Card>

      <Card
        title="Legenda só para o leitor de tela"
        description="`srOnlyLabel`: quando o contexto da tela já dá o título."
      >
        <RadioGroup
          label="Canal de contato"
          options={channelOptions}
          srOnlyLabel
        />
      </Card>

      <Card title="Com erro" description="Mensagem abaixo do grupo.">
        <RadioGroup
          label="Canal de contato"
          options={channelOptions}
          errors={{ message: 'Escolha um canal.' }}
        />
      </Card>

      <Card
        title="Desabilitado"
        description="Mantém o valor, bloqueia a interação."
      >
        <RadioGroup
          label="Canal de contato"
          options={channelOptions}
          defaultValue="email"
          disabled
        />
      </Card>

      <Card
        title="Controlled (react-hook-form)"
        description="Integrado via control + name, com defaultValue e rules."
      >
        <ControlledDemo />
      </Card>
    </div>
  ),
};
