import { isAxiosError } from 'axios';
import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { catchHandler, sendErrorMessage } from '@/services/api/errorHandlers';
import { roleKeys } from '@/services/roles/queryKeys';
import {
  copyRole,
  deleteRole,
  findRoleFormIssues,
  type RoleFormField,
} from '@/services/roles/roleFormApi';
import { type RoleListResponse } from '@/services/roles/roleListApi';
import { type RoleMembers } from '@/services/roles/roleUsersApi';
import { type Role } from '@/services/roles/types';

export const UNEXPECTED_ROLE_ERROR_MESSAGE =
  'Não foi possível concluir agora. Tente novamente em instantes.';

const NO_MEMBERS: RoleMembers = { users: [], count: 0 };

/**
 * Põe no cache o cargo devolvido por uma mutação: o detalhe (que a aba
 * "Cargos" do usuário também lê) e a linha dele nas páginas da listagem já
 * carregadas, sem rebuscar a lista inteira.
 */
export function storeSavedRole(queryClient: QueryClient, role: Role): void {
  queryClient.setQueryData<Role>(roleKeys.detail(role.id), role);
  queryClient.setQueriesData<RoleListResponse>(
    { queryKey: roleKeys.lists() },
    (previous) =>
      previous && {
        ...previous,
        roles: previous.roles.map((item) =>
          item.id === role.id
            ? {
                ...item,
                name: role.name,
                description: role.description,
                usersCount: role.usersCount,
                permissionsCount: role.permissions.length,
                updatedAt: role.updatedAt,
              }
            : item
        ),
      }
  );
}

/**
 * Um cargo novo (criado ou copiado): o detalhe já vem da resposta, sem
 * usuários, e a listagem e as opções de cargo (os campos da tela de usuários)
 * são relidas.
 */
export function storeNewRole(queryClient: QueryClient, role: Role): void {
  queryClient.setQueryData<Role>(roleKeys.detail(role.id), role);
  queryClient.setQueryData<RoleMembers>(roleKeys.members(role.id), NO_MEMBERS);
  invalidateRoleChoices(queryClient);
}

/** Relê a listagem e as opções de cargo (o nome ou o conjunto mudou). */
export function invalidateRoleChoices(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
  void queryClient.invalidateQueries({ queryKey: roleKeys.allOptions() });
}

/**
 * Falha de uma mutação de cargo. Erro HTTP já teve o toast do interceptor (ou
 * a resposta própria de quem chamou) e não ganha outro. Qualquer outra falha é
 * inesperada: a resposta 200 fora do contrato recusada pelo `.parse` (o
 * servidor pode ter gravado, e o toast de sucesso já saiu) ou um bug.
 * Mensagem genérica, reporte, e o cache dos cargos é relido para a tela
 * mostrar o que o servidor tem.
 */
export function handleRoleMutationError(
  error: unknown,
  queryClient: QueryClient
): void {
  if (isAxiosError(error)) return;

  console.error('Falha inesperada numa ação de cargo.', error);
  void sendErrorMessage({ error });
  toast.error(UNEXPECTED_ROLE_ERROR_MESSAGE, { id: 'errorToastId' });
  void queryClient.invalidateQueries({ queryKey: roleKeys.all });
}

/**
 * Falha da gravação do formulário (criação ou edição). O 400 volta sem toast
 * (`silentError` no serviço): os `issues` que apontam um campo marcam o
 * campo; sem campo a marcar, o `message` do servidor vira o toast. As demais
 * recusas (409, 403, 404) já tiveram o toast do interceptor.
 */
export function handleRoleFormError(
  error: unknown,
  {
    queryClient,
    markField,
  }: {
    queryClient: QueryClient;
    markField: (field: RoleFormField, message: string) => void;
  }
): void {
  if (!isAxiosError(error)) {
    handleRoleMutationError(error, queryClient);
    return;
  }

  if (error.response?.status !== 400) return;

  const issues = findRoleFormIssues(error);
  if (issues.length === 0) {
    catchHandler({ response: error.response });
    return;
  }

  issues.forEach(({ field, message }) => markField(field, message));
}

/**
 * Copia o cargo (`POST /client/roles/:roleId/copy`) e abre a cópia, para a
 * pessoa renomeá-la. O toast de sucesso e o da recusa (o `Administrador`, o
 * anti-escalonamento, sem nome livre) são o `message` do servidor.
 */
export function useCopyRole() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (roleId: string) => copyRole(roleId),
    onSuccess: ({ role }) => {
      storeNewRole(queryClient, role);
      void navigate({ to: '/roles/$roleId', params: { roleId: role.id } });
    },
    onError: (error) => handleRoleMutationError(error, queryClient),
  });
}

/**
 * Exclui; a listagem e as opções de cargo são relidas. O detalhe fica velho
 * sem ser rebuscado agora (a tela dele, quando é ela que exclui, está
 * saindo): quem voltar a ele relê e recebe o 404.
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => deleteRole(roleId),
    onSuccess: (_, roleId) => {
      void queryClient.invalidateQueries({
        queryKey: roleKeys.detail(roleId),
        refetchType: 'none',
      });
      invalidateRoleChoices(queryClient);
    },
    onError: (error) => handleRoleMutationError(error, queryClient),
  });
}

/** Texto da confirmação de exclusão (lista e detalhe). */
export function deleteRoleCopy(roleName: string): {
  title: string;
  description: string;
} {
  return {
    title: 'Excluir cargo?',
    description: `O cargo "${roleName}" sai da lista. Esta ação não pode ser desfeita.`,
  };
}
