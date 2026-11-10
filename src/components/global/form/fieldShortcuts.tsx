import type { ReactNode } from 'react';

import { Button } from '@/components/global/button/button';
import { FieldLabel } from '@/components/ui/field';

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
  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      aria-label={shortcut.label}
      disabled={disabled}
      disabledReason={reason ?? ''}
      onClick={shortcut.onSelect}
    >
      {shortcut.label}
    </Button>
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
