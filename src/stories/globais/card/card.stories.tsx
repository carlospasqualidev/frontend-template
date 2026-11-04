import { Download, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Card } from '@/components/global/card/card';
import { Button } from '@/components/global/button/button';
import { DemoNotice } from '@/components/global/demoNotice/demoNotice';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Typography } from '@/components/ui/typography';
import {
  PAIRED_LIST_CARD_CLASS,
  PAIRED_LIST_CONTENT_CLASS,
} from '@/lib/constants/pairedCard';
import { ActivityChart } from '@/screens/home/activityChart';
import { PendingTasks } from '@/screens/home/pendingTasks';

const meta = {
  title: 'Globais/Card',
  component: Card,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Container de conteúdo com `title` + `description` + `children`. Já trata `bg-card`, borda, `shadow-sm` (light) e `dark:shadow-none`.',
      },
    },
  },
  args: { title: '', description: '', children: null },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vitrine: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card
        title="Simples"
        description="Container básico com título, descrição e conteúdo livre."
      >
        <Typography variant="muted">
          Conteúdo do card. Use para qualquer agrupamento visual com cabeçalho e
          corpo.
        </Typography>
      </Card>

      <Card
        title="Resumo da operação"
        description="Visão consolidada das movimentações do dia."
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Typography as="span" variant="muted">
              Entradas
            </Typography>
            <Typography as="span" variant="small">
              R$ 12.480,00
            </Typography>
          </div>

          <div className="flex items-center justify-between">
            <Typography as="span" variant="muted">
              Saídas
            </Typography>
            <Typography as="span" variant="small">
              R$ 8.920,00
            </Typography>
          </div>

          <div className="flex items-center justify-between border-t border-border/70 pt-3">
            <Typography as="span" variant="small">
              Saldo
            </Typography>
            <Typography as="span" variant="small" className="font-semibold">
              R$ 3.560,00
            </Typography>
          </div>

          <Button className="w-full">Ver detalhes</Button>
        </div>
      </Card>

      <Card
        title="Termos de uso"
        description="Leia atentamente antes de prosseguir."
      >
        <Typography variant="muted">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec aliquam
          tortor at quam pretium, ac convallis turpis dignissim. Nulla facilisi.
          Suspendisse potenti.
        </Typography>
      </Card>

      <Card
        title="Plano Pro"
        description="R$ 149,00/mês · próxima cobrança em 15 de junho."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Badge variant="default">Ativo</Badge>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">Trocar de plano</Button>
            <Button variant="ghost">Cancelar plano</Button>
          </div>
        </div>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Variações comuns: card vazio (apenas texto), card com métricas + CTA, card de termos, e card com ações inline alinhadas à direita (padrão de configurações).',
      },
    },
  },
};

export const ComAcoesInline: Story = {
  render: () => (
    <div className="grid gap-4">
      <Card
        title="Cartão de crédito · Visa 4242"
        description="Expira em 08/2028."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Typography variant="muted" className="text-xs">
            Usado para cobranças automáticas mensais.
          </Typography>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Pencil />
              Atualizar
            </Button>
            <Button variant="ghost" size="sm">
              <Trash2 />
              Remover
            </Button>
          </div>
        </div>
      </Card>

      <Card
        title="Backup mensal · maio/2026"
        description="Snapshot completo do banco e dos arquivos enviados."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Typography variant="muted" className="text-xs">
            2,4 GB · disponível por 90 dias.
          </Typography>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Download />
              Baixar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Mais ações">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Restaurar</DropdownMenuItem>
                <DropdownMenuItem>Compartilhar</DropdownMenuItem>
                <DropdownMenuItem variant="destructive">
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Card como item de lista (item de cobrança, sessão, backup, integração). As ações ficam alinhadas à direita; em mobile elas quebram embaixo via `flex-col sm:flex-row`.',
      },
    },
  },
};

export const ComAcaoNoCabecalho: Story = {
  render: () => (
    <div className="grid gap-4">
      <Card
        title="Membros"
        description="Pessoas com acesso a este projeto."
        action={
          <Button variant="outline" size="sm">
            <Plus />
            Adicionar membro
          </Button>
        }
      >
        <ul className="divide-y rounded-md border text-sm">
          <li className="p-3">Ana Souza · Administradora</li>
          <li className="p-3">Bruno Lima · Editor</li>
        </ul>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Ação primária de uma seção (ex.: "Adicionar …") no `action` do Card — alinhada à direita do cabeçalho. É o padrão: NÃO coloque o botão de adicionar solto acima/dentro do conteúdo.',
      },
    },
  },
};

/**
 * Largura útil da Home em `lg`+: viewport − sidebar (16rem expandida, 48px
 * recolhida) − 64px de padding do layout. O breakpoint segue a viewport.
 * `100vw` inclui a barra de rolagem vertical (~15px no Windows): a simulação
 * fica até ~15px mais larga que a Home real, margem aceita para a story.
 */
const HOME_WIDTH_EXPANDED = 'lg:w-[calc(100vw-20rem)]';
const HOME_WIDTH_COLLAPSED = 'lg:w-[calc(100vw-48px-64px)]';

function LongList() {
  return (
    <Card
      title="Lista longa"
      className={PAIRED_LIST_CARD_CLASS}
      contentClassName={PAIRED_LIST_CONTENT_CLASS}
    >
      <ul className="divide-y divide-border/60">
        {Array.from({ length: 30 }, (_, index) => (
          <li key={index} className="py-3 text-sm">
            Item {index + 1}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export const CabecalhoEstreito: Story = {
  render: () => (
    <div className="grid gap-6">
      <div className="w-60">
        <Card
          title="Pendências"
          description="4 itens aguardando"
          action={<DemoNotice />}
        >
          <Typography variant="muted">Coluna estreita (15rem)</Typography>
        </Card>
      </div>
      <div className="w-full max-w-[28rem]">
        <Card
          title="Pendências"
          description="4 itens aguardando"
          action={<DemoNotice />}
        >
          <Typography variant="muted">Coluna larga (28rem)</Typography>
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Título + descrição + ação. Em cabeçalho com menos de 20rem de conteúdo, título, descrição e ação empilham na coluna 1 (a ação por último), sem cortar a ação; em cabeçalho largo a ação fica à direita.',
      },
    },
  },
};

export const ParComListaAoLado: Story = {
  render: () => (
    <div className="grid gap-8">
      <div className={`grid gap-4 lg:grid-cols-3 ${HOME_WIDTH_EXPANDED}`}>
        <ActivityChart className="lg:col-span-2" />
        <PendingTasks />
      </div>

      <div className={`grid gap-4 lg:grid-cols-3 ${HOME_WIDTH_COLLAPSED}`}>
        <ActivityChart className="lg:col-span-2" />
        <PendingTasks />
      </div>

      <div className={`grid gap-4 lg:grid-cols-3 ${HOME_WIDTH_EXPANDED}`}>
        <ActivityChart className="lg:col-span-2" />
        <LongList />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Par lista + gráfico: em `lg` a linha mede a lista até o teto (`PAIRED_LIST_CARD_CLASS` + `PAIRED_LIST_CONTENT_CLASS`) e só acima dele a lista rola por dentro; o gráfico (`PAIRED_ANCHOR_CONTENT_CLASS`) ocupa a altura da linha. Os blocos simulam a largura útil da Home em `lg`+ (viewport − sidebar − padding): 1º com a sidebar expandida (4 itens, sem scroll), 2º com a recolhida, 3º com 30 itens (rola). Abaixo de `lg` empilha, com altura máxima na lista.',
      },
    },
  },
};
