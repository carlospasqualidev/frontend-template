import type { JSX } from 'react';

import { Card } from '@/components/global/card/card';
import { SkeletonText } from '@/components/global/skeleton/skeleton';
import {
  groupByModule,
  moduleDescription,
} from '@/screens/settings/utils/configModules';
import {
  listMockSystemConfigOutline,
  systemConfigModuleLabel,
} from '@/services/systemConfigs/systemConfigsApi';

// Um card por grupo e uma linha por chave do catálogo, na ordem da tela.
const SKELETON_GROUPS = groupByModule(
  listMockSystemConfigOutline(),
  (config) => config.module
);

function ConfigRowSkeleton(): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 last:border-b-0">
      <div className="space-y-2">
        <SkeletonText className="h-4 w-48" />
        <SkeletonText className="h-3 w-64" />
      </div>
      <SkeletonText className="h-9 w-40" />
    </div>
  );
}

export function SettingsSkeleton(): JSX.Element {
  return (
    <div className="space-y-4">
      {SKELETON_GROUPS.map(({ module, items }) => (
        <Card
          key={module}
          title={systemConfigModuleLabel(module)}
          description={moduleDescription(module)}
        >
          <div>
            {items.map(({ key }) => (
              <ConfigRowSkeleton key={key} />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default SettingsSkeleton;
