import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { DecimalField } from '@/components/global/form/decimalField';
import { Card } from '@/components/global/card/card';

// Controlled-only (exige `control`/`name`), então a vitrine é render-only e o
// meta não vincula `component`/`args`.
const meta = {
  title: 'Formulário/DecimalField',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Campo numérico de digitação **livre** em pt-BR: o usuário posiciona a vírgula manualmente e informa quantas casas quiser (sem a máscara "centavos" do `NumberField`). Controlled via `control` + `name`; guarda um `number` no formulário. Use quando a precisão é do usuário e varia por registro (ex.: uma medição onde "0,0003" e "200" convivem).',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const schema = z.object({
  mass: z.number({ error: 'Informe o valor.' }).optional(),
  retained: z.number({ error: 'Informe o valor.' }).optional(),
});

type FormValues = z.infer<typeof schema>;

function DecimalFieldDemo() {
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { mass: undefined, retained: undefined },
  });

  return (
    <form
      className="space-y-3"
      onSubmit={handleSubmit(() => undefined)}
      noValidate
    >
      <DecimalField
        id="mass"
        name="mass"
        control={control}
        label="Massa da amostra"
        placeholder="g"
      />
      <DecimalField
        id="retained"
        name="retained"
        control={control}
        label="Massa | Retido no Imã (R)"
        placeholder="g"
      />
      <button
        type="submit"
        className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
      >
        Validar
      </button>
    </form>
  );
}

export const Vitrine: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card
        title="Variáveis de resultado (decimal livre)"
        description='Digite "0,0003" ou "200" livremente — a vírgula é sua, não há máscara. Guarda o número no formulário.'
      >
        <DecimalFieldDemo />
      </Card>
    </div>
  ),
};
