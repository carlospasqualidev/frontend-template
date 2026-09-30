import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Check, X } from 'lucide-react';

import { Button } from '@/components/global/button/button';
import { PageActions } from '@/components/global/layout/pageActions';
import { useReturnToList } from '@/hooks/useReturnToList';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { useZodForm } from '@/lib/forms/useZodForm';
import {
  createUserFormSchema,
  EMPTY_USER_FORM_VALUES,
  toCreateUserBody,
} from '@/screens/users/utils/userForm';
import { UserFormFields } from '@/screens/users/utils/userFormFields';
import { handleUserFormError } from '@/screens/users/utils/userMutations';
import { userKeys } from '@/services/users/queryKeys';
import { type UserDetailResponse } from '@/services/users/userDetailApi';
import { createUser, type UserFormField } from '@/services/users/userFormApi';

const FORM_ID = 'user-create-form';

const CREATE_FIELDS: readonly UserFormField[] = [
  'name',
  'email',
  'password',
  'confirmPassword',
  'phone',
  'image',
  'idleTimeoutMinutes',
];

/**
 * Novo usuário (`POST /client/users`). O usuário nasce ativo e sem cargo:
 * criado, abre o detalhe dele na aba "Cargos", onde os cargos são dados.
 */
export function UserCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const returnToList = useReturnToList('/users');

  const {
    control,
    handleSubmit,
    setError,
    formState: { isDirty },
  } = useZodForm({
    schema: createUserFormSchema,
    defaultValues: EMPTY_USER_FORM_VALUES,
  });

  // "Cancelar" volta à lista sem perguntar (é o descartar da criação).
  useUnsavedChangesGuard(isDirty);

  // O toast de sucesso é o `message` da resposta (interceptor do `api`).
  // Criado, o que foi digitado está gravado: abrir o detalhe não pergunta.
  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: ({ user }) => {
      queryClient.setQueryData<UserDetailResponse>(userKeys.detail(user.id), {
        user,
      });
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      void navigate({
        to: '/users/$userId',
        params: { userId: user.id },
        search: { tab: 'roles' },
        replace: true,
        ignoreBlocker: true,
      });
    },
    onError: (error) => {
      handleUserFormError(error, {
        queryClient,
        fields: CREATE_FIELDS,
        markField: (field, message) =>
          setError(field, { type: 'server', message }),
      });
    },
  });

  const onSubmit = handleSubmit((values) =>
    mutation.mutate(toCreateUserBody(values))
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
            aria-label="Criar usuário"
          >
            <Check />
            <span className="hidden sm:inline">Criar usuário</span>
          </Button>
        )}
      </PageActions>

      <form
        id={FORM_ID}
        onSubmit={(event) => void onSubmit(event)}
        className="grid gap-4"
        noValidate
      >
        <UserFormFields control={control} mode="create" />
      </form>
    </>
  );
}
