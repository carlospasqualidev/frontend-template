import { createElement } from 'react';
import {
  AlertTriangle,
  CreditCard,
  Mail,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/global/button/button';
import { Card } from '@/components/global/card/card';
import { DemoNotice } from '@/components/global/demoNotice/demoNotice';
import { notifyDemoAction } from '@/components/global/demoNotice/notifyDemoAction';
import { Typography } from '@/components/ui/typography';
import {
  DEMO_PENDING_TASKS,
  type PendingTask,
  type PendingTaskKind,
} from '@/screens/home/utils/homeDemo';

// Ícone de cada tipo de pendência (Map: sem indexar objeto por variável).
const TASK_ICON = new Map<PendingTaskKind, LucideIcon>([
  ['invite', Mail],
  ['review', ShieldCheck],
  ['billing', CreditCard],
  ['security', AlertTriangle],
]);

interface PendingTasksProps {
  className?: string;
}

/** Pendências: demonstração (convites, faturas e alertas não existem no servidor). */
export function PendingTasks({ className }: PendingTasksProps) {
  return (
    <Card
      title="Pendências"
      description="Itens que precisam da sua atenção."
      action={<DemoNotice />}
      className={className}
    >
      <ul className="divide-y divide-border/60">
        {DEMO_PENDING_TASKS.map((task) => (
          <PendingTaskItem key={task.id} task={task} />
        ))}
      </ul>
    </Card>
  );
}

function PendingTaskItem({ task }: { task: PendingTask }) {
  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground [&>svg]:size-4">
        {createElement(TASK_ICON.get(task.kind) ?? AlertTriangle, {
          'aria-hidden': true,
        })}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Typography as="span" variant="small">
            {task.title}
          </Typography>
          <Typography as="span" variant="muted" className="text-xs">
            {task.hint}
          </Typography>
        </div>
        <Typography variant="muted" className="text-xs">
          {task.description}
        </Typography>
      </div>
      <Button size="sm" variant="ghost" onClick={notifyDemoAction}>
        Abrir
      </Button>
    </li>
  );
}
