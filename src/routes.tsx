import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';

import { NotFound } from './components/global/layout/notFound';

import { Layout } from '@/components/global/layout/layout';
import { SessionValidation } from '@/components/global/layout/sessionValidation';
import { accountRoute } from '@/screens/account/routes';
import { auditLogsRoute } from '@/screens/audit-logs/routes';
import { homeRoute } from '@/screens/home/routes';
import { loginRoute, signupRoute } from '@/screens/session/routes';
import { settingsRoute } from '@/screens/settings/routes';
import {
  userCreateRoute,
  userDetailsRoute,
  usersLayoutRoute,
  usersListRoute,
} from '@/screens/users/routes';

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    breadcrumb?: string;
  }

  interface Register {
    router: typeof router;
  }
}

export const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFound,
});

export const protectedLayoutRoute = createRoute({
  id: 'protected-layout',
  getParentRoute: () => rootRoute,
  component: () => (
    <SessionValidation>
      <Layout>
        <Outlet />
      </Layout>
    </SessionValidation>
  ),
});

export const router = createRouter({
  notFoundMode: 'root',
  // Pré-carrega o chunk da rota ao passar o mouse/tocar no link,
  // eliminando o atraso percebido do lazy loading sem perder o code-splitting.
  defaultPreload: 'intent',
  routeTree: rootRoute.addChildren([
    loginRoute,
    signupRoute,
    protectedLayoutRoute.addChildren([
      homeRoute,
      accountRoute,
      auditLogsRoute,
      settingsRoute,
      usersLayoutRoute.addChildren([
        usersListRoute,
        userCreateRoute,
        userDetailsRoute,
      ]),
    ]),
  ]),
});
