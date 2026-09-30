import { type Dispatch, type SetStateAction } from 'react';

import { ConfirmDialog } from '@/components/global/confirmDialog/confirmDialog';
import {
  userActionCopy,
  type UserActionType,
} from '@/screens/users/utils/userActionCopy';
import {
  useDeleteUser,
  useSetUserActive,
} from '@/screens/users/utils/userMutations';
import { type CompanyUser } from '@/services/users/types';

export interface UserRowAction {
  type: UserActionType;
  user: CompanyUser;
}

interface UserActionDialogProps {
  /** A última ação pedida: continua aqui enquanto o dialog fecha (animação). */
  action: UserRowAction | null;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

/**
 * Confirmação das ações de linha da listagem (bloquear, desbloquear, excluir).
 * O toast de sucesso e o de recusa (último administrador, o próprio usuário,
 * sem permissão) são o `message` do servidor; a recusa deixa o dialog aberto.
 */
export function UserActionDialog({
  action,
  open,
  setOpen,
}: UserActionDialogProps) {
  const setActive = useSetUserActive();
  const remove = useDeleteUser();

  if (!action) return null;

  const copy = userActionCopy(action.type, action.user.name);

  const confirm = async () => {
    if (action.type === 'delete') {
      await remove.mutateAsync(action.user.id);
      return;
    }
    await setActive.mutateAsync({
      userId: action.user.id,
      isActive: action.type === 'unblock',
    });
  };

  return (
    <ConfirmDialog
      open={open}
      setOpen={setOpen}
      title={copy.title}
      description={copy.description}
      confirmLabel={copy.confirmLabel}
      destructive={copy.destructive}
      onConfirm={confirm}
    />
  );
}
