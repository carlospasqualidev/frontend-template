import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { protectedLayoutRoute } from '@/routes';

interface AccountSearch {
  tab?: string;
}

function validateAccountSearch(search: Record<string, unknown>): AccountSearch {
  return {
    tab: typeof search.tab === 'string' ? search.tab : undefined,
  };
}

export const accountRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/account',
  staticData: {
    breadcrumb: 'Conta',
  },
  validateSearch: validateAccountSearch,
  component: lazyRouteComponent(() => import('.'), 'AccountPage'),
});
