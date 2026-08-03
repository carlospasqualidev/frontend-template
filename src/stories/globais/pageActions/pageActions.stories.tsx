import { Download, Filter, Plus, Settings2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import {
  PageActions,
  PageActionsSlot,
} from '@/components/global/layout/pageActions';
import { Button } from '@/components/global/button/button';
import { Card } from '@/components/global/card/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Typography } from '@/components/ui/typography';

const meta = {
  title: 'Globais/PageActions',
  component: PageActions,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '`PageActions` renderiza os filhos no slot fixo do header global via portal. Use para injetar botões contextuais da tela sem que cada tela carregue o próprio cabeçalho. Em mobile, o texto do botão é escondido (`hidden sm:inline`) e o ícone vira a *affordance*; mantenha `aria-label` para acessibilidade.',
      },
    },
  },
  args: { children: null },
} satisfies Meta<typeof PageActions>;

export default meta;
type Story = StoryObj<typeof meta>;

function FakeHeaderShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-svh flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-card">
        <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
          <Typography as="span" variant="small" className="font-medium">
            App / Demo
          </Typography>
        </div>
        <PageActionsSlot />
      </header>
      <main className="flex-1 space-y-4 overflow-auto p-4">{children}</main>
    </div>
  );
}

export const BotaoUnico: Story = {
  render: () => (
    <FakeHeaderShell>
      <PageActions>
        <Button
          aria-label="Novo usuário"
          onClick={() => toast.success('Abrir criação.')}
        >
          <UserPlus />
          <span className="hidden sm:inline">Novo usuário</span>
        </Button>
      </PageActions>

      <Card
        title="Lista de usuários"
        description="O botão 'Novo usuário' está no header acima, injetado via PageActions."
      >
        <Typography variant="muted">
          A tela permanece enxuta — sem cabeçalho próprio com título e ações.
        </Typography>
      </Card>
    </FakeHeaderShell>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Caso mais comum: uma única ação primária. Em telas estreitas, o texto some e o ícone serve como affordance.',
      },
    },
  },
};

export const AcaoPrimariaESecundaria: Story = {
  render: () => (
    <FakeHeaderShell>
      <PageActions>
        <Button
          variant="outline"
          aria-label="Exportar"
          onClick={() => toast('Exportando...')}
        >
          <Download />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
        <Button
          aria-label="Novo registro"
          onClick={() => toast.success('Abrir criação.')}
        >
          <Plus />
          <span className="hidden sm:inline">Novo registro</span>
        </Button>
      </PageActions>

      <Card
        title="Tela com duas ações"
        description="A primária (filled) sempre por último, à direita."
      >
        <Typography variant="muted">
          Use no máximo 2–3 botões no header. Para mais, agrupe em dropdown.
        </Typography>
      </Card>
    </FakeHeaderShell>
  ),
};

export const ComDropdown: Story = {
  render: () => (
    <FakeHeaderShell>
      <PageActions>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" aria-label="Mais ações">
              <Settings2 />
              <span className="hidden sm:inline">Mais</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toast('Duplicar.')}>
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast('Arquivar.')}>
              Arquivar
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => toast.error('Excluir.')}
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button aria-label="Salvar" onClick={() => toast.success('Salvo.')}>
          Salvar
        </Button>
      </PageActions>

      <Card
        title="Ações primária + secundárias agrupadas"
        description="Dropdown 'Mais' agrega ações menos frequentes (duplicar, arquivar, excluir)."
      >
        <Typography variant="muted">
          Padrão usado nos detalhes de registro quando há mais de três
          operações.
        </Typography>
      </Card>
    </FakeHeaderShell>
  ),
};

export const ComFiltro: Story = {
  render: () => (
    <FakeHeaderShell>
      <PageActions>
        <Button
          variant="outline"
          aria-label="Filtros"
          onClick={() => toast('Abrir painel de filtros.')}
        >
          <Filter />
          <span className="hidden sm:inline">Filtros</span>
        </Button>
        <Button
          aria-label="Novo registro"
          onClick={() => toast.success('Abrir criação.')}
        >
          <Plus />
          <span className="hidden sm:inline">Novo registro</span>
        </Button>
      </PageActions>

      <Card
        title="Filtro + criação"
        description="Combinação típica de listas com criação."
      >
        <Typography variant="muted">
          O filtro abre uma sheet/drawer lateral; a criação abre um modal.
        </Typography>
      </Card>
    </FakeHeaderShell>
  ),
};
