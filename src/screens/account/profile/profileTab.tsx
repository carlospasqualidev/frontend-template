import { useEffect, useRef } from 'react';
import { isAxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, UserCog, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/global/button/button';
import { Card } from '@/components/global/card/card';
import { Empty } from '@/components/global/empty/empty';
import { InputField } from '@/components/global/form/inputField';
import { NumberField } from '@/components/global/form/numberField';
import { PageActions } from '@/components/global/layout/pageActions';
import { useSessionStore } from '@/hooks/useSessionStore';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { useZodForm } from '@/lib/forms/useZodForm';
import {
  changedProfileFields,
  pendingProfileFieldsOnRebase,
  PROFILE_SECTIONS,
  profileAfterSave,
  profileFormSchema,
  profileToFormValues,
} from '@/screens/account/profile/profileForm';
import { ProfilePhotoField } from '@/screens/account/profile/profilePhotoField';
import { ProfileTabSkeleton } from '@/screens/account/profile/profileTabSkeleton';
import {
  fetchAccountProfile,
  findProfileFormIssues,
  updateAccountProfile,
  type AccountProfile,
  type UpdateProfileBody,
} from '@/services/account/accountApi';
import { accountKeys } from '@/services/account/queryKeys';
import { catchHandler, sendErrorMessage } from '@/services/api/errorHandlers';
import { roleKeys } from '@/services/roles/queryKeys';
import { userKeys } from '@/services/users/queryKeys';

const FORM_ID = 'account-profile-form';

const UNEXPECTED_ERROR_MESSAGE =
  'Não foi possível concluir agora. Tente novamente em instantes.';

/**
 * Aba "Perfil": o próprio cadastro, pré-preenchido pelo perfil gravado
 * (`GET /client/users/me/profile`) e salvo por `PATCH /client/users/me`. A
 * casca espera o perfil; o formulário só monta com ele pronto.
 */
export function ProfileTab() {
  const {
    data: profile,
    isPending,
    refetch,
  } = useQuery({
    queryKey: accountKeys.profile,
    queryFn: fetchAccountProfile,
    staleTime: 30_000,
  });

  if (isPending) return <ProfileTabSkeleton />;

  // A primeira leitura falhou (o toast do interceptor já saiu). Uma releitura
  // que falha com o perfil já carregado mantém o formulário e a edição.
  if (!profile) {
    return (
      <Empty
        title="Não foi possível carregar o perfil"
        description="Tente de novo em instantes."
        icon={<UserCog />}
      >
        <Button variant="outline" onClick={() => void refetch()}>
          Tentar novamente
        </Button>
      </Empty>
    );
  }

  return <ProfileForm profile={profile} />;
}

/**
 * Detalhe = Edição: os campos abrem editáveis e o "Salvar alterações" aparece
 * no topo quando algo muda. Salvar manda só os campos alterados; a resposta
 * traz o usuário da sessão, que substitui o do store (nome, foto e o tempo de
 * inatividade resolvido passam a valer na hora).
 */
function ProfileForm({ profile }: { profile: AccountProfile }) {
  const queryClient = useQueryClient();
  const setSessionUser = useSessionStore((state) => state.setUser);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    formState: { isDirty },
  } = useZodForm({
    schema: profileFormSchema,
    defaultValues: profileToFormValues(profile),
  });

  // A aba inativa desmonta e leva a edição junto: trocar de aba (`?tab=`)
  // pergunta como sair da tela.
  useUnsavedChangesGuard(isDirty, { searchKey: 'tab' });

  // Uma referência só, o perfil do cache: é com ele que o "Salvar" compara, é
  // a ele que o "Descartar" volta e é contra ele que a alteração pendente
  // aparece. Quando o cache muda (a resposta de uma gravação, uma releitura),
  // o formulário parte do perfil novo, e o que a pessoa alterou e ainda não
  // foi gravado continua pendente.
  const startRef = useRef(profile);
  useEffect(() => {
    const start = startRef.current;
    startRef.current = profile;
    const pendingFields = pendingProfileFieldsOnRebase(
      getValues(),
      start,
      profile
    );
    if (!pendingFields) return;

    const pending = pendingFields.map((field) => ({
      field,
      value: getValues(field),
    }));
    reset(profileToFormValues(profile));
    for (const { field, value } of pending) {
      setValue(field, value, { shouldDirty: true });
    }
  }, [profile, getValues, reset, setValue]);

  const handleError = (error: unknown, body: UpdateProfileBody) => {
    // A resposta 200 fora do contrato (o servidor pode ter gravado, e o toast
    // de sucesso já saiu) ou um bug: mensagem genérica, reporte e releitura
    // do perfil, de onde o formulário passa a partir.
    if (!isAxiosError(error)) {
      console.error('Falha inesperada ao salvar o perfil.', error);
      void sendErrorMessage({ error });
      toast.error(UNEXPECTED_ERROR_MESSAGE, { id: 'errorToastId' });
      void queryClient.invalidateQueries({ queryKey: accountKeys.profile });
      return;
    }

    // Outras falhas HTTP já tiveram o toast do interceptor.
    if (error.response?.status !== 400) return;

    const issues = findProfileFormIssues(error, body);
    if (issues.length === 0) {
      catchHandler({ response: error.response });
      return;
    }
    issues.forEach(({ field, message }) =>
      setError(field, { type: 'server', message })
    );
  };

  // O toast de sucesso é o `message` da resposta (interceptor do `api`).
  const mutation = useMutation({
    mutationFn: (body: UpdateProfileBody) => updateAccountProfile(body),
    onSuccess: ({ user }, body) => {
      setSessionUser(user);
      queryClient.setQueryData<AccountProfile>(
        accountKeys.profile,
        (previous) => previous && profileAfterSave(previous, body, user)
      );
      // O próprio cadastro aparece também na gestão de usuários (lista e
      // detalhe) e nos usuários de cada cargo, que releem quando abertos.
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
      void queryClient.invalidateQueries({ queryKey: roleKeys.allMembers() });
    },
    onError: handleError,
  });

  const onSubmit = handleSubmit((values) => {
    const body = changedProfileFields(profile, values);
    if (body) mutation.mutate(body);
  });

  const { identification, access, photo } = PROFILE_SECTIONS;

  return (
    <>
      <PageActions>
        {isDirty && (
          <>
            <Button
              key="discard-action"
              variant="outline"
              type="button"
              aria-label="Descartar"
              onClick={() => reset()}
            >
              <X />
              <span className="hidden sm:inline">Descartar</span>
            </Button>
            <Button
              key="submit-action"
              type="submit"
              form={FORM_ID}
              loading={mutation.isPending}
              aria-label="Salvar alterações"
            >
              <Check />
              <span className="hidden sm:inline">Salvar alterações</span>
            </Button>
          </>
        )}
      </PageActions>

      <form
        id={FORM_ID}
        onSubmit={(event) => void onSubmit(event)}
        className="grid items-start gap-4 lg:grid-cols-2"
        noValidate
      >
        <Card
          title={identification.title}
          description={identification.description}
        >
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <InputField
              control={control}
              name="name"
              id="account-name"
              label="Nome"
              placeholder="Seu nome completo"
              autoComplete="name"
            />
            <InputField
              control={control}
              name="email"
              id="account-email"
              label="E-mail"
              type="email"
              placeholder="voce@empresa.com"
              readOnly
              description="Para alterar o e-mail, fale com o administrador."
            />
            <InputField
              control={control}
              name="phone"
              id="account-phone"
              label="Telefone"
              placeholder="(00) 00000-0000"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
        </Card>

        <Card title={access.title} description={access.description}>
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <NumberField
              control={control}
              name="idleTimeoutMinutes"
              id="account-idle-timeout"
              label="Tempo de inatividade (min)"
              placeholder="Padrão da empresa"
              maxDecimals={0}
            />
          </div>
        </Card>

        <Card title={photo.title} description={photo.description}>
          <ProfilePhotoField control={control} />
        </Card>
      </form>
    </>
  );
}
