import { toast } from 'sonner';

export const DEMO_ACTION_MESSAGE = 'Dados de demonstração: nada foi alterado.';

/**
 * Resposta de uma ação dentro de uma parte de demonstração (encerrar uma
 * sessão, baixar uma fatura...): o servidor não tem a função, então a tela diz
 * que nada mudou, em vez de simular uma confirmação.
 */
export function notifyDemoAction(): void {
  toast(DEMO_ACTION_MESSAGE, { id: 'demoActionToastId' });
}
