import type { ReactNode } from 'react';

import { Typography } from '@/components/ui/typography';

interface IPageHeader {
  title: string;
  description?: string;
  actions?: ReactNode;
}

/**
 * Cabeçalho padrão para topo de tela: título, descrição e área opcional de
 * ações. Já trata `bg-card` + borda + shadow (light) + `dark:shadow-none`.
 */
export function PageHeader({ title, description, actions }: IPageHeader) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:flex-row lg:items-center lg:justify-between dark:shadow-none">
      <div className="space-y-2">
        <Typography as="h1" variant="h3">
          {title}
        </Typography>
        {description ? (
          <Typography variant="muted" className="max-w-2xl">
            {description}
          </Typography>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
