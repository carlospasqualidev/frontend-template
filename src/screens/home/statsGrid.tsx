import { createElement, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownRight,
  ArrowUpRight,
  Mail,
  Minus,
  UserPlus,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import { DemoNotice } from '@/components/global/demoNotice/demoNotice';
import { SkeletonValue } from '@/components/global/skeleton/skeleton';
import { Typography } from '@/components/ui/typography';
import { useSessionStore } from '@/hooks/useSessionStore';
import { hasPermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import {
  DEMO_STATS,
  type DemoStat,
  type DemoStatId,
} from '@/screens/home/utils/homeDemo';
import {
  newUsersThisMonthParams,
  TOTAL_USERS_PARAMS,
} from '@/services/home/homeApi';
import { userKeys } from '@/services/users/queryKeys';
import { fetchUsers, type UserListParams } from '@/services/users/userListApi';

// Ícones (Map: sem indexar objeto por variável).
const DEMO_STAT_ICON = new Map<DemoStatId, LucideIcon>([
  ['activeSessions', Zap],
  ['pendingInvites', Mail],
]);

const TREND_ICON = new Map<DemoStat['trend'], LucideIcon>([
  ['up', ArrowUpRight],
  ['down', ArrowDownRight],
  ['neutral', Minus],
]);

function deltaColor(stat: DemoStat): string {
  if (stat.trend === 'neutral') return 'text-muted-foreground';
  const isPositive = stat.trend === 'up';
  const isGood = stat.invertSentiment ? !isPositive : isPositive;
  return isGood ? 'text-success' : 'text-destructive';
}

interface StatCardProps {
  label: string;
  icon: LucideIcon;
  /** `undefined` enquanto carrega: o skeleton ocupa o lugar do número. */
  value: string | undefined;
  children: ReactNode;
}

function StatCard({ label, icon, value, children }: StatCardProps) {
  return (
    <article className="space-y-3 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:rounded-3xl dark:shadow-none">
      <div className="flex items-center justify-between gap-3">
        <Typography variant="small" className="text-muted-foreground">
          {label}
        </Typography>
        <span className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground [&>svg]:size-4">
          {createElement(icon, { 'aria-hidden': true })}
        </span>
      </div>
      {value === undefined ? (
        <SkeletonValue className="w-20" />
      ) : (
        <Typography as="strong" variant="h2" className="block">
          {value}
        </Typography>
      )}
      {children}
    </article>
  );
}

/**
 * Número real: o `count` da listagem de usuários com os parâmetros dados, na
 * chave da própria listagem (o cache guarda a resposta inteira; a tela lê só o
 * total).
 */
function UserCountCard({
  label,
  icon,
  params,
  hint,
}: {
  label: string;
  icon: LucideIcon;
  params: UserListParams;
  hint: string;
}) {
  const {
    data: count,
    isPending,
    isError,
  } = useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => fetchUsers(params),
    select: (response) => response.count,
    staleTime: 30_000,
  });

  const value = isPending
    ? undefined
    : isError || count === undefined
      ? '—'
      : count.toLocaleString('pt-BR');

  return (
    <StatCard label={label} icon={icon} value={value}>
      <Typography variant="muted" className="text-xs">
        {isError ? 'Não foi possível carregar.' : hint}
      </Typography>
    </StatCard>
  );
}

function DemoStatCard({ stat }: { stat: DemoStat }) {
  return (
    <StatCard
      label={stat.label}
      icon={DEMO_STAT_ICON.get(stat.id) ?? Zap}
      value={stat.value}
    >
      <div className="flex items-center gap-2 text-xs">
        <span
          className={cn(
            'inline-flex items-center gap-1 font-medium [&>svg]:size-3',
            deltaColor(stat)
          )}
        >
          {createElement(TREND_ICON.get(stat.trend) ?? Minus, {
            'aria-hidden': true,
          })}
          {stat.delta}
        </span>
        <Typography as="span" variant="muted" className="text-xs">
          {stat.hint}
        </Typography>
      </div>
      <DemoNotice />
    </StatCard>
  );
}

/**
 * Indicadores da home. Usuários totais e novos no mês são reais (o `count` de
 * `GET /client/users`) e só aparecem com `backoffice.users.read`; sessões
 * ativas e convites pendentes não têm rota no servidor e ficam como
 * demonstração, com o aviso.
 */
export function StatsGrid() {
  const canReadUsers = useSessionStore((state) =>
    hasPermission(state.user, 'backoffice.users.read')
  );

  return (
    <section
      aria-label="Indicadores"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {canReadUsers && (
        <>
          <UserCountCard
            label="Usuários totais"
            icon={Users}
            params={TOTAL_USERS_PARAMS}
            hint="na empresa"
          />
          <UserCountCard
            label="Novos este mês"
            icon={UserPlus}
            params={newUsersThisMonthParams(new Date())}
            hint="cadastrados desde o dia 1º"
          />
        </>
      )}
      {DEMO_STATS.map((stat) => (
        <DemoStatCard key={stat.id} stat={stat} />
      ))}
    </section>
  );
}
