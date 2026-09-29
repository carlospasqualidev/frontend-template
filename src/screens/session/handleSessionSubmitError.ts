import { isAxiosError } from 'axios';
import { toast } from 'sonner';

import { sendErrorMessage } from '@/services/api/errorHandlers';

export const UNEXPECTED_SESSION_ERROR_MESSAGE =
  'Não foi possível concluir agora. Tente novamente em instantes.';

/**
 * Trata a falha do envio do login e do cadastro, para a rejeição não escapar
 * do `handleSubmit` como unhandled rejection.
 *
 * - Erro HTTP (credencial recusada, validação, e-mail já cadastrado, rede): o
 *   interceptor do `api` já exibiu o toast com a mensagem do servidor. O
 *   formulário volta a ficar disponível, sem toast repetido.
 * - Qualquer outra falha é inesperada: a resposta fora do contrato recusada
 *   pelo `.parse` do serviço (`ZodError`) ou um bug. Mensagem genérica ao
 *   usuário e reporte como erro.
 */
export function handleSessionSubmitError(error: unknown): void {
  if (isAxiosError(error)) {
    return;
  }

  console.error('Falha inesperada no envio da sessão.', error);
  void sendErrorMessage({ error });
  toast.error(UNEXPECTED_SESSION_ERROR_MESSAGE, { id: 'errorToastId' });
}
