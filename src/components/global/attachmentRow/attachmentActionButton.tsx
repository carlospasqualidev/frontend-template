import type { ReactNode } from 'react';

import { Button } from '@/components/global/button/button';
import { cn } from '@/lib/utils';

interface IAttachmentActionButton {
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  /** Motivo exibido no tooltip e no nome acessível enquanto `disabled`. */
  disabledReason?: string;
  className?: string;
}

/**
 * Botão de ícone das ações do anexo. Desabilitado, usa `aria-disabled` (e não
 * `disabled`) para continuar focável: o motivo aparece no tooltip e no nome
 * acessível, e o clique não faz nada.
 */
export function AttachmentActionButton({
  label,
  icon,
  onSelect,
  disabled,
  disabledReason,
  className,
}: IAttachmentActionButton) {
  const accessibleName =
    disabled && disabledReason ? `${label}: ${disabledReason}` : label;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      tooltip={disabled ? (disabledReason ?? label) : label}
      aria-label={accessibleName}
      aria-disabled={disabled || undefined}
      className={cn(
        'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
        className
      )}
      onClick={disabled ? undefined : onSelect}
    >
      {icon}
    </Button>
  );
}
