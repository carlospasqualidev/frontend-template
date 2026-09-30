import {
  useEffect,
  useMemo,
  useRef,
  type FormEvent,
  type ReactNode,
} from 'react';
import { isAxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { Check, Copy, Shield, ShieldOff, Trash2, Users, X } from 'lucide-react';

import { Alert } from '@/components/global/alert/alert';
import { Button } from '@/components/global/button/button';
import { ConfirmDialog } from '@/components/global/confirmDialog/confirmDialog';
import { Empty } from '@/components/global/empty/empty';
import { PageActions } from '@/components/global/layout/pageActions';
import { Link } from '@/components/global/link/link';
import { UrlTabs } from '@/components/global/tabs/urlTabs';
import { useReturnToList } from '@/hooks/useReturnToList';
import { useSessionStore } from '@/hooks/useSessionStore';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { useZodForm } from '@/lib/forms/useZodForm';
import { hasPermission } from '@/lib/permissions';
import { OverviewTab } from '@/screens/roles/details/overviewTab';
import {
  RoleDetailSkeleton,
  type RoleDetailSkeletonTab,
} from '@/screens/roles/details/roleDetailSkeleton';
import {
  UsersTab,
  type UsersTabNotice,
} from '@/screens/roles/details/usersTab';
import {
  hasMemberChanges,
  hasRoleChanges,
  pendingRoleFieldsOnRebase,
  roleFormSchema,
  roleToFormValues,
  toSaveRoleBody,
  type RoleFormReference,
} from '@/screens/roles/utils/roleForm';
import {
  deleteRoleCopy,
  handleRoleFormError,
  handleRoleMutationError,
  storeSavedRole,
  useCopyRole,
  useDeleteRole,
} from '@/screens/roles/utils/roleMutations';
import { roleKeys } from '@/services/roles/queryKeys';
import { fetchRoleDetail } from '@/services/roles/roleDetailApi';
import { updateRole, type SaveRoleBody } from '@/services/roles/roleFormApi';
import {
  fetchAllRoleUsers,
  MAX_ROLE_MEMBERS,
  setRoleUsers,
  type RoleMembers,
} from '@/services/roles/roleUsersApi';
import { type Role } from '@/services/roles/types';
import { userKeys } from '@/services/users/queryKeys';

const NO_MEMBERS: RoleMembers = { users: [], count: 0 };

const SYSTEM_ROLE_NOTICE: UsersTabNotice = {
  title: 'Não muda por aqui',
  description:
    'Os usuários do Administrador mudam pelos cargos de cada usuário, na tela de usuários.',
};

const LARGE_ROLE_NOTICE: UsersTabNotice = {
  title: `Mais de ${MAX_ROLE_MEMBERS.toLocaleString('pt-BR')} usuários`,
  description:
    'A lista deste cargo não muda por aqui: altere os cargos de cada usuário, na tela de usuários.',
};

interface DetailPermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  /** Ver os usuários do cargo exige também `backoffice.users.read`. */
  canReadUsers: boolean;
  /** Trocar os usuários do cargo exige também `backoffice.users.update`. */
  canUpdateUsers: boolean;
}

function useDetailPermissions(): DetailPermissions {
  const user = useSessionStore((state) => state.user);
  return {
    canCreate: hasPermission(user, 'backoffice.roles.create'),
    canUpdate: hasPermission(user, 'backoffice.roles.update'),
    canDelete: hasPermission(user, 'backoffice.roles.delete'),
    canReadUsers: hasPermission(user, 'backoffice.users.read'),
    canUpdateUsers: hasPermission(user, 'backoffice.users.update'),
  };
}

// Abas na ordem da tela; "Usuários" só com a leitura de usuários.
function detailTabs({
  canReadUsers,
}: DetailPermissions): RoleDetailSkeletonTab[] {
  return [
    { value: 'overview', icon: <Shield />, label: 'Visão geral' },
    ...(canReadUsers
      ? [{ value: 'users', icon: <Users />, label: 'Usuários' }]
      : []),
  ];
}

// Id fora do formato (400) e cargo inexistente, excluído ou de outra empresa
// (404): o serviço deixa sem toast, e a tela diz que não achou.
function isNotFound(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 400 || status === 404;
}

