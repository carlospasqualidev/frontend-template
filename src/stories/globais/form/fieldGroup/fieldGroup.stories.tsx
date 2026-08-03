import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Card } from '@/components/global/card/card';
import { FieldGroup } from '@/components/global/form/fieldGroup';
import { InputField } from '@/components/global/form/inputField';
import { Select } from '@/components/global/form/select';
import { Switch } from '@/components/global/form/switch';

const meta = {
  title: 'Globais/Form/FieldGroup',
  component: FieldGroup,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Agrupa campos relacionados num `fieldset` + `legend` — o que dá ao leitor de tela o NOME do grupo ("Endereço", "Contato") antes de anunciar cada campo. Use para separar blocos dentro de um formulário longo; sem `title`, é só um agrupamento de layout.',
      },
    },
  },
} satisfies Meta<typeof FieldGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const states = [
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'PR', label: 'Paraná' },
];

export const Vitrine: Story = {
  args: { children: null },
  render: () => (
    <div className="space-y-4">
      <Card
        title="Com título e descrição"
        description="A legenda nomeia o grupo; a descrição explica o porquê dos campos."
      >
        <FieldGroup
          title="Endereço"
          description="Usado para a entrega e para o documento fiscal."
        >
          <InputField
            id="street"
            label="Rua"
            placeholder="Informe a rua e o número"
          />
          <InputField id="city" label="Cidade" placeholder="Informe a cidade" />
          <Select
            id="state"
            label="Estado"
            options={states}
            placeholder="Selecione o estado"
          />
        </FieldGroup>
      </Card>

      <Card
        title="Só com título"
        description="Quando o nome do grupo já basta."
      >
        <FieldGroup title="Contato">
          <InputField id="email" label="E-mail" placeholder="seu@email.com" />
          <InputField
            id="phone"
            label="Telefone"
            placeholder="(00) 00000-0000"
          />
        </FieldGroup>
      </Card>

      <Card
        title="Sem título"
        description="Agrupamento puramente de layout — não gera legenda para o leitor de tela."
      >
        <FieldGroup>
          <Switch id="notify" label="Receber notificações por e-mail" />
          <Switch id="weekly" label="Resumo semanal" />
        </FieldGroup>
      </Card>

      <Card
        title="Dois grupos no mesmo formulário"
        description="É assim que um formulário longo se organiza: um grupo por assunto."
      >
        <FieldGroup title="Identificação">
          <InputField id="name" label="Nome" placeholder="Informe o nome" />
        </FieldGroup>
        <FieldGroup title="Acesso">
          <InputField
            id="login"
            label="Login"
            placeholder="Informe o login de acesso"
          />
        </FieldGroup>
      </Card>
    </div>
  ),
};
