import { describe, expect, it } from 'vitest';

import { hasPermission } from '@/lib/permissions';
import type { IUser } from '@/types/user/types';

function user(permissions?: string[]): IUser {
  return {
    id: '1',
    name: 'Maria Silva',
    email: 'maria@example.com',
    image: null,
    ...(permissions ? { permissions } : {}),
  };
}

describe('hasPermission', () => {
  it('concede quando a permissão está na lista efetiva', () => {
    expect(
      hasPermission(user(['users.read', 'users.update']), 'users.read')
    ).toBe(true);
  });

  it('nega quando a permissão não está na lista', () => {
    expect(hasPermission(user(['users.read']), 'users.delete')).toBe(false);
  });

  // Um usuário sem `permissions` (backend que ainda não envia, ou sessão em
  // carregamento) NÃO pode virar "pode tudo" — o default é negar.
  it('nega quando o usuário não tem `permissions`', () => {
    expect(hasPermission(user(), 'users.read')).toBe(false);
  });

  it('nega para lista vazia', () => {
    expect(hasPermission(user([]), 'users.read')).toBe(false);
  });

  it('nega sem usuário (deslogado / sessão ainda não resolvida)', () => {
    expect(hasPermission(null, 'users.read')).toBe(false);
    expect(hasPermission(undefined, 'users.read')).toBe(false);
  });

  // Permissão é comparada por igualdade exata: `users.read` não abre
  // `users.readAll`, e um prefixo não concede o filho.
  it('compara por igualdade exata (sem prefixo/curinga)', () => {
    expect(hasPermission(user(['users.readAll']), 'users.read')).toBe(false);
    expect(hasPermission(user(['users']), 'users.read')).toBe(false);
    expect(hasPermission(user(['USERS.READ']), 'users.read')).toBe(false);
  });
});
