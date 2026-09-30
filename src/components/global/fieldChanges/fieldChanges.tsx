import { ArrowRight } from 'lucide-react';

import { Typography } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

/** Mudança de um campo, já pronta para exibir (formato do `fieldChanges` do servidor). */
export interface IFieldChange {
  /** Nome técnico: só a chave da lista, nunca exibido. */
  field: string;
  label: string;
  from: string;
  to: string;
}

interface IFieldChanges {
  changes: IFieldChange[];
  /** Texto quando o evento não altera campos (login, exportação). */
  emptyMessage?: string;
}

// Marcadores que o servidor devolve no lugar do valor: ausente e omitido
// (segredo ou dado anonimizado). São exibidos como estão, em itálico e sem risco.
const PLACEHOLDER_VALUES = new Set(['[Vazio]', '[omitido]']);

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_VALUES.has(value);
}

/**
 * Lista "rótulo: de → para" de um evento da trilha de auditoria. O valor
 * anterior vem riscado e atenuado (`<del>`), o novo em destaque (`<ins>`); o
 * leitor de tela ouve "de … para …" no lugar da seta.
 */
export function FieldChanges({
  changes,
  emptyMessage = 'Nenhum campo alterado neste evento.',
}: IFieldChanges) {
  if (changes.length === 0) {
    return <Typography variant="muted">{emptyMessage}</Typography>;
  }

  return (
    <dl className="space-y-1.5 text-sm">
      {changes.map((change) => (
        <div
          key={change.field}
          className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5"
        >
          <dt className="font-medium">{change.label}:</dt>
          <dd className="flex min-w-0 flex-wrap items-center gap-x-1.5">
            <span className="sr-only">de </span>
            <del
              className={cn(
                'min-w-0 wrap-break-word text-muted-foreground',
                isPlaceholder(change.from)
                  ? 'italic no-underline'
                  : 'line-through'
              )}
            >
              {change.from}
            </del>
            <ArrowRight
              aria-hidden
              className="size-3.5 shrink-0 text-muted-foreground"
            />
            <span className="sr-only"> para </span>
            <ins
              className={cn(
                'min-w-0 wrap-break-word no-underline',
                isPlaceholder(change.to)
                  ? 'text-muted-foreground italic'
                  : 'font-medium'
              )}
            >
              {change.to}
            </ins>
          </dd>
        </div>
      ))}
    </dl>
  );
}
