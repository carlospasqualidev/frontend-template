import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { CollapsibleCard } from '@/components/global/collapsibleCard/collapsibleCard';
import { FieldChanges } from '@/components/global/fieldChanges/fieldChanges';
import { Modal } from '@/components/global/modal/modal';
import { SkeletonText } from '@/components/global/skeleton/skeleton';
import { Badge } from '@/components/ui/badge';
import { Typography } from '@/components/ui/typography';
import { dateFormatter } from '@/lib/dateTime/dateFormatter';
import { cn } from '@/lib/utils';
import { useAuditOptions } from '@/screens/audit-logs/utils/useAuditOptions';
import {
  auditKeys,
  fetchAuditLogDetail,
  type AuditLogDetail,
} from '@/services/audit/auditApi';

interface AuditLogDetailModalProps {
  logId: string | null;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface DetailField {
  label: string;
  render: (log: AuditLogDetail) => React.ReactNode;
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <Typography as="dt" variant="muted">
        {label}
      </Typography>
      <dd className="text-sm wrap-break-word">{children}</dd>
    </div>
  );
}

function Snapshot({
  title,
  data,
  changed,
}: {
  title: string;
  data: AuditLogDetail['before'];
  changed: string[];
}) {
  return (
    <div className="min-w-0 space-y-2">
      <Typography as="p" variant="small">
        {title}
      </Typography>
      {data ? (
        <dl className="space-y-1 rounded-lg border border-border/70 p-3 text-sm">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex flex-wrap gap-x-2">
              <dt
                className={
                  changed.includes(key)
                    ? 'font-semibold'
                    : 'text-muted-foreground'
                }
              >
                {key}:
              </dt>
              <dd className="break-all">
                {value === null ? '—' : String(value)}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <Typography variant="muted">—</Typography>
      )}
    </div>
  );
}

/** `before`/`after` como gravados, recolhidos por padrão: o dado técnico para quem precisa dele. */
function RawSnapshots({ log }: { log: AuditLogDetail }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <CollapsibleCard
      title={<span className="text-sm font-medium">Dados técnicos</span>}
      summary="Antes e depois, como gravados"
      expanded={expanded}
      onToggle={() => setExpanded((value) => !value)}
      bodyClassName="grid gap-4 sm:grid-cols-2"
    >
      <Snapshot title="Antes" data={log.before} changed={log.changedFields} />
      <Snapshot title="Depois" data={log.after} changed={log.changedFields} />
    </CollapsibleCard>
  );
}

export function AuditLogDetailModal({
  logId,
  open,
  setOpen,
}: AuditLogDetailModalProps) {
  const { moduleLabel, actionLabel, entityLabel } = useAuditOptions();

  const { data, isError } = useQuery({
    queryKey: auditKeys.detail(logId ?? ''),
    queryFn: () => fetchAuditLogDetail(logId!),
    enabled: open && !!logId,
    staleTime: 60_000,
  });
  const log = data?.auditLog;

  const fields: DetailField[] = [
    {
      label: 'Data/hora',
      render: ({ createdAt }) =>
        dateFormatter({ date: createdAt, hasTimeStamp: true, showHours: true }),
    },
    { label: 'Autor', render: ({ user }) => user?.name ?? 'Sistema' },
    { label: 'Módulo', render: ({ module }) => moduleLabel(module) },
    {
      label: 'Ação',
      render: ({ action }) => (
        <Badge variant="secondary">{actionLabel(action)}</Badge>
      ),
    },
    { label: 'Entidade', render: ({ entity }) => entityLabel(entity) },
    { label: 'ID da entidade', render: ({ entityId }) => entityId ?? '—' },
  ];

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      size="xl"
      title="Detalhe da auditoria"
      description="Quem fez o quê, quando, e o que mudou no registro."
    >
      {isError ? (
        <Typography variant="muted">
          Não foi possível carregar este registro de auditoria.
        </Typography>
      ) : (
        <div className="space-y-4">
          <dl className="grid gap-4 sm:grid-cols-2">
            {fields.map(({ label, render }) => (
              <Field key={label} label={label}>
                {log ? render(log) : <SkeletonText className="w-32" />}
              </Field>
            ))}
            <Field label="Resumo" className="sm:col-span-2">
              {log ? (
                (log.description ?? '—')
              ) : (
                <SkeletonText className="w-2/3" />
              )}
            </Field>
          </dl>

          <section className="space-y-2">
            <Typography as="h3" variant="small">
              O que mudou
            </Typography>
            {log ? (
              <FieldChanges changes={log.fieldChanges} />
            ) : (
              <SkeletonText className="w-1/2" />
            )}
          </section>

          {log && <RawSnapshots key={log.id} log={log} />}
        </div>
      )}
    </Modal>
  );
}
