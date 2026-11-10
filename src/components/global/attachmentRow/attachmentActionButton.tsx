import type { ReactNode } from 'react';

import { Button } from '@/components/global/button/button';

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
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      tooltip={label}
      disabled={disabled}
      disabledReason={disabledReason ?? ''}
      className={className}
      onClick={onSelect}
    >
      {icon}
    </Button>
  );
}
