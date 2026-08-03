import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { NumberField } from '@/components/global/form/numberField';
import { Card } from '@/components/global/card/card';

// Controlled-only (exige `control`/`name`), então a vitrine é render-only e o
// meta não vincula `component`/`args` (que exigiriam um `control` fabricado).
const meta = {
  title: 'Formulário/NumberField',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Campo numérico com máscara pt-BR **na digitação** (milhar "." e decimal ","), para quantidades e valores monetários. Controlled via `control` + `name`; guarda um `number` no formulário (não a string). Os dígitos preenchem da direita para a esquerda (estilo centavos: "150000" → "1.500,00"). Para dinheiro, passe `prefix="R$ "`.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const schema = z.object({
  quantity: z
    .number({ error: 'Informe a quantidade.' })
    .positive('Informe uma quantidade maior que zero.'),
  price: z
    .number({ error: 'Informe o valor.' })
    .positive('Informe um valor maior que zero.'),
});

type FormValues = z.infer<typeof schema>;

function NumberFieldDemo() {
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: undefined, price: undefined },
  });

  return (
    <form
      className="space-y-3"
      onSubmit={handleSubmit(() => undefined)}
      noValidate
    >
      <NumberField
        id="quantity"
        name="quantity"
        control={control}
        label="Quantidade"
        placeholder="0,00"
      />
      <NumberField
        id="price"
        name="price"
        control={control}
        label="Valor"
        prefix="R$ "
        placeholder="R$ 0,00"
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
        title="Quantidade (decimal)"
        description='Digite "150000" e veja virar "1.500,00" na hora. Guarda 1500 no formulário.'
      >
        <NumberFieldDemo />
      </Card>
    </div>
  ),
};

function TableCellDemo() {
  const { control } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: undefined, price: undefined },
  });
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-muted-foreground">
          <th className="pb-2 font-medium">Mínimo</th>
          <th className="pb-2 font-medium">Máximo</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="pr-2">
            <NumberField
              id="cell-min"
              name="quantity"
              control={control}
              label="Valor mínimo"
              srOnlyLabel
              maxDecimals={5}
            />
          </td>
          <td>
            <NumberField
              id="cell-max"
              name="price"
              control={control}
              label="Valor máximo"
              srOnlyLabel
              maxDecimals={5}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export const RotuloOculto: Story = {
  render: () => (
    <Card
      title="Em célula de tabela (srOnlyLabel)"
      description="Com `srOnlyLabel`, o rótulo do campo fica acessível ao leitor de tela mas oculto visualmente — o cabeçalho da coluna é o rótulo visível."
    >
      <TableCellDemo />
    </Card>
  ),
};
