import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { MultiSelect } from '@/components/global/form/multiSelect';
import { Card } from '@/components/global/card/card';

const meta = {
  title: 'Formulário/MultiSelect',
  component: MultiSelect,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Seleção múltipla integrada ao `react-hook-form`. Wrap do primitivo em `components/global/multiSelect/` com label, descrição e erros.',
      },
    },
  },
  args: { label: '', options: [] },
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

const benefitOptions = [
  { label: 'Vale-refeição', value: 'vale_refeicao' },
  { label: 'Vale-transporte', value: 'vale_transporte' },
  { label: 'Plano de saúde', value: 'plano_saude' },
  { label: 'Plano odontológico', value: 'plano_odontologico' },
  { label: 'Gympass', value: 'gympass' },
];

const longOptions = Array.from({ length: 20 }, (_, i) => ({
  label: `Opção ${i + 1}`,
  value: `option_${i + 1}`,
}));

const schema = z.object({
  benefits: z.array(z.string()).min(1, 'Selecione pelo menos um benefício.'),
});

function VitrineDemo() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{
    basic: string[];
    searchable: string[];
    prefilled: string[];
    many: string[];
    disabled: string[];
    validated: string[];
  }>({
    resolver: zodResolver(
      z.object({
        basic: z.array(z.string()),
        searchable: z.array(z.string()),
        prefilled: z.array(z.string()),
        many: z.array(z.string()),
        disabled: z.array(z.string()),
        validated: schema.shape.benefits,
      })
    ),
    defaultValues: {
      basic: [],
      searchable: [],
      prefilled: ['plano_saude', 'vale_refeicao'],
      many: benefitOptions.map((option) => option.value),
      disabled: ['plano_saude'],
      validated: [],
    },
  });

  return (
    <form
      className="grid gap-6 lg:grid-cols-2"
      onSubmit={handleSubmit(() => undefined)}
      noValidate
    >
      <Card title="Padrão" description="Controlled via control + name.">
        <MultiSelect
          id="ms-basic"
          name="basic"
          control={control}
          label="Benefícios"
          placeholder="Selecione os benefícios"
          options={benefitOptions}
        />
      </Card>

      <Card
        title="Buscável"
        description="Campo de busca quando há muitas opções."
      >
        <MultiSelect
          id="ms-search"
          name="searchable"
          control={control}
          label="Opções"
          placeholder="Selecione opções"
          searchable
          searchPlaceholder="Buscar opção..."
          options={longOptions}
        />
      </Card>

      <Card
        title="Com valor inicial"
        description="defaultValues preenchidos no useForm."
      >
        <MultiSelect
          id="ms-default"
          name="prefilled"
          control={control}
          label="Benefícios"
          options={benefitOptions}
        />
      </Card>

      <Card
        title="Muitas seleções"
        description="Acima de maxDisplay (3), resume para 'N selecionados'."
      >
        <MultiSelect
          id="ms-many"
          name="many"
          control={control}
          label="Benefícios"
          options={benefitOptions}
          maxDisplay={3}
        />
      </Card>

      <Card
        title="Desabilitado"
        description="Mantém o valor mas bloqueia interação."
      >
        <MultiSelect
          id="ms-disabled"
          name="disabled"
          control={control}
          label="Benefícios"
          options={benefitOptions}
          disabled
        />
      </Card>

      <Card
        title="Com validação Zod"
        description="Submeta sem selecionar para ver o erro."
      >
        <div className="space-y-3">
          <MultiSelect
            id="ms-validated"
            name="validated"
            control={control}
            label="Benefícios"
            placeholder="Selecione os benefícios"
            options={benefitOptions}
            errors={errors.validated}
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
          >
            Validar
          </button>
        </div>
      </Card>
    </form>
  );
}

export const Vitrine: Story = {
  render: () => <VitrineDemo />,
};
