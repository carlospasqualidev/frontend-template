import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Card } from '@/components/global/card/card';
import {
  FieldChanges,
  type IFieldChange,
} from '@/components/global/fieldChanges/fieldChanges';

const meta = {
  title: 'Globais/FieldChanges',
  component: FieldChanges,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'De→para de um evento da trilha de auditoria (`fieldChanges` do servidor): `rótulo: de → para`, com o valor anterior riscado e o novo em destaque. `[Vazio]` e `[omitido]` aparecem como estão, em itálico. Sem mudanças (login, exportação), mostra `emptyMessage`.',
      },
    },
  },
  args: { changes: [] },
} satisfies Meta<typeof FieldChanges>;

export default meta;
type Story = StoryObj<typeof meta>;

const UPDATE: IFieldChange[] = [
  { field: 'name', label: 'Nome', from: 'Maria', to: 'Maria Alves' },
  { field: 'phone', label: 'Telefone', from: '[Vazio]', to: '48999999999' },
  { field: 'password', label: 'Senha', from: '[omitido]', to: '[omitido]' },
  {
    field: 'idleTimeoutMinutes',
    label: 'Tempo de inatividade (minutos)',
    from: '30',
    to: '90',
  },
];

const CREATE: IFieldChange[] = [
  { field: 'name', label: 'Nome', from: '[Vazio]', to: 'Priscila Camargo' },
  {
    field: 'email',
    label: 'E-mail',
    from: '[Vazio]',
    to: 'priscila.camargo@example.com',
  },
  { field: 'isActive', label: 'Ativo', from: '[Vazio]', to: 'Sim' },
];

const ANONYMIZED: IFieldChange[] = [
  { field: 'name', label: 'Nome', from: '[omitido]', to: '[omitido]' },
  { field: 'isActive', label: 'Ativo', from: 'Sim', to: 'Não' },
];

export const Vitrine: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card
        title="Edição"
        description="Só os campos alterados, com a senha omitida."
      >
        <FieldChanges changes={UPDATE} />
      </Card>

      <Card
        title="Criação"
        description="Os campos gravados, partindo de [Vazio]."
      >
        <FieldChanges changes={CREATE} />
      </Card>

      <Card
        title="Evento anonimizado"
        description="O dado pessoal vira [omitido]; o resto continua legível."
      >
        <FieldChanges changes={ANONYMIZED} />
      </Card>

      <Card title="Sem mudanças" description="Login e exportação.">
        <FieldChanges changes={[]} />
      </Card>
    </div>
  ),
};
