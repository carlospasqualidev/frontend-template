import type { JSX } from 'react';

import { Card } from '@/components/global/card/card';
import { SkeletonValue } from '@/components/global/skeleton/skeleton';
import { Typography } from '@/components/ui/typography';
import { PROFILE_SECTIONS } from '@/screens/account/profile/profileForm';

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

/**
 * Aba "Perfil" enquanto o perfil carrega: os cards e os rótulos reais, na
 * mesma grade da tela carregada; só os campos viram skeleton.
 */
export function ProfileTabSkeleton(): JSX.Element {
  const { identification, access, photo } = PROFILE_SECTIONS;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2" aria-busy>
      <Card
        title={identification.title}
        description={identification.description}
      >
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <FieldSkeleton label="Nome" />
          <FieldSkeleton label="E-mail" />
          <FieldSkeleton label="Telefone" />
        </div>
      </Card>
      <Card title={access.title} description={access.description}>
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <FieldSkeleton label="Tempo de inatividade (min)" />
        </div>
      </Card>
      <Card title={photo.title} description={photo.description}>
        <SkeletonValue className="size-24 rounded-md" />
      </Card>
    </div>
  );
}
