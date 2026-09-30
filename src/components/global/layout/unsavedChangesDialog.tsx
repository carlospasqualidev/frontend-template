import { useEffect, type SetStateAction } from 'react';

import { ConfirmDialog } from '@/components/global/confirmDialog/confirmDialog';
import {
  answerLeaveRequest,
  dropLeaveRequest,
  useUnsavedChangesStore,
} from '@/hooks/useUnsavedChangesGuard';

// O foco volta para onde estava quando a saída foi pedida (o campo que a
// pessoa editava, o link do menu). Uma aba que a troca pedida ativaria
// pediria a troca de novo ao receber o foco (as abas trocam no foco): o foco
// vai para a aba ativa da mesma lista.
function focusTarget(element: HTMLElement | null): HTMLElement | null {
  if (!element?.isConnected) return null;
  const isInactiveTab =
    element.getAttribute('role') === 'tab' &&
    element.getAttribute('aria-selected') !== 'true';
  if (!isInactiveTab) return element;
  return (
    element
      .closest('[role="tablist"]')
      ?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]') ?? null
  );
}

function returnFocus(event: Event): void {
  event.preventDefault();
  focusTarget(useUnsavedChangesStore.getState().returnFocus)?.focus();
}

function keepEditingOnClose(open: SetStateAction<boolean>): void {
  if (open === false) answerLeaveRequest(false);
}

/**
 * A confirmação do guard de edição não salva (`useUnsavedChangesGuard`),
 * montada uma vez no `Layout`: abre quando uma tela com edição pede para
 * sair. "Descartar alterações" deixa a navegação seguir; "Continuar editando"
 * (e o Esc) a cancela e devolve o foco.
 */
export function UnsavedChangesDialog() {
  const open = useUnsavedChangesStore((state) => state.resolveLeave !== null);

  // O `Layout` sai com a pergunta aberta quando a sessão acaba (a
  // inatividade leva ao login): ela não reaparece ao entrar de novo.
  useEffect(() => dropLeaveRequest, []);

  return (
    <ConfirmDialog
      open={open}
      setOpen={keepEditingOnClose}
      title="Descartar as alterações?"
      description="O que você alterou ainda não foi salvo. Sair agora descarta essas alterações."
      confirmLabel="Descartar alterações"
      cancelLabel="Continuar editando"
      destructive
      onConfirm={() => answerLeaveRequest(true)}
      onCloseAutoFocus={returnFocus}
    />
  );
}
