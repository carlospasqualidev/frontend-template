export type UserRole = 'admin' | 'manager' | 'member' | 'viewer';

export type UserStatus = 'active' | 'inactive' | 'pending' | 'blocked';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
  status: UserStatus;
  /** Data (`aaaa-mm-dd`) em que o convite/registro foi aceito. */
  createdAt: string;
  /** Último login (`aaaa-mm-dd`). `null` quando o usuário ainda não acessou. */
  lastLoginAt: string | null;
}

export const userRoleLabels = new Map<UserRole, string>([
  ['admin', 'Administrador'],
  ['manager', 'Gestor'],
  ['member', 'Membro'],
  ['viewer', 'Visualizador'],
]);

export const userStatusLabels = new Map<UserStatus, string>([
  ['active', 'Ativo'],
  ['inactive', 'Inativo'],
  ['pending', 'Pendente'],
  ['blocked', 'Bloqueado'],
]);

export const USER_ROLE_OPTIONS = Array.from(
  userRoleLabels,
  ([value, label]) => ({ value, label })
);

export const USER_STATUS_OPTIONS = Array.from(
  userStatusLabels,
  ([value, label]) => ({ value, label })
);

export interface UserPermission {
  id: string;
  label: string;
  description: string;
  granted: boolean;
}

export interface UserSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  /** Data ISO do último uso (`aaaa-mm-dd`). */
  lastActiveAt: string;
  /** Se é a sessão pela qual o usuário está logado agora. */
  current: boolean;
}
