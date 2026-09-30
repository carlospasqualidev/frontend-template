import { type RoleListParams } from '@/services/roles/roleListApi';

/**
 * Chaves de cache dos cargos, da tela de cargos e da de usuários. `lists()` é
 * o prefixo de todas as páginas e buscas da listagem; `options(search)`, as
 * opções de cargo dos campos de escolha (a tela de usuários); `detail(id)`, o
 * cargo com as permissões (o detalhe e as permissões de cada cargo na aba
 * "Cargos" do usuário); `members(id)`, todos os usuários do cargo.
 */
export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (params: RoleListParams) => [...roleKeys.lists(), params] as const,
  allOptions: () => [...roleKeys.all, 'options'] as const,
  options: (search: string) => [...roleKeys.allOptions(), search] as const,
  detail: (roleId: string) => [...roleKeys.all, 'detail', roleId] as const,
  members: (roleId: string) => [...roleKeys.all, 'members', roleId] as const,
  permissionCatalog: ['roles', 'permission-catalog'] as const,
};
