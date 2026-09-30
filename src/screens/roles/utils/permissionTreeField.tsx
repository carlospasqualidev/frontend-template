import { useMemo, useState } from 'react';
import { useController, type Control } from 'react-hook-form';

import { CollapsibleCard } from '@/components/global/collapsibleCard/collapsibleCard';
import { Checkbox } from '@/components/global/form/checkbox';
import { FieldError } from '@/components/ui/field';
import { useSessionStore } from '@/hooks/useSessionStore';
import { resolveFieldErrors } from '@/lib/forms/errors';
import {
  canGrantPermission,
  countModulePermissions,
  isLockedRead,
  togglePermission,
} from '@/screens/roles/utils/permissionTree';
import { type RoleFormValues } from '@/screens/roles/utils/roleForm';
import {
  type CatalogGroup,
  type CatalogPermission,
  type PermissionCatalog,
} from '@/services/roles/roleDetailApi';

const NO_PERMISSIONS: readonly string[] = [];

const LOCKED_READ_HINT = 'Incluída pelas outras ações do grupo.';
const NOT_GRANTABLE_HINT = 'Você não tem esta permissão.';

interface PermissionItemProps {
  permission: CatalogPermission;
  group: CatalogGroup;
  selected: ReadonlySet<string>;
  grantable: boolean;
  readOnly: boolean;
  onToggle: (
    group: CatalogGroup,
    permission: CatalogPermission,
    checked: boolean
  ) => void;
}

function PermissionItem({
  permission,
  group,
  selected,
  grantable,
  readOnly,
  onToggle,
}: PermissionItemProps) {
  const locked = isLockedRead(permission, group, selected);
  // A explicação de cada trava fica visível ao lado do item; em leitura (sem
  // a permissão de editar, o `Administrador`) nada é editável e ela sobra.
  const hint = readOnly
    ? undefined
    : locked
      ? LOCKED_READ_HINT
      : grantable
        ? undefined
        : NOT_GRANTABLE_HINT;

  return (
    <Checkbox
      id={`permission-${permission.id}`}
      label={permission.label}
      description={hint}
      checked={selected.has(permission.id)}
      disabled={readOnly || locked || !grantable}
      onCheckedChange={(checked) =>
        onToggle(group, permission, checked === true)
      }
    />
  );
}

interface PermissionTreeFieldProps {
  control: Control<RoleFormValues>;
  catalog: PermissionCatalog;
  /** Sem a permissão de editar, ou o `Administrador`: só leitura. */
  readOnly: boolean;
  /** As permissões do cargo gravado (na criação, nenhuma). */
  savedPermissionIds: ReadonlySet<string>;
}

/**
 * Campo `permissionIds` do formulário de cargo, na árvore do catálogo do
 * servidor: módulo (um bloco recolhível) → grupo → ação (um checkbox), com os
 * rótulos do servidor. Marcar uma escrita marca e trava o `read` do grupo; a
 * permissão que quem edita não tem (e que o cargo gravado não tem) aparece
 * desabilitada, com a explicação. Quem decide é o servidor: o 403 dele chega
 * no toast.
 */
export function PermissionTreeField({
  control,
  catalog,
  readOnly,
  savedPermissionIds,
}: PermissionTreeFieldProps) {
  const {
    field,
    fieldState: { error },
  } = useController({ control, name: 'permissionIds' });

  const sessionPermissions = useSessionStore(
    (state) => state.user?.permissions ?? NO_PERMISSIONS
  );
  const authorPermissions = useMemo(
    () => new Set(sessionPermissions),
    [sessionPermissions]
  );
  const selected = useMemo(() => new Set(field.value), [field.value]);

  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const toggleModule = (module: string) =>
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (!next.delete(module)) next.add(module);
      return next;
    });

  const toggle = (
    group: CatalogGroup,
    permission: CatalogPermission,
    checked: boolean
  ) =>
    field.onChange(togglePermission(field.value, group, permission, checked));

  return (
    <div className="space-y-3">
      {catalog.modules.map((module) => {
        const { checked, total } = countModulePermissions(module, selected);
        return (
          <CollapsibleCard
            key={module.module}
            title={
              <span className="text-sm font-medium">{module.moduleLabel}</span>
            }
            summary={`${checked} de ${total}`}
            expanded={!collapsed.has(module.module)}
            onToggle={() => toggleModule(module.module)}
            bodyClassName="grid items-start gap-6 sm:grid-cols-2 xl:grid-cols-4"
          >
            {module.groups.map((group) => (
              <fieldset key={group.groupLabel} className="space-y-3">
                <legend className="mb-3 text-sm font-medium">
                  {group.groupLabel}
                </legend>
                {group.permissions.map((permission) => (
                  <PermissionItem
                    key={permission.id}
                    permission={permission}
                    group={group}
                    selected={selected}
                    grantable={canGrantPermission(
                      permission,
                      authorPermissions,
                      savedPermissionIds
                    )}
                    readOnly={readOnly}
                    onToggle={toggle}
                  />
                ))}
              </fieldset>
            ))}
          </CollapsibleCard>
        );
      })}
      <FieldError errors={resolveFieldErrors(error)} />
    </div>
  );
}
