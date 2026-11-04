import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/global/card/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const meta = {
  title: 'UI primitivos/Sheet',
  component: Sheet,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Painel lateral / drawer. Útil para filtros avançados, edição rápida, configurações ou navegação secundária. Aceita `side="left" | "right" | "top" | "bottom"` no `SheetContent`.',
      },
    },
  },
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

function EditUserSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Editar perfil</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Editar perfil</SheetTitle>
          <SheetDescription>
            Atualize seus dados e clique em salvar quando terminar.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 px-4">
          <div className="grid gap-2">
            <Label htmlFor="sheet-name">Nome</Label>
            <Input id="sheet-name" defaultValue="Ana Silva" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sheet-email">E-mail</Label>
            <Input
              id="sheet-email"
              type="email"
              defaultValue="ana.silva@empresa.com"
            />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cancelar</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button>Salvar alterações</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function SidesDemo() {
  const sides = ['left', 'right', 'top', 'bottom'] as const;
  return (
    <div className="flex flex-wrap gap-2">
      {sides.map((side) => (
        <Sheet key={side}>
          <SheetTrigger asChild>
            <Button variant="outline" className="capitalize">
              {side}
            </Button>
          </SheetTrigger>
          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle className="capitalize">Painel: {side}</SheetTitle>
              <SheetDescription>
                Demonstrando a entrada por <code>{side}</code>.
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  );
}

export const Vitrine: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card
        title="Edição em painel lateral"
        description="Caso típico: form de edição rápida sem sair da tela."
      >
        <EditUserSheet />
      </Card>

      <Card
        title="Lados"
        description="O Sheet pode entrar por qualquer lateral."
      >
        <SidesDemo />
      </Card>
    </div>
  ),
};
