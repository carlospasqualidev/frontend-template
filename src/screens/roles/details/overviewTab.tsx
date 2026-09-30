import { type FormEvent, type ReactNode } from 'react';
import { type Control } from 'react-hook-form';

import { Card } from '@/components/global/card/card';
import { Typography } from '@/components/ui/typography';
import { dateFormatter } from '@/lib/dateTime/dateFormatter';
import { type RoleFormValues } from '@/screens/roles/utils/roleForm';
import {
  RoleIdentityCard,
  RolePermissionsCard,
} from '@/screens/roles/utils/roleFormFields';
import { type Role } from '@/services/roles/types';

function DefinitionItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt>
        <Typography as="span" variant="small" className="text-muted-foreground">
          {label}
        </Typography>
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function usersCountText(count: number): string {
  if (count === 0) return 'Nenhum usuário';
  return `${count.toLocaleString('pt-BR')} ${count === 1 ? 'usuário' : 'usuários'}`;
}

interface OverviewTabProps {
  role: Role;
  control: Control<RoleFormValues>;
  /** Sem `backoffice.roles.update`, ou o `Administrador`: só leitura. */
  readOnly: boolean;
  /** As permissões do cargo gravado. */
  savedPermissionIds: ReadonlySet<string>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

/**
 * Visão geral do detalhe: o cargo, já editável (Detalhe = Edição; o "Salvar
 * alterações" fica no topo), o resumo, só leitura, e a árvore de permissões.
 */
export function OverviewTab({
  role,
  control,
  readOnly,
  savedPermissionIds,
  onSubmit,
}: OverviewTabProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="grid items-start gap-4 lg:grid-cols-2"
      noValidate
    >
      <RoleIdentityCard control={control} readOnly={readOnly} />

      <Card
        title="Resumo"
        description="Quem usa o cargo e quando ele foi criado e alterado."
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <DefinitionItem label="Usuários">
            {usersCountText(role.usersCount)}
          </DefinitionItem>
          <DefinitionItem label="Criado em">
            {dateFormatter({
              date: role.createdAt,
              hasTimeStamp: true,
              showHours: true,
            })}
          </DefinitionItem>
          <DefinitionItem label="Última alteração">
            {dateFormatter({
              date: role.updatedAt,
              hasTimeStamp: true,
              showHours: true,
            })}
          </DefinitionItem>
          <DefinitionItem label="ID interno">
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              {role.id}
            </code>
          </DefinitionItem>
        </dl>
      </Card>

      <RolePermissionsCard
        control={control}
        readOnly={readOnly}
        savedPermissionIds={savedPermissionIds}
        className="lg:col-span-2"
      />
    </form>
  );
}
