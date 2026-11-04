// Grupos da tela de configurações, um por módulo do catálogo do servidor. A
// tela e o skeleton leem daqui a ordem e a descrição de cada grupo.

/** Linha da tela: campo de texto ou número (rótulo em cima) ou interruptor (rótulo ao lado). */
export type ConfigRowKind = 'field' | 'switch';

export interface ConfigModuleOutline {
  module: string;
  rows: readonly ConfigRowKind[];
}

/**
 * Formato esperado da tela, para o skeleton reservar o espaço enquanto a
 * leitura (`GET /client/system-configs`) não volta: os grupos na ordem de
 * exibição e uma linha por chave do catálogo do servidor, pelo tipo do campo.
 * Chave ou grupo novo no catálogo entra aqui.
 */
export const SETTINGS_OUTLINE: readonly ConfigModuleOutline[] = [
  { module: 'GENERAL', rows: ['field', 'field'] },
  { module: 'SECURITY', rows: ['field', 'field', 'field'] },
  { module: 'NOTIFICATIONS', rows: ['switch'] },
];

// Ordem de exibição dos módulos (Geral primeiro). `switch` — sem indexar
// objeto por variável.
function moduleRank(module: string): number {
  switch (module) {
    case 'GENERAL':
      return 0;
    case 'SECURITY':
      return 1;
    case 'NOTIFICATIONS':
      return 2;
    default:
      return 3;
  }
}

export interface ModuleGroup<TItem> {
  module: string;
  items: TItem[];
}

/**
 * Agrupa os itens por módulo (`moduleOf`), com os grupos na ordem de exibição
 * e os itens de cada grupo na ordem de chegada.
 */
export function groupByModule<TItem>(
  items: readonly TItem[],
  moduleOf: (item: TItem) => string
): ModuleGroup<TItem>[] {
  const groups = new Map<string, TItem[]>();
  items.forEach((item) => {
    const module = moduleOf(item);
    groups.set(module, [...(groups.get(module) ?? []), item]);
  });
  return [...groups.entries()]
    .map(([module, groupItems]) => ({ module, items: groupItems }))
    .sort((a, b) => moduleRank(a.module) - moduleRank(b.module));
}
