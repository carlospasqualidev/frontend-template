/*
 * DADOS DE DEMONSTRAÇÃO da home: métricas que o servidor não tem (não há
 * registro de sessões, convites nem agregação de logins por dia) e as
 * pendências (conceito que o servidor não tem). Cada bloco que usa estes dados
 * mostra o aviso de demonstração. Os números reais (usuários e novos no mês) e
 * a atividade recente vêm do servidor, por `services/home/homeApi.ts`.
 */

export type DemoStatId = 'activeSessions' | 'pendingInvites';

export interface DemoStat {
  id: DemoStatId;
  label: string;
  value: string;
  /** Variação relativa ao período anterior, ex.: `-4,2%`. */
  delta: string;
  /** Sentido do delta: escolhe o ícone de seta e a cor. */
  trend: 'up' | 'down' | 'neutral';
  /**
   * Quando `true`, uma alta é negativa (ex.: convites pendentes acumulados).
   * Inverte só a cor; o sinal continua o mesmo.
   */
  invertSentiment?: boolean;
  hint: string;
}

export const DEMO_STATS: DemoStat[] = [
  {
    id: 'activeSessions',
    label: 'Sessões ativas',
    value: '312',
    delta: '-4,2%',
    trend: 'down',
    hint: 'últimas 24h',
  },
  {
    id: 'pendingInvites',
    label: 'Convites pendentes',
    value: '17',
    delta: '+5',
    trend: 'up',
    invertSentiment: true,
    hint: 'aguardando aceite',
  },
];

export interface DailyActivityPoint {
  /** Rótulo curto (`Seg`, `Ter`, ...). */
  label: string;
  value: number;
}

export const DEMO_WEEKLY_ACTIVITY: DailyActivityPoint[] = [
  { label: 'Seg', value: 24 },
  { label: 'Ter', value: 32 },
  { label: 'Qua', value: 41 },
  { label: 'Qui', value: 28 },
  { label: 'Sex', value: 47 },
  { label: 'Sáb', value: 14 },
  { label: 'Dom', value: 9 },
];

export type PendingTaskKind = 'invite' | 'review' | 'billing' | 'security';

export interface PendingTask {
  id: string;
  kind: PendingTaskKind;
  title: string;
  description: string;
  /** Texto curto à direita, ex.: "vence hoje", "3 itens". */
  hint: string;
}

export const DEMO_PENDING_TASKS: PendingTask[] = [
  {
    id: 'task-invites',
    kind: 'invite',
    title: 'Aprovar convites',
    description: 'Há 5 convites aguardando aprovação de um administrador.',
    hint: '5 itens',
  },
  {
    id: 'task-review-permissions',
    kind: 'review',
    title: 'Revisar permissões',
    description: 'Contas com acesso amplo sem atividade nos últimos 60 dias.',
    hint: '8 contas',
  },
  {
    id: 'task-billing',
    kind: 'billing',
    title: 'Fatura próxima do vencimento',
    description: 'A próxima fatura do plano vence em 3 dias.',
    hint: 'vence em 3d',
  },
  {
    id: 'task-security',
    kind: 'security',
    title: 'Alertas de segurança',
    description: 'Dois logins a partir de localizações incomuns.',
    hint: '2 alertas',
  },
];
