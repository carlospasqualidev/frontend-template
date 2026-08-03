import type { Meta, StoryObj } from '@storybook/tanstack-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';

import { Card } from '@/components/global/card/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

const meta = {
  title: 'UI primitivos/Chart',
  component: ChartContainer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Wrapper do recharts com tooltip/legenda no tema do sistema. A cor de cada série vem do `ChartConfig` — e o token depende do TIPO de gráfico: séries diferentes usam a paleta **categórica** (`--series-1..5`, hues distintos, sempre na ordem dos slots); uma medida em intensidades usa a paleta **sequencial** da marca (`--chart-1..5`). Ver "Cor da marca e tema" no CLAUDE.md.',
      },
    },
  },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

const monthly = [
  { month: 'Jan', entradas: 186, saidas: 120 },
  { month: 'Fev', entradas: 305, saidas: 210 },
  { month: 'Mar', entradas: 237, saidas: 190 },
  { month: 'Abr', entradas: 273, saidas: 240 },
  { month: 'Mai', entradas: 209, saidas: 180 },
  { month: 'Jun', entradas: 314, saidas: 260 },
];

// Séries DIFERENTES → paleta categórica, na ordem dos slots (é o que mantém o
// contraste entre elas, inclusive para daltonismo).
const seriesConfig = {
  entradas: { label: 'Entradas', color: 'var(--series-1)' },
  saidas: { label: 'Saídas', color: 'var(--series-2)' },
} satisfies ChartConfig;

// UMA medida em intensidades → paleta sequencial da marca.
const sequentialConfig = {
  total: { label: 'Total', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const distribution = [
  { faixa: '0-25', total: 12 },
  { faixa: '26-50', total: 38 },
  { faixa: '51-75', total: 61 },
  { faixa: '76-100', total: 27 },
];

export const Vitrine: Story = {
  args: { config: seriesConfig, children: <LineChart /> },
  render: () => (
    <div className="space-y-4">
      <Card
        title="Linhas — séries diferentes (paleta categórica)"
        description="Duas medidas comparáveis no mesmo gráfico: cada série tem um hue distinto (--series-1, --series-2), usados na ordem dos slots."
      >
        <ChartContainer config={seriesConfig} className="h-64 w-full">
          <LineChart data={monthly} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey="entradas"
              stroke="var(--color-entradas)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="saidas"
              stroke="var(--color-saidas)"
              strokeWidth={2}
              // O traçado carrega a identidade junto com a cor — não confie só
              // na cor para diferenciar séries.
              strokeDasharray="7 3"
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </Card>

      <Card
        title="Barras — uma medida em intensidades (paleta sequencial)"
        description="Uma única medida distribuída em faixas: tom da marca (--chart-3). Tons do mesmo hue NÃO servem para séries diferentes."
      >
        <ChartContainer config={sequentialConfig} className="h-64 w-full">
          <BarChart data={distribution} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="faixa" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="total" fill="var(--color-total)" radius={4} />
          </BarChart>
        </ChartContainer>
      </Card>

      <Card
        title="Área empilhada"
        description="Mesmo config de séries; o tooltip mostra o rótulo em pt-BR do ChartConfig, não a chave do dado."
      >
        <ChartContainer config={seriesConfig} className="h-64 w-full">
          <AreaChart data={monthly} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="entradas"
              stackId="a"
              stroke="var(--color-entradas)"
              fill="var(--color-entradas)"
              fillOpacity={0.2}
            />
            <Area
              dataKey="saidas"
              stackId="a"
              stroke="var(--color-saidas)"
              fill="var(--color-saidas)"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ChartContainer>
      </Card>
    </div>
  ),
};
