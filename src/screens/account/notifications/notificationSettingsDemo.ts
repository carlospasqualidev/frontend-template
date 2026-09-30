/*
 * DADOS DE DEMONSTRAÇÃO da aba "Notificações": o servidor não guarda
 * preferência de notificação por usuário (só a configuração da empresa
 * `notifications.email`). A aba mostra o aviso de demonstração e nada é
 * gravado. Fica assim até existir a rota.
 */

export interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  checked: boolean;
}

export const DEMO_NOTIFICATION_CHANNELS: NotificationSetting[] = [
  {
    id: 'channel-email',
    label: 'E-mail',
    description: 'Receba notificações no e-mail cadastrado.',
    checked: true,
  },
  {
    id: 'channel-push',
    label: 'Push',
    description: 'Avisos no navegador e celular.',
    checked: true,
  },
  {
    id: 'channel-inapp',
    label: 'Dentro do sistema',
    description: 'Indicador no sino da barra superior.',
    checked: true,
  },
];

export const DEMO_NOTIFICATION_EVENTS: NotificationSetting[] = [
  {
    id: 'event-activity',
    label: 'Atividade da conta',
    description: 'Novos logins, alterações no perfil e em permissões.',
    checked: true,
  },
  {
    id: 'event-security',
    label: 'Alertas de segurança',
    description: 'Acessos suspeitos e tentativas bloqueadas.',
    checked: true,
  },
  {
    id: 'event-product',
    label: 'Atualizações do produto',
    description: 'Novas funcionalidades e melhorias relevantes.',
    checked: false,
  },
  {
    id: 'event-marketing',
    label: 'Conteúdo e promoções',
    description: 'Newsletters, dicas e ofertas ocasionais.',
    checked: false,
  },
];
