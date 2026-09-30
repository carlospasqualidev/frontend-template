export type UserActionType = 'block' | 'unblock' | 'delete';

export interface UserActionCopy {
  title: string;
  description: string;
  confirmLabel: string;
  destructive: boolean;
}

/** Texto da confirmação de bloquear, desbloquear e excluir (lista e detalhe). */
export function userActionCopy(
  type: UserActionType,
  userName: string
): UserActionCopy {
  switch (type) {
    case 'block':
      return {
        title: 'Bloquear usuário?',
        description: `${userName} perde o acesso ao sistema até ser desbloqueado.`,
        confirmLabel: 'Bloquear',
        destructive: true,
      };
    case 'unblock':
      return {
        title: 'Desbloquear usuário?',
        description: `${userName} volta a acessar o sistema, com os cargos que tem.`,
        confirmLabel: 'Desbloquear',
        destructive: false,
      };
    case 'delete':
      return {
        title: 'Excluir usuário?',
        description: `${userName} sai da lista e perde o acesso. Esta ação não pode ser desfeita.`,
        confirmLabel: 'Excluir',
        destructive: true,
      };
  }
}
