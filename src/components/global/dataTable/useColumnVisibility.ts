import * as React from 'react';
import type { ColumnVisibilityState, Updater } from '@tanstack/react-table';
import { z } from 'zod';

const STORAGE_PREFIX = 'dataTable:hiddenColumns:';

const hiddenColumnsSchema = z.array(z.string());

/** Chave no `localStorage` onde a tabela guarda as colunas ocultas. */
export function columnVisibilityStorageKey(tableKey: string): string {
  return `${STORAGE_PREFIX}${tableKey}`;
}

/**
 * Colunas ocultas gravadas, ou `null` quando o usuário nunca configurou (nada
 * gravado, valor corrompido ou armazenamento bloqueado): aí vale o padrão.
 */
function readHiddenColumns(storageKey: string): string[] | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = hiddenColumnsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch (error) {
    // Armazenamento bloqueado (modo privado) ou JSON corrompido: a tabela
    // segue com o padrão, em memória.
    console.info('Não foi possível ler as colunas ocultas da tabela.', error);
    return null;
  }
}

/**
 * Grava só os ids ocultos. Lista vazia remove a chave, exceto quando
 * `persistEmpty` (a tabela tem colunas ocultas por padrão): aí `[]` é a escolha
 * "mostrar todas" e precisa sobreviver ao próximo carregamento.
 */
function writeHiddenColumns(
  storageKey: string,
  hidden: string[],
  persistEmpty: boolean
): void {
  try {
    if (hidden.length === 0 && !persistEmpty) {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, JSON.stringify(hidden));
    }
  } catch (error) {
    console.info(
      'Não foi possível salvar as colunas ocultas da tabela.',
      error
    );
  }
}

function toVisibilityState(hidden: string[]): ColumnVisibilityState {
  return Object.fromEntries(hidden.map((id) => [id, false]));
}

function toHiddenColumns(state: ColumnVisibilityState): string[] {
  return Object.entries(state)
    .filter(([, visible]) => !visible)
    .map(([id]) => id);
}

/**
 * Visibilidade das colunas da `DataTable`, lembrada **neste navegador** via
 * `localStorage` — é preferência de exibição de cada usuário, não estado
 * compartilhável (por isso não vai na URL). Persiste só os ids **ocultos**:
 * uma coluna nova adicionada à tela aparece visível para todos, e ids de
 * colunas que deixaram de existir são simplesmente ignorados.
 *
 * `defaultHiddenColumnIds` são as colunas que nascem ocultas enquanto o usuário
 * não escolheu nada; a escolha gravada (inclusive `[]`) sempre vence. A lista é
 * comparada por conteúdo, então um array novo a cada render não reinicia nada.
 *
 * Sem `tableKey`, o estado vive só em memória (nada é gravado).
 */
export function useColumnVisibility(
  tableKey?: string,
  defaultHiddenColumnIds?: readonly string[]
): [ColumnVisibilityState, (updater: Updater<ColumnVisibilityState>) => void] {
  const storageKey = tableKey ? columnVisibilityStorageKey(tableKey) : null;
  const defaultsKey = JSON.stringify(defaultHiddenColumnIds ?? []);
  const defaultHidden = React.useMemo(
    () => hiddenColumnsSchema.parse(JSON.parse(defaultsKey)),
    [defaultsKey]
  );
  const persistEmpty = defaultHidden.length > 0;

  const [visibility, setVisibility] = React.useState<ColumnVisibilityState>(
    () =>
      toVisibilityState(
        (storageKey ? readHiddenColumns(storageKey) : null) ?? defaultHidden
      )
  );

  // Mantém várias abas do mesmo navegador em sincronia.
  React.useEffect(() => {
    if (!storageKey) return undefined;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea !== localStorage || event.key !== storageKey) {
        return;
      }
      setVisibility(
        toVisibilityState(readHiddenColumns(storageKey) ?? defaultHidden)
      );
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey, defaultHidden]);

  const updateVisibility = React.useCallback(
    (updater: Updater<ColumnVisibilityState>) => {
      setVisibility((previous) => {
        const next =
          typeof updater === 'function' ? updater(previous) : updater;
        if (storageKey) {
          writeHiddenColumns(storageKey, toHiddenColumns(next), persistEmpty);
        }
        return next;
      });
    },
    [storageKey, persistEmpty]
  );

  return [visibility, updateVisibility];
}
