import { z } from 'zod';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Card } from '@/components/global/card/card';
import { MaskedInputField } from '@/components/global/form/maskedInputField';
import { Select } from '@/components/global/form/select';
import { Typography } from '@/components/ui/typography';
import { useZodForm } from '@/lib/forms/useZodForm';

const meta = {
  title: 'Formulário/MaskedInputField',
  component: MaskedInputField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Campo com máscara viva: CPF, CNPJ, CEP e telefone. A máscara é NA DIGITAÇÃO e o que sai para o formulário é só dígito. Um placeholder mostrando o formato não substitui a máscara: ele deixa o campo aceitar qualquer coisa.',
      },
    },
  },
  args: { label: '', mask: 'cpf', name: 'x', control: undefined as never },
} satisfies Meta<typeof MaskedInputField>;

export default meta;
type Story = StoryObj<typeof meta>;

const schema = z.object({
  cpf: z.string(),
  cnpj: z.string(),
  document: z.string(),
  cep: z.string(),
  phone: z.string(),
  contactType: z.string(),
  contact: z.string(),
  account: z.string(),
});

export const Showcase: Story = {
  render: () => {
    const { control, watch } = useZodForm({
      schema,
      defaultValues: {
        cpf: '',
        cnpj: '',
        document: '',
        cep: '',
        // Valor que veio do servidor: cru, e o campo o mostra mascarado.
        phone: '48999998888',
        contactType: 'phone',
        contact: '',
        account: '',
      },
    });

    const email = watch('contactType') === 'email';

    return (
      <div className="flex max-w-xl flex-col gap-4">
        <Card
          title="As quatro máscaras"
          description="Digite e veja a pontuação entrar. O telefone abre com um valor cru vindo do servidor."
        >
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <MaskedInputField
              control={control}
              name="cpf"
              id="story-cpf"
              label="CPF"
              mask="cpf"
              placeholder="000.000.000-00"
            />
            <MaskedInputField
              control={control}
              name="cnpj"
              id="story-cnpj"
              label="CNPJ"
              mask="cnpj"
              placeholder="00.000.000/0000-00"
            />
            <MaskedInputField
              control={control}
              name="cep"
              id="story-cep"
              label="CEP"
              mask="cep"
              placeholder="00000-000"
            />
            <MaskedInputField
              control={control}
              name="phone"
              id="story-phone"
              label="Telefone"
              mask="phone"
              placeholder="(00) 00000-0000"
            />
          </div>
        </Card>

        <Card
          title="Documento que pode ser CPF ou CNPJ"
          description="A máscara decide pela quantidade de dígitos: até onze formata como CPF, acima como CNPJ. Use quando o campo aceita os dois."
        >
          <MaskedInputField
            control={control}
            name="document"
            id="story-document"
            label="CPF ou CNPJ"
            mask="document"
            placeholder="Informe o CPF ou CNPJ"
          />
        </Card>

        <Card
          title="Quando a máscara depende do tipo"
          description="O mesmo campo serve para e-mail e para telefone. Troque o tipo: mascarar um e-mail comeria o “@” e o ponto do domínio."
        >
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Select
              control={control}
              name="contactType"
              id="story-type"
              label="Tipo"
              placeholder="Escolha o tipo"
              options={[
                { value: 'phone', label: 'Telefone' },
                { value: 'email', label: 'E-mail' },
              ]}
            />
            <MaskedInputField
              control={control}
              name="contact"
              id="story-contact"
              label={email ? 'E-mail' : 'Telefone'}
              mask={email ? 'none' : 'phone'}
              type={email ? 'email' : 'text'}
              placeholder={email ? 'nome@dominio.com' : '(00) 00000-0000'}
            />
          </div>
        </Card>

        <Card
          title="Só algarismos"
          description="Para número que a API exige só com dígitos mas que não tem formato fixo — conta bancária, porta. Digite um traço: ele some na hora, em vez de voltar como recusa."
        >
          <MaskedInputField
            control={control}
            name="account"
            id="story-account"
            label="Conta"
            mask="digits"
            placeholder="Só números, com o dígito"
          />
        </Card>

        <Card
          title="Com erro"
          description="O erro aparece abaixo do campo e marca o controle como inválido, como em qualquer field do sistema."
        >
          <MaskedInputField
            control={control}
            name="cpf"
            id="story-error"
            label="CPF"
            mask="cpf"
            placeholder="000.000.000-00"
            errors={{ message: 'Informe um CPF válido.' }}
          />
        </Card>

        <Typography variant="muted" className="text-xs">
          O valor guardado no formulário é sempre só dígito — o que se vê é a
          máscara aplicada sobre ele.
        </Typography>
      </div>
    );
  },
};
