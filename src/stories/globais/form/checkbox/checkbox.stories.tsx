import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Checkbox } from '@/components/global/form/checkbox';
import { Card } from '@/components/global/card/card';

const meta = {
  title: 'Formulário/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Checkbox integrado ao `react-hook-form`. Uncontrolled (sem `control`) ou controlled (passando `control` + `name`). Suporta label, descrição opcional e mensagens de erro.',
      },
    },
  },
  args: { label: '' },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

const schema = z.object({
  terms: z.boolean().refine(Boolean, 'Você precisa aceitar os termos.'),
});

function ControlledDemo() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{ terms: boolean }>({
    resolver: zodResolver(schema),
    defaultValues: { terms: false },
  });

  return (
    <form
      className="space-y-3"
      onSubmit={handleSubmit(() => undefined)}
      noValidate
    >
      <Checkbox
        id="terms"
        name="terms"
        control={control}
        label="Aceito os termos de uso"
        description="Obrigatório — submeter sem marcar dispara a validação."
        errors={errors.terms}
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
      <Card title="Padrão" description="Uncontrolled simples.">
        <Checkbox id="cb-basic" label="Receber novidades por e-mail" />
      </Card>

      <Card title="Com descrição" description="Texto auxiliar abaixo.">
        <Checkbox
          id="cb-desc"
          label="Manter conectado"
          description="Não exige novo login por 30 dias."
        />
      </Card>

      <Card
        title="Marcado por padrão"
        description="Uncontrolled com defaultChecked."
      >
        <Checkbox
          id="cb-default"
          label="Receber relatórios semanais"
          defaultChecked
        />
      </Card>

      <Card
        title="Desabilitado"
        description="Mantém o valor mas bloqueia interação."
      >
        <Checkbox
          id="cb-disabled"
          label="Permissões avançadas"
          defaultChecked
          disabled
        />
      </Card>

      <Card
        title="Controlled + validação Zod"
        description="Submeta vazio para ver a mensagem de erro."
      >
        <ControlledDemo />
      </Card>
    </div>
  ),
};
