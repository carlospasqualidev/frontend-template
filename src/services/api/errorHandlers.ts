import axios from 'axios';
import { toast } from 'sonner';

import { sessionUserRef } from './sessionUserRef';

import { env } from '@/lib/env';
import {
  extractResponseMessage,
  hasResponseMessage,
  type ICatchHandler,
  type IThenHandler,
} from '@/services/api/types';

/**
 * Envia o erro para um serviço de log externo, se `VITE_ERROR_LOG_URL`
 * estiver configurado. Só dispara em produção. Nunca lança — falhas no
 * reporte não devem derrubar a aplicação.
 *
 * Do usuário da sessão vai só o `userId` (id opaco, o mesmo campo que o
 * `server-template` manda ao log): nome e e-mail são dado pessoal (LGPD).
 */
export const sendErrorMessage = async ({ error }: { error: unknown }) => {
  if (!import.meta.env.PROD || !env.VITE_ERROR_LOG_URL) {
    return;
  }

  const errorStack = error instanceof Error ? error.stack : String(error);
  const user = sessionUserRef.get();

  await axios
    .post(env.VITE_ERROR_LOG_URL, {
      projectName: env.VITE_PROJECT_NAME,
      environment: env.VITE_PROJECT_ENVIRONMENT,
      side: env.VITE_PROJECT_SIDE,
      errorStack,
      extraInfo: {
        url: window.location.href,
        userId: user?.id,
      },
    })
    .catch(() => undefined);
};

function isSilentError(err: ICatchHandler): boolean {
  const silentError = err.config?.silentError;

  if (silentError === undefined || typeof silentError === 'boolean') {
    return silentError === true;
  }

  const status = err.response?.status;
  return status !== undefined && silentError.includes(status);
}

/**
 * Interceptor de erro: exibe a mensagem do servidor (ou uma genérica) num
 * toast. A chamada feita com `silentError: true` no config não exibe nada; com
 * uma lista de status (`silentError: [401]`), só essas respostas ficam sem
 * toast.
 */
export const catchHandler = (err: ICatchHandler) => {
  if (isSilentError(err)) {
    return;
  }

  const message = extractResponseMessage(err.response?.data);

  if (message) {
    toast.error(message, { id: 'errorToastId' });
    return;
  }

  if (err.response?.status) {
    toast.error(`Erro ${err.response.status}`, { id: 'errorToastId' });
    return;
  }

  toast.error('Erro de comunicação', { id: 'errorToastId' });
};

/**
 * Interceptor de sucesso. Se a resposta carrega `data.message`, exibe um
 * toast de sucesso automaticamente — pensado para confirmações de
 * mutations (criar/atualizar/excluir). Se a sua API anexa `message` em
 * respostas de listagem, ajuste o backend ou troque este interceptor por
 * um opt-in explícito por chamada.
 */
export const thenHandler = (res: IThenHandler) => {
  if (hasResponseMessage(res?.data)) {
    toast.success(res.data.message);
  }
};
