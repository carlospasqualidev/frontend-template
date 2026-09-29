import * as React from 'react';
import type { ColumnVisibilityState, Updater } from '@tanstack/react-table';
import { z } from 'zod';

const STORAGE_PREFIX = 'dataTable:hiddenColumns:';

const hiddenColumnsSchema = z.array(z.string());

/** Chave no `localStorage` onde a tabela guarda as colunas ocultas. */
export function columnVisibilityStorageKey(tableKey: string): string {
  return `${STORAGE_PREFIX}${tableKey}`;
}

function readHiddenColumns(storageKey: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = hiddenColumnsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch (error) {
    // Armazenamento bloqueado (modo privado) ou JSON corrompido: a tabela
    // segue com todas as colunas visíveis.
    console.info('Não foi possível ler as colunas ocultas da tabela.', error);
    return [];
  }
}

function writeHiddenColumns(storageKey: string, hidden: string[]): void {
  try {
    if (hidden.length === 0) {
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
 * Sem `tableKey`, o estado vive só em memória (nada é gravado).
 */
export function useColumnVisibility(
  tableKey?: string
): [ColumnVisibilityState, (updater: Updater<ColumnVisibilityState>) => void] {
  const storageKey = tableKey ? columnVisibilityStorageKey(tableKey) : null;

  const [visibility, setVisibility] = React.useState<ColumnVisibilityState>(
    () => (storageKey ? toVisibilityState(readHiddenColumns(storageKey)) : {})
  );

  // Mantém várias abas do mesmo navegador em sincronia.
  React.useEffect(() => {
    if (!storageKey) return undefined;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea !== localStorage || event.key !== storageKey) {
        return;
      }
      setVisibility(toVisibilityState(readHiddenColumns(storageKey)));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey]);

  const updateVisibility = React.useCallback(
    (updater: Updater<ColumnVisibilityState>) => {
      setVisibility((previous) => {
        const next =
          typeof updater === 'function' ? updater(previous) : updater;
        if (storageKey) writeHiddenColumns(storageKey, toHiddenColumns(next));
        return next;
      });
    },
    [storageKey]
  );

  return [visibility, updateVisibility];
}
