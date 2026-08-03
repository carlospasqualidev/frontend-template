import type { IUser } from '@/types/user/types';

/**
 * Gating de UI por permissão efetiva. As permissões chegam achatadas em
 * `user.permissions` (achate-as no mapper da sessão ao integrar o backend). O
 * backend continua sendo a autoridade — isto só esconde/mostra controles na
 * interface.
 */
export function hasPermission(
  user: IUser | null | undefined,
  permission: string
): boolean {
  return user?.permissions?.includes(permission) ?? false;
}
