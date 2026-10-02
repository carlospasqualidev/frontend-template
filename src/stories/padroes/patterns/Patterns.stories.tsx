import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CreditCard,
  KeyRound,
  Laptop,
  LogIn,
  Mail,
  Minus,
  Pencil,
  Plus,
  Shield,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Button } from '@/components/global/button/button';
import { Card } from '@/components/global/card/card';
import { ConfirmDialog } from '@/components/global/confirmDialog/confirmDialog';
import { InputField } from '@/components/global/form/inputField';
import { Select } from '@/components/global/form/select';
import { Modal } from '@/components/global/modal/modal';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Typography } from '@/components/ui/typography';
import { useZodForm } from '@/lib/forms/useZodForm';
import { cn } from '@/lib/utils';

const meta = {
  title: 'Padrões',
  parameters: {
    layout: 'padded',
  },
} satisfies Meta;

export default meta;

// ============================================================================
// KPI grid — padrão usado em screens/home/statsGrid.tsx
// ============================================================================

interface Kpi {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'neutral';
  invertSentiment?: boolean;
  hint: string;
  icon: LucideIcon;
}

const KPIS: Kpi[] = [
  {
    id: 'totalUsers',
    label: 'Usuários totais',
    value: '1.284',
    delta: '+8,3%',
    trend: 'up',
    hint: 'vs. mês anterior',
    icon: Users,
  },
  {
    id: 'newUsers',
    label: 'Novos este mês',
    value: '146',
    delta: '+22,1%',
    trend: 'up',
    hint: 'vs. mês anterior',
    icon: UserPlus,
  },
  {
    id: 'activeSessions',
    label: 'Sessões ativas',
    value: '312',
    delta: '-4,2%',
    trend: 'down',
    hint: 'últimas 24h',
    icon: Zap,
  },
  {
    id: 'pendingInvites',
    label: 'Convites pendentes',
    value: '17',
    delta: '+5',
    trend: 'up',
    invertSentiment: true,
    hint: 'aguardando aceite',
    icon: Mail,
  },
];

const TREND_ICON: Record<Kpi['trend'], LucideIcon> = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  neutral: Minus,
};

function deltaColor(kpi: Kpi): string {
  if (kpi.trend === 'neutral') return 'text-muted-foreground';
  const isPositive = kpi.trend === 'up';
  const isGood = kpi.invertSentiment ? !isPositive : isPositive;
  return isGood
    ? 'text-emerald-600 dark:text-emerald-500'
    : 'text-rose-600 dark:text-rose-500';
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon;
  const TrendIcon = TREND_ICON[kpi.trend];

  return (
    <article className="space-y-3 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:rounded-3xl dark:shadow-none">
      <div className="flex items-center justify-between gap-3">
        <Typography variant="small" className="text-muted-foreground">
          {kpi.label}
        </Typography>
        <span className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground [&>svg]:size-4">
          <Icon />
        </span>
      </div>
      <Typography as="strong" variant="h2" className="block">
        {kpi.value}
      </Typography>
      <div className="flex items-center gap-2 text-xs">
        <span
          className={cn(
            'inline-flex items-center gap-1 font-medium [&>svg]:size-3',
            deltaColor(kpi)
          )}
        >
          <TrendIcon />
          {kpi.delta}
        </span>
        <Typography as="span" variant="muted" className="text-xs">
          {kpi.hint}
        </Typography>
      </div>
    </article>
  );
}

function KpiGridDemo() {
  return (
    <Card
      title="Grid de KPIs"
      description="Cards de métrica com ícone, valor grande, delta colorido e hint. Use no topo de telas de dashboard. A cor do delta é derivada da combinação de trend + invertSentiment (alta de 'convites pendentes' não é positiva)."
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </section>
    </Card>
  );
}

// ============================================================================
// Timeline — padrão usado em screens/users/details/activityTab.tsx
// e screens/home/recentActivity.tsx
// ============================================================================

