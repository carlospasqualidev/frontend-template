import { type FormEvent, type ReactNode } from 'react';
import { type Control } from 'react-hook-form';
import { UserCheck, UserX } from 'lucide-react';

import { Button } from '@/components/global/button/button';
import { Card } from '@/components/global/card/card';
import { Typography } from '@/components/ui/typography';
import { dateFormatter } from '@/lib/dateTime/dateFormatter';
import { type UserFormValues } from '@/screens/users/utils/userForm';
import { UserFormFields } from '@/screens/users/utils/userFormFields';
import { UserStatusBadge } from '@/screens/users/utils/userStatusBadge';
import { type CompanyUser } from '@/services/users/types';

interface DefinitionItemProps {
  label: string;
  children: ReactNode;
}

function DefinitionItem({ label, children }: DefinitionItemProps) {
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

interface OverviewTabProps {
  user: CompanyUser;
  control: Control<UserFormValues>;
  /** Sem `backoffice.users.update`: campos em leitura e sem bloquear. */
  readOnly: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  /**
   * Abre a confirmação de bloquear/desbloquear, que vive na tela, fora da aba;
   * recebe o botão que abriu, para o foco voltar a ele ao fechar.
   */
  onRequestStatusChange: (trigger: HTMLElement) => void;
}

/**
 * Visão geral do detalhe: o cadastro, já editável (Detalhe = Edição; o
 * "Salvar alterações" fica no topo), e a situação da conta, só leitura.
 */
export function OverviewTab({
  user,
  control,
  readOnly,
  onSubmit,
  onRequestStatusChange,
}: OverviewTabProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="grid items-start gap-4 lg:grid-cols-2"
      noValidate
    >
      <UserFormFields control={control} mode="edit" readOnly={readOnly} />

      <Card
        title="Situação"
        action={
          readOnly ? undefined : (
            <Button
              type="button"
              variant="outline"
              onClick={(event) => onRequestStatusChange(event.currentTarget)}
            >
              {user.isActive ? <UserX /> : <UserCheck />}
              {user.isActive ? 'Bloquear' : 'Desbloquear'}
            </Button>
          )
        }
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <DefinitionItem label="Status">
            <UserStatusBadge isActive={user.isActive} />
          </DefinitionItem>
          <DefinitionItem label="Último acesso">
            {user.lastLoginAt
              ? dateFormatter({
                  date: user.lastLoginAt,
                  hasTimeStamp: true,
                  showHours: true,
                })
              : 'Nunca acessou'}
          </DefinitionItem>
          <DefinitionItem label="Criado em">
            {dateFormatter({
              date: user.createdAt,
              hasTimeStamp: true,
              showHours: true,
            })}
          </DefinitionItem>
          <DefinitionItem label="ID interno">
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              {user.id}
            </code>
          </DefinitionItem>
        </dl>
      </Card>
    </form>
  );
}
