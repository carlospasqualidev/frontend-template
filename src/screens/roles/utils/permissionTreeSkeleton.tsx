import type { JSX } from 'react';

import { SkeletonText } from '@/components/global/skeleton/skeleton';

const GROUPS = 4;
const PERMISSIONS_PER_GROUP = 3;

/**
 * A árvore de permissões enquanto o catálogo carrega: o bloco de um módulo
 * (a faixa do cabeçalho e os grupos lado a lado), no mesmo espaço da árvore
 * carregada. Só os rótulos, que vêm do servidor, viram skeleton.
 */
export function PermissionTreeSkeleton(): JSX.Element {
  return (
    <div className="overflow-hidden rounded-lg border" aria-busy>
      <div className="bg-muted/40 px-3 py-2.5">
        <SkeletonText className="w-28" />
      </div>
      <div className="grid items-start gap-6 border-t p-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: GROUPS }, (_, group) => (
          <div key={group} className="space-y-4">
            <SkeletonText className="w-20" />
            {Array.from({ length: PERMISSIONS_PER_GROUP }, (_, permission) => (
              <SkeletonText key={permission} className="w-36" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
