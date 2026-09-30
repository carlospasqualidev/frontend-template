import { Outlet } from '@tanstack/react-router';

/**
 * Layout vazio que existe apenas para aninhar as rotas filhas (`/roles`,
 * `/roles/create`, `/roles/$roleId`) sob um pai comum. Isso permite que o
 * breadcrumb global monte a cadeia "Cargos › Detalhes do cargo" via
 * `useMatches()`.
 */
export function RolesLayout() {
  return <Outlet />;
}
