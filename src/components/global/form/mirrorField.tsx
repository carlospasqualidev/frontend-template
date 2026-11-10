import { useId, type ReactNode } from 'react';

import { InfoTooltip } from '@/components/global/infoTooltip/infoTooltip';
import { Field as BaseField, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * A casca do campo somente-leitura, para o conteúdo que NÃO cabe num `<input>`
 * — um link para outro registro, por exemplo. Espelha o `Input` em repouso e
 * `read-only`; o que fica de fora são os estados que um valor inerte não tem
 * (foco, desabilitado, inválido).
 */
const FIELD_SHELL =
  'flex h-8 w-full min-w-0 items-center overflow-hidden rounded-lg border border-input bg-muted/40 px-2.5 py-1 text-sm dark:bg-input/30';

interface IMirrorField {
  label: string;
  /** Valor JÁ formatado para exibição (ex.: "1.234,50", "—"). */
  value?: string;
  /**
   * Conteúdo próprio no lugar do valor: use só quando ele não for texto puro
   * (um `Link` para outro registro). Com ele o campo deixa de ser inerte,
   * porque o que está dentro é que recebe o clique e o foco.
   */
  children?: ReactNode;
  id?: string;
  /** Esconde o rótulo do olho, mantendo-o para o leitor de tela. */
  srOnlyLabel?: boolean;
  className?: string;
  /** Explicação opcional, revelada num `InfoTooltip` ao lado do rótulo (mesma dica do Checkbox global). */
  labelHint?: ReactNode;
}

/**
 * Campo-espelho: um valor **derivado** que o usuário nunca digita (um total que
 * o servidor calcula, um dado que vem de outro registro) com o **visual de
 * campo** — para alinhar no grid ao lado dos editáveis — mas **inerte**: sem
 * foco, sem seleção, sem cursor de texto. É o padrão de `docs/conventions/forms.md`
 * ("`readOnly` copiável × campo-espelho inerte"): renderizar como `<input readOnly>`
 * sozinho ainda deixaria o campo focável e com realce de seleção, o que parece um
 * bug. Use quando o valor é só contexto e não vale a pena copiar; quando vale
 * (um código, um documento), prefira um `readOnly` copiável.
 */
export function MirrorField({
  label,
  value,
  children,
  id,
  srOnlyLabel,
  className,
  labelHint,
}: IMirrorField) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const labelId = `${inputId}-label`;
  const fieldLabel = (
    <FieldLabel
      id={labelId}
      htmlFor={inputId}
      className={srOnlyLabel ? 'sr-only' : undefined}
    >
      {label}
    </FieldLabel>
  );

  return (
    <BaseField>
      {/* Com a dica, rótulo e ícone vão juntos num wrapper — e a dica fica FORA do
          `<label>` para não entrar no nome acessível do campo. O `triggerLabel`
          nomeia o botão pelo campo, para dois tooltips na mesma tela não colidirem. */}
      {labelHint ? (
        <span className="inline-flex items-center gap-1.5">
          {fieldLabel}
          <InfoTooltip label={labelHint} triggerLabel={`Sobre ${label}`} />
        </span>
      ) : (
        fieldLabel
      )}
      {children ? (
        <div
          id={inputId}
          role="group"
          aria-labelledby={labelId}
          className={cn(FIELD_SHELL, className)}
        >
          {children}
        </div>
      ) : (
        <Input
          id={inputId}
          value={value ?? ''}
          placeholder="—"
          readOnly
          tabIndex={-1}
          aria-readonly
          className={cn('pointer-events-none select-none', className)}
        />
      )}
    </BaseField>
  );
}
