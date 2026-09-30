import { useEffect, useState } from 'react';
import { useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { MultiSelect } from '@/components/global/form/multiSelect';
import { Card } from '@/components/global/card/card';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

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

// Pessoas fictícias para a busca no servidor simulada (o Storybook não tem backend).
const people = [
  'Ana Souza',
  'Bruno Lima',
  'Camila Oliveira',
  'Diego Martins',
  'Eduarda Costa',
  'Felipe Rocha',
  'Gabriela Nunes',
  'Henrique Pereira',
].map((name, index) => ({ label: name, value: `person_${index + 1}` }));

type VitrineValues = {
  basic: string[];
  searchable: string[];
  remote: string[];
  prefilled: string[];
  many: string[];
  disabled: string[];
  validated: string[];
};

/**
 * Busca no servidor: o campo repassa o texto (`onSearchChange`), a tela espera
 * o debounce e troca as opções pelo resultado. Aqui o "servidor" é um filtro
 * com atraso; a opção marcada continua no gatilho quando sai do resultado.
 */
function ServerSearchField({ control }: { control: Control<VitrineValues> }) {
  const [search, setSearch] = useState('');
  const typed = search.trim().toLowerCase();
  const term = useDebouncedValue(typed, 300);
  const [result, setResult] = useState({
    term: '',
    options: people.slice(0, 3),
  });

  useEffect(() => {
    const timer = setTimeout(
      () =>
        setResult({
          term,
          options: people
            .filter((person) => person.label.toLowerCase().includes(term))
            .slice(0, 3),
        }),
      400
    );
    return () => clearTimeout(timer);
  }, [term]);

  return (
    <MultiSelect
      id="ms-remote"
      name="remote"
      control={control}
      label="Pessoas"
      placeholder="Selecione"
      options={result.options}
      onSearchChange={setSearch}
      loading={result.term !== typed}
      emptyText="Ninguém encontrado."
    />
  );
}

const schema = z.object({
  benefits: z.array(z.string()).min(1, 'Selecione pelo menos um benefício.'),
});

function VitrineDemo() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VitrineValues>({
    resolver: zodResolver(
      z.object({
        basic: z.array(z.string()),
        searchable: z.array(z.string()),
        remote: z.array(z.string()),
        prefilled: z.array(z.string()),
        many: z.array(z.string()),
        disabled: z.array(z.string()),
        validated: schema.shape.benefits,
      })
    ),
    defaultValues: {
      basic: [],
      searchable: [],
      remote: [],
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
        title="Busca no servidor"
        description="onSearchChange + loading: a tela busca (com debounce) e troca as opções."
      >
        <ServerSearchField control={control} />
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
