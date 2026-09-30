import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { validateDataTableSearch } from '@/components/global/dataTable/dataTableSearch';
import { protectedLayoutRoute } from '@/routes';
import { RolesLayout } from '@/screens/roles/rolesLayout';

/**
 * Layout pai de tudo que vive sob `/roles`. Só serve para que o breadcrumb
 * inclua "Cargos" como ancestral natural das telas filhas (lista, detalhe).
 */
export const rolesLayoutRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/roles',
  staticData: {
    breadcrumb: 'Cargos',
  },
  component: RolesLayout,
});

/**
 * Lista de cargos — casa em `/roles`. Sem `breadcrumb` próprio: o pai
 * (`rolesLayoutRoute`) já fornece "Cargos".
 */
export const rolesListRoute = createRoute({
  getParentRoute: () => rolesLayoutRoute,
  path: '/',
  validateSearch: validateDataTableSearch,
  component: lazyRouteComponent(() => import('./list'), 'RolesPage'),
});

/**
 * Criação — `/roles/create`. Segmento estático: o roteador o prefere ao
 * `$roleId` da rota de detalhe.
 */
export const roleCreateRoute = createRoute({
  getParentRoute: () => rolesLayoutRoute,
  path: 'create',
  staticData: {
    breadcrumb: 'Novo cargo',
  },
  component: lazyRouteComponent(() => import('./create'), 'RoleCreatePage'),
});

interface RoleDetailsSearch {
  tab?: string;
}

function validateRoleDetailsSearch(
  search: Record<string, unknown>
): RoleDetailsSearch {
  return { tab: typeof search.tab === 'string' ? search.tab : undefined };
}

export const roleDetailsRoute = createRoute({
  getParentRoute: () => rolesLayoutRoute,
  path: '$roleId',
  staticData: {
    breadcrumb: 'Detalhes do cargo',
  },
  validateSearch: validateRoleDetailsSearch,
  component: lazyRouteComponent(() => import('./details'), 'RoleDetailsPage'),
});
