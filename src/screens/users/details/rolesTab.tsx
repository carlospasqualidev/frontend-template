import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWatch, type Control } from 'react-hook-form';
import { Shield } from 'lucide-react';

import { Card } from '@/components/global/card/card';
import { Empty } from '@/components/global/empty/empty';
import { MultiSelect } from '@/components/global/form/multiSelect';
import { SkeletonText } from '@/components/global/skeleton/skeleton';
import { Badge } from '@/components/ui/badge';
import { Typography } from '@/components/ui/typography';
import { type UserFormValues } from '@/screens/users/utils/userForm';
import { useRoleOptions } from '@/screens/users/utils/useRoleOptions';
import { roleKeys } from '@/services/roles/queryKeys';
import {
  fetchPermissionCatalog,
  fetchRoleDetail,
  type PermissionCatalog,
} from '@/services/roles/roleDetailApi';
import { type CompanyUser, type UserRole } from '@/services/users/types';

const ROLES_DESCRIPTION =
  'A pessoa tem as permissões de todos os cargos dela. A troca vale depois de salvar.';

function NoRoles() {
  return (
    <Empty
      title="Sem cargo"
      description="Sem cargo, a pessoa entra no sistema, mas não vê nenhuma área administrativa."
      icon={<Shield />}
    />
  );
}

/** Sem `backoffice.roles.read`: só os nomes dos cargos, que vêm no usuário. */
function RoleNames({ roles }: { roles: UserRole[] }) {
  return (
    <Card title="Cargos" description="Os cargos que valem para esta pessoa.">
      {roles.length === 0 ? (
        <NoRoles />
      ) : (
        <ul className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <li key={role.id}>
              <Badge variant="secondary">{role.name}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

interface PermissionGroup {
  groupLabel: string;
  labels: string[];
}

// As permissões do cargo agrupadas como o catálogo do servidor as apresenta
// (grupo e rótulo pt-BR, na ordem de exibição dele).
function groupPermissions(
  permissionIds: Set<string>,
  catalog: PermissionCatalog
): PermissionGroup[] {
  return catalog.modules
    .flatMap((module) => module.groups)
    .flatMap((group) => {
      const labels = group.permissions
        .filter((permission) => permissionIds.has(permission.id))
        .map((permission) => permission.label);
      return labels.length > 0
        ? [{ groupLabel: group.groupLabel, labels }]
        : [];
    });
}

function RolePermissions({
  roleId,
  roleName,
  catalog,
}: {
  roleId: string;
  roleName: string;
  catalog: PermissionCatalog | undefined;
}) {
  const { data: role, isError } = useQuery({
    queryKey: roleKeys.detail(roleId),
    queryFn: () => fetchRoleDetail(roleId),
    staleTime: 60_000,
  });

  const groups =
    role && catalog
      ? groupPermissions(
          new Set(role.permissions.map((permission) => permission.id)),
          catalog
        )
      : undefined;

  return (
    <section className="space-y-2 border-b py-4 first:pt-0 last:border-b-0 last:pb-0">
      <Typography as="h3" variant="small" className="font-medium">
        {role?.name ?? roleName}
      </Typography>
      {isError ? (
        <Typography variant="muted">
          Não foi possível carregar as permissões deste cargo.
        </Typography>
      ) : groups ? (
        <dl className="space-y-2">
          {groups.map((group) => (
            <div
              key={group.groupLabel}
              className="flex flex-col gap-1 sm:flex-row sm:gap-4"
            >
              <dt className="text-sm text-muted-foreground sm:w-40 sm:shrink-0">
                {group.groupLabel}
              </dt>
              <dd className="flex flex-wrap gap-1">
                {group.labels.map((label) => (
                  <Badge key={label} variant="outline">
                    {label}
                  </Badge>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="space-y-2" aria-busy>
          <SkeletonText className="h-5 w-2/3" />
          <SkeletonText className="h-5 w-1/2" />
        </div>
      )}
    </section>
  );
}

interface RolesTabProps {
  user: CompanyUser;
  control: Control<UserFormValues>;
  /** Pode ler cargos (`backoffice.roles.read`): opções e permissões. */
  canReadRoles: boolean;
  /** Sem `backoffice.users.update`: os cargos só aparecem. */
  readOnly: boolean;
}

/**
 * Aba "Cargos": os cargos do usuário (campo `roleIds` do formulário do
 * detalhe, gravado pelo "Salvar alterações" do topo em
 * `PUT /client/users/:userId/roles`) e, só para conferência, as permissões de
 * cada cargo escolhido. Quem pode dar qual cargo é o servidor que decide: a
 * recusa (anti-escalonamento, o `Administrador`, os próprios cargos, o último
 * administrador) chega no toast.
 */
export function RolesTab({
  user,
  control,
  canReadRoles,
  readOnly,
}: RolesTabProps) {
  if (!canReadRoles) return <RoleNames roles={user.roles} />;

  return <EditableRoles user={user} control={control} readOnly={readOnly} />;
}

function EditableRoles({
  user,
  control,
  readOnly,
}: Omit<RolesTabProps, 'canReadRoles'>) {
  const roleIds = useWatch({ control, name: 'roleIds' });

  // Busca no servidor; os cargos escolhidos ficam nas opções, com o nome que
  // já vem no usuário ou o da leitura de cada um.
  const { options, onSearchChange, loading } = useRoleOptions({
    enabled: true,
    selectedIds: roleIds,
    knownRoles: user.roles,
  });

  const { data: catalog } = useQuery({
    queryKey: roleKeys.permissionCatalog,
    queryFn: fetchPermissionCatalog,
    staleTime: 30 * 60_000,
  });

  const nameById = useMemo(
    () => new Map(options.map((option) => [option.value, option.label])),
    [options]
  );

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <Card title="Cargos" description={ROLES_DESCRIPTION}>
        <MultiSelect
          control={control}
          name="roleIds"
          id="user-roles"
          label="Cargos do usuário"
          placeholder="Selecione os cargos"
          emptyText="Nenhum cargo encontrado."
          options={options}
          onSearchChange={onSearchChange}
          loading={loading}
          disabled={readOnly}
        />
      </Card>

      <Card
        title="Permissões dos cargos"
        description="O que os cargos escolhidos permitem, para conferência."
      >
        {roleIds.length === 0 ? (
          <NoRoles />
        ) : (
          roleIds.map((roleId) => (
            <RolePermissions
              key={roleId}
              roleId={roleId}
              roleName={nameById.get(roleId) ?? ''}
              catalog={catalog}
            />
          ))
        )}
      </Card>
    </div>
  );
}
