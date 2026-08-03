import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { DateField } from '@/components/global/form/dateField';
import { Card } from '@/components/global/card/card';

const meta = {
  title: 'Formulário/DateField',
  component: DateField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Campo de data com input mascarado e popover de calendário. Sempre controlled (`control` + `name`). Aceita digitação manual no formato dd/mm/aaaa e sincroniza com o calendário.',
      },
    },
  },
  args: { label: '' },
} satisfies Meta<typeof DateField>;

export default meta;
type Story = StoryObj<typeof meta>;

const schema = z.object({
  admissionDate: z
    .string()
    .min(1, 'Informe a data de admissão.')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use uma data válida.'),
});

function VitrineDemo() {
  const {
    control,
    formState: { errors },
  } = useForm<{
    basic: string;
    described: string;
    prefilled: string;
    disabled: string;
    validated: string;
  }>({
    resolver: zodResolver(
      z.object({
        basic: z.string(),
        described: z.string(),
        prefilled: z.string(),
        disabled: z.string(),
        validated: schema.shape.admissionDate,
      })
    ),
    defaultValues: {
      basic: '',
      described: '',
      prefilled: '2026-03-15',
      disabled: '2025-12-01',
      validated: '',
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card
        title="Padrão"
        description="Vazio; aceita digitação ou seleção no calendário."
      >
        <DateField id="df-basic" name="basic" control={control} label="Data" />
      </Card>

      <Card title="Com descrição" description="Texto auxiliar abaixo.">
        <DateField
          id="df-desc"
          name="described"
          control={control}
          label="Data de validade"
          description="Formato aceito: dd/mm/aaaa."
        />
      </Card>

      <Card
        title="Com valor inicial"
        description="defaultValues preenchidos no useForm."
      >
        <DateField
          id="df-default"
          name="prefilled"
          control={control}
          label="Data de admissão"
        />
      </Card>

      <Card
        title="Desabilitado"
        description="Bloqueia interação; valor permanece visível."
      >
        <DateField
          id="df-disabled"
          name="disabled"
          control={control}
          label="Data de registro"
          disabled
        />
      </Card>

      <Card
        title="Com erro de validação"
        description="Schema Zod exige o campo preenchido."
      >
        <DateField
          id="df-error"
          name="validated"
          control={control}
          label="Data de admissão"
          errors={errors.validated}
        />
      </Card>
    </div>
  );
}

export const Vitrine: Story = {
  render: () => <VitrineDemo />,
};
