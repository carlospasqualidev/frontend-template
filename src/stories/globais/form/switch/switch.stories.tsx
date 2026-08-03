import { useForm } from 'react-hook-form';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Switch } from '@/components/global/form/switch';
import { Card } from '@/components/global/card/card';

const meta = {
  title: 'Formulário/Switch',
  component: Switch,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Toggle on/off integrado ao `react-hook-form`. Usado para configurações booleanas (ativar/desativar, mostrar/esconder, etc).',
      },
    },
  },
  args: { label: '' },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledDemo() {
  const { control } = useForm<{ adminAccess: boolean }>({
    defaultValues: { adminAccess: true },
  });

  return (
    <Switch
      id="sw-admin"
      name="adminAccess"
      control={control}
      label="Conceder acesso administrativo"
      description="Habilita permissões avançadas para este usuário."
    />
  );
}

export const Vitrine: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Padrão" description="Uncontrolled simples.">
        <Switch id="sw-basic" label="Notificações por e-mail" />
      </Card>

      <Card title="Com descrição" description="Texto auxiliar abaixo do label.">
        <Switch
          id="sw-desc"
          label="Modo escuro automático"
          description="Segue a preferência do sistema operacional."
        />
      </Card>

      <Card
        title="Ligado por padrão"
        description="Uncontrolled com defaultChecked."
      >
        <Switch id="sw-default" label="Backup automático" defaultChecked />
      </Card>

      <Card
        title="Desabilitado"
        description="Mantém o valor mas bloqueia interação."
      >
        <Switch
          id="sw-disabled"
          label="Sincronização externa"
          defaultChecked
          disabled
        />
      </Card>

      <Card
        title="Controlled (react-hook-form)"
        description="Integrado via control + name."
      >
        <ControlledDemo />
      </Card>
    </div>
  ),
};
