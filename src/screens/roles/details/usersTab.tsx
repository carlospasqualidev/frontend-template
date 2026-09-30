import { useMemo } from 'react';
import {
  useQueries,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useController, type Control } from 'react-hook-form';
import { Users, X } from 'lucide-react';

import { Alert } from '@/components/global/alert/alert';
import { UserAvatar } from '@/components/global/avatar/userAvatar';
import { Button } from '@/components/global/button/button';
import { Card } from '@/components/global/card/card';
import { Empty } from '@/components/global/empty/empty';
import { MultiSelect } from '@/components/global/form/multiSelect';
import {
  FormTable,
  FormTableHeader,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/global/formTable/formTable';
import { SkeletonText } from '@/components/global/skeleton/skeleton';
import { Typography } from '@/components/ui/typography';
import { useRoleMemberOptions } from '@/screens/roles/details/useRoleMemberOptions';
import { normalizeIds } from '@/screens/roles/utils/permissionTree';
import { type RoleFormValues } from '@/screens/roles/utils/roleForm';
import { UserStatusBadge } from '@/screens/users/utils/userStatusBadge';
import { type RoleMember } from '@/services/roles/roleUsersApi';
import { userKeys } from '@/services/users/queryKeys';
import {
  fetchUser,
  type UserDetailResponse,
} from '@/services/users/userDetailApi';

// Fora do componente: com a mesma função, o `useQueries` devolve a mesma lista
// enquanto os resultados não mudam.
function toMembers(
  results: UseQueryResult<UserDetailResponse>[]
): RoleMember[] {
  return results.flatMap((result) => (result.data ? [result.data.user] : []));
}

function byName(first: RoleMember, second: RoleMember): number {
  return first.name.localeCompare(second.name, 'pt-BR');
}

export interface UsersTabNotice {
  title: string;
  description: string;
}

interface UsersTabProps {
  control: Control<RoleFormValues>;
  /** Os usuários gravados do cargo (o ponto de partida do campo). */
  members: RoleMember[];
  /** Sem `backoffice.roles.update` e `backoffice.users.update`, o `Administrador`: só a lista. */
  readOnly: boolean;
  /** Por que a lista não muda por aqui (o `Administrador`, o cargo grande demais). */
  notice?: UsersTabNotice;
}

/**
 * Aba "Usuários": quem tem o cargo (campo `userIds` do formulário do detalhe,
 * gravado pelo "Salvar alterações" do topo em `PUT
 * /client/roles/:roleId/users`, com o conjunto completo). As pessoas entram
 * pela busca do servidor e saem pelo "X" da linha. Quem pode vincular quem
 * (a si mesmo, o anti-escalonamento) é o servidor que decide: a recusa chega
 * no toast.
 */
export function UsersTab({
  control,
  members,
  readOnly,
  notice,
}: UsersTabProps) {
  const queryClient = useQueryClient();
  const { field } = useController({ control, name: 'userIds' });
  const selectedIds = field.value;

  const membersById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members]
  );

  // Quem entrou agora (fora dos gravados): os dados vêm da leitura de cada um,
  // já no cache quando a pessoa foi escolhida no resultado da busca.
  const addedIds = useMemo(
    () => selectedIds.filter((userId) => !membersById.has(userId)),
    [selectedIds, membersById]
  );
  const added = useQueries({
    queries: addedIds.map((userId) => ({
      queryKey: userKeys.detail(userId),
      queryFn: () => fetchUser(userId),
      staleTime: 60_000,
    })),
    combine: toMembers,
  });

  const known = useMemo(() => {
    const byId = new Map(membersById);
    for (const user of added) byId.set(user.id, user);
    return byId;
  }, [membersById, added]);

  const rows = useMemo(
    () =>
      selectedIds
        .flatMap((userId) => {
          const user = known.get(userId);
          return user ? [user] : [];
        })
        .sort(byName),
    [selectedIds, known]
  );
  const loadingRows = selectedIds.length - rows.length;

  const { options, onSearchChange, loading, found } = useRoleMemberOptions({
    enabled: !readOnly,
    selected: rows,
  });

  const changeUsers = (next: string[]) => {
    for (const userId of next) {
      const user = found.find((item) => item.id === userId);
      if (!membersById.has(userId) && user) {
        queryClient.setQueryData<UserDetailResponse>(
          userKeys.detail(userId),
          (previous) => previous ?? { user }
        );
      }
    }
    field.onChange(normalizeIds(next));
  };

  const removeUser = (userId: string) =>
    field.onChange(selectedIds.filter((item) => item !== userId));

  return (
    <Card
      title="Quem tem o cargo"
      description={
        readOnly
          ? 'As pessoas com este cargo.'
          : 'Escolha quem tem este cargo. A troca vale depois de salvar.'
      }
    >
      <div className="space-y-4">
        {notice && (
          <Alert
            variant="info"
            title={notice.title}
            description={notice.description}
          />
        )}

        {!readOnly && (
          <MultiSelect
            id="role-users"
            label="Usuários do cargo"
            placeholder="Selecione os usuários"
            emptyText="Nenhum usuário encontrado."
            maxDisplay={2}
            options={options}
            value={selectedIds}
            onValueChange={changeUsers}
            onSearchChange={onSearchChange}
            loading={loading}
            className="sm:max-w-md"
          />
        )}

        {selectedIds.length === 0 ? (
          <Empty
            title="Nenhum usuário com este cargo"
            description={
              readOnly
                ? 'Ninguém tem este cargo agora.'
                : 'Escolha acima quem passa a ter este cargo.'
            }
            icon={<Users />}
          />
        ) : (
          <FormTable>
            <FormTableHeader>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Status</TableHead>
              {!readOnly && (
                <TableHead className="w-px">
                  <span className="sr-only">Ações</span>
                </TableHead>
              )}
            </FormTableHeader>
            <TableBody>
              {rows.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.name} imageUrl={user.image} />
                      <Typography as="span" variant="small">
                        {user.name}
                      </Typography>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <UserStatusBadge isActive={user.isActive} />
                  </TableCell>
                  {!readOnly && (
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        tooltip={`Retirar ${user.name} do cargo`}
                        onClick={() => removeUser(user.id)}
                      >
                        <X />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {Array.from({ length: loadingRows }, (_, index) => (
                <TableRow key={`loading-${index}`} aria-busy>
                  <TableCell colSpan={readOnly ? 3 : 4}>
                    <SkeletonText className="w-48" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </FormTable>
        )}
      </div>
    </Card>
  );
}
