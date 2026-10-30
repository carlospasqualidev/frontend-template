import { useForm } from 'react-hook-form';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { DateTimeField } from '@/components/global/form/dateTimeField';
import { Card } from '@/components/global/card/card';

const meta = {
  title: 'Formulário/DateTimeField',
  component: DateTimeField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Campo combinado de data + hora com input mascarado e popover de calendário. Aceita digitação manual no formato dd/mm/aaaa hh:mm e sincroniza com o calendário. O cabeçalho do calendário traz quatro setas (ano anterior, mês anterior, próximo mês, próximo ano) além dos seletores de mês e ano; as setas respeitam os limites do calendário (100 anos atrás, 50 à frente).',
      },
    },
  },
  args: { label: '' },
} satisfies Meta<typeof DateTimeField>;

export default meta;
type Story = StoryObj<typeof meta>;

function VitrineDemo() {
  const { control } = useForm<{
    basic: string;
    described: string;
    prefilled: string;
    disabled: string;
  }>({
    defaultValues: {
      basic: '',
      described: '',
      prefilled: '2026-03-15T09:30',
      disabled: '2025-12-01T14:00',
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Padrão" description="Vazio; data + hora.">
        <DateTimeField
          id="dtf-basic"
          name="basic"
          control={control}
          label="Início"
        />
      </Card>

      <Card title="Com descrição" description="Texto auxiliar abaixo.">
        <DateTimeField
          id="dtf-desc"
          name="described"
          control={control}
          label="Agendamento"
          description="Formato: dd/mm/aaaa hh:mm (24h)."
        />
      </Card>

      <Card
        title="Com valor inicial"
        description="defaultValues preenchidos no useForm."
      >
        <DateTimeField
          id="dtf-default"
          name="prefilled"
          control={control}
          label="Data e hora de admissão"
        />
      </Card>

      <Card
        title="Desabilitado"
        description="Bloqueia interação; valor permanece visível."
      >
        <DateTimeField
          id="dtf-disabled"
          name="disabled"
          control={control}
          label="Registrado em"
          disabled
        />
      </Card>
    </div>
  );
}

export const Vitrine: Story = {
  render: () => <VitrineDemo />,
};
