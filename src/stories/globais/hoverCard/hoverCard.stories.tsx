import { CalendarDays } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { HoverCard } from '@/components/global/hoverCard/hoverCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/global/card/card';

const meta = {
  title: 'Globais/HoverCard',
  component: HoverCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Preview detalhado exibido ao passar o mouse / focar no trigger. API simples: `trigger` + `children` (conteúdo). Ãštil para previews de usuário, links e badges.',
      },
    },
  },
  args: {
    trigger: null,
    children: null,
  },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vitrine: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card
        title="Perfil de usuário"
        description="Preview clássico ao passar o mouse num link/nome de usuário."
      >
        <HoverCard
          trigger={
            <Button variant="link" className="px-0">
              @anasilva
            </Button>
          }
        >
          <div className="flex justify-between gap-4">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>AS</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">@anasilva</h4>
              <p className="text-sm text-muted-foreground">
                Designer de produto · Cuida do design system da empresa.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" />
                <span>Entrou em Março de 2024</span>
              </div>
            </div>
          </div>
        </HoverCard>
      </Card>

      <Card
        title="Preview de link"
        description="Mostra metadados de um link sem precisar abrir."
      >
        <p className="text-sm">
          Documentação completa em{' '}
          <HoverCard
            trigger={
              <Button variant="link" className="px-0">
                ui.shadcn.com
              </Button>
            }
            align="start"
          >
            <div className="space-y-2">
              <p className="text-sm font-semibold">shadcn/ui</p>
              <p className="text-sm text-muted-foreground">
                Beautifully designed components built with Radix UI and Tailwind
                CSS.
              </p>
              <p className="text-xs text-muted-foreground">ui.shadcn.com</p>
            </div>
          </HoverCard>
          .
        </p>
      </Card>

      <Card
        title="Posições"
        description="Use side e align para controlar a posição do preview."
      >
        <div className="flex flex-wrap gap-3">
          <HoverCard
            side="top"
            trigger={<Button variant="outline">Top</Button>}
          >
            <p className="text-sm">Preview acima do trigger.</p>
          </HoverCard>
          <HoverCard
            side="right"
            trigger={<Button variant="outline">Right</Button>}
          >
            <p className="text-sm">Preview à direita do trigger.</p>
          </HoverCard>
          <HoverCard
            side="bottom"
            trigger={<Button variant="outline">Bottom</Button>}
          >
            <p className="text-sm">Preview abaixo do trigger.</p>
          </HoverCard>
          <HoverCard
            side="left"
            trigger={<Button variant="outline">Left</Button>}
          >
            <p className="text-sm">Preview à esquerda do trigger.</p>
          </HoverCard>
        </div>
      </Card>

      <Card
        title="Delay customizado"
        description="openDelay e closeDelay controlam o tempo de abertura/fechamento (ms)."
      >
        <HoverCard
          openDelay={50}
          closeDelay={50}
          trigger={<Button variant="outline">Rápido (50ms)</Button>}
        >
          <p className="text-sm">
            Este preview abre quase instantaneamente. Padrão do Radix é 700ms;
            ajuste conforme o caso.
          </p>
        </HoverCard>
      </Card>
    </div>
  ),
};