type TimelineEventType =
  | 'login'
  | 'invite-accepted'
  | 'role-change'
  | 'password-changed'
  | 'profile-updated';

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  message: string;
  occurredAt: string;
}

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'evt-1',
    type: 'role-change',
    message: 'Papel alterado para Administrador.',
    occurredAt: '02/04/2026',
  },
  {
    id: 'evt-2',
    type: 'password-changed',
    message: 'Senha redefinida via fluxo de recuperação.',
    occurredAt: '28/03/2026',
  },
  {
    id: 'evt-3',
    type: 'profile-updated',
    message: 'Bio e foto de perfil atualizadas.',
    occurredAt: '15/03/2026',
  },
  {
    id: 'evt-4',
    type: 'invite-accepted',
    message: 'Convite aceito por ana.silva@empresa.com.',
    occurredAt: '02/03/2026',
  },
  {
    id: 'evt-5',
    type: 'login',
    message: 'Primeiro login a partir de São Paulo, BR.',
    occurredAt: '02/03/2026',
  },
];

const TIMELINE_ICON: Record<TimelineEventType, LucideIcon> = {
  login: LogIn,
  'invite-accepted': UserCheck,
  'role-change': ShieldCheck,
  'password-changed': KeyRound,
  'profile-updated': Pencil,
};

