import { describe, expect, it } from 'vitest';

import {
  hasMemberChanges,
  hasRoleChanges,
  pendingRoleFieldsOnRebase,
  roleFormSchema,
  roleToFormValues,
  toSaveRoleBody,
  type RoleFormReference,
} from '@/screens/roles/utils/roleForm';
import { makeRole } from '@/tests/factories/role';

const START: RoleFormReference = {
  role: makeRole({
    name: 'Suporte',
    description: null,
    permissions: [
      { id: 'p-users-update', name: 'backoffice.users.update' },
      { id: 'p-users-read', name: 'backoffice.users.read' },
    ],
  }),
  userIds: ['u-2', 'u-1'],
};

describe('roleFormSchema', () => {
  it('recusa o que o servidor recusaria, com as mesmas mensagens', () => {
    const result = roleFormSchema.safeParse({
      name: ' S ',
      description: 'x'.repeat(501),
      permissionIds: [],
      userIds: [],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'O nome precisa ter pelo menos 2 caracteres.',
      'A descrição deve ter no máximo 500 caracteres.',
      'Selecione ao menos uma permissão para o cargo.',
    ]);
  });
});

describe('roleToFormValues e toSaveRoleBody', () => {
  it('os ids do cargo numa ordem só, a descrição nula como vazia', () => {
    expect(roleToFormValues(START)).toEqual({
      name: 'Suporte',
      description: '',
      permissionIds: ['p-users-read', 'p-users-update'],
      userIds: ['u-1', 'u-2'],
    });
  });

  it('a descrição vazia vai como `null`; os usuários não vão no cargo', () => {
    expect(
      toSaveRoleBody({
        name: 'Suporte',
        description: '',
        permissionIds: ['p-users-read'],
        userIds: ['u-1'],
      })
    ).toEqual({
      name: 'Suporte',
      description: null,
      permissionIds: ['p-users-read'],
    });
  });
});

describe('hasRoleChanges e hasMemberChanges', () => {
  it('sem mudança, nada a gravar (espaços nas pontas não contam)', () => {
    const values = { ...roleToFormValues(START), name: ' Suporte ' };
    expect(hasRoleChanges(START, values)).toBe(false);
    expect(hasMemberChanges(START, values)).toBe(false);
  });

  it('as permissões e os usuários se comparam como conjunto', () => {
    const values = {
      ...roleToFormValues(START),
      permissionIds: ['p-users-read'],
      userIds: ['u-1', 'u-3'],
    };
    expect(hasRoleChanges(START, values)).toBe(true);
    expect(hasMemberChanges(START, values)).toBe(true);
  });
});

describe('pendingRoleFieldsOnRebase', () => {
  it('sem mudança nos campos do formulário, nada é refeito', () => {
    const next = {
      ...START,
      role: { ...START.role, usersCount: 5, updatedAt: '2026-09-30T10:00:00Z' },
    };
    expect(
      pendingRoleFieldsOnRebase(roleToFormValues(START), START, next)
    ).toBeUndefined();
  });

  // O que a pessoa alterou e o servidor não tem continua pendente; o que ela
  // não mexeu segue o servidor.
  it('mantém pendente só o que a pessoa alterou e o novo não tem', () => {
    const values = {
      ...roleToFormValues(START),
      description: 'Atende os clientes',
      userIds: ['u-1', 'u-2', 'u-3'],
    };
    const next: RoleFormReference = {
      role: { ...START.role, name: 'Suporte N1' },
      userIds: ['u-1', 'u-2'],
    };

    expect(pendingRoleFieldsOnRebase(values, START, next)).toEqual([
      'description',
      'userIds',
    ]);
  });

  it('o que o servidor gravou igual ao digitado não fica pendente', () => {
    const values = { ...roleToFormValues(START), name: 'Suporte N1' };
    const next: RoleFormReference = {
      role: { ...START.role, name: 'Suporte N1' },
      userIds: START.userIds,
    };

    expect(pendingRoleFieldsOnRebase(values, START, next)).toEqual([]);
  });
});
