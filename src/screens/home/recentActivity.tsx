import { createElement } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Download,
  LogIn,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/global/button/button';
import { Card } from '@/components/global/card/card';
import { Link } from '@/components/global/link/link';
import { Typography } from '@/components/ui/typography';
import { dateFormatter } from '@/lib/dateTime/dateFormatter';
import { RecentActivitySkeleton } from '@/screens/home/recentActivitySkeleton';
import {
  auditKeys,
  fetchAuditLogs,
  type AuditLogListItem,
} from '@/services/audit/auditApi';
import { RECENT_ACTIVITY_PARAMS } from '@/services/home/homeApi';

// Ícone de cada ação da trilha (Map: sem indexar objeto por variável).
const ACTION_ICON = new Map<string, LucideIcon>([
  ['create', Plus],
  ['update', Pencil],
  ['delete', Trash2],
  ['statusChange', ShieldCheck],
  ['login', LogIn],
  ['export', Download],
]);

function ActivityItem({ log }: { log: AuditLogListItem }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground [&>svg]:size-4">
        {createElement(ACTION_ICON.get(log.action) ?? Activity, {
          'aria-hidden': true,
        })}
      </span>
      <div className="min-w-0 flex-1">
        <Typography as="p" variant="small">
          {log.description ?? '—'}
        </Typography>
        <Typography variant="muted" className="text-xs">
          {log.userName ?? 'Sistema'} ·{' '}
          {dateFormatter({
            date: log.createdAt,
            hasTimeStamp: true,
            showHours: true,
          })}
        </Typography>
      </div>
    </li>
  );
}

interface RecentActivityProps {
  className?: string;
}

/**
 * Atividade recente: os últimos eventos da trilha de auditoria
 * (`GET /client/audit-logs`, na chave da própria listagem), com a frase pronta
 * do servidor. Quem monta a home só o mostra com `backoffice.audit.read`.
 */
export function RecentActivity({ className }: RecentActivityProps) {
  const {
    data: logs,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: auditKeys.list(RECENT_ACTIVITY_PARAMS),
    queryFn: () => fetchAuditLogs(RECENT_ACTIVITY_PARAMS),
    select: (response) => response.logs,
    staleTime: 30_000,
  });

  const content = isPending ? (
    <RecentActivitySkeleton />
  ) : isError || !logs ? (
    <div className="flex flex-wrap items-center gap-2">
      <Typography variant="muted">
        Não foi possível carregar a atividade.
      </Typography>
      <Button variant="outline" onClick={() => void refetch()}>
        Tentar novamente
      </Button>
    </div>
  ) : logs.length === 0 ? (
    <Typography variant="muted">Nenhum evento registrado ainda.</Typography>
  ) : (
    <ol className="space-y-3">
      {logs.map((log) => (
        <ActivityItem key={log.id} log={log} />
      ))}
    </ol>
  );

  return (
    <Card
      title="Atividade recente"
      description="Últimos eventos da trilha de auditoria."
      action={
        <Link href="/audit-logs" newTabLabel="Abrir a auditoria em nova aba">
          Ver auditoria
        </Link>
      }
      className={className}
    >
      {content}
    </Card>
  );
}
