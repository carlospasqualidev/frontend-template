import * as React from 'react';

import { Button } from '@/components/global/button/button';
import {
  AlertDialog as AlertDialogPrimitive,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BaseProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

interface ControlledProps extends BaseProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  trigger?: never;
}

interface UncontrolledProps extends BaseProps {
  trigger: React.ReactNode;
  open?: never;
  setOpen?: never;
}

type IConfirmDialog = ControlledProps | UncontrolledProps;

interface InternalProps extends BaseProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  trigger?: React.ReactNode;
}

function ConfirmDialogInternal({
  open,
  setOpen,
  trigger,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
}: InternalProps) {
  const [isPending, setIsPending] = React.useState(false);

  const handleConfirm = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      // A rejeição de `onConfirm` é o sinal de "não deu certo": o dialog fica
      // aberto. Quem rejeita já deu a resposta ao usuário (o toast do
      // interceptor do `api`, ou o `onError` da mutation); relançar daqui só
      // viraria uma rejeição sem dono no clique.
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialogPrimitive open={open} onOpenChange={setOpen}>
      {trigger ? (
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      ) : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {cancelLabel}
          </AlertDialogCancel>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            loading={isPending}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialogPrimitive>
  );
}

function UncontrolledConfirmDialog(props: UncontrolledProps) {
  const [open, setOpen] = React.useState(false);
  return <ConfirmDialogInternal {...props} open={open} setOpen={setOpen} />;
}

/**
 * Padrão de confirmação para ações destrutivas/reversíveis.
 *
 * - **Uncontrolled**: passe `trigger` (o elemento que abre o dialog).
 *   O estado de abertura é gerenciado internamente.
 * - **Controlled**: passe `open` + `setOpen` para controlar de fora
 *   (atalho de teclado, evento externo, abertura programática).
 *
 * Em ambos os modos, o componente gerencia o loading interno
 * enquanto `onConfirm` resolve, e fecha automaticamente em sucesso.
 */
function isUncontrolled(props: IConfirmDialog): props is UncontrolledProps {
  return 'trigger' in props;
}

export function ConfirmDialog(props: IConfirmDialog) {
  if (isUncontrolled(props)) {
    return <UncontrolledConfirmDialog {...props} />;
  }
  return <ConfirmDialogInternal {...props} />;
}
