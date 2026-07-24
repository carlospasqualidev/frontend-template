import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Combobox } from '@/components/global/form/combobox';
import { Card } from '@/components/global/card/card';

// Controlled-only/uncontrolled — a vitrine é render-only (sem `component`/`args`).
const meta = {
  title: 'Formulário/Combobox',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Select **pesquisável** de seleção única. Use quando a lista de opções é grande — o `Select` global (Radix) não tem busca. Controlled via `control` + `name` ou uncontrolled (`value` + `onValueChange`).',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const cityOptions = [
  'Belo Horizonte',
  'Belém',
  'Brasília',
  'Campinas',
  'Curitiba',
  'Florianópolis',
  'Fortaleza',
  'Goiânia',
  'Manaus',
  'Natal',
  'Porto Alegre',
  'Recife',
  'Rio de Janeiro',
  'Salvador',
  'Santos',
  'São Paulo',
  'Sorocaba',
  'Vitória',
].map((name) => ({ value: name.toLowerCase().replace(/\s+/g, '-'), label: name }));

const schema = z.object({ city: z.string().min(1, 'Selecione a cidade.') });

function ControlledDemo() {
  const { control, handleSubmit } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { city: '' },
  });

  return (
    <form className="space-y-3" onSubmit={handleSubmit(() => undefined)} noValidate>
      <Combobox label="Cidade" name="city" control={control} options={cityOptions} placeholder="Selecione a cidade" />
      <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
        Validar
      </button>
    </form>
  );
}

export const Vitrine: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Pesquisável" description="Abra e digite para filtrar uma lista grande. Validação Zod ao submeter vazio.">
        <ControlledDemo />
      </Card>
    </div>
  ),
};
