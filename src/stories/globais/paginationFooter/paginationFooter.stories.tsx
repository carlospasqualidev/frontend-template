import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { PaginationFooter } from '@/components/global/paginationFooter/paginationFooter';

const meta = {
  title: 'Globais/PaginationFooter',
  component: PaginationFooter,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Rodapé de paginação da `DataTable` e de listas em cartões: "Itens por página", resumo opcional e Anterior/Próxima. A página é em base 0; quem usa diz se há próxima (`hasNextPage`). O seletor só aparece com `onPageSizeChange` e `pageSize` entre 25, 50 e 100.',
      },
    },
  },
  args: {
    pageIndex: 1,
    pageSize: 25,
    hasNextPage: true,
    isLoading: false,
    onPageChange: () => undefined,
    onPageSizeChange: () => undefined,
  },
} satisfies Meta<typeof PaginationFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InTheMiddle: Story = {};

export const FirstPage: Story = { args: { pageIndex: 0 } };

export const LastPage: Story = { args: { hasNextPage: false } };

export const Loading: Story = { args: { isLoading: true } };

export const WithoutSizeSelector: Story = {
  args: { onPageSizeChange: undefined },
};

export const WithSummary: Story = {
  args: { summary: '42 registros' },
};

export const Vitrine: Story = {
  render: (args) => (
    <div className="space-y-6">
      <PaginationFooter {...args} pageIndex={1} summary="42 registros" />
      <PaginationFooter {...args} pageIndex={0} />
      <PaginationFooter {...args} hasNextPage={false} />
      <PaginationFooter {...args} isLoading />
      <PaginationFooter {...args} onPageSizeChange={undefined} />
    </div>
  ),
};
