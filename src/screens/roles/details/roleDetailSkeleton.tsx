import type { JSX, ReactNode } from 'react';

import { Card } from '@/components/global/card/card';
import {
  SkeletonText,
  SkeletonValue,
} from '@/components/global/skeleton/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Typography } from '@/components/ui/typography';
import { PermissionTreeSkeleton } from '@/screens/roles/utils/permissionTreeSkeleton';

export interface RoleDetailSkeletonTab {
  value: string;
  label: string;
  icon: ReactNode;
}

function FieldSkeleton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div className="space-y-2">
      <Typography as="span" variant="small" className="block">
        {label}
      </Typography>
      <SkeletonValue className={className ?? 'w-full'} />
    </div>
  );
}

function ItemSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-1">
      <Typography
        as="span"
        variant="small"
        className="block text-muted-foreground"
      >
        {label}
      </Typography>
      <SkeletonText className="w-32" />
    </div>
  );
}

/**
 * Detalhe do cargo enquanto ele (e os usuários dele) carregam: as abas
 * (paradas na primeira) e os cards da visão geral com os rótulos reais; só os
 * valores viram skeleton. Os textos dos cards são os da tela carregada.
 */
export function RoleDetailSkeleton({
  tabs,
}: {
  tabs: RoleDetailSkeletonTab[];
}): JSX.Element {
  const [first] = tabs;

  return (
    <Tabs value={first?.value}>
      <div className="-mb-2 overflow-x-auto pb-2">
        <TabsList variant="line" className="w-max">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} disabled>
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value={first?.value ?? ''} className="pt-4">
        <div className="grid items-start gap-4 lg:grid-cols-2" aria-busy>
          <Card
            title="Identificação"
            description="Nome e descrição, como aparecem na escolha de cargos."
          >
            <div className="grid items-start gap-4">
              <FieldSkeleton label="Nome" />
              <FieldSkeleton label="Descrição" className="h-19 w-full" />
            </div>
          </Card>
          <Card
            title="Resumo"
            description="Quem usa o cargo e quando ele foi criado e alterado."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <ItemSkeleton label="Usuários" />
              <ItemSkeleton label="Criado em" />
              <ItemSkeleton label="Última alteração" />
              <ItemSkeleton label="ID interno" />
            </div>
          </Card>
          <Card
            title="Permissões"
            description="O que o cargo permite. Marcar uma ação de escrita marca também a de visualizar do mesmo grupo."
            className="lg:col-span-2"
          >
            <PermissionTreeSkeleton />
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
