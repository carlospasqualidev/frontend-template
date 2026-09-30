import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { validateDataTableSearch } from '@/components/global/dataTable/dataTableSearch';
import { protectedLayoutRoute } from '@/routes';
import { UsersLayout } from '@/screens/users/usersLayout';

/**
 * Layout pai de tudo que vive sob `/users`. Só serve para que o breadcrumb
 * inclua "Usuários" como ancestral natural das telas filhas (lista, detalhe).
 */
export const usersLayoutRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/users',
  staticData: {
    breadcrumb: 'Usuários',
  },
  component: UsersLayout,
});

/**
 * Lista de usuários — casa em `/users`. Sem `breadcrumb` próprio: o pai
 * (`usersLayoutRoute`) já fornece "Usuários", evitando duplicação.
 */
export const usersListRoute = createRoute({
  getParentRoute: () => usersLayoutRoute,
  path: '/',
  validateSearch: validateDataTableSearch,
  component: lazyRouteComponent(() => import('./list'), 'UsersPage'),
});

/**
 * Criação — `/users/create`. Segmento estático: o roteador o prefere ao
 * `$userId` da rota de detalhe.
 */
export const userCreateRoute = createRoute({
  getParentRoute: () => usersLayoutRoute,
  path: 'create',
  staticData: {
    breadcrumb: 'Novo usuário',
  },
  component: lazyRouteComponent(() => import('./create'), 'UserCreatePage'),
});

interface UserDetailsSearch {
  tab?: string;
  /** Página (0-based) da linha do tempo da aba "Atividade". */
  activityPage?: number;
}

function validateUserDetailsSearch(
  search: Record<string, unknown>
): UserDetailsSearch {
  return {
    tab: typeof search.tab === 'string' ? search.tab : undefined,
    activityPage:
      Number.isInteger(search.activityPage) && Number(search.activityPage) > 0
        ? Number(search.activityPage)
        : undefined,
  };
}

export const userDetailsRoute = createRoute({
  getParentRoute: () => usersLayoutRoute,
  path: '$userId',
  staticData: {
    breadcrumb: 'Detalhes do usuário',
  },
  validateSearch: validateUserDetailsSearch,
  component: lazyRouteComponent(() => import('./details'), 'UserDetailsPage'),
});
