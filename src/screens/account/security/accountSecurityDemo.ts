/*
 * DADOS DE DEMONSTRAÇÃO da aba "Segurança": o servidor não tem autenticação
 * em dois fatores nem registro das sessões (a sessão é um cookie JWT, sem
 * tabela). Os cards que usam estes dados mostram o aviso de demonstração; a
 * troca de senha, na mesma aba, é real. Fica assim até existirem as rotas.
 */

/** Se o exemplo abre com a autenticação em dois fatores ligada. */
export const DEMO_TWO_FACTOR_ENABLED = true;

export type AccountSessionDevice = 'laptop' | 'phone';

export interface AccountSession {
  id: string;
  device: string;
  icon: AccountSessionDevice;
  location: string;
  lastActive: string;
  current: boolean;
}

export const DEMO_ACCOUNT_SESSIONS: AccountSession[] = [
  {
    id: 'sess-current',
    device: 'MacBook Pro · Chrome',
    icon: 'laptop',
    location: 'São Paulo, BR',
    lastActive: 'agora',
    current: true,
  },
  {
    id: 'sess-mobile',
    device: 'iPhone 15 · Safari',
    icon: 'phone',
    location: 'São Paulo, BR',
    lastActive: 'há 2 h',
    current: false,
  },
  {
    id: 'sess-work',
    device: 'Windows 11 · Edge',
    icon: 'laptop',
    location: 'Rio de Janeiro, BR',
    lastActive: 'há 3 d',
    current: false,
  },
];
