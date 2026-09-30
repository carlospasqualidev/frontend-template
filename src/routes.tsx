import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';

import { NotFound } from './components/global/layout/notFound';

import { RouteErrorBoundary } from '@/components/global/errorFallback/routeErrorBoundary';
import { RouteErrorFallback } from '@/components/global/errorFallback/routeErrorFallback';
import { Layout } from '@/components/global/layout/layout';
import { SessionValidation } from '@/components/global/layout/sessionValidation';
import { accountRoute } from '@/screens/account/routes';
import { auditLogsRoute } from '@/screens/audit-logs/routes';
import { homeRoute } from '@/screens/home/routes';
import {
  roleCreateRoute,
  roleDetailsRoute,
  rolesLayoutRoute,
  rolesListRoute,
} from '@/screens/roles/routes';
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

// Erro de render ou de carregamento: nas telas do layout protegido, o
// `RouteErrorBoundary` em volta do `Outlet` troca só o conteúdo (o menu fica);
// nas rotas públicas (login, cadastro) e no próprio layout, o `errorComponent`
// da raiz mostra a tela cheia. O `ErrorBoundary` do `App.tsx` fica para o que
// acontece fora do roteador.
export const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFound,
  errorComponent: RouteErrorFallback,
});

export const protectedLayoutRoute = createRoute({
  id: 'protected-layout',
  getParentRoute: () => rootRoute,
  component: () => (
    <SessionValidation>
      <Layout>
        <RouteErrorBoundary>
          <Outlet />
        </RouteErrorBoundary>
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
      rolesLayoutRoute.addChildren([
        rolesListRoute,
        roleCreateRoute,
        roleDetailsRoute,
      ]),
      usersLayoutRoute.addChildren([
        usersListRoute,
        userCreateRoute,
        userDetailsRoute,
      ]),
    ]),
  ]),
});
