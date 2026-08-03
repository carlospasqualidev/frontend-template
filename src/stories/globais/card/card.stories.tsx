import { Download, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Card } from '@/components/global/card/card';
import { Button } from '@/components/global/button/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Typography } from '@/components/ui/typography';

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
            <Button variant="ghost">Cancelar</Button>
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
