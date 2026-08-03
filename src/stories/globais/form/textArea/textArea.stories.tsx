import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { TextArea } from '@/components/global/form/textArea';
import { Card } from '@/components/global/card/card';

const meta = {
  title: 'Formulário/TextArea',
  component: TextArea,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Textarea integrado ao `react-hook-form`. Mesma API do `InputField` (uncontrolled via `register` ou controlled via `control` + `name`).',
      },
    },
  },
  args: { label: '' },
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const schema = z.object({
  observations: z.string().trim().min(10, 'Escreva pelo menos 10 caracteres.'),
});

function UncontrolledFormDemo() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ observations: string }>({
    resolver: zodResolver(schema),
    defaultValues: { observations: '' },
  });

  return (
    <form
      className="space-y-3"
      onSubmit={handleSubmit(() => undefined)}
      noValidate
    >
      <TextArea
        id="obs"
        label="Observações"
        placeholder="Mínimo 10 caracteres..."
        errors={errors.observations}
        {...register('observations')}
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
      <Card title="Padrão" description="Apenas label + placeholder.">
        <TextArea
          id="ta-basic"
          label="Observações"
          placeholder="Descreva os detalhes..."
        />
      </Card>

      <Card title="Com descrição" description="Texto auxiliar abaixo.">
        <TextArea
          id="ta-desc"
          label="Notas internas"
          placeholder="Apenas a equipe vê esta nota..."
          description="Não aparece para o cliente final."
        />
      </Card>

      <Card title="Com valor inicial" description="defaultValue preenchido.">
        <TextArea
          id="ta-default"
          label="Resumo"
          defaultValue="Cliente solicitou orçamento via e-mail no dia 12/03."
        />
      </Card>

      <Card
        title="Desabilitado"
        description="Mantém o valor mas bloqueia interação."
      >
        <TextArea
          id="ta-disabled"
          label="Histórico"
          defaultValue="Conteúdo bloqueado para edição."
          disabled
        />
      </Card>

      <Card
        title="Uncontrolled + validação Zod"
        description="Submeta com menos de 10 caracteres para ver o erro."
      >
        <UncontrolledFormDemo />
      </Card>
    </div>
  ),
};
