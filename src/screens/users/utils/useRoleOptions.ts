import { useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import {
  keepPreviousData,
  useQueries,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { roleKeys } from '@/services/users/queryKeys';
import { type UserRole } from '@/services/users/types';
import {
  fetchRoleDetail,
  searchRoleOptions,
  type RoleDetail,
} from '@/services/users/userRolesApi';

const SEARCH_DEBOUNCE_MS = 300;

const NO_ROLES: UserRole[] = [];

// Id fora do formato (400) ou cargo inexistente ou excluído (404).
function isRoleNotFound(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 400 || status === 404;
}

interface RoleRead {
  role?: UserRole;
  /** O servidor não tem o cargo. */
  missing: boolean;
}

// Fora do componente: com a mesma função, o `useQueries` devolve a mesma lista
// enquanto os resultados não mudam. Na ordem dos ids lidos.
function toRoleReads(results: UseQueryResult<RoleDetail>[]): RoleRead[] {
  return results.map(({ data, error }) => ({
    role: data && { id: data.id, name: data.name },
    missing: isRoleNotFound(error),
  }));
}

interface RoleOptions {
  options: { value: string; label: string }[];
  onSearchChange: (search: string) => void;
  loading: boolean;
  /** Os marcados que o servidor não tem (400 ou 404 na leitura). */
  missingIds: string[];
}

/**
 * Opções de cargo pela busca do servidor (`GET /client/roles?search=`, com
 * debounce), para empresa com qualquer número de cargos: o filtro "Cargos" da
 * lista e o campo da aba "Cargos" do detalhe. Os cargos marcados
 * (`selectedIds`) ficam sempre nas opções, com o nome de `knownRoles` (os
 * cargos que já vêm no usuário) ou da leitura de cada um
 * (`GET /client/roles/:roleId`, a mesma chave das permissões da aba "Cargos").
 * Os lidos que o servidor não tem (o cargo excluído de um link antigo, um id
 * fora do formato) voltam em `missingIds`, para quem usa tirá-los da seleção.
 * Só roda com `enabled` (a permissão `backoffice.roles.read`).
 */
export function useRoleOptions({
  enabled,
  selectedIds,
  knownRoles = NO_ROLES,
}: {
  enabled: boolean;
  selectedIds: string[];
  knownRoles?: UserRole[];
}): RoleOptions {
  const [search, setSearch] = useState('');
  const term = search.trim();
  const debouncedTerm = useDebouncedValue(term, SEARCH_DEBOUNCE_MS);

  const { data: found, isFetching } = useQuery({
    queryKey: roleKeys.options(debouncedTerm),
    queryFn: () => searchRoleOptions(debouncedTerm),
    enabled,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  // A lista chega nova a cada render (a URL, o formulário): a chave em texto
  // mantém as opções estáveis enquanto a seleção é a mesma.
  const selectedKey = selectedIds.join(',');
  const knownNames = useMemo(
    () => new Map(knownRoles.map((role) => [role.id, role.name])),
    [knownRoles]
  );

  // Os marcados sem nome conhecido: o nome vem da leitura de cada um.
  const readIds = useMemo(
    () =>
      (enabled && selectedKey ? selectedKey.split(',') : []).filter(
        (roleId) => !knownNames.has(roleId)
      ),
    [enabled, selectedKey, knownNames]
  );

  const reads = useQueries({
    queries: readIds.map((roleId) => ({
      queryKey: roleKeys.detail(roleId),
      queryFn: () => fetchRoleDetail(roleId),
      staleTime: 60_000,
    })),
    combine: toRoleReads,
  });

  const missingIds = useMemo(
    () => readIds.filter((_, index) => reads.at(index)?.missing),
    [readIds, reads]
  );

  const options = useMemo(() => {
    const nameById = new Map<string, string>();
    for (const roleId of selectedKey ? selectedKey.split(',') : []) {
      const name = knownNames.get(roleId);
      if (name !== undefined) nameById.set(roleId, name);
    }
    for (const { role } of reads) {
      if (role) nameById.set(role.id, role.name);
    }
    for (const role of found ?? []) nameById.set(role.id, role.name);
    return Array.from(nameById, ([value, label]) => ({ value, label }));
  }, [selectedKey, knownNames, reads, found]);

  return {
    options,
    onSearchChange: setSearch,
    loading: isFetching || term !== debouncedTerm,
    missingIds,
  };
}
