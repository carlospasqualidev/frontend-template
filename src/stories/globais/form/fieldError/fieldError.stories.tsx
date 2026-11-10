import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Card } from '@/components/global/card/card';
import { FieldError } from '@/components/global/form/fieldError';

const meta = {
  title: 'Form/FieldError',
  component: FieldError,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Mensagem de erro de um controle montado na tela (grupo de caixas, grade de escolhas), no mesmo visual dos fields globais. Recebe o `fieldState.error` do `useController`; sem erro, não renderiza nada. Os fields globais já trazem a sua — não use ao lado deles.',
      },
    },
  },
} satisfies Meta<typeof FieldError>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  render: () => (
    <div className="space-y-4">
      <Card title="Com erro" description="Abaixo do grupo, cresce para baixo.">
        <div className="rounded-md border border-destructive p-3 text-sm">
          Lista de opções do grupo
        </div>
        <FieldError errors={{ message: 'Selecione ao menos uma permissão.' }} />
      </Card>

      <Card
        title="Vários erros"
        description="Mensagens distintas viram lista; repetidas aparecem uma vez."
      >
        <FieldError
          errors={[
            { message: 'Obrigatório.' },
            { message: 'Formato inválido.' },
          ]}
        />
      </Card>

      <Card title="Sem erro" description="Não ocupa espaço.">
        <div className="rounded-md border p-3 text-sm">
          Lista de opções do grupo
        </div>
        <FieldError errors={undefined} />
      </Card>
    </div>
  ),
};
