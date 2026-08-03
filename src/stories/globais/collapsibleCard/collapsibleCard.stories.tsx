import * as React from 'react';
import { Star, X } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Button } from '@/components/global/button/button';
import { CollapsibleCard } from '@/components/global/collapsibleCard/collapsibleCard';
import { Badge } from '@/components/ui/badge';

const meta = {
  title: 'Globais/CollapsibleCard',
  component: CollapsibleCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Card recolhível (accordion) padrão do sistema: cabeçalho sempre visível (chevron + título + resumo + ações) e corpo revelado ao expandir. O cabeçalho é o gatilho (com `cursor-pointer`). Use em coleções de itens (ex.: os itens de um pedido); para seção de página recolhível, use o `Card` com `expanded`.',
      },
    },
  },
  args: {
    title: '',
    expanded: false,
    onToggle: () => undefined,
    children: null,
  },
} satisfies Meta<typeof CollapsibleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo() {
  const [expanded, setExpanded] = React.useState<Set<string>>(
    () => new Set(['a'])
  );
  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="space-y-3">
      <CollapsibleCard
        accent
        expanded={expanded.has('a')}
        onToggle={() => toggle('a')}
        title={
          <>
            <span className="truncate font-medium">Dioxinas e Furanos</span>
            <Badge variant="secondary" className="shrink-0">
              Padrão
            </Badge>
          </>
        }
        summary="1 método · ng TEQ PCDD/F OMS /kg"
        actions={
          <>
            <Button variant="ghost" size="icon" tooltip="Definir como padrão">
              <Star className="size-4 fill-current text-primary" />
            </Button>
            <Button variant="ghost" size="icon" tooltip="Remover">
              <X />
            </Button>
          </>
        }
        bodyClassName="space-y-2"
      >
        <p className="text-sm text-muted-foreground">
          Conteúdo do card (campos, tabela de métodos, etc.).
        </p>
      </CollapsibleCard>

      <CollapsibleCard
        expanded={expanded.has('b')}
        onToggle={() => toggle('b')}
        title={
          <span className="truncate font-medium">
            Item sem acento e sem ações
          </span>
        }
        summary="recolhido por padrão"
      >
        <p className="text-sm text-muted-foreground">
          Clique no cabeçalho para expandir.
        </p>
      </CollapsibleCard>
    </div>
  );
}

export const Vitrine: Story = {
  render: () => <Demo />,
};
