import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/ui/field';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface FieldShortcut {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  /** Por que o atalho está indisponível; aparece em tooltip no hover e no foco. */
  disabledReason?: string;
}

interface IFieldShortcuts {
  label: string;
  /** `id` do campo filho: liga o rótulo ao input. */
  htmlFor: string;
  shortcuts: FieldShortcut[];
  /** Desabilita todos os atalhos do grupo. */
  disabled?: boolean;
  /** Motivo do grupo desabilitado (tooltip); sem ele, o grupo não explica. */
  disabledReason?: string;
  /** O campo, com `label=""` e o mesmo `id` de `htmlFor`. */
  children: ReactNode;
}

function ShortcutButton({
  shortcut,
  groupDisabled,
  groupDisabledReason,
}: {
  shortcut: FieldShortcut;
  groupDisabled?: boolean;
  groupDisabledReason?: string;
}) {
  const disabled = groupDisabled || shortcut.disabled;
  // Com o grupo desabilitado vale o motivo do grupo; o do atalho não se aplica.
  const reason = groupDisabled ? groupDisabledReason : shortcut.disabledReason;
  // `aria-disabled` (e não `disabled`) mantém o botão focável: o motivo aparece
  // no tooltip também para quem navega por teclado, e o leitor anuncia o estado.
  const button = (
    <Button
      type="button"
      variant="outline"
      size="xs"
      aria-disabled={disabled || undefined}
      className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
      onClick={disabled ? undefined : shortcut.onSelect}
    >
      {shortcut.label}
    </Button>
  );

  if (!disabled || !reason) return button;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{reason}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Rótulo, fileira de botões de atalho e o campo (filho). Não guarda estado nem
 * conhece o formulário: o `onSelect` de cada atalho é da tela, que grava o valor
 * com `setValue(..., { shouldDirty: true, shouldValidate: formState.isSubmitted })`.
 */
export function FieldShortcuts({
  label,
  htmlFor,
  shortcuts,
  disabled,
  disabledReason,
  children,
}: IFieldShortcuts) {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      <div className="flex flex-wrap gap-1.5">
        {shortcuts.map((shortcut) => (
          <ShortcutButton
            key={shortcut.label}
            shortcut={shortcut}
            groupDisabled={disabled}
            groupDisabledReason={disabledReason}
          />
        ))}
      </div>
      {children}
    </div>
  );
}
