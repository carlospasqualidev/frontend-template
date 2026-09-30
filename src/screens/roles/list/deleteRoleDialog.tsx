import { type Dispatch, type SetStateAction } from 'react';

import { ConfirmDialog } from '@/components/global/confirmDialog/confirmDialog';
import {
  deleteRoleCopy,
  useDeleteRole,
} from '@/screens/roles/utils/roleMutations';
import { type RoleListItem } from '@/services/roles/types';

interface DeleteRoleDialogProps {
  /** O último cargo pedido: continua aqui enquanto o dialog fecha (animação). */
  role: RoleListItem | null;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

/**
 * Confirmação da exclusão pedida no menu "⋯" da listagem. O toast de sucesso
 * e o da recusa (o cargo com usuários vinculados, o `Administrador`, sem
 * permissão) são o `message` do servidor; a recusa deixa o dialog aberto.
 */
export function DeleteRoleDialog({
  role,
  open,
  setOpen,
}: DeleteRoleDialogProps) {
  const remove = useDeleteRole();

  if (!role) return null;

  const copy = deleteRoleCopy(role.name);

  return (
    <ConfirmDialog
      open={open}
      setOpen={setOpen}
      title={copy.title}
      description={copy.description}
      confirmLabel="Excluir"
      destructive
      onConfirm={async () => {
        await remove.mutateAsync(role.id);
      }}
    />
  );
}
