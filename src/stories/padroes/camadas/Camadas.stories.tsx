import * as React from 'react';
import {
  CalendarClock,
  Layers,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Button } from '@/components/global/button/button';
import { Card } from '@/components/global/card/card';
import { ConfirmDialog } from '@/components/global/confirmDialog/confirmDialog';
import { DateField } from '@/components/global/form/dateField';
import { DateTimeField } from '@/components/global/form/dateTimeField';
import { MultiSelect } from '@/components/global/form/multiSelect';
import { Select } from '@/components/global/form/select';
import { HoverCard } from '@/components/global/hoverCard/hoverCard';
import { InfoTooltip } from '@/components/global/infoTooltip/infoTooltip';
import { Modal, ModalFooter } from '@/components/global/modal/modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Typography } from '@/components/ui/typography';

/**
 * Bancada de verificação das CAMADAS (z-index) e dos portais.
 *
 * Responde de olho, num lugar só: "todo conteúdo flutuante abre NA FRENTE do
 * que deveria, em qualquer contexto?". O bug que motivou esta página: o
 * calendário do `DateField` abria ATRÁS do modal, porque o `PopoverContent`
 * estava numa camada abaixo da dos modais.
 *
 * A ordem canônica vive em `src/index.css` (seção "CAMADAS (z-index)") e é
 * travada por `src/tests/globais/layout/layers.test.ts` (ordem dos tokens) e
 * por `e2e/storybook/camadas.spec.ts` (empilhamento real no navegador, medido
 * contra estas stories).
 */
const meta = {
  // `id` explícito: o spec de empilhamento navega direto para
  // `/iframe.html?id=padroes-camadas--<story>`, e um título com acento não
  // geraria um slug estável.
  id: 'padroes-camadas',
  title: 'Padrões/Camadas (z-index)',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Bancada das camadas de empilhamento. Cada story repete a MESMA bancada de flutuantes (calendário, selects, dropdown, hovercard, tooltip, toast) num contexto diferente — página, modal, sheet e empilhamento profundo. Duas coisas para conferir de olho: (1) se algum flutuante abrir ATRÁS do contexto que o contém, a convenção de z-index regrediu; (2) com uma camada de ESCOLHA aberta a página não deve rolar — só o `Tooltip` e o `HoverCard`, camadas auxiliares, deixam rolar.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* ────────────────────────────────────────────────────────────────────────────
   Dados de apoio
   ──────────────────────────────────────────────────────────────────────────── */

/** Acima de 8 opções o `Select` liga a busca sozinho (vira o núcleo do Combobox). */
const UF_OPTIONS = [
  { value: 'AC', label: 'Acre' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PR', label: 'Paraná' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
];

const STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'encerrado', label: 'Encerrado' },
];

const TAG_OPTIONS = [
  { value: 'urgente', label: 'Urgente' },
  { value: 'revisao', label: 'Em revisão' },
  { value: 'externo', label: 'Cliente externo' },
  { value: 'auditado', label: 'Auditado' },
];

/** Camadas na ordem visual esperada, do fundo para a frente. */
const LAYER_TOKENS = [
  { name: 'sidebar', owners: 'Sidebar fixo' },
  { name: 'sidebar-rail', owners: 'Alça de redimensionar do sidebar' },
  { name: 'header', owners: 'Header / breadcrumb do Layout' },
  { name: 'overlay', owners: 'Dialog, AlertDialog, Sheet, Drawer' },
  { name: 'floating', owners: 'Popover, DropdownMenu, Select, HoverCard' },
  { name: 'tooltip', owners: 'Tooltip' },
  { name: 'toast', owners: 'Sonner' },
];

/* ────────────────────────────────────────────────────────────────────────────
   Bancada reutilizável
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Todos os componentes que abrem conteúdo flutuante, lado a lado. É renderizada
 * igual em página, dentro de `Modal`, dentro de `Sheet` e dentro do `Drawer` (o
 * `Modal` no mobile) — o resultado tem de ser o mesmo nos quatro.
 *
 * `context` prefixa os `id`s para os campos continuarem únicos quando duas
 * bancadas coexistem no DOM (a da página + a do modal aberto).
 */
