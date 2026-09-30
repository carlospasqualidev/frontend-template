import { useEffect, useRef, type FormEvent, type ReactNode } from 'react';
import { isAxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import {
  Activity,
  Check,
  MonitorSmartphone,
  Shield,
  Trash2,
  UserCog,
  UserX,
  X,
} from 'lucide-react';

import { Button } from '@/components/global/button/button';
import { ConfirmDialog } from '@/components/global/confirmDialog/confirmDialog';
import { Empty } from '@/components/global/empty/empty';
import { PageActions } from '@/components/global/layout/pageActions';
import { Link } from '@/components/global/link/link';
import { UrlTabs } from '@/components/global/tabs/urlTabs';
import { useReturnToList } from '@/hooks/useReturnToList';
import { useSessionStore } from '@/hooks/useSessionStore';
import { useZodForm } from '@/lib/forms/useZodForm';
import { hasPermission } from '@/lib/permissions';
import { ActivityTab } from '@/screens/users/details/activityTab';
import { OverviewTab } from '@/screens/users/details/overviewTab';
import { RolesTab } from '@/screens/users/details/rolesTab';
import { SessionsTab } from '@/screens/users/details/sessionsTab';
import {
  UserDetailSkeleton,
  type UserDetailSkeletonTab,
} from '@/screens/users/details/userDetailSkeleton';
import { userActionCopy } from '@/screens/users/utils/userActionCopy';
import {
  changedProfileFields,
  editUserFormSchema,
  hasSameRoles,
  pendingFieldsOnRebase,
  userToFormValues,
} from '@/screens/users/utils/userForm';
import {
  handleUserFormError,
  handleUserMutationError,
  storeSavedUser,
  useDeleteUser,
} from '@/screens/users/utils/userMutations';
import { userKeys } from '@/services/users/queryKeys';
import { type CompanyUser } from '@/services/users/types';
import { fetchUser } from '@/services/users/userDetailApi';
import {
  updateUser,
  type UpdateUserBody,
  type UserFormField,
} from '@/services/users/userFormApi';
import { setUserRoles } from '@/services/users/userRolesApi';

// Campos do cadastro no detalhe (o e-mail só aparece; não há senha).
const EDIT_FIELDS: readonly UserFormField[] = [
  'name',
  'phone',
  'image',
  'idleTimeoutMinutes',
];

interface DetailPermissions {
  canUpdate: boolean;
  canDelete: boolean;
  canReadRoles: boolean;
  canReadAudit: boolean;
}

function useDetailPermissions(): DetailPermissions {
  const user = useSessionStore((state) => state.user);
  return {
    canUpdate: hasPermission(user, 'backoffice.users.update'),
    canDelete: hasPermission(user, 'backoffice.users.delete'),
    canReadRoles: hasPermission(user, 'backoffice.roles.read'),
    // A linha do tempo lê a trilha de auditoria (`backoffice.audit.read`).
    canReadAudit: hasPermission(user, 'backoffice.audit.read'),
  };
}

// Abas na ordem da tela; "Atividade" só com a permissão da trilha.
function detailTabs({
  canReadAudit,
}: DetailPermissions): UserDetailSkeletonTab[] {
  return [
    { value: 'overview', icon: <UserCog />, label: 'Visão geral' },
    ...(canReadAudit
      ? [{ value: 'activity', icon: <Activity />, label: 'Atividade' }]
      : []),
    { value: 'roles', icon: <Shield />, label: 'Cargos' },
    { value: 'sessions', icon: <MonitorSmartphone />, label: 'Sessões' },
  ];
}

// Id fora do formato (400) e usuário inexistente, excluído ou de outra
// empresa (404): o serviço deixa sem toast, e a tela diz que não achou.
function isNotFound(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 400 || status === 404;
}

export function UserDetailsPage() {
  const { userId = '' } = useParams({ strict: false });
  const permissions = useDetailPermissions();

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => fetchUser(userId),
    enabled: !!userId,
    staleTime: 30_000,
  });

  if (isPending) {
    return <UserDetailSkeleton tabs={detailTabs(permissions)} />;
  }

  // Sem o usuário (a primeira leitura falhou) ou ele não existe mais (404
  // numa releitura): a tela diz o que houve. A releitura que falha por outro
  // motivo mantém o formulário, com o que a pessoa editou.
  if (!data || (isError && isNotFound(error))) {
    return isNotFound(error) ? (
      <Empty
        title="Usuário não encontrado"
        description="O identificador é inválido ou o usuário foi removido."
        icon={<UserX />}
      >
        <Button asChild variant="outline">
          <Link
            href="/users"
            newTabIcon={false}
            className="text-foreground no-underline hover:text-foreground"
          >
            Voltar para a lista
          </Link>
        </Button>
      </Empty>
    ) : (
      <Empty
        title="Não foi possível carregar o usuário"
        description="Tente de novo em instantes."
        icon={<UserX />}
      >
        <Button variant="outline" onClick={() => void refetch()}>
          Tentar novamente
        </Button>
      </Empty>
    );
  }

  return (
    <UserDetails
      key={data.user.id}
      user={data.user}
      permissions={permissions}
    />
  );
}

