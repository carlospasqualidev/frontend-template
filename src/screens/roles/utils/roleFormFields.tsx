import { useQuery } from '@tanstack/react-query';
import { type Control } from 'react-hook-form';
import { ShieldAlert } from 'lucide-react';

import { Button } from '@/components/global/button/button';
import { Card } from '@/components/global/card/card';
import { Empty } from '@/components/global/empty/empty';
import { InputField } from '@/components/global/form/inputField';
import { TextArea } from '@/components/global/form/textArea';
import { PermissionTreeField } from '@/screens/roles/utils/permissionTreeField';
import { PermissionTreeSkeleton } from '@/screens/roles/utils/permissionTreeSkeleton';
import { type RoleFormValues } from '@/screens/roles/utils/roleForm';
import { roleKeys } from '@/services/roles/queryKeys';
import { fetchPermissionCatalog } from '@/services/roles/roleDetailApi';

interface RoleIdentityCardProps {
  control: Control<RoleFormValues>;
  /** Sem a permissão de editar, ou o `Administrador`: campos `readOnly` (copiáveis). */
  readOnly?: boolean;
}

/** Nome e descrição do cargo, os mesmos na criação e no detalhe. */
export function RoleIdentityCard({
  control,
  readOnly = false,
}: RoleIdentityCardProps) {
  return (
    <Card
      title="Identificação"
      description="Nome e descrição, como aparecem na escolha de cargos."
    >
      <div className="grid items-start gap-4">
        <InputField
          control={control}
          name="name"
          id="role-name"
          label="Nome"
          placeholder="Ex.: Suporte"
          autoComplete="off"
          readOnly={readOnly}
        />
        <TextArea
          control={control}
          name="description"
          id="role-description"
          label="Descrição"
          placeholder="Para que serve o cargo (opcional)"
          rows={3}
          readOnly={readOnly}
        />
      </div>
    </Card>
  );
}

interface RolePermissionsCardProps {
  control: Control<RoleFormValues>;
  readOnly?: boolean;
  /** As permissões do cargo gravado (na criação, nenhuma). */
  savedPermissionIds: ReadonlySet<string>;
  className?: string;
}

/**
 * A árvore de permissões do cargo, pelo catálogo do servidor
 * (`GET /client/roles/permissions`, o mesmo para toda empresa, guardado por
 * 30 minutos). Enquanto ele carrega, o skeleton da árvore; na falha, o
 * "Tentar novamente".
 */
export function RolePermissionsCard({
  control,
  readOnly = false,
  savedPermissionIds,
  className,
}: RolePermissionsCardProps) {
  const {
    data: catalog,
    isError,
    refetch,
  } = useQuery({
    queryKey: roleKeys.permissionCatalog,
    queryFn: fetchPermissionCatalog,
    staleTime: 30 * 60_000,
  });

  return (
    <Card
      title="Permissões"
      description={
        readOnly
          ? 'O que o cargo permite.'
          : 'O que o cargo permite. Marcar uma ação de escrita marca também a de visualizar do mesmo grupo.'
      }
      className={className}
    >
      {catalog ? (
        <PermissionTreeField
          control={control}
          catalog={catalog}
          readOnly={readOnly}
          savedPermissionIds={savedPermissionIds}
        />
      ) : isError ? (
        <Empty
          title="Não foi possível carregar as permissões"
          description="Tente de novo em instantes."
          icon={<ShieldAlert />}
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => void refetch()}
          >
            Tentar novamente
          </Button>
        </Empty>
      ) : (
        <PermissionTreeSkeleton />
      )}
    </Card>
  );
}
