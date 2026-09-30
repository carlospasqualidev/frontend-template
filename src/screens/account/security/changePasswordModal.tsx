import { type Dispatch, type SetStateAction } from 'react';
import { isAxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { Check, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/global/button/button';
import { InputField } from '@/components/global/form/inputField';
import { Modal, ModalFooter } from '@/components/global/modal/modal';
import { useZodForm } from '@/lib/forms/useZodForm';
import {
  EMPTY_PASSWORD_FORM,
  passwordFormSchema,
} from '@/screens/account/security/passwordForm';
import {
  changeAccountPassword,
  findPasswordFormIssues,
  type ChangePasswordBody,
} from '@/services/account/accountApi';
import { catchHandler, sendErrorMessage } from '@/services/api/errorHandlers';

const FORM_ID = 'account-password-form';

const UNEXPECTED_ERROR_MESSAGE =
  'Não foi possível concluir agora. Tente novamente em instantes.';

interface ChangePasswordModalProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

/**
 * Troca da própria senha num modal: senha atual, nova e confirmação. O
 * formulário vive no corpo do modal, então fechar descarta o que foi digitado.
 */
export function ChangePasswordModal({
  open,
  setOpen,
}: ChangePasswordModalProps) {
  return (
    <Modal
      title="Alterar senha"
      description="Informe a senha atual e a nova. A sessão continua aberta."
      icon={<KeyRound />}
      open={open}
      setOpen={setOpen}
    >
      <ChangePasswordForm onChanged={() => setOpen(false)} />
    </Modal>
  );
}

function ChangePasswordForm({ onChanged }: { onChanged: () => void }) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { isDirty },
  } = useZodForm({
    schema: passwordFormSchema,
    defaultValues: EMPTY_PASSWORD_FORM,
  });

  // O toast de sucesso é o `message` da resposta ("Senha alterada.").
  const mutation = useMutation({
    mutationFn: (body: ChangePasswordBody) => changeAccountPassword(body),
    onSuccess: onChanged,
    onError: (error) => {
      // A resposta 200 fora do contrato ou um bug: a troca pode ter valido.
      if (!isAxiosError(error)) {
        console.error('Falha inesperada ao trocar a senha.', error);
        void sendErrorMessage({ error });
        toast.error(UNEXPECTED_ERROR_MESSAGE, { id: 'errorToastId' });
        return;
      }

      // 409, 429 e as demais falhas já tiveram o toast do interceptor.
      if (error.response?.status !== 400) return;

      const issues = findPasswordFormIssues(error);
      if (issues.length === 0) {
        catchHandler({ response: error.response });
        return;
      }
      issues.forEach(({ field, message }) =>
        setError(field, { type: 'server', message })
      );
    },
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <form
      id={FORM_ID}
      onSubmit={(event) => void onSubmit(event)}
      className="grid gap-4"
      noValidate
    >
      <InputField
        control={control}
        name="currentPassword"
        id="account-current-password"
        label="Senha atual"
        type="password"
        placeholder="Sua senha de hoje"
        autoComplete="current-password"
      />
      <InputField
        control={control}
        name="password"
        id="account-new-password"
        label="Nova senha"
        type="password"
        placeholder="Mínimo de 8 caracteres"
        autoComplete="new-password"
      />
      <InputField
        control={control}
        name="confirmPassword"
        id="account-confirm-password"
        label="Confirmação da nova senha"
        type="password"
        placeholder="Repita a nova senha"
        autoComplete="new-password"
      />
      {isDirty && (
        <ModalFooter>
          <Button type="submit" loading={mutation.isPending}>
            <Check />
            Alterar senha
          </Button>
        </ModalFooter>
      )}
    </form>
  );
}
