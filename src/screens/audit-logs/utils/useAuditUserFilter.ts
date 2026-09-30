import { useMemo, useState } from 'react';
import {
  keepPreviousData,
  useQueries,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { userKeys } from '@/services/users/queryKeys';
import {
  fetchUser,
  type UserDetailResponse,
} from '@/services/users/userDetailApi';
import {
  searchUserOptions,
  type UserOption,
} from '@/services/users/userListApi';

const SEARCH_DEBOUNCE_MS = 300;

// Fora do componente: com a mesma função, o `useQueries` devolve a mesma lista
// enquanto os resultados não mudam.
function toSelectedUsers(
  results: UseQueryResult<UserDetailResponse>[]
): UserOption[] {
  return results.flatMap((result) =>
    result.data
      ? [{ id: result.data.user.id, name: result.data.user.name }]
      : []
  );
}

interface AuditUserFilter {
  options: { value: string; label: string }[];
  onSearchChange: (search: string) => void;
  loading: boolean;
}

/**
 * Opções do filtro "Usuário" da auditoria pela busca do servidor
 * (`GET /client/users?search=`, com debounce): serve para empresa com qualquer
 * número de usuários. Os usuários já aplicados (o `userId` da URL) entram
 * pelas próprias leituras (`GET /client/users/:userId`), para o filtro mostrar
 * o nome deles mesmo fora do resultado da busca. Só roda com `enabled` (a
 * permissão `backoffice.users.read`).
 */
export function useAuditUserFilter({
  enabled,
  selectedIds,
}: {
  enabled: boolean;
  selectedIds: string[];
}): AuditUserFilter {
  const [search, setSearch] = useState('');
  const term = search.trim();
  const debouncedTerm = useDebouncedValue(term, SEARCH_DEBOUNCE_MS);

  const { data: found, isFetching } = useQuery({
    queryKey: userKeys.options(debouncedTerm),
    queryFn: () => searchUserOptions(debouncedTerm),
    enabled,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const selectedUsers = useQueries({
    queries: (enabled ? selectedIds : []).map((userId) => ({
      queryKey: userKeys.detail(userId),
      queryFn: () => fetchUser(userId),
      staleTime: 5 * 60_000,
    })),
    combine: toSelectedUsers,
  });

  const options = useMemo(() => {
    const nameById = new Map<string, string>();
    for (const user of selectedUsers) nameById.set(user.id, user.name);
    for (const user of found ?? []) nameById.set(user.id, user.name);
    return Array.from(nameById, ([value, label]) => ({ value, label }));
  }, [selectedUsers, found]);

  return {
    options,
    onSearchChange: setSearch,
    loading: isFetching || term !== debouncedTerm,
  };
}
