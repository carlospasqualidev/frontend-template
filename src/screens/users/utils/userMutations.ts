import { isAxiosError } from 'axios';
import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import { catchHandler, sendErrorMessage } from '@/services/api/errorHandlers';
import { roleKeys } from '@/services/roles/queryKeys';
import { userKeys } from '@/services/users/queryKeys';
import { type CompanyUser } from '@/services/users/types';
import { type UserDetailResponse } from '@/services/users/userDetailApi';
import {
  deleteUser,
  findUserFormIssues,
  setUserActive,
  type UserFormField,
} from '@/services/users/userFormApi';
import { type UserListResponse } from '@/services/users/userListApi';

export const UNEXPECTED_USER_ERROR_MESSAGE =
  'Não foi possível concluir agora. Tente novamente em instantes.';

/**
 * Põe no cache o usuário devolvido por uma mutação: o detalhe e a linha dele
 * nas páginas da listagem já carregadas, sem rebuscar a lista inteira.
 */
export function storeSavedUser(
  queryClient: QueryClient,
  user: CompanyUser
): void {
  queryClient.setQueryData<UserDetailResponse>(userKeys.detail(user.id), {
    user,
  });
  queryClient.setQueriesData<UserListResponse>(
    { queryKey: userKeys.lists() },
    (previous) =>
      previous && {
        ...previous,
        users: previous.users.map((item) =>
          item.id === user.id ? user : item
        ),
      }
  );
}

/**
 * Os cargos de alguém mudaram (a troca de cargos, a exclusão da pessoa): o
 * cache dos cargos é relido, os usuários de cada um, as contagens da listagem
 * e o detalhe. Sem isso, a aba "Usuários" de um cargo partiria da lista velha,
 * e o `PUT` do conjunto completo desfaria o que mudou aqui.
 */
export function invalidateRoleMemberships(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: roleKeys.all });
}

/**
 * O cadastro ou o status de alguém mudou (editar, bloquear, desbloquear): os
 * usuários de cada cargo são relidos, porque a aba "Usuários" do cargo mostra
 * o nome, o e-mail, a foto e o status de cada um. Os cargos, as contagens e as
 * permissões não mudam e ficam como estão.
 */
export function invalidateRoleMembers(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: roleKeys.allMembers() });
}

/**
 * Falha de uma mutação de usuário. Erro HTTP já teve o toast do interceptor (ou
 * a resposta própria de quem chamou) e não ganha outro. Qualquer outra falha é
 * inesperada: a resposta 200 fora do contrato recusada pelo `.parse` (o
 * servidor pode ter gravado, e o toast de sucesso já saiu) ou um bug. Mensagem
 * genérica, reporte, e o cache dos usuários é relido para a tela mostrar o que
 * o servidor tem (o detalhe aberto passa a partir do usuário relido).
 */
export function handleUserMutationError(
  error: unknown,
  queryClient: QueryClient
): void {
  if (isAxiosError(error)) return;

  console.error('Falha inesperada numa ação de usuário.', error);
  void sendErrorMessage({ error });
  toast.error(UNEXPECTED_USER_ERROR_MESSAGE, { id: 'errorToastId' });
  void queryClient.invalidateQueries({ queryKey: userKeys.all });
}

/**
 * Falha da gravação do formulário (criação ou edição). O 400 volta sem toast
 * (`silentError` no serviço): os `issues` que apontam um campo do formulário
 * marcam o campo; sem campo a marcar, o `message` do servidor vira o toast.
 */
export function handleUserFormError(
  error: unknown,
  {
    queryClient,
    markField,
    fields,
  }: {
    queryClient: QueryClient;
    markField: (field: UserFormField, message: string) => void;
    /** Campos que o formulário mostra (a edição não tem e-mail nem senha). */
    fields: readonly UserFormField[];
  }
): void {
  if (!isAxiosError(error)) {
    handleUserMutationError(error, queryClient);
    return;
  }

  if (error.response?.status !== 400) return;

  const issues = findUserFormIssues(error).filter((issue) =>
    fields.includes(issue.field)
  );
  if (issues.length === 0) {
    catchHandler({ response: error.response });
    return;
  }

  issues.forEach(({ field, message }) => markField(field, message));
}

/**
 * Bloqueia ou desbloqueia; o toast de sucesso é o `message` do servidor. O
 * status aparece também nos usuários de cada cargo, que são relidos.
 */
export function useSetUserActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      setUserActive(userId, isActive),
    onSuccess: ({ user }) => {
      storeSavedUser(queryClient, user);
      invalidateRoleMembers(queryClient);
    },
    onError: (error) => handleUserMutationError(error, queryClient),
  });
}

/**
 * Exclui; a listagem é relida (a contagem muda), e os cargos da pessoa perdem
 * um usuário. O detalhe fica velho sem ser rebuscado agora (a tela dele,
 * quando é ela que exclui, está saindo): quem voltar a ele relê e recebe o 404.
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: (_, userId) => {
      void queryClient.invalidateQueries({
        queryKey: userKeys.detail(userId),
        refetchType: 'none',
      });
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      invalidateRoleMemberships(queryClient);
    },
    onError: (error) => handleUserMutationError(error, queryClient),
  });
}
