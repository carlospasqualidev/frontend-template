import type { IUser } from '@/types/user/types';

/**
 * Gating de UI por permissão efetiva. As permissões chegam prontas do backend
 * em `user.permissions`, já achatadas no formato `modulo.entidade.acao` (ex.:
 * `backoffice.users.read`). O backend continua sendo a autoridade — isto só
 * esconde/mostra controles na interface.
 */
export function hasPermission(
  user: IUser | null | undefined,
  permission: string
): boolean {
  return user?.permissions.includes(permission) ?? false;
}