export function RoleDetailsPage() {
  const { roleId = '' } = useParams({ strict: false });
  const permissions = useDetailPermissions();

  const roleQuery = useQuery({
    queryKey: roleKeys.detail(roleId),
    queryFn: () => fetchRoleDetail(roleId),
    enabled: !!roleId,
    staleTime: 30_000,
  });

  // Todos os usuários do cargo: o ponto de partida da aba "Usuários", que
  // grava o conjunto completo.
  const membersQuery = useQuery({
    queryKey: roleKeys.members(roleId),
    queryFn: () => fetchAllRoleUsers(roleId),
    enabled: !!roleId && permissions.canReadUsers,
    staleTime: 30_000,
  });

  const role = roleQuery.data;
  const members = permissions.canReadUsers ? membersQuery.data : NO_MEMBERS;

  if (
    roleQuery.isPending ||
    (permissions.canReadUsers && membersQuery.isPending)
  ) {
    return <RoleDetailSkeleton tabs={detailTabs(permissions)} />;
  }

  // Sem o cargo (a primeira leitura falhou) ou ele não existe mais (404 numa
  // releitura): a tela diz o que houve. A releitura que falha por outro
  // motivo mantém o formulário, com o que a pessoa editou.
  const notFound =
    (roleQuery.isError && isNotFound(roleQuery.error)) ||
    (membersQuery.isError && isNotFound(membersQuery.error));

  if (!role || !members || notFound) {
    return notFound ? (
      <Empty
        title="Cargo não encontrado"
        description="O identificador é inválido ou o cargo foi excluído."
        icon={<ShieldOff />}
      >
        <Button asChild variant="outline">
          <Link
            href="/roles"
            newTabIcon={false}
            className="text-foreground no-underline hover:text-foreground"
          >
            Voltar para a lista
          </Link>
        </Button>
      </Empty>
    ) : (
      <Empty
        title="Não foi possível carregar o cargo"
        description="Tente de novo em instantes."
        icon={<ShieldOff />}
      >
        <Button
          variant="outline"
          onClick={() => {
            void roleQuery.refetch();
            if (permissions.canReadUsers) void membersQuery.refetch();
          }}
        >
          Tentar novamente
        </Button>
      </Empty>
    );
  }

  return (
    <RoleDetails
      key={role.id}
      role={role}
      members={members}
      permissions={permissions}
    />
  );
}

function CopyRoleAction({ role }: { role: Role }) {
  const copy = useCopyRole();

  return (
    <Button
      variant="outline"
      type="button"
      aria-label="Copiar cargo"
      loading={copy.isPending}
      onClick={() => copy.mutate(role.id)}
    >
      <Copy />
      <span className="hidden sm:inline">Copiar</span>
    </Button>
  );
}

function DeleteRoleAction({ role }: { role: Role }) {
  const remove = useDeleteRole();
  const returnToList = useReturnToList('/roles');
  const copy = deleteRoleCopy(role.name);

  return (
    <ConfirmDialog
      title={copy.title}
      description={copy.description}
      confirmLabel="Excluir"
      destructive
      onConfirm={async () => {
        await remove.mutateAsync(role.id);
        returnToList();
      }}
      trigger={
        <Button variant="destructive" aria-label="Excluir cargo">
          <Trash2 />
          <span className="hidden sm:inline">Excluir</span>
        </Button>
      }
    />
  );
}

/**
 * Detalhe = Edição: o cargo (aba "Visão geral") e os usuários dele (aba
 * "Usuários") são um formulário só, com o "Salvar alterações" no topo. Salvar
 * grava o que mudou: o cargo em `PUT /client/roles/:roleId` (nome, descrição e
 * o conjunto de permissões) e, depois dele, os usuários em `PUT
 * /client/roles/:roleId/users` (o conjunto completo). Cada resposta traz o
 * próprio toast. O `Administrador` (`isSystem`) só aparece.
 */
