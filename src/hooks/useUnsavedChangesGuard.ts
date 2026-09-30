import { useCallback, useEffect, useRef } from 'react';
import { useBlocker, type ShouldBlockFn } from '@tanstack/react-router';
import { create } from 'zustand';

interface IPendingPop {
  /**
   * A posição do histórico (`__TSR_index`) onde o voltar ou avançar deixou o
   * navegador: é dali que o roteador o devolve à edição se a pessoa ficar.
   * `undefined` quando não deu para ler.
   */
  index: number | undefined;
}

interface IUnsavedChangesStore {
  /**
   * A navegação que espera a resposta da pessoa: `true` sai (e descarta a
   * edição), `false` fica. `null` sem pergunta aberta.
   */
  resolveLeave: ((leave: boolean) => void) | null;
  /** Onde estava o foco quando a saída foi pedida: é para lá que ele volta. */
  returnFocus: HTMLElement | null;
  /** A pergunta aberta veio do voltar ou avançar do navegador. */
  pendingPop: IPendingPop | null;
}

/**
 * A pergunta em aberto do guard, lida pela confirmação global
 * (`UnsavedChangesDialog`, montada uma vez no `Layout`).
 */
export const useUnsavedChangesStore = create<IUnsavedChangesStore>(() => ({
  resolveLeave: null,
  returnFocus: null,
  pendingPop: null,
}));

interface IDirtyGuard {
  searchKey: string | undefined;
}

// Os guards com edição não salva, na ordem em que a edição começou. O
// primeiro pergunta por todos: uma pergunta só por saída, mesmo com mais de
// um formulário alterado na tela (o perfil e o modal de senha).
const dirtyGuards = new Set<IDirtyGuard>();

function firstDirtyGuard(): IDirtyGuard | undefined {
  return dirtyGuards.values().next().value;
}

// O item de um menu (o "Sair" do menu da pessoa) some quando o menu fecha: o
// foco volta ao botão que abriu o menu.
function focusedElement(): HTMLElement | null {
  const focused = document.activeElement;
  if (!(focused instanceof HTMLElement)) return null;
  const openerId = focused
    .closest('[role="menu"]')
    ?.getAttribute('aria-labelledby');
  return (openerId && document.getElementById(openerId)) || focused;
}

function askToLeave(pendingPop: IPendingPop | null): Promise<boolean> {
  return new Promise((resolve) => {
    const { resolveLeave, returnFocus } = useUnsavedChangesStore.getState();
    // Outra saída com a pergunta aberta (o voltar do navegador com a
    // confirmação na tela): a anterior fica onde está, a pergunta passa a
    // valer para a nova, e o foco continua voltando para onde estava antes.
    resolveLeave?.(false);
    useUnsavedChangesStore.setState({
      resolveLeave: resolve,
      returnFocus: resolveLeave ? returnFocus : focusedElement(),
      pendingPop,
    });
  });
}

// A posição do navegador no histórico, como o roteador a grava em cada
// entrada.
function historyIndex(): number | undefined {
  const state: unknown = window.history.state;
  if (typeof state !== 'object' || state === null) return undefined;
  if (!('__TSR_index' in state)) return undefined;
  return typeof state.__TSR_index === 'number' ? state.__TSR_index : undefined;
}

/**
 * Outro voltar ou avançar com a pergunta de um voltar aberta. Ele não troca a
 * pergunta nem é desfeito pelo roteador: o roteador desfaz cada um contando a
 * partir da edição, então dois desfeitos passariam dela (ou não achariam para
 * onde ir) e a URL ficaria em outra tela. O navegador volta para onde a
 * primeira pergunta o deixou, e a navegação fica sem resposta, de propósito:
 * responder qualquer coisa faria o roteador sair ou desfazer de novo. A
 * pergunta que vale é a primeira: "Continuar editando" volta à edição,
 * "Descartar alterações" vai aonde o primeiro voltar ia.
 */
function holdPop(pendingPop: IPendingPop): Promise<boolean> {
  const index = historyIndex();
  if (
    pendingPop.index !== undefined &&
    index !== undefined &&
    index !== pendingPop.index
  ) {
    window.history.go(pendingPop.index - index);
  }
  return new Promise<boolean>(() => undefined);
}

/** Resposta da confirmação: `true` sai e descarta; `false` fica editando. */
export function answerLeaveRequest(leave: boolean): void {
  const { resolveLeave } = useUnsavedChangesStore.getState();
  if (!resolveLeave) return;
  useUnsavedChangesStore.setState({ resolveLeave: null, pendingPop: null });
  resolveLeave(leave);
}

/**
 * Esquece a pergunta aberta sem responder: a navegação que esperava não segue
 * nem volta. Para quando a confirmação sai da tela com a pergunta aberta (a
 * sessão acabou e o app foi ao login): ela não pode reaparecer depois.
 */
