import type { Meta, StoryObj } from '@storybook/tanstack-react';

import {
  FormTable,
  FormTableHeader,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/global/formTable/formTable';
import { Card } from '@/components/global/card/card';
import { InputField } from '@/components/global/form/inputField';

const meta = {
  title: 'Globais/FormTable',
  component: FormTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Tabela estilizada para seções de formulário/configuração (coleções editáveis inline): container com borda arredondada + cabeçalho na cor da marca. Não confundir com o `DataTable` (listagem paginada server-side).',
      },
    },
  },
  args: { children: null },
} satisfies Meta<typeof FormTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vitrine: Story = {
  render: () => (
    <div className="space-y-6">
      <Card
        title="Métodos"
        description="Cabeçalho na cor da marca, cantos arredondados."
      >
        <FormTable>
          <FormTableHeader>
            <TableHead className="min-w-56">Método</TableHead>
            <TableHead className="w-40">Unidade de medida</TableHead>
            <TableHead className="w-24">Casas decimais</TableHead>
          </FormTableHeader>
          <TableBody>
            <TableRow>
              <TableCell>GC-MS/MS</TableCell>
              <TableCell>%</TableCell>
              <TableCell>3</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Gravimétrico</TableCell>
              <TableCell>mg/kg</TableCell>
              <TableCell>2</TableCell>
            </TableRow>
          </TableBody>
        </FormTable>
      </Card>

      <Card
        title="Limites por atributo"
        description="Mesma base, outras colunas."
      >
        <FormTable>
          <FormTableHeader>
            <TableHead className="w-16">Incluir</TableHead>
            <TableHead className="min-w-50">Atributo</TableHead>
            <TableHead className="w-32">Mínimo</TableHead>
            <TableHead className="w-32">Máximo</TableHead>
          </FormTableHeader>
          <TableBody>
            <TableRow>
              <TableCell>✓</TableCell>
              <TableCell>Cu</TableCell>
              <TableCell>0,00000</TableCell>
              <TableCell>400,00000</TableCell>
            </TableRow>
          </TableBody>
        </FormTable>
      </Card>

      <Card
        title="Com erro de campo"
        description="A célula do corpo fica ancorada no topo: o erro de um campo não empurra as colunas vizinhas."
      >
        <FormTable>
          <FormTableHeader>
            <TableHead className="min-w-56">Método</TableHead>
            <TableHead className="w-40">Unidade de medida</TableHead>
            <TableHead className="w-24">Casas decimais</TableHead>
          </FormTableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                <InputField
                  label="Método"
                  srOnlyLabel
                  defaultValue=""
                  errors={{ message: 'Informe o nome do método.' }}
                />
              </TableCell>
              <TableCell>
                <InputField
                  label="Unidade de medida"
                  srOnlyLabel
                  defaultValue="mg/kg"
                />
              </TableCell>
              <TableCell>
                <InputField
                  label="Casas decimais"
                  srOnlyLabel
                  defaultValue="2"
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </FormTable>
      </Card>
    </div>
  ),
};
