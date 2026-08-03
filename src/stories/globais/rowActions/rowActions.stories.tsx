import {
  ClipboardCheck,
  ExternalLink,
  FileCheck,
  FileClock,
  PackageCheck,
  Printer,
  Trash2,
  Truck,
} from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Card } from '@/components/global/card/card';
import {
  RowActions,
  type RowAction,
} from '@/components/global/rowActions/rowActions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const meta = {
  title: 'Globais/RowActions',
  component: RowActions,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Ações de uma linha de tabela como botões-ícone visíveis (um por ação) — para telas operacionais, onde o usuário repete as etapas do fluxo dezenas de vezes por dia. Cada ação tem ícone, tom semântico e rótulo em pt-BR (tooltip + nome acessível). Ações indisponíveis ficam visíveis e desabilitadas, com o motivo no tooltip. Nas demais listagens, use o menu "⋯" (`actionsColumn`).',
      },
    },
  },
} satisfies Meta<typeof RowActions>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => undefined;

const orderActions: RowAction[] = [
  {
    key: 'changes',
    label: 'Consultar alterações',
    icon: <FileClock />,
    onSelect: noop,
  },
  {
    key: 'print',
    label: 'Imprimir',
    icon: <Printer />,
    tone: 'brand',
    // Ação de navegação: com `href` o botão é um link (clique do meio abre em
    // nova aba); o clique normal segue o `onSelect` (navegação SPA).
    href: '/orders/1/print',
    onSelect: noop,
  },
  {
    key: 'delete',
    label: 'Excluir',
    icon: <Trash2 />,
    tone: 'destructive',
    onSelect: noop,
  },
];

const itemActions = (released: boolean): RowAction[] => [
  {
    key: 'dispatch',
    label: 'Apontar expedição',
    icon: <Truck />,
    tone: 'brand',
    disabled: !released,
    disabledReason: 'Apontar expedição — disponível após liberar o item',
    onSelect: noop,
  },
  {
    key: 'approve',
    label: 'Aprovar',
    icon: <FileCheck />,
    tone: 'success',
    disabled: !released,
    onSelect: noop,
  },
  {
    key: 'inspect',
    label: 'Inspecionar',
    icon: <ClipboardCheck />,
    tone: 'info',
    disabled: !released,
    onSelect: noop,
  },
  {
    key: 'deliver',
    // Cinza enquanto não entregue; verde quando a entrega acontece.
    label: released ? 'Entregue' : 'Entregar',
    icon: <PackageCheck />,
    tone: released ? 'success' : 'neutral',
    disabled: true,
    onSelect: noop,
  },
  {
    key: 'remove',
    label: 'Excluir',
    icon: <Trash2 />,
    tone: 'destructive',
    disabled: !released,
    onSelect: noop,
  },
];

export const Vitrine: Story = {
  args: { actions: orderActions },
  render: () => (
    <div className="space-y-4">
      <Card
        title="Tons"
        description="A mesma ação mantém o mesmo tom em todas as telas: cinza para consulta, marca para a ação principal do fluxo, azul/verde/âmbar conforme o significado e vermelho para o que remove. Cor nova = token no index.css + entrada em toneClasses."
      >
        <RowActions
          className="justify-start"
          actions={[
            {
              key: 'neutral',
              label: 'Consultar alterações',
              icon: <FileClock />,
              onSelect: noop,
            },
            {
              key: 'brand',
              label: 'Imprimir',
              icon: <Printer />,
              tone: 'brand',
              onSelect: noop,
            },
            {
              key: 'info',
              label: 'Inspecionar',
              icon: <ClipboardCheck />,
              tone: 'info',
              onSelect: noop,
            },
            {
              key: 'success',
              label: 'Aprovar',
              icon: <FileCheck />,
              tone: 'success',
              onSelect: noop,
            },
            {
              key: 'warning',
              label: 'Apontar pendência',
              icon: <Truck />,
              tone: 'warning',
              onSelect: noop,
            },
            {
              key: 'destructive',
              label: 'Excluir',
              icon: <Trash2 />,
              tone: 'destructive',
              onSelect: noop,
            },
          ]}
        />
      </Card>

      <Card
        title="Numa tabela"
        description="A coluna encolhe até o conteúdo e fica colada na borda direita. Na 2ª linha, as etapas ainda não liberadas aparecem desabilitadas — a posição de cada ícone não muda entre linhas."
      >
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead className="w-px">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">
                  P-80 | Produto de exemplo
                </TableCell>
                <TableCell>REF-0001</TableCell>
                <TableCell className="w-px whitespace-nowrap">
                  <RowActions actions={itemActions(true)} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  P-90 | Produto de exemplo
                </TableCell>
                <TableCell className="text-muted-foreground">-</TableCell>
                <TableCell className="w-px whitespace-nowrap">
                  <RowActions actions={itemActions(false)} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card
        title="Lista de topo"
        description="Ações da linha de um registro: consultar alterações, imprimir e excluir (editar é o clique na linha)."
      >
        <RowActions className="justify-start" actions={orderActions} />
      </Card>

      <Card
        title="Ação única"
        description="Uma ação só (ex.: abrir o registro a partir de um modal de vínculos)."
      >
        <RowActions
          className="justify-start"
          actions={[
            {
              key: 'open',
              label: 'Abrir registro REF-0001',
              icon: <ExternalLink />,
              onSelect: noop,
            },
          ]}
        />
      </Card>
    </div>
  ),
};
