import { useCallback, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ShieldPlus } from 'lucide-react';

import { Button } from '@/components/global/button/button';
import { Card } from '@/components/global/card/card';
import { DataTable } from '@/components/global/dataTable/dataTable';
import {
  textFilter,
  type DataTableFilter,
} from '@/components/global/dataTable/filters';
import { useDataTableUrlQuery } from '@/components/global/dataTable/useDataTableUrlQuery';
import { PageActions } from '@/components/global/layout/pageActions';
import { Link } from '@/components/global/link/link';
import { Typography } from '@/components/ui/typography';
import { useSessionStore } from '@/hooks/useSessionStore';
import { hasPermission } from '@/lib/permissions';
import { buildRoleColumns } from '@/screens/roles/list/roleColumns';
import { DeleteRoleDialog } from '@/screens/roles/list/deleteRoleDialog';
import { useCopyRole } from '@/screens/roles/utils/roleMutations';
import { roleKeys } from '@/services/roles/queryKeys';
import { buildRoleListParams, fetchRoles } from '@/services/roles/roleListApi';
import { type RoleListItem } from '@/services/roles/types';

const PAGE_SIZE = 25;

// Coluna secundária: o menu "Configurar colunas" a revela.
const HIDDEN_BY_DEFAULT = ['createdAt'];

const FILTERS: DataTableFilter[] = [
  textFilter({
    key: 'search',
    label: 'Buscar',
    placeholder: 'Nome do cargo...',
  }),
];

/**
 * Cargos da empresa (`GET /client/roles`): busca pelo nome, ordenação e
 * paginação no servidor, com as contagens de permissões e de usuários de cada
 * um. O clique na linha abre o detalhe (a edição); os ícones da linha copiam e excluem.
 */
export function RolesPage() {
  const navigate = useNavigate();
  const sessionUser = useSessionStore((state) => state.user);
  const canCreate = hasPermission(sessionUser, 'backoffice.roles.create');
  const canDelete = hasPermission(sessionUser, 'backoffice.roles.delete');

  const { query, tableProps } = useDataTableUrlQuery({ pageSize: PAGE_SIZE });
  const params = buildRoleListParams(query);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: roleKeys.list(params),
    queryFn: () => fetchRoles(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const { mutate: copyRole } = useCopyRole();

  const [deletion, setDeletion] = useState<{
    open: boolean;
    role: RoleListItem | null;
  }>({ open: false, role: null });

  const onCopy = useCallback(
    (role: RoleListItem) => copyRole(role.id),
    [copyRole]
  );
  const onDelete = useCallback(
    (role: RoleListItem) => setDeletion({ open: true, role }),
    []
  );

  const columns = useMemo(
    () => buildRoleColumns({ canCreate, canDelete, onCopy, onDelete }),
    [canCreate, canDelete, onCopy, onDelete]
  );

  return (
    <>
      {canCreate && (
        <PageActions>
          <Button asChild aria-label="Novo cargo">
            <Link
              href="/roles/create"
              newTabIcon={false}
              className="no-underline hover:text-primary-foreground"
            >
              <ShieldPlus />
              <span className="hidden sm:inline">Novo cargo</span>
            </Link>
          </Button>
        </PageActions>
      )}

      <Typography as="h1" variant="h3" className="sr-only">
        Cargos
      </Typography>

      <Card>
        <DataTable
          columns={columns}
          data={data?.roles ?? []}
          rowCount={data?.count}
          filters={FILTERS}
          isLoading={isPending}
          emptyMessage="Nenhum cargo encontrado."
          errorMessage={
            isError && !data ? 'Não foi possível carregar os cargos' : undefined
          }
          onRetry={refetch}
          columnVisibilityKey="roles"
          defaultHiddenColumnIds={HIDDEN_BY_DEFAULT}
          onRowClick={(role) =>
            navigate({ to: '/roles/$roleId', params: { roleId: role.id } })
          }
          getRowHref={(role) => `/roles/${role.id}`}
          {...tableProps}
        />
      </Card>

      <DeleteRoleDialog
        role={deletion.role}
        open={deletion.open}
        setOpen={(next) =>
          setDeletion((previous) => ({
            ...previous,
            open: typeof next === 'function' ? next(previous.open) : next,
          }))
        }
      />
    </>
  );
}
