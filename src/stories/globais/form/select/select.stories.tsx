import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Select } from '@/components/global/form/select';
import { Card } from '@/components/global/card/card';

const meta = {
  title: 'Formulário/Select',
  component: Select,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Select baseado em Radix integrado ao `react-hook-form`. Aceita `options` declarativas, placeholder, descrição e erros.',
      },
    },
  },
  args: { label: '', options: [] },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const departmentOptions = [
  { label: 'Financeiro', value: 'financeiro' },
  { label: 'Operações', value: 'operacoes' },
  { label: 'Recursos Humanos', value: 'rh' },
  { label: 'Tecnologia', value: 'tecnologia' },
];

const stateOptions = [
  { label: 'Acre', value: 'AC' },
  { label: 'Bahia', value: 'BA' },
  { label: 'Ceará', value: 'CE' },
  { label: 'Distrito Federal', value: 'DF' },
  { label: 'Espírito Santo', value: 'ES' },
  { label: 'Minas Gerais', value: 'MG' },
  { label: 'Paraná', value: 'PR' },
  { label: 'Rio de Janeiro', value: 'RJ' },
  { label: 'Rio Grande do Sul', value: 'RS' },
  { label: 'Santa Catarina', value: 'SC' },
  { label: 'São Paulo', value: 'SP' },
];

const schema = z.object({
  department: z.string().min(1, 'Selecione um departamento.'),
});

function ControlledDemo() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{ department: string }>({
    resolver: zodResolver(schema),
    defaultValues: { department: '' },
  });

  return (
    <form
      className="space-y-3"
      onSubmit={handleSubmit(() => undefined)}
      noValidate
    >
      <Select
        id="dept"
        name="department"
        control={control}
        label="Departamento"
        placeholder="Selecione um departamento"
        options={departmentOptions}
        errors={errors.department}
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
        <Select
          id="sel-basic"
          label="Departamento"
          placeholder="Selecione um departamento"
          options={departmentOptions}
        />
      </Card>

      <Card title="Com descrição" description="Texto auxiliar abaixo.">
        <Select
          id="sel-desc"
          label="Departamento"
          description="Define a área que aparecerá no perfil."
          placeholder="Selecione um departamento"
          options={departmentOptions}
        />
      </Card>

      <Card title="Com valor inicial" description="defaultValue selecionado.">
        <Select
          id="sel-default"
          label="Departamento"
          defaultValue="financeiro"
          options={departmentOptions}
        />
      </Card>

      <Card
        title="Desabilitado"
        description="Mantém o valor mas bloqueia interação."
      >
        <Select
          id="sel-disabled"
          label="Departamento"
          defaultValue="rh"
          options={departmentOptions}
          disabled
        />
      </Card>

      <Card
        title="Controlled + validação Zod"
        description="Submeta sem selecionar para ver o erro."
      >
        <ControlledDemo />
      </Card>

      <Card
        title="Busca automática (lista longa)"
        description="Acima de 8 opções o campo de busca aparece sozinho — sem precisar passar prop."
      >
        <Select
          id="sel-search-auto"
          label="Estado"
          placeholder="Selecione um estado"
          searchPlaceholder="Buscar estado..."
          options={stateOptions}
        />
      </Card>

      <Card
        title="Busca forçada desligada"
        description="Mesmo com lista longa, searchable={false} mantém o dropdown puro do Radix."
      >
        <Select
          id="sel-search-off"
          label="Estado"
          searchable={false}
          placeholder="Selecione um estado"
          options={stateOptions}
        />
      </Card>
    </div>
  ),
};
