import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { type RoleMember } from '@/services/roles/roleUsersApi';
import { userKeys } from '@/services/users/queryKeys';
import { type CompanyUser } from '@/services/users/types';
import { fetchUsers, type UserListParams } from '@/services/users/userListApi';

const SEARCH_DEBOUNCE_MS = 300;

// Uma página de opções por busca: quem procura uma pessoa digita o nome.
const OPTIONS_PAGE_SIZE = 20;

const NO_USERS: CompanyUser[] = [];

interface RoleMemberOptions {
  options: { value: string; label: string }[];
  onSearchChange: (search: string) => void;
  loading: boolean;
  /** Os usuários do resultado da busca, para a tela guardar quem foi escolhido. */
  found: CompanyUser[];
}

/**
 * Opções do campo "Usuários do cargo" pela busca do servidor
 * (`GET /client/users?search=`, nome ou e-mail, com debounce), para empresa
 * com qualquer número de usuários. O resultado vem primeiro; os já escolhidos
 * (`selected`) ficam nas opções depois dele, marcados, para o campo mostrar e
 * desmarcar todos. Só roda com `enabled` (quem pode trocar os usuários).
 */
export function useRoleMemberOptions({
  enabled,
  selected,
}: {
  enabled: boolean;
  selected: RoleMember[];
}): RoleMemberOptions {
  const [search, setSearch] = useState('');
  const term = search.trim();
  const debouncedTerm = useDebouncedValue(term, SEARCH_DEBOUNCE_MS);

  const params: UserListParams = {
    page: 0,
    pageSize: OPTIONS_PAGE_SIZE,
    search: debouncedTerm || undefined,
    orderBy: 'name',
    order: 'asc',
  };

  const { data, isFetching } = useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => fetchUsers(params),
    enabled,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const found = data?.users ?? NO_USERS;

  const options = useMemo(() => {
    const nameById = new Map<string, string>();
    for (const user of found) nameById.set(user.id, user.name);
    for (const user of selected) nameById.set(user.id, user.name);
    return Array.from(nameById, ([value, label]) => ({ value, label }));
  }, [found, selected]);

  return {
    options,
    onSearchChange: setSearch,
    loading: isFetching || term !== debouncedTerm,
    found,
  };
}
