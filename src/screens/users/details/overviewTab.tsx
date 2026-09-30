import { type FormEvent, type ReactNode } from 'react';
import { type Control } from 'react-hook-form';
import { UserCheck, UserX } from 'lucide-react';

import { Button } from '@/components/global/button/button';
import { Card } from '@/components/global/card/card';
import { ConfirmDialog } from '@/components/global/confirmDialog/confirmDialog';
import { Typography } from '@/components/ui/typography';
import { dateFormatter } from '@/lib/dateTime/dateFormatter';
import { userActionCopy } from '@/screens/users/utils/userActionCopy';
import { type UserFormValues } from '@/screens/users/utils/userForm';
import { UserFormFields } from '@/screens/users/utils/userFormFields';
import { useSetUserActive } from '@/screens/users/utils/userMutations';
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

/** Bloquear/desbloquear no cabeçalho do card "Situação", com confirmação. */
function UserStatusAction({ user }: { user: CompanyUser }) {
  const setActive = useSetUserActive();
  const copy = userActionCopy(user.isActive ? 'block' : 'unblock', user.name);

  return (
    <ConfirmDialog
      title={copy.title}
      description={copy.description}
      confirmLabel={copy.confirmLabel}
      destructive={copy.destructive}
      onConfirm={async () => {
        await setActive.mutateAsync({
          userId: user.id,
          isActive: !user.isActive,
        });
      }}
      trigger={
        <Button type="button" variant="outline">
          {user.isActive ? <UserX /> : <UserCheck />}
          {user.isActive ? 'Bloquear' : 'Desbloquear'}
        </Button>
      }
    />
  );
}

interface OverviewTabProps {
  user: CompanyUser;
  control: Control<UserFormValues>;
  /** Sem `backoffice.users.update`: campos em leitura e sem bloquear. */
  readOnly: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
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
        description="Status do acesso e quando a conta foi criada e usada."
        action={readOnly ? undefined : <UserStatusAction user={user} />}
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
