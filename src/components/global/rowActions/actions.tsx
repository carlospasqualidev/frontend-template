import {
  Copy,
  Download,
  Pencil,
  RotateCcw,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';

import type { RowAction, RowActionBase } from './rowActions';

/**
 * Catálogo de ações de linha RECORRENTES.
 *
 * Cada fábrica fixa a IDENTIDADE da ação (`key`, rótulo-base, ícone e `tone`) e
 * recebe só o COMPORTAMENTO (`onSelect`) e os ajustes da linha (`overrides`: rótulo
 * com o nome do alvo, `disabled`/`disabledReason`, `href`). Assim a MESMA ação tem o
 * mesmo ícone e tom em toda tela, e trocar o ícone ou o tom é editar um lugar.
 *
 * Duas ações iguais na mesma linha (dois `copyAction`) trocam o rótulo por
 * `overrides`; a `key` fica a da ação. Ação específica de uma tela, sem reuso,
 * continua um `RowAction` literal. Ações de domínio não entram aqui.
 */
export type RowActionOverrides = Partial<
  Pick<RowActionBase, 'label' | 'disabled' | 'disabledReason' | 'href'>
>;

const make =
  (base: Omit<RowActionBase, 'href'>) =>
  (onSelect: () => void, overrides?: RowActionOverrides): RowAction => ({
    ...base,
    onSelect,
    // `undefined` não apaga o padrão (ex.: `label: undefined` de uma prop opcional).
    ...Object.fromEntries(
      Object.entries(overrides ?? {}).filter(([, value]) => value !== undefined)
    ),
  });

/**
 * Editar o registro da linha. Só para lista SEM clique na linha: com
 * `onRowClick`/`getRowHref`, editar é pela linha e esta ação não entra.
 *
 * `info`: é a ação mais usada da fileira e, sem cor, sumiria ao lado do excluir.
 */
export const editAction = make({
  key: 'edit',
  label: 'Editar',
  icon: <Pencil />,
  tone: 'info',
});

/** Excluir o registro da linha (destrutivo; a tela confirma antes). */
export const deleteAction = make({
  key: 'delete',
  label: 'Excluir',
  icon: <Trash2 />,
  tone: 'destructive',
});

/** Baixar o arquivo da linha. `brand`: ação corriqueira que não dá veredito. */
export const downloadAction = make({
  key: 'download',
  label: 'Baixar',
  icon: <Download />,
  tone: 'brand',
});

/** Reprocessar a linha (ex.: um job que falhou). */
export const retryAction = make({
  key: 'retry',
  label: 'Tentar de novo',
  icon: <RotateCcw />,
  tone: 'neutral',
});

/** Copiar um valor da linha (e-mail, código). */
export const copyAction = make({
  key: 'copy',
  label: 'Copiar',
  icon: <Copy />,
  tone: 'neutral',
});

/** Bloquear o acesso do registro (reversível; par de `unblockAction`). */
export const blockAction = make({
  key: 'block',
  label: 'Bloquear',
  icon: <UserX />,
  tone: 'warning',
});

/** Desbloquear o acesso do registro (par de `blockAction`). */
export const unblockAction = make({
  key: 'unblock',
  label: 'Desbloquear',
  icon: <UserCheck />,
  tone: 'success',
});