export function dropLeaveRequest(): void {
  useUnsavedChangesStore.setState({
    resolveLeave: null,
    returnFocus: null,
    pendingPop: null,
  });
}

/**
 * A saída que não é uma navegação do roteador e perde a edição: o "Sair" do
 * menu da pessoa, que encerra a sessão antes de ir ao login. Com alguma
 * edição não salva, abre a mesma confirmação e resolve `true` com "Descartar
 * alterações" e `false` com "Continuar editando"; sem edição, resolve `true`
 * sem perguntar. Quem chama só segue com `true`, e navega com
 * `ignoreBlocker: true` para não perguntar de novo.
 */
export function confirmLeaveIfDirty(): Promise<boolean> {
  if (dirtyGuards.size === 0) return Promise.resolve(true);
  return askToLeave(null);
}

type ShouldBlockArgs = Parameters<ShouldBlockFn>[0];
type GuardLocation = ShouldBlockArgs['current'];

function searchValue(location: GuardLocation, key: string): unknown {
  return new Map(Object.entries(location.search)).get(key);
}

// Sair da tela é trocar de caminho. Na mesma tela, abas e paginação que não
// desmontam o formulário (o detalhe de usuário: o formulário fica acima das
// abas) não saem da edição; `searchKey` é o parâmetro que desmonta.
function leavesTheEdit(
  current: GuardLocation,
  next: GuardLocation,
  searchKey: string | undefined
): boolean {
  if (current.pathname !== next.pathname) return true;
  if (searchKey === undefined) return false;
  return searchValue(current, searchKey) !== searchValue(next, searchKey);
}

// A decisão do guard que pergunta por todos: `true` segura a navegação.
async function shouldBlockLeave({
  current,
  next,
  action,
}: ShouldBlockArgs): Promise<boolean> {
  const isPop = action !== 'PUSH' && action !== 'REPLACE';
  const { pendingPop } = useUnsavedChangesStore.getState();
  if (isPop && pendingPop) return holdPop(pendingPop);

  const leaves = [...dirtyGuards].some((guard) =>
    leavesTheEdit(current, next, guard.searchKey)
  );
  if (!leaves) return false;
  const leave = await askToLeave(isPop ? { index: historyIndex() } : null);
  return !leave;
}

export interface IUnsavedChangesGuardOptions {
  /**
   * Parâmetro da URL cuja troca também sai da edição, sem sair da tela: a aba
   * que desmonta o formulário (`'tab'` na aba "Perfil" de Minha conta). Sem
   * ele, só sair da tela (outro caminho) pede confirmação.
   */
  searchKey?: string;
}

/**
 * Guard de edição não salva, o mesmo em toda tela de edição. Com `isDirty`
 * (o mesmo sinal do "Salvar alterações"), sair da tela pela navegação do app
 * (link do menu, breadcrumb, voltar e avançar do navegador) abre a
 * confirmação global, "Descartar alterações" ou "Continuar editando", e
 * fechar ou recarregar a aba abre o aviso nativo do navegador.
 *
 * - Sem edição, nada é registrado: nem confirmação, nem aviso nativo. Salvar
 *   (o formulário volta a pristine) e "Descartar" (`reset()`) liberam a saída.
 * - A navegação que a própria tela dispara ao salvar (criar e abrir o
 *   detalhe) passa `ignoreBlocker: true`; o retorno à listagem
 *   (`useReturnToList`) já passa.
 * - Link aberto em nova guia (Ctrl, Shift, Cmd+clique, clique do meio) não é
 *   navegação desta aba: não pergunta.
 * - Mais de um formulário alterado na mesma tela: uma pergunta só.
 * - O "Sair" do menu da pessoa pergunta por `confirmLeaveIfDirty`.
 */
export function useUnsavedChangesGuard(
  isDirty: boolean,
  { searchKey }: IUnsavedChangesGuardOptions = {}
): void {
  const ownGuard = useRef<IDirtyGuard | null>(null);

  useEffect(() => {
    if (!isDirty) return;
    const guard: IDirtyGuard = { searchKey };
    dirtyGuards.add(guard);
    ownGuard.current = guard;
    return () => {
      dirtyGuards.delete(guard);
      ownGuard.current = null;
    };
  }, [isDirty, searchKey]);

  // Cada guard com edição tem o seu bloqueio no roteador, e o roteador chama
  // um por um: só o primeiro guard com edição decide, pelos outros também.
  const shouldBlockFn = useCallback<ShouldBlockFn>(
    (args) =>
      ownGuard.current !== null && ownGuard.current === firstDirtyGuard()
        ? shouldBlockLeave(args)
        : false,
    []
  );

  useBlocker({ shouldBlockFn, disabled: !isDirty });
}
