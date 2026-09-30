import { isAxiosError } from 'axios';
import { create } from 'zustand';

import { sendErrorMessage } from '@/services/api/errorHandlers';
import { sessionUserRef } from '@/services/api/sessionUserRef';
import { sessionService } from '@/services/session/sessionService';
import type { IUser } from '@/types/user/types';

export interface ISessionStore {
  user: IUser | null;
  setUser: (user: IUser | null) => void;
  signOut: () => Promise<void>;
  /**
   * Relê a pessoa da sessão (`GET /client/users/me`) quando as permissões
   * dela podem ter mudado com a sessão aberta (editar um cargo que ela tem):
   * menu e botões passam a seguir as novas sem recarregar. Nunca rejeita: na
   * falha, a sessão continua como está, sem toast e sem ir ao login.
   */
  refreshUser: () => Promise<void>;
}

export const useSessionStore = create<ISessionStore>((set, get) => ({
  user: null,
  setUser: (user) => {
    sessionUserRef.set(user);
    set({ user });
  },
  signOut: async () => {
    try {
      await sessionService.signOut();
    } finally {
      sessionUserRef.set(null);
      set({ user: null });
    }
  },
  refreshUser: async () => {
    try {
      const { user } = await sessionService.refresh();
      // A sessão saiu (ou virou outra) enquanto a leitura corria: não volta.
      if (get().user?.id !== user.id) return;
      get().setUser(user);
    } catch (error) {
      // A gravação que pediu a releitura já deu certo, com o toast dela. Menu
      // e botões seguem as permissões anteriores até a próxima leitura. A
      // resposta fora do contrato é inesperada: vai ao reporte, sem toast.
      if (isAxiosError(error)) {
        console.info('Não foi possível reler as permissões da sessão.', {
          status: error.response?.status,
        });
        return;
      }
      console.error('Resposta inesperada ao reler a sessão.', error);
      void sendErrorMessage({ error });
    }
  },
}));
