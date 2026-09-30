import { type PermissionCatalog } from '@/services/roles/roleDetailApi';
import { type RoleMember } from '@/services/roles/roleUsersApi';
import { type Role, type RoleListItem } from '@/services/roles/types';

/** Cargo com as permissões, no formato do servidor, com dados fictícios. */
export function makeRole(overrides: Partial<Role> = {}): Role {
  return {
    id: '01a0ee28-61ed-7028-957f-9a3ab51f18f0',
    name: 'Suporte',
    description: 'Atendimento aos clientes.',
    isSystem: false,
    usersCount: 0,
    permissions: [],
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-15T09:10:00.000Z',
    ...overrides,
  };
}

/** Cargo na listagem, no formato do servidor, com dados fictícios. */
export function makeRoleListItem(
  overrides: Partial<RoleListItem> = {}
): RoleListItem {
  return {
    id: '01a0ee28-61ed-7028-957f-9a3ab51f18f0',
    name: 'Suporte',
    description: 'Atendimento aos clientes.',
    isSystem: false,
    usersCount: 0,
    permissionsCount: 2,
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-15T09:10:00.000Z',
    ...overrides,
  };
}

/** Usuário de um cargo (`GET /client/roles/:roleId/users`), fictício. */
export function makeRoleMember(
  overrides: Partial<RoleMember> = {}
): RoleMember {
  return {
    id: '01a0f253-fc4e-745c-b069-dff39ba3116e',
    name: 'Camila Oliveira',
    email: 'camila.oliveira@example.com',
    image: null,
    isActive: true,
    ...overrides,
  };
}

/**
 * Catálogo pequeno no formato do servidor: "Usuários" (ler, criar, editar),
 * "Auditoria" (só ler) e "Configurações" (ler, editar), num módulo só.
 */
export const PERMISSION_CATALOG: PermissionCatalog = {
  modules: [
    {
      module: 'backoffice',
      moduleLabel: 'Backoffice',
      groups: [
        {
          groupLabel: 'Usuários',
          permissions: [
            {
              id: 'p-users-read',
              name: 'backoffice.users.read',
              action: 'read',
              label: 'Visualizar usuários',
            },
            {
              id: 'p-users-create',
              name: 'backoffice.users.create',
              action: 'create',
              label: 'Criar usuário',
            },
            {
              id: 'p-users-update',
              name: 'backoffice.users.update',
              action: 'update',
              label: 'Editar usuário',
            },
          ],
        },
        {
          groupLabel: 'Auditoria',
          permissions: [
            {
              id: 'p-audit-read',
              name: 'backoffice.audit.read',
              action: 'read',
              label: 'Visualizar trilha de auditoria',
            },
          ],
        },
        {
          groupLabel: 'Configurações',
          permissions: [
            {
              id: 'p-configs-read',
              name: 'backoffice.systemConfigs.read',
              action: 'read',
              label: 'Visualizar configurações',
            },
            {
              id: 'p-configs-update',
              name: 'backoffice.systemConfigs.update',
              action: 'update',
              label: 'Editar configurações',
            },
          ],
        },
      ],
    },
  ],
};
