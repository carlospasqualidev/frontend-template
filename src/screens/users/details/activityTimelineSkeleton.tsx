import type { JSX } from 'react';

import {
  SkeletonAvatar,
  SkeletonText,
} from '@/components/global/skeleton/skeleton';

const ITEMS = 4;

/**
 * Itens da linha do tempo da aba "Atividade" enquanto carregam: o círculo do
 * ícone, a frase, a linha de autor e data e um de→para. O `Card` em volta (título
 * e descrição) continua visível.
 */
export function ActivityTimelineSkeleton(): JSX.Element {
  return (
    <ol aria-hidden className="space-y-4">
      {Array.from({ length: ITEMS }, (_, index) => (
        <li key={index} className="flex gap-3">
          <SkeletonAvatar className="size-8 shrink-0" />
          <div className="flex-1 space-y-2 pb-2">
            <SkeletonText className="w-2/3" />
            <SkeletonText className="h-3 w-40" />
            <SkeletonText className="w-1/2" />
          </div>
        </li>
      ))}
    </ol>
  );
}
