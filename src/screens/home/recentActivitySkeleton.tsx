import type { JSX } from 'react';

import {
  SkeletonAvatar,
  SkeletonText,
} from '@/components/global/skeleton/skeleton';
import { RECENT_ACTIVITY_SIZE } from '@/services/home/homeApi';

/**
 * Eventos da "Atividade recente" enquanto carregam: o círculo do ícone, a
 * frase e a linha de autor e data, na quantidade que a home pede. O `Card` em
 * volta (título, descrição e o link da auditoria) continua visível.
 */
export function RecentActivitySkeleton(): JSX.Element {
  return (
    <ol aria-hidden className="space-y-3">
      {Array.from({ length: RECENT_ACTIVITY_SIZE }, (_, index) => (
        <li key={index} className="flex items-start gap-3">
          <SkeletonAvatar className="mt-0.5 size-8 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <SkeletonText className="w-3/4" />
            <SkeletonText className="h-3 w-40" />
          </div>
        </li>
      ))}
    </ol>
  );
}