function TimelineDemo() {
  return (
    <Card
      title="Timeline"
      description="Eventos cronológicos com ícone temático em círculo + linha vertical conectora. Use para auditoria, histórico de mudanças, atividade do usuário. O conector é suprimido no último item."
    >
      <ol className="space-y-4">
        {TIMELINE_EVENTS.map((event, index) => {
          const Icon = TIMELINE_ICON[event.type];
          const isLast = index === TIMELINE_EVENTS.length - 1;
          return (
            <li key={event.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                {isLast ? null : (
                  <span className="my-1 w-px flex-1 bg-border" aria-hidden />
                )}
              </div>
              <div className="space-y-1 pb-2">
                <Typography as="p" variant="small">
                  {event.message}
                </Typography>
                <Typography variant="muted" className="text-xs">
                  {event.occurredAt}
                </Typography>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

// ============================================================================
// Itens de lista com ações alinhadas — padrão usado em
// screens/account/security/securityTab.tsx (sessões),
// screens/account/billing/billingTab.tsx (faturas) e
// screens/users/details/sessionsTab.tsx
// ============================================================================

interface DeviceSession {
  id: string;
  device: string;
  icon: 'laptop' | 'phone';
  location: string;
  lastActive: string;
  current: boolean;
}

const SESSIONS: DeviceSession[] = [
  {
    id: 'sess-current',
    device: 'MacBook Pro · Chrome',
    icon: 'laptop',
    location: 'São Paulo, BR',
    lastActive: 'agora',
    current: true,
  },
  {
    id: 'sess-mobile',
    device: 'iPhone 15 · Safari',
    icon: 'phone',
    location: 'São Paulo, BR',
    lastActive: 'há 2 h',
    current: false,
  },
  {
    id: 'sess-work',
    device: 'Windows 11 · Edge',
    icon: 'laptop',
    location: 'Rio de Janeiro, BR',
    lastActive: 'há 3 d',
    current: false,
  },
];

const DEVICE_ICON = {
  laptop: Laptop,
  phone: Smartphone,
};

function ItemListWithActionsDemo() {
  return (
    <Card
      title="Lista com ações por item"
      description="Padrão repetido em sessões ativas, faturas, dispositivos pareados, integrações. Cada item: ícone (opcional) + texto principal + meta + ação à direita. `flex-col sm:flex-row` mantém legibilidade em mobile sem esconder dados."
    >
      <ul className="space-y-3">
        {SESSIONS.map((session, index) => {
          const Icon = DEVICE_ICON[session.icon];
          return (
            <li key={session.id} className="space-y-3">
              {index > 0 ? <Separator /> : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground [&>svg]:size-5">
                    <Icon />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Typography as="span" variant="small">
                        {session.device}
                      </Typography>
                      {session.current ? (
                        <Badge variant="default">Sessão atual</Badge>
                      ) : null}
                    </div>
                    <Typography variant="muted" className="text-xs">
                      {session.location} · ativa {session.lastActive}
                    </Typography>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={session.current}
                  onClick={() =>
                    toast(`Sessão em ${session.device} encerrada.`)
                  }
                >
                  Encerrar
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

// ============================================================================
// Lista de toggles — padrão usado em
// screens/account/notifications/notificationsTab.tsx
// ============================================================================

interface PermissionRow {
  id: string;
  label: string;
  description: string;
  granted: boolean;
}

const PERMISSIONS: PermissionRow[] = [
  {
    id: 'p-1',
    label: 'Convidar usuários',
    description: 'Pode enviar convites por e-mail para novos membros.',
    granted: true,
  },
  {
    id: 'p-2',
    label: 'Gerenciar permissões',
    description: 'Altera papéis e capacidades de outros membros.',
    granted: true,
  },
  {
    id: 'p-3',
    label: 'Exportar relatórios',
    description: 'Faz download de dados consolidados em CSV/XLSX.',
    granted: false,
  },
  {
    id: 'p-4',
    label: 'Encerrar sessões alheias',
    description: 'Pode forçar logout em dispositivos de outros membros.',
    granted: false,
  },
];

function ToggleListDemo() {
  return (
    <Card
      title="Lista de toggles"
      description="Permissões, canais de notificação, preferências booleanas. Cada item tem label + descrição secundária + Switch. O `<Switch>` tem aria-label porque o label visível está em um elemento separado."
    >
      <ul className="divide-y divide-border/60">
        {PERMISSIONS.map((permission) => (
          <li
            key={permission.id}
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 space-y-0.5">
              <Typography as="span" variant="small" className="block">
                {permission.label}
              </Typography>
              <Typography variant="muted" className="text-xs">
                {permission.description}
              </Typography>
            </div>
            <Switch
              defaultChecked={permission.granted}
              aria-label={permission.label}
              onCheckedChange={(checked) =>
                toast(
                  checked
                    ? `${permission.label} concedida.`
                    : `${permission.label} revogada.`
                )
              }
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ============================================================================
// Definition list — padrão usado em
// screens/users/details/overviewTab.tsx (card "Situação")
// ============================================================================

interface DefinitionItemProps {
  label: string;
  children: React.ReactNode;
}

function DefinitionItem({ label, children }: DefinitionItemProps) {
  return (
    <div className="space-y-1">
      <Typography variant="small" className="text-muted-foreground">
        {label}
      </Typography>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function DefinitionListDemo() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card
        title="Identificação"
        description="Use `<dl>` semântico para listas de propriedade → valor: detalhes de registro, cabeçalho de entidades, dados de contato."
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <DefinitionItem label="Nome">Ana Silva</DefinitionItem>
          <DefinitionItem label="E-mail">ana.silva@empresa.com</DefinitionItem>
          <DefinitionItem label="Papel">Administrador</DefinitionItem>
          <DefinitionItem label="Status">Ativo</DefinitionItem>
          <DefinitionItem label="ID interno">
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              usr_8f3c1e9a-4b2d-4f6e-9c8b-2a1d3e5f7g9h
            </code>
          </DefinitionItem>
        </dl>
      </Card>

      <Card
        title="Acesso"
        description="Pares discretos, sem ação inline. Quando o valor merece ação (editar, copiar), prefira o padrão Lista com ações por item."
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <DefinitionItem label="Cadastrado em">02/03/2026</DefinitionItem>
          <DefinitionItem label="Último acesso">15/05/2026</DefinitionItem>
        </dl>
      </Card>
    </div>
  );
}

// ============================================================================
// Tabs com estado persistido (URL ou state local) — padrão usado em
// screens/account/index.tsx e screens/users/details/index.tsx
// ============================================================================

function TabsWithUrlStateDemo() {
  // No Storybook não há TanStack Router; em tela real, troque por:
  //   const search = useSearch({ strict: false }) as { tab?: string };
  //   const navigate = useNavigate();
  //   const activeTab = isTabValue(search.tab) ? search.tab : 'profile';
  //   const setTab = (next) => navigate({ to: '.', search: (p) => ({...p, tab: next === 'profile' ? undefined : next}), replace: true });
  const [tab, setTab] = useState<
    'profile' | 'security' | 'notifications' | 'billing'
  >('profile');

  return (
    <Card
      title="Tabs com estado persistido"
      description="Em uma tela real, o tab ativo vive na URL (?tab=security) via TanStack Router — F5 e link compartilhado preservam o estado. Use `variant='line'` para sub-navegação dentro de uma tela; o estilo bloco é para escolha de modos. O default fica fora da URL (omitido)."
    >
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList variant="line">
          <TabsTrigger value="profile">
            <UserCog />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard />
            Pagamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="pt-4">
          <Typography variant="muted">
            Conteúdo do perfil: nome, e-mail, foto, bio.
          </Typography>
        </TabsContent>
        <TabsContent value="security" className="pt-4">
          <Typography variant="muted">
            Conteúdo de segurança: senha, 2FA, sessões ativas.
          </Typography>
        </TabsContent>
        <TabsContent value="notifications" className="pt-4">
          <Typography variant="muted">
            Conteúdo de notificações: canais, preferências, frequência.
          </Typography>
        </TabsContent>
        <TabsContent value="billing" className="pt-4">
          <Typography variant="muted">
            Conteúdo de pagamento: plano, faturas, método de pagamento.
          </Typography>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

// ============================================================================
// CRUD completo — DataTable simplificada + Modal + Form + ConfirmDialog
// ============================================================================

const roleOptions = [
  { label: 'Administrador', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Visualizador', value: 'viewer' },
] as const;

const roleLabel: Record<Person['role'], string> = {
  admin: 'Administrador',
  editor: 'Editor',
  viewer: 'Visualizador',
};

interface Person {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

const personSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.'),
  email: z.string().trim().email('Informe um e-mail válido.'),
  role: z.enum(['admin', 'editor', 'viewer']),
});

type PersonFormValues = z.output<typeof personSchema>;

const INITIAL_PEOPLE: Person[] = [
  { id: '1', name: 'Ana Silva', email: 'ana.silva@empresa.com', role: 'admin' },
  {
    id: '2',
    name: 'João Pereira',
    email: 'joao.pereira@empresa.com',
    role: 'editor',
  },
  {
    id: '3',
    name: 'Maria Costa',
    email: 'maria.costa@empresa.com',
    role: 'viewer',
  },
];

function PersonForm({
  initial,
  onSave,
}: {
  initial: Person | null;
  onSave: (values: PersonFormValues) => void;
}) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useZodForm({
    schema: personSchema,
    defaultValues: initial ?? { name: '', email: '', role: 'viewer' },
  });

  const onSubmit = handleSubmit(async (values) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    onSave(values);
  });

  return (
    <form className="space-y-4" noValidate onSubmit={onSubmit}>
      <InputField
        id="crud-name"
        label="Nome"
        placeholder="Nome completo"
        errors={errors.name}
        disabled={isSubmitting}
        {...register('name')}
      />

      <InputField
        id="crud-email"
        label="E-mail"
        type="email"
        placeholder="email@empresa.com"
        errors={errors.email}
        disabled={isSubmitting}
        {...register('email')}
      />

      <Select
        id="crud-role"
        name="role"
        control={control}
        label="Papel"
        placeholder="Selecione o papel"
        disabled={isSubmitting}
        options={roleOptions.map((option) => ({
          label: option.label,
          value: option.value,
        }))}
      />

      {isDirty && (
        <Button type="submit" loading={isSubmitting} className="w-full">
          {initial ? 'Salvar alterações' : 'Cadastrar'}
        </Button>
      )}
    </form>
  );
}

function CrudDemo() {
  const [people, setPeople] = useState<Person[]>(INITIAL_PEOPLE);
  const [editing, setEditing] = useState<Person | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (person: Person) => {
    setEditing(person);
    setModalOpen(true);
  };

  const handleSave = (values: PersonFormValues) => {
    if (editing) {
      setPeople((prev) =>
        prev.map((p) => (p.id === editing.id ? { ...p, ...values } : p))
      );
      toast.success('Registro atualizado.');
    } else {
      setPeople((prev) => [...prev, { id: crypto.randomUUID(), ...values }]);
      toast.success('Registro cadastrado.');
    }
    setModalOpen(false);
  };

  const handleDelete = async (person: Person) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    setPeople((prev) => prev.filter((p) => p.id !== person.id));
    toast.success(`${person.name} foi removido(a).`);
  };

  return (
    <Card
      title="CRUD completo"
      description="Amarra DataTable + Modal + Form (Zod + useZodForm) + ConfirmDialog. Estado em memória para a demo — em produção use TanStack Query com mutations. Para listas com filtros server-side, troque `<Table>` pelo `DataTable` global (ver story Globais/DataTable)."
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={openCreate}>
            <Plus />
            Novo
          </Button>
        </div>

        <Modal
          title={editing ? 'Editar pessoa' : 'Cadastrar pessoa'}
          description={
            editing
              ? 'Atualize os dados e salve para confirmar.'
              : 'Preencha os dados para adicionar uma nova pessoa.'
          }
          open={modalOpen}
          setOpen={setModalOpen}
        >
          <PersonForm
            key={editing?.id ?? 'new'}
            initial={editing}
            onSave={handleSave}
          />
        </Modal>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {people.map((person) => (
                // Editar é pelo clique na linha (mesmo idioma a11y do DataTable
                // global): sem botão "Editar" na célula. O "⋯"/ações ficam só
                // com o que não é abrir/editar — aqui, o Excluir.
                <TableRow
                  key={person.id}
                  onClick={() => openEdit(person)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openEdit(person);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Editar ${person.name}`}
                  className="cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <TableCell className="font-medium">{person.name}</TableCell>
                  <TableCell>{person.email}</TableCell>
                  <TableCell>{roleLabel[person.role]}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <ConfirmDialog
                        title={`Remover ${person.name}?`}
                        description="Esta ação não pode ser desfeita."
                        confirmLabel="Remover"
                        destructive
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Remover ${person.name}`}
                            // Não deixa o clique borbulhar e abrir a edição.
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Trash2 />
                          </Button>
                        }
                        onConfirm={() => handleDelete(person)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// Optimistic update — padrão TanStack Query (documentado em docs/conventions/http-and-state.md)
// ============================================================================

const FOLLOW_KEY = ['story-follow-status'];

const serverStore = { following: false };

async function fakeGetFollowing(): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return serverStore.following;
}

async function fakeToggleFollowing(): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  if (Math.random() < 0.3) {
    throw new Error('Falha simulada de rede.');
  }
  serverStore.following = !serverStore.following;
  return serverStore.following;
}

function OptimisticUpdateDemo() {
  const queryClient = useQueryClient();

  const { data: isFollowing = false } = useQuery({
    queryKey: FOLLOW_KEY,
    queryFn: fakeGetFollowing,
  });

  const toggleMutation = useMutation({
    mutationFn: fakeToggleFollowing,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: FOLLOW_KEY });
      const previous = queryClient.getQueryData<boolean>(FOLLOW_KEY);
      queryClient.setQueryData<boolean>(FOLLOW_KEY, (prev = false) => !prev);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(FOLLOW_KEY, context?.previous);
      toast.error('Falha ao atualizar — UI revertida.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FOLLOW_KEY });
    },
  });

  return (
    <Card
      title="Optimistic update"
      description="A UI muda na hora e faz rollback automático se o request falhar (~30% das vezes aqui, simulando rede instável). Use em ações reversíveis e de baixo risco — toggles, likes, edit inline. Evite em pagamento, criação de recursos críticos, qualquer fluxo onde a inconsistência momentânea engana o usuário."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Typography as="span" variant="muted">
            Estado:
          </Typography>
          <Typography as="span" variant="small">
            {isFollowing ? 'Seguindo' : 'Não seguindo'}
          </Typography>
        </div>

        <Button
          variant={isFollowing ? 'outline' : 'default'}
          onClick={() => toggleMutation.mutate()}
        >
          {isFollowing ? 'Deixar de seguir' : 'Seguir'}
        </Button>

        <Typography variant="muted">
          Clique algumas vezes. O botão troca instantaneamente — sem spinner,
          porque a UI já reflete o estado pretendido. Quando o request falha, um
          toast avisa e a UI volta sozinha pelo snapshot capturado em
          `onMutate`.
        </Typography>
      </div>
    </Card>
  );
}

// ============================================================================
// Exports
// ============================================================================

export const KpiGrid: StoryObj<typeof KpiGridDemo> = {
  name: 'Grid de KPIs',
  render: () => <KpiGridDemo />,
};

export const Timeline: StoryObj<typeof TimelineDemo> = {
  render: () => <TimelineDemo />,
};

export const ListaComAcoes: StoryObj<typeof ItemListWithActionsDemo> = {
  name: 'Lista com ações por item',
  render: () => <ItemListWithActionsDemo />,
};

export const ListaDeToggles: StoryObj<typeof ToggleListDemo> = {
  name: 'Lista de toggles',
  render: () => <ToggleListDemo />,
};

export const DefinitionList: StoryObj<typeof DefinitionListDemo> = {
  name: 'Definition list',
  render: () => <DefinitionListDemo />,
};

export const TabsComUrlState: StoryObj<typeof TabsWithUrlStateDemo> = {
  name: 'Tabs com estado persistido',
  render: () => <TabsWithUrlStateDemo />,
};

export const CRUD: StoryObj<typeof CrudDemo> = {
  render: () => <CrudDemo />,
};

export const OptimisticUpdate: StoryObj<typeof OptimisticUpdateDemo> = {
  render: () => <OptimisticUpdateDemo />,
};