function RoleDetails({
  role,
  members,
  permissions,
}: {
  role: Role;
  members: RoleMembers;
  permissions: DetailPermissions;
}) {
  const queryClient = useQueryClient();
  const sessionUserId = useSessionStore((state) => state.user?.id);
  const refreshSessionUser = useSessionStore((state) => state.refreshUser);
  const readOnly = role.isSystem || !permissions.canUpdate;
  // Acima do máximo que o servidor aceita no corpo, o conjunto completo não
  // cabe num `PUT`: a lista só aparece.
  const tooManyMembers = members.count > members.users.length;
  const membersReadOnly =
    readOnly || !permissions.canUpdateUsers || tooManyMembers;
  // Sem a lista inteira (sem ler usuários, ou acima do máximo), não dá para
  // saber se quem edita tem o cargo: conta como se tivesse.
  const sessionMayHoldRole =
    !permissions.canReadUsers ||
    tooManyMembers ||
    members.users.some((member) => member.id === sessionUserId);

  const reference = useMemo<RoleFormReference>(
    () => ({ role, userIds: members.users.map((user) => user.id) }),
    [role, members]
  );
  const savedPermissionIds = useMemo(
    () => new Set(role.permissions.map((permission) => permission.id)),
    [role]
  );

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    formState: { isDirty },
  } = useZodForm({
    schema: roleFormSchema,
    defaultValues: roleToFormValues(reference),
  });

  // O formulário fica acima das abas: trocar de aba não sai da edição, só
  // sair da tela pergunta.
  useUnsavedChangesGuard(!readOnly && isDirty);

  // Uma referência só, o cargo e os usuários do cache: é com eles que o
  // "Salvar" compara, é a eles que o "Descartar" volta e é contra eles que a
  // alteração pendente aparece. Quando o cache muda (a resposta de uma
  // gravação, uma releitura), o formulário passa a partir do novo, e o que a
  // pessoa alterou e ainda não foi gravado continua pendente.
  const startRef = useRef(reference);
  useEffect(() => {
    const start = startRef.current;
    startRef.current = reference;
    const pendingFields = pendingRoleFieldsOnRebase(
      getValues(),
      start,
      reference
    );
    if (!pendingFields) return;

    const pending = pendingFields.map((field) => ({
      field,
      value: getValues(field),
    }));
    reset(roleToFormValues(reference));
    for (const { field, value } of pending) {
      setValue(field, value, { shouldDirty: true });
    }
  }, [reference, getValues, reset, setValue]);

  // Cada gravação põe no cache o cargo que o servidor devolveu, e o
  // formulário passa a partir dele. O nome aparece nos usuários (lista e
  // detalhe) e nas opções de cargo: renomear relê os dois. Um cargo de quem
  // edita muda as permissões da própria sessão: ela é relida, e menu e botões
  // passam a segui-las sem recarregar.
  const roleMutation = useMutation({
    mutationFn: (body: SaveRoleBody) => updateRole(role.id, body),
    onSuccess: ({ role: saved }) => {
      storeSavedRole(queryClient, saved);
      if (saved.name !== role.name) {
        void queryClient.invalidateQueries({ queryKey: roleKeys.allOptions() });
        void queryClient.invalidateQueries({ queryKey: userKeys.all });
      }
      if (sessionMayHoldRole) void refreshSessionUser();
    },
    onError: (error) =>
      handleRoleFormError(error, {
        queryClient,
        markField: (field, message) =>
          setError(field, { type: 'server', message }),
      }),
  });

  // A recusa (a própria pessoa, o anti-escalonamento) é o toast do servidor;
  // a troca continua pendente. No sucesso, os usuários do cargo são relidos
  // antes de o botão sair do "salvando", e os cargos de cada usuário mudaram.
  const membersMutation = useMutation({
    mutationFn: (userIds: string[]) => setRoleUsers(role.id, userIds),
    onSuccess: async ({ role: saved }) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
      await queryClient.invalidateQueries({
        queryKey: roleKeys.members(role.id),
      });
      storeSavedRole(queryClient, saved);
    },
    onError: (error) => handleRoleMutationError(error, queryClient),
  });

  const onSubmit = handleSubmit((values) => {
    const roleBody = hasRoleChanges(reference, values)
      ? toSaveRoleBody(values)
      : undefined;
    const userIds =
      !membersReadOnly && hasMemberChanges(reference, values)
        ? values.userIds
        : undefined;
    const saveMembers = () => {
      if (userIds) membersMutation.mutate(userIds);
    };

    if (roleBody) {
      roleMutation.mutate(roleBody, { onSuccess: saveMembers });
    } else {
      saveMembers();
    }
  });

  const submitForm = (event?: FormEvent<HTMLFormElement>) =>
    void onSubmit(event);

  const isSaving = roleMutation.isPending || membersMutation.isPending;

  const tabContent = new Map<string, ReactNode>([
    [
      'overview',
      <OverviewTab
        role={role}
        control={control}
        readOnly={readOnly}
        savedPermissionIds={savedPermissionIds}
        onSubmit={submitForm}
      />,
    ],
    [
      'users',
      <UsersTab
        control={control}
        members={members.users}
        readOnly={membersReadOnly}
        notice={
          role.isSystem
            ? SYSTEM_ROLE_NOTICE
            : tooManyMembers
              ? LARGE_ROLE_NOTICE
              : undefined
        }
      />,
    ],
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
          !role.isSystem && (
            <>
              {permissions.canCreate && (
                <CopyRoleAction key="copy-action" role={role} />
              )}
              {permissions.canDelete && (
                <DeleteRoleAction key="delete-action" role={role} />
              )}
            </>
          )
        )}
      </PageActions>

      {role.isSystem && (
        <Alert
          variant="info"
          title="Cargo do sistema"
          description="O Administrador tem todas as permissões e não é editado, copiado nem excluído."
        />
      )}

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
