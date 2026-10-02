import * as React from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

const PAGE_ACTIONS_SLOT_ID = 'page-actions-slot';

/**
 * Slot fixo no header global do `Layout`. As telas injetam botões de ação
 * contextuais aqui via `<PageActions>`, evitando que cada tela carregue o
 * próprio cabeçalho cheio.
 *
 * `flex-shrink-0` protege as ações em mobile: se o breadcrumb for longo,
 * ele encolhe/trunca antes dos botões serem comprimidos.
 */
export function PageActionsSlot({ className }: { className?: string }) {
  return (
    <div
      id={PAGE_ACTIONS_SLOT_ID}
      className={cn('ml-auto flex shrink-0 items-center gap-2 px-4', className)}
    />
  );
}

interface PageActionsProps {
  children: React.ReactNode;
}

/**
 * Renderiza `children` no slot de ações do header global, em qualquer ponto
 * do JSX da tela. Use para botões contextuais (ex.: "Novo usuário"). Os
 * elementos são removidos automaticamente ao desmontar a tela.
 *
 * Para acomodar mobile, esconda o texto do botão em telas estreitas e mantenha
 * um `aria-label` para acessibilidade:
 *
 * ```tsx
 * <PageActions>
 *   <Button aria-label="Novo usuário">
 *     <UserPlus />
 *     <span className="hidden sm:inline">Novo usuário</span>
 *   </Button>
 * </PageActions>
 * ```
 */
const subscribeToSlot = () => () => {};
const getSlot = () => document.getElementById(PAGE_ACTIONS_SLOT_ID);

export function PageActions({ children }: PageActionsProps) {
  // O slot só entra no DOM no commit do `Layout`; o `useSyncExternalStore`
  // revalida o snapshot após o mount e re-renderiza quando ele aparece.
  const slot = React.useSyncExternalStore(subscribeToSlot, getSlot);

  if (!slot) return null;
  return createPortal(children, slot);
}