function DeleteUserAction({ user }: { user: CompanyUser }) {
  const remove = useDeleteUser();
  const returnToList = useReturnToList('/users');
  const copy = userActionCopy('delete', user.name);

  return (
    <ConfirmDialog
      title={copy.title}
      description={copy.description}
      confirmLabel={copy.confirmLabel}
      destructive
      onConfirm={async () => {
        await remove.mutateAsync(user.id);
        returnToList();
      }}
      trigger={
        <Button variant="destructive" aria-label="Excluir usuário">
          <Trash2 />
          <span className="hidden sm:inline">Excluir</span>
        </Button>
      }
    />
  );
}

/**
 * Detalhe = Edição: o cadastro (aba "Visão geral") e os cargos (aba
 * "Cargos") são um formulário só, com o "Salvar alterações" no topo. Salvar
 * grava o que mudou: o cadastro em `PATCH /client/users/:userId` (só os
 * campos alterados) e, depois dele, os cargos em `PUT
 * /client/users/:userId/roles`. Cada resposta traz o próprio toast.
 */
function UserDetails({
  user,
  permissions,
}: {
  user: CompanyUser;
  permissions: DetailPermissions;
}) {
  const queryClient = useQueryClient();
  const readOnly = !permissions.canUpdate;

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    formState: { isDirty },
  } = useZodForm({
    schema: editUserFormSchema,
    defaultValues: userToFormValues(user),
  });

  // Uma referência só, o usuário do cache: é com ele que o "Salvar" compara, é
  // a ele que o "Descartar" volta e é contra ele que a alteração pendente
  // aparece. Quando o cache muda (a resposta de uma gravação, o "Bloquear", uma
  // releitura), o formulário passa a partir do usuário novo, e o que a pessoa
  // alterou e ainda não foi gravado (inclusive o que digitou enquanto a
  // gravação ou a releitura corria) continua pendente.
  const startRef = useRef(user);
  useEffect(() => {
    const start = startRef.current;
    startRef.current = user;
    const pendingFields = pendingFieldsOnRebase(getValues(), start, user);
    if (!pendingFields) return;

    const pending = pendingFields.map((field) => ({
      field,
      value: getValues(field),
    }));
    reset(userToFormValues(user));
    for (const { field, value } of pending) {
      setValue(field, value, { shouldDirty: true });
    }
  }, [user, getValues, reset, setValue]);

  // Cada gravação põe no cache o usuário que o servidor devolveu, e o
  // formulário passa a partir dele. A falha que não é HTTP (a resposta 200
  // fora do contrato: o servidor pode ter gravado) relê o usuário; se a
  // releitura falhar, a alteração inteira continua pendente.
  const profileMutation = useMutation({
    mutationFn: (body: UpdateUserBody) => updateUser(user.id, body),
    onSuccess: ({ user: saved }) => storeSavedUser(queryClient, saved),
    onError: (error) =>
      handleUserFormError(error, {
        queryClient,
        fields: EDIT_FIELDS,
        markField: (field, message) =>
          setError(field, { type: 'server', message }),
      }),
  });

  // A recusa (anti-escalonamento, o `Administrador`, os próprios cargos, o
  // último administrador) é o toast do servidor; a troca continua pendente.
  const rolesMutation = useMutation({
    mutationFn: (roleIds: string[]) => setUserRoles(user.id, roleIds),
    onSuccess: ({ user: saved }) => storeSavedUser(queryClient, saved),
    onError: (error) => handleUserMutationError(error, queryClient),
  });

  const onSubmit = handleSubmit((values) => {
    const profile = changedProfileFields(user, values);
    const roleIds = hasSameRoles(user, values.roleIds)
      ? undefined
      : values.roleIds;
    const saveRoles = () => {
      if (roleIds) rolesMutation.mutate(roleIds);
    };

    if (profile) {
      profileMutation.mutate(profile, { onSuccess: saveRoles });
    } else {
      saveRoles();
    }
  });

  const submitForm = (event?: FormEvent<HTMLFormElement>) =>
    void onSubmit(event);

  const isSaving = profileMutation.isPending || rolesMutation.isPending;

  const tabContent = new Map<string, ReactNode>([
    [
      'overview',
      <OverviewTab
        user={user}
        control={control}
        readOnly={readOnly}
        onSubmit={submitForm}
      />,
    ],
    ['activity', <ActivityTab userId={user.id} />],
    [
      'roles',
      <RolesTab
        user={user}
        control={control}
        canReadRoles={permissions.canReadRoles}
        readOnly={readOnly}
      />,
    ],
    ['sessions', <SessionsTab user={user} />],
  ]);

  return (
    <>
      <PageActions>
        {!readOnly && isDirty ? (
          <>
            <Button
              key="discard-action"
              variant="outline"
              type="button"
              aria-label="Descartar"
              onClick={() => reset()}
            >
              <X />
              <span className="hidden sm:inline">Descartar</span>
            </Button>
            <Button
              key="submit-action"
              type="button"
              loading={isSaving}
              aria-label="Salvar alterações"
              onClick={() => submitForm()}
            >
              <Check />
              <span className="hidden sm:inline">Salvar alterações</span>
            </Button>
          </>
        ) : (
          permissions.canDelete && (
            <DeleteUserAction key="delete-action" user={user} />
          )
        )}
      </PageActions>

      <UrlTabs
        defaultValue="overview"
        items={detailTabs(permissions).map((tab) => ({
          ...tab,
          content: tabContent.get(tab.value),
        }))}
      />
    </>
  );
}
