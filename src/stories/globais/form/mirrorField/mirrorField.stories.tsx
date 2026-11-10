import type { Meta, StoryObj } from '@storybook/tanstack-react';
import { useForm } from 'react-hook-form';

import { MirrorField } from '@/components/global/form/mirrorField';
import { NumberField } from '@/components/global/form/numberField';
import { Card } from '@/components/global/card/card';

const meta = {
  title: 'Form/MirrorField',
  component: MirrorField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Campo-espelho: um valor **derivado** (um total que o servidor calcula, um dado de outro registro) com o visual de campo, mas **inerte** — sem foco, sem seleção, sem cursor de texto. Alinha no grid ao lado dos campos editáveis sem sugerir que se pode digitar por cima.',
      },
    },
  },
  args: { label: '', value: '' },
} satisfies Meta<typeof MirrorField>;

export default meta;
type Story = StoryObj<typeof meta>;

function GridDemo() {
  const { control } = useForm<{ base: number }>({
    defaultValues: { base: 10000 },
  });

  return (
    <div className="grid items-start gap-4 sm:grid-cols-3">
      <NumberField
        control={control}
        name="base"
        id="demo-base"
        label="Valor base (editável)"
        prefix="R$ "
      />
      <MirrorField label="Subtotal (calculado)" value="R$ 0,00" />
      <MirrorField label="Desconto (calculado)" value="R$ 0,00" />
    </div>
  );
}

export const Showcase: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card
        title="Ao lado de um editável"
        description="O espelho (inerte) alinha com o campo editável, mas não recebe foco."
      >
        <GridDemo />
      </Card>

      <Card
        title="Com conteúdo próprio e dica"
        description="`children` para valor que não é texto, e `labelHint` com tooltip ao lado do rótulo."
      >
        <MirrorField label="Origem" labelHint="Registro de onde vem o valor.">
          <a href="#origem" className="underline">
            Ver origem
          </a>
        </MirrorField>
      </Card>

      <Card title="Isolado" description="Rótulo + valor já formatado.">
        <MirrorField label="Taxa" value="R$ 1.250,00" />
      </Card>
    </div>
  ),
};
