import { describe, expect, it } from 'vitest';

import { hasPermission } from '@/lib/permissions';
import type { IUser } from '@/types/user/types';

function user(permissions: string[]): IUser {
  return {
    id: '1',
    name: 'Maria Silva',
    email: 'maria@example.com',
    image: null,
    permissions,
    idleTimeoutMinutes: 20,
  };
}

// Nomes no formato do backend: `modulo.entidade.acao`.
describe('hasPermission', () => {
  it('concede quando a permissão está na lista efetiva', () => {
    expect(
      hasPermission(
        user(['backoffice.users.read', 'backoffice.users.update']),
        'backoffice.users.read'
      )
    ).toBe(true);
  });

  it('nega quando a permissão não está na lista', () => {
    expect(
      hasPermission(user(['backoffice.users.read']), 'backoffice.users.delete')
    ).toBe(false);
  });

  // Usuário sem cargo chega com lista vazia: não vira "pode tudo".
  it('nega para lista vazia', () => {
    expect(hasPermission(user([]), 'backoffice.users.read')).toBe(false);
  });

  it('nega sem usuário (deslogado / sessão ainda não resolvida)', () => {
    expect(hasPermission(null, 'backoffice.users.read')).toBe(false);
    expect(hasPermission(undefined, 'backoffice.users.read')).toBe(false);
  });

  // Permissão é comparada por igualdade exata: sem prefixo, curinga nem
  // equivalência com o formato antigo (`users.read`, `users:read`).
  it('compara por igualdade exata (sem prefixo/curinga)', () => {
    expect(
      hasPermission(user(['backoffice.users.readAll']), 'backoffice.users.read')
    ).toBe(false);
    expect(
      hasPermission(user(['backoffice.users']), 'backoffice.users.read')
    ).toBe(false);
    expect(
      hasPermission(user(['BACKOFFICE.USERS.READ']), 'backoffice.users.read')
    ).toBe(false);
    expect(hasPermission(user(['users.read']), 'backoffice.users.read')).toBe(
      false
    );
    expect(hasPermission(user(['users:read']), 'backoffice.users.read')).toBe(
      false
    );
  });
});
