import { createElement } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
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
import { Empty } from '@/components/global/empty/empty';
import { FieldChanges } from '@/components/global/fieldChanges/fieldChanges';
import { Typography } from '@/components/ui/typography';
import { dateFormatter } from '@/lib/dateTime/dateFormatter';
import { cn } from '@/lib/utils';
import { ActivityTimelineSkeleton } from '@/screens/users/details/activityTimelineSkeleton';
import {
  auditKeys,
  fetchEntityAuditLogs,
  type EntityAuditLog,
} from '@/services/audit/auditApi';

interface ActivityTabProps {
  userId: string;
}

const PAGE_SIZE = 10;

const TIMELINE_TITLE = 'Linha do tempo';
const TIMELINE_DESCRIPTION =
  'Eventos da trilha de auditoria deste usuário, do mais recente para o mais antigo.';

// Ícone de cada ação da trilha (Map: sem indexar objeto por variável).
const ACTION_ICON = new Map<string, LucideIcon>([
  ['create', Plus],
  ['update', Pencil],
  ['delete', Trash2],
  ['statusChange', ShieldCheck],
  ['login', LogIn],
  ['export', Download],
]);

function TimelineItem({
  log,
  isLast,
}: {
  log: EntityAuditLog;
  isLast: boolean;
}) {
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {createElement(ACTION_ICON.get(log.action) ?? Activity, {
            className: 'size-4',
            'aria-hidden': true,
          })}
        </span>
        {!isLast && <span className="my-1 w-px flex-1 bg-border" aria-hidden />}
      </div>
      <div className="min-w-0 flex-1 space-y-2 pb-2">
        <div className="space-y-1">
          <Typography as="p" variant="small" className="leading-5">
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
        {log.fieldChanges.length > 0 && (
          <FieldChanges changes={log.fieldChanges} />
        )}
      </div>
    </li>
  );
}

/**
 * Linha do tempo do usuário (`GET /client/audit-logs/entities/User/:id`): o que
 * fizeram com ele e os logins dele, paginada, com a página na URL
 * (`activityPage`, 0-based) para recarregar e compartilhar na mesma posição.
 */
export function ActivityTab({ userId }: ActivityTabProps) {
  const search = useSearch({ strict: false }) as { activityPage?: number };
  const navigate = useNavigate();
  const page = search.activityPage ?? 0;

  const params = {
    entity: 'User' as const,
    entityId: userId,
    page,
    pageSize: PAGE_SIZE,
  };
  const { data, isPending, isError, isPlaceholderData, refetch } = useQuery({
    queryKey: auditKeys.entity(params),
    queryFn: () => fetchEntityAuditLogs(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const goToPage = (next: number) => {
    void navigate({
      to: '.',
      search: (previous: Record<string, unknown>) => ({
        ...previous,
        activityPage: next > 0 ? next : undefined,
      }),
    });
  };

  if (isError) {
    return (
      <Empty
        title="Não foi possível carregar a atividade"
        description="Tente de novo em instantes."
        icon={<Activity />}
      >
        <Button variant="outline" onClick={() => void refetch()}>
          Tentar novamente
        </Button>
      </Empty>
    );
  }

  if (data && data.count === 0) {
    return (
      <Empty
        title="Sem atividade registrada"
        description="Os eventos da trilha de auditoria deste usuário aparecerão aqui."
        icon={<Activity />}
      />
    );
  }

  // Endereço com uma página que não existe mais (ex.: eventos apagados pela
  // retenção depois que o link foi compartilhado).
  if (data && data.logs.length === 0) {
    return (
      <Empty
        title="Nenhum evento nesta página"
        description="A linha do tempo deste usuário tem menos páginas."
        icon={<Activity />}
      >
        <Button variant="outline" onClick={() => goToPage(0)}>
          Ir para a primeira página
        </Button>
      </Empty>
    );
  }

  const logs = data?.logs ?? [];
  const count = data?.count ?? 0;
  const firstIndex = page * PAGE_SIZE;

  return (
    <Card title={TIMELINE_TITLE} description={TIMELINE_DESCRIPTION}>
      {isPending ? (
        <ActivityTimelineSkeleton />
      ) : (
        <ol className="space-y-4" aria-busy={isPlaceholderData}>
          {logs.map((log, index) => (
            <TimelineItem
              key={log.id}
              log={log}
              isLast={index === logs.length - 1}
            />
          ))}
        </ol>
      )}

      {count > PAGE_SIZE && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
          <Typography
            variant="muted"
            className={cn('mr-auto', isPlaceholderData && 'invisible')}
          >
            {firstIndex + 1}–{firstIndex + logs.length} de {count} eventos
          </Typography>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page - 1)}
            disabled={page === 0 || isPlaceholderData}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page + 1)}
            disabled={firstIndex + PAGE_SIZE >= count || isPlaceholderData}
          >
            Próxima
          </Button>
        </div>
      )}
    </Card>
  );
}
