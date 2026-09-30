import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Check, X } from 'lucide-react';

import { Button } from '@/components/global/button/button';
import { PageActions } from '@/components/global/layout/pageActions';
import { useReturnToList } from '@/hooks/useReturnToList';
import { useSessionStore } from '@/hooks/useSessionStore';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { useZodForm } from '@/lib/forms/useZodForm';
import { hasPermission } from '@/lib/permissions';
import {
  EMPTY_ROLE_FORM_VALUES,
  roleFormSchema,
  toSaveRoleBody,
} from '@/screens/roles/utils/roleForm';
import {
  RoleIdentityCard,
  RolePermissionsCard,
} from '@/screens/roles/utils/roleFormFields';
import {
  handleRoleFormError,
  storeNewRole,
} from '@/screens/roles/utils/roleMutations';
import { createRole, type SaveRoleBody } from '@/services/roles/roleFormApi';

const FORM_ID = 'role-create-form';

// Na criação, o cargo ainda não tem permissão nenhuma: só as que quem cria
// tem ficam liberadas na árvore.
const NO_SAVED_PERMISSIONS: ReadonlySet<string> = new Set();

/**
 * Novo cargo (`POST /client/roles`): nome, descrição e as permissões. O cargo
 * nasce sem usuários: criado, abre o detalhe dele na aba "Usuários" (quando
 * quem cria pode ver usuários), onde as pessoas são vinculadas.
 */
export function RoleCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const returnToList = useReturnToList('/roles');
  const canReadUsers = useSessionStore((state) =>
    hasPermission(state.user, 'backoffice.users.read')
  );

  const {
    control,
    handleSubmit,
    setError,
    formState: { isDirty },
  } = useZodForm({
    schema: roleFormSchema,
    defaultValues: EMPTY_ROLE_FORM_VALUES,
  });

  // "Cancelar" volta à lista sem perguntar (é o descartar da criação).
  useUnsavedChangesGuard(isDirty);

  // O toast de sucesso é o `message` da resposta (interceptor do `api`).
  // Criado, o que foi digitado está gravado: abrir o detalhe não pergunta.
  const mutation = useMutation({
    mutationFn: (body: SaveRoleBody) => createRole(body),
    onSuccess: ({ role }) => {
      storeNewRole(queryClient, role);
      void navigate({
        to: '/roles/$roleId',
        params: { roleId: role.id },
        search: canReadUsers ? { tab: 'users' } : {},
        replace: true,
        ignoreBlocker: true,
      });
    },
    onError: (error) =>
      handleRoleFormError(error, {
        queryClient,
        markField: (field, message) =>
          setError(field, { type: 'server', message }),
      }),
  });

  const onSubmit = handleSubmit((values) =>
    mutation.mutate(toSaveRoleBody(values))
  );

  return (
    <>
      <PageActions>
        <Button
          key="cancel-action"
          variant="outline"
          type="button"
          aria-label="Cancelar"
          onClick={returnToList}
        >
          <X />
          <span className="hidden sm:inline">Cancelar</span>
        </Button>
        {isDirty && (
          <Button
            key="submit-action"
            type="submit"
            form={FORM_ID}
            loading={mutation.isPending}
            aria-label="Criar cargo"
          >
            <Check />
            <span className="hidden sm:inline">Criar cargo</span>
          </Button>
        )}
      </PageActions>

      <form
        id={FORM_ID}
        onSubmit={(event) => void onSubmit(event)}
        className="grid items-start gap-4"
        noValidate
      >
        <RoleIdentityCard control={control} />
        <RolePermissionsCard
          control={control}
          savedPermissionIds={NO_SAVED_PERMISSIONS}
        />
      </form>
    </>
  );
}
