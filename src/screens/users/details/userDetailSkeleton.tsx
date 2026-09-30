import type { JSX, ReactNode } from 'react';

import { Card } from '@/components/global/card/card';
import {
  SkeletonBadge,
  SkeletonText,
  SkeletonValue,
} from '@/components/global/skeleton/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Typography } from '@/components/ui/typography';

export interface UserDetailSkeletonTab {
  value: string;
  label: string;
  icon: ReactNode;
}

function FieldSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-2">
      <Typography as="span" variant="small" className="block">
        {label}
      </Typography>
      <SkeletonValue className="w-full" />
    </div>
  );
}

function ItemSkeleton({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <Typography
        as="span"
        variant="small"
        className="block text-muted-foreground"
      >
        {label}
      </Typography>
      {value}
    </div>
  );
}

/**
 * Detalhe do usuário enquanto o cadastro carrega: as abas (paradas na
 * primeira) e os cards da visão geral com os rótulos reais; só os valores
 * viram skeleton. Os textos dos cards são os da tela carregada.
 */
export function UserDetailSkeleton({
  tabs,
}: {
  tabs: UserDetailSkeletonTab[];
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
            description="Nome, e-mail de acesso e contato."
          >
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <FieldSkeleton label="Nome" />
              <FieldSkeleton label="E-mail" />
              <FieldSkeleton label="Telefone" />
            </div>
          </Card>
          <Card
            title="Acesso"
            description="Tempo até o logout por inatividade."
          >
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <FieldSkeleton label="Tempo de inatividade (min)" />
            </div>
          </Card>
          <Card title="Foto" description="Aparece ao lado do nome no sistema.">
            <SkeletonValue className="size-24 rounded-md" />
          </Card>
          <Card
            title="Situação"
            description="Status do acesso e quando a conta foi criada e usada."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <ItemSkeleton label="Status" value={<SkeletonBadge />} />
              <ItemSkeleton
                label="Último acesso"
                value={<SkeletonText className="w-32" />}
              />
              <ItemSkeleton
                label="Criado em"
                value={<SkeletonText className="w-32" />}
              />
              <ItemSkeleton
                label="ID interno"
                value={<SkeletonText className="w-48" />}
              />
            </div>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
