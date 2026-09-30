/*
 * DADOS DE DEMONSTRAÇÃO da aba "Sessões": o servidor não tem sessões por
 * usuário (a sessão é um cookie JWT, sem tabela). Os dispositivos são fixos e
 * as datas saem do último acesso real. Fica assim até existir a rota.
 */

export interface UserSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  /** Último uso (ISO 8601). */
  lastActiveAt: string;
  /** Se é a sessão pela qual o usuário está logado agora. */
  current: boolean;
}

const SESSION_TEMPLATES: Omit<
  UserSession,
  'id' | 'lastActiveAt' | 'current'
>[] = [
  {
    device: 'MacBook Pro',
    browser: 'Chrome 132',
    location: 'São Paulo, BR',
    ip: '187.45.12.88',
  },
  {
    device: 'iPhone 15',
    browser: 'Safari Mobile',
    location: 'São Paulo, BR',
    ip: '187.45.12.88',
  },
  {
    device: 'Windows 11',
    browser: 'Edge 131',
    location: 'Rio de Janeiro, BR',
    ip: '201.18.94.31',
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

export function getDemoUserSessions(user: {
  id: string;
  lastLoginAt: string | null;
}): UserSession[] {
  if (!user.lastLoginAt) return [];

  const lastLogin = new Date(user.lastLoginAt).getTime();
  return SESSION_TEMPLATES.map((template, index) => ({
    id: `${user.id}_sess_${index}`,
    ...template,
    current: index === 0,
    lastActiveAt: new Date(lastLogin - index * 3 * DAY_MS).toISOString(),
  }));
}
