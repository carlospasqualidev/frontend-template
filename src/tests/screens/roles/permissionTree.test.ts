import { describe, expect, it } from 'vitest';

import {
  canGrantPermission,
  countModulePermissions,
  isLockedRead,
  normalizeIds,
  togglePermission,
} from '@/screens/roles/utils/permissionTree';
import { PERMISSION_CATALOG } from '@/tests/factories/role';

const [MODULE] = PERMISSION_CATALOG.modules;
if (!MODULE) throw new Error('Catálogo sem módulo.');
const [USERS, AUDIT, CONFIGS] = MODULE.groups;
if (!USERS || !AUDIT || !CONFIGS) throw new Error('Catálogo incompleto.');

function permissionOf(group: typeof USERS, id: string) {
  const permission = group.permissions.find((item) => item.id === id);
  if (!permission) throw new Error(`Sem a permissão ${id}.`);
  return permission;
}

const USERS_READ = permissionOf(USERS, 'p-users-read');
const USERS_UPDATE = permissionOf(USERS, 'p-users-update');
const AUDIT_READ = permissionOf(AUDIT, 'p-audit-read');

describe('togglePermission', () => {
  // A expansão do servidor: escrita inclui o `read` do mesmo grupo.
  it('marcar uma escrita marca também o read do grupo', () => {
    expect(togglePermission([], USERS, USERS_UPDATE, true)).toEqual([
      'p-users-read',
      'p-users-update',
    ]);
  });

  it('marcar o read não marca mais nada', () => {
    expect(togglePermission([], USERS, USERS_READ, true)).toEqual([
      'p-users-read',
    ]);
  });

  it('desmarcar uma escrita mantém o read', () => {
    expect(
      togglePermission(
        ['p-users-read', 'p-users-update'],
        USERS,
        USERS_UPDATE,
        false
      )
    ).toEqual(['p-users-read']);
  });

  it('não mexe nos outros grupos', () => {
    expect(
      togglePermission(['p-audit-read'], USERS, USERS_UPDATE, true)
    ).toEqual(['p-audit-read', 'p-users-read', 'p-users-update']);
  });
});

describe('isLockedRead', () => {
  it('trava o read enquanto houver uma escrita do grupo marcada', () => {
    expect(
      isLockedRead(
        USERS_READ,
        USERS,
        new Set(['p-users-read', 'p-users-update'])
      )
    ).toBe(true);
    expect(isLockedRead(USERS_READ, USERS, new Set(['p-users-read']))).toBe(
      false
    );
  });

  it('nunca trava uma escrita, nem o read de grupo só de leitura', () => {
    expect(isLockedRead(USERS_UPDATE, USERS, new Set(['p-users-update']))).toBe(
      false
    );
    expect(isLockedRead(AUDIT_READ, AUDIT, new Set(['p-audit-read']))).toBe(
      false
    );
  });
});

describe('canGrantPermission', () => {
  it('quem edita concede as permissões que tem', () => {
    expect(
      canGrantPermission(
        AUDIT_READ,
        new Set(['backoffice.audit.read']),
        new Set()
      )
    ).toBe(true);
  });

  it('não concede as que não tem', () => {
    expect(
      canGrantPermission(
        AUDIT_READ,
        new Set(['backoffice.users.read']),
        new Set()
      )
    ).toBe(false);
  });

  // Manter ou retirar do cargo o que ele já tem é permitido pelo servidor.
  it('a que o cargo gravado já tem continua liberada', () => {
    expect(
      canGrantPermission(AUDIT_READ, new Set(), new Set(['p-audit-read']))
    ).toBe(true);
  });
});

describe('normalizeIds e countModulePermissions', () => {
  it('ordena e tira os repetidos', () => {
    expect(normalizeIds(['b', 'a', 'b'])).toEqual(['a', 'b']);
  });

  it('conta as marcadas do módulo', () => {
    expect(
      countModulePermissions(MODULE, new Set(['p-users-read', 'p-audit-read']))
    ).toEqual({ checked: 2, total: 6 });
  });
});
