import type { JSX } from 'react';

import { Card } from '@/components/global/card/card';
import {
  SkeletonBadge,
  SkeletonText,
  SkeletonValue,
} from '@/components/global/skeleton/skeleton';
import {
  moduleDescription,
  SETTINGS_OUTLINE,
  type ConfigRowKind,
} from '@/screens/settings/utils/configModules';
import { systemConfigModuleLabel } from '@/services/systemConfigs/systemConfigsApi';

// Mesmo formato e espaçamento das linhas da tela: o campo de texto ou número
// com rótulo, caixa e descrição empilhados; o interruptor com rótulo e
// descrição à esquerda.
function ConfigRowSkeleton({ kind }: { kind: ConfigRowKind }): JSX.Element {
  if (kind === 'switch') {
    return (
      <div className="flex items-center justify-between gap-4 border-b py-4 last:border-b-0">
        <div className="space-y-1">
          <SkeletonText className="w-48" />
          <SkeletonText className="w-64" />
        </div>
        <SkeletonBadge className="w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-2 border-b py-4 last:border-b-0">
      <SkeletonText className="w-48" />
      <SkeletonValue className="w-full" />
      <SkeletonText className="w-72" />
    </div>
  );
}

export function SettingsSkeleton(): JSX.Element {
  return (
    <div className="space-y-4">
      {SETTINGS_OUTLINE.map(({ module, rows }) => (
        <Card
          key={module}
          title={systemConfigModuleLabel(module)}
          description={moduleDescription(module)}
        >
          <div>
            {rows.map((kind, index) => (
              <ConfigRowSkeleton key={index} kind={kind} />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default SettingsSkeleton;
