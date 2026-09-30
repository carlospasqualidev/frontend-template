import { useQuery } from '@tanstack/react-query';

import {
  auditKeys,
  fetchAuditFilterOptions,
  type AuditFilterOptions,
} from '@/services/audit/auditApi';

const EMPTY: AuditFilterOptions = { modules: [], actions: [], entities: [] };

/**
 * Opções + rótulos pt-BR dos filtros de auditoria. A fonte de verdade é o
 * backend (`GET /client/audit-logs/options`) — entidade nova auditada aparece
 * aqui automaticamente, sem o frontend precisar conhecê-la. Cacheado (muda
 * raramente).
 */
export function useAuditOptions() {
  const { data } = useQuery({
    queryKey: auditKeys.options,
    queryFn: fetchAuditFilterOptions,
    staleTime: 30 * 60_000,
  });

  const options = data ?? EMPTY;
  const moduleMap = new Map(options.modules.map((option) => [option.value, option.label]));
  const actionMap = new Map(options.actions.map((option) => [option.value, option.label]));
  const entityMap = new Map(options.entities.map((option) => [option.value, option.label]));

  return {
    options,
    moduleLabel: (value: string) => moduleMap.get(value) ?? value,
    actionLabel: (value: string) => actionMap.get(value) ?? value,
    entityLabel: (value: string) => entityMap.get(value) ?? value,
  };
}