function FloatingBench({ context }: { context: string }) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  return (
    <div className="space-y-4" data-testid={`bench-${context}`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <DateField id={`${context}-date`} label="DateField (calendário)" />
        <DateTimeField
          id={`${context}-datetime`}
          label="DateTimeField (calendário + hora)"
        />
        <Select
          id={`${context}-select`}
          label="Select simples (lista curta)"
          placeholder="Selecione..."
          options={STATUS_OPTIONS}
        />
        <Select
          id={`${context}-searchable`}
          label="Select com busca (Combobox)"
          placeholder="Selecione a UF..."
          options={UF_OPTIONS}
        />
        <MultiSelect
          id={`${context}-multi`}
          label="MultiSelect"
          placeholder="Selecione as tags..."
          options={TAG_OPTIONS}
          searchable
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreHorizontal />
              DropdownMenu
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Pencil />
              Editar registro
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive">
              <Trash2 />
              Excluir registro
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Popover cru</Button>
          </PopoverTrigger>
          <PopoverContent>
            <Typography variant="small">
              Popover montado à mão, sem passar `portal` — ele resolve o portal
              pelo contexto e usa `z-(--z-floating)`.
            </Typography>
            {/* Tooltip DENTRO de um flutuante: prova `--z-tooltip` > `--z-floating`. */}
            <div className="flex items-center gap-2">
              <Typography variant="muted">Tooltip aqui dentro</Typography>
              <InfoTooltip
                label="Tooltip aberto de dentro de um popover."
                triggerLabel="Ajuda dentro do popover"
              />
            </div>
          </PopoverContent>
        </Popover>

        <HoverCard trigger={<Button variant="outline">HoverCard</Button>}>
          <Typography variant="small">
            Preview do HoverCard — mesma camada dos demais flutuantes.
          </Typography>
        </HoverCard>

        <InfoTooltip
          label="Tooltip fica acima de qualquer flutuante."
          triggerLabel="Ajuda da bancada"
        />

        <Button
          variant="outline"
          onClick={() => toast.success('Toast fica acima de tudo (--z-toast).')}
        >
          Disparar toast
        </Button>

        {/*
          AlertDialog aberto de dentro do contexto: um overlay sobre outro
          overlay. Como ambos vivem em `--z-overlay`, quem decide é a ordem dos
          portais — o último a abrir fica na frente.
        */}
        <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
          Abrir ConfirmDialog
        </Button>
        <ConfirmDialog
          open={confirmOpen}
          setOpen={setConfirmOpen}
          destructive
          title="Excluir registro?"
          description="Um AlertDialog aberto de dentro deste contexto precisa ficar na frente dele."
          onConfirm={() => {
            toast.success('Confirmado.');
          }}
        />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Stories
   ──────────────────────────────────────────────────────────────────────────── */

function EscalaTabela() {
  // Lê o valor REAL do token no navegador — não uma cópia escrita à mão aqui.
  // `Map` (e não objeto indexado por variável) por causa do object-injection.
  const [values] = React.useState(() => {
    const styles = getComputedStyle(document.documentElement);
    return new Map(
      LAYER_TOKENS.map(({ name }) => [
        name,
        styles.getPropertyValue(`--z-${name}`).trim(),
      ])
    );
  });

  // Ordem crescente sem indexar o array por variável: compara cada valor com o
  // anterior acumulado.
  let previous = Number.NEGATIVE_INFINITY;
  let inOrder = values.size > 0;

  for (const { name } of LAYER_TOKENS) {
    const value = Number(values.get(name));
    if (!Number.isFinite(value) || value <= previous) {
      inOrder = false;
      break;
    }
    previous = value;
  }

  return (
    <Card
      title="Escala de camadas"
      description="Valores lidos de `src/index.css` no navegador. A regra que não pode regredir: `floating` fica ACIMA de `overlay` — é o que faz um calendário abrir na frente de um modal."
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-2 pr-4 font-medium">Token</th>
              <th className="py-2 pr-4 font-medium">Valor</th>
              <th className="py-2 font-medium">Quem usa</th>
            </tr>
          </thead>
          <tbody>
            {LAYER_TOKENS.map(({ name, owners }) => (
              <tr key={name} className="border-t border-border/60">
                <td className="py-2 pr-4 font-mono text-xs">--z-{name}</td>
                <td
                  className="py-2 pr-4 font-mono text-xs tabular-nums"
                  data-testid={`token-${name}`}
                >
                  {values.get(name) || '—'}
                </td>
                <td className="py-2 text-muted-foreground">{owners}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Typography
        variant="small"
        data-testid="escala-veredito"
        className={inOrder ? 'text-success' : 'text-destructive'}
      >
        {inOrder
          ? 'Ordem crescente — escala coerente.'
          : 'ORDEM QUEBRADA — algum token saiu de sequência ou não existe.'}
      </Typography>
    </Card>
  );
}

/**
 * A escala lida do CSS em tempo de execução. Se um token sumir ou sair de
 * ordem, aparece aqui antes de virar bug de tela.
 */
export const Escala: Story = {
  render: () => (
    <div className="p-4">
      <EscalaTabela />
    </div>
  ),
};

/**
 * Bancada em PÁGINA, sob uma réplica do header do `Layout` (mesmo token
 * `--z-header`, mesma altura `h-16`). Confere o outro lado da regra: os
 * flutuantes ficam ACIMA do header no eixo z, e quem os mantém fora da faixa do
 * breadcrumb é o `collisionPadding` de topo, não o z-index.
 */
export const EmPagina: Story = {
  render: () => (
    <div className="h-svh overflow-y-auto bg-background">
      {/* Réplica do header do `Layout`: mesmo token e mesma altura. */}
      <header
        data-testid="header-falso"
        className="sticky top-0 z-(--z-header) flex h-16 items-center gap-2 bg-background px-4"
      >
        <Layers className="size-5 text-primary" />
        <Typography variant="h3">Camadas / Bancada</Typography>
        <Typography variant="muted" className="ml-auto">
          Réplica do header do Layout (`--z-header`, `h-16`)
        </Typography>
      </header>

      <div className="space-y-4 p-4">
        <Card
          title="Flutuantes em página"
          description="Abra cada um e tente rolar a página. Nenhum deve ser cortado por um ancestral, nenhum deve ser posicionado sobre a faixa do header (o `collisionPadding` de topo reserva essa faixa) e, com um deles aberto, a página só rola no `HoverCard` e no `Tooltip` — as camadas auxiliares."
        >
          <FloatingBench context="pagina" />
        </Card>

        {/* Empurra um segundo grupo até o fim da viewport: ali os flutuantes
            precisam FLIPAR para cima, e é aí que invadiriam o header se o
            `collisionPadding` sumisse. */}
        <div className="h-[60svh]" />

        <Card
          title="Perto do fim da viewport (o flutuante flipa para cima)"
          description="Aqui o conteúdo abre para CIMA. Mesmo assim ele não pode encostar na faixa do header."
        >
          <FloatingBench context="rodape" />
        </Card>

        <div className="h-24" />
      </div>
    </div>
  ),
};

/**
 * O caso que originou tudo: a bancada inteira DENTRO de um `Modal`. No desktop
 * o `Modal` é um `Dialog`; abaixo de 768px vira `Drawer` (vaul) — a mesma story
 * cobre os dois, basta estreitar a viewport.
 */
export const DentroDoModal: Story = {
  render: () => {
    const [open, setOpen] = React.useState(true);

    return (
      <div className="space-y-4 p-4">
        <Card
          title="Bancada dentro de um Modal"
          description="Todo flutuante aberto aqui precisa aparecer NA FRENTE do modal e continuar clicável. Estreite a viewport para menos de 768px e o mesmo `Modal` vira um Drawer — o resultado tem de ser idêntico."
        >
          <Button onClick={() => setOpen(true)}>Abrir modal</Button>
        </Card>

        <Modal
          open={open}
          setOpen={setOpen}
          size="lg"
          icon={<CalendarClock />}
          title="Agendar coleta"
          description="Todos os campos com conteúdo flutuante, dentro de um modal."
        >
          <div className="space-y-4">
            <FloatingBench context="modal" />
            <ModalFooter>
              <Button onClick={() => setOpen(false)}>Salvar</Button>
            </ModalFooter>
          </div>
        </Modal>
      </div>
    );
  },
};

/**
 * Mesma bancada dentro de um `Sheet` (painel lateral — é o que o sidebar vira
 * no mobile). O `Sheet` divide a camada `--z-overlay` com os modais, então os
 * flutuantes também precisam ficar na frente dele.
 */
export const DentroDoSheet: Story = {
  render: () => (
    <div className="space-y-4 p-4">
      <Card
        title="Bancada dentro de um Sheet"
        description="O Sheet vive na mesma camada dos modais (`--z-overlay`). Os flutuantes abertos de dentro dele precisam ficar por cima — e, como o `SheetContent` também provê o `InModalContext`, a roda do mouse continua rolando as listas."
      >
        <Sheet defaultOpen>
          <SheetTrigger asChild>
            <Button variant="outline">Abrir sheet</Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Filtros avançados</SheetTitle>
              <SheetDescription>
                Painel lateral com campos que abrem conteúdo flutuante.
              </SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <FloatingBench context="sheet" />
            </div>
          </SheetContent>
        </Sheet>
      </Card>
    </div>
  ),
};

/**
 * Empilhamento profundo — o caminho mais fundo que o app produz:
 * `Modal` → `DropdownMenu` → `ConfirmDialog` (AlertDialog) → `Toast`.
 * Cada passo precisa ficar na frente do anterior.
 */
export const EmpilhamentoProfundo: Story = {
  render: () => {
    const [modalOpen, setModalOpen] = React.useState(true);
    const [confirmOpen, setConfirmOpen] = React.useState(false);

    return (
      <div className="space-y-4 p-4">
        <Card
          title="Empilhamento profundo"
          description="Modal → DropdownMenu → ConfirmDialog → Toast. Abra na sequência: cada camada aparece na frente da anterior."
        >
          <Button onClick={() => setModalOpen(true)}>Abrir modal</Button>
        </Card>

        <Modal
          open={modalOpen}
          setOpen={setModalOpen}
          title="Registro #4821"
          description="Abra o menu de ações e confirme a exclusão."
        >
          <div className="space-y-4">
            <DateField id="profundo-date" label="Data da ocorrência" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreHorizontal />
                  Ações do registro
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setConfirmOpen(true)}
                >
                  <Trash2 />
                  Excluir registro
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmDialog
              open={confirmOpen}
              setOpen={setConfirmOpen}
              destructive
              title="Excluir registro #4821?"
              description="Aberto de dentro de um dropdown que está dentro de um modal."
              onConfirm={() => {
                toast.success('Excluído — e o toast fica acima de tudo.');
              }}
            />
          </div>
        </Modal>
      </div>
    );
  },
};
