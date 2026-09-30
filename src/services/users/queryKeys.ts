import { type UserListParams } from '@/services/users/userListApi';

/**
 * Chaves de cache dos usuários. `lists()` é o prefixo de todas as páginas e
 * filtros da listagem (invalidar depois de criar ou excluir); `detail(id)`, o
 * usuário aberto.
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UserListParams) => [...userKeys.lists(), params] as const,
  options: (search: string) => [...userKeys.all, 'options', search] as const,
  detail: (userId: string) => [...userKeys.all, 'detail', userId] as const,
};
