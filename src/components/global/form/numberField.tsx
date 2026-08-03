import {
  useController,
  useWatch,
  type Control,
  type FieldPathByValue,
  type FieldValues,
} from 'react-hook-form';

import {
  Field as BaseField,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { resolveFieldErrors } from '@/lib/forms/errors';

interface NumberFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, number | undefined>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  /** Mantém o rótulo acessível (leitor de tela) mas oculto visualmente — para uso
   *  em células de tabela onde o cabeçalho da coluna já é o rótulo visual. */
  srOnlyLabel?: boolean;
  id?: string;
  placeholder?: string;
  /** Prefixo visual para valores monetários (ex.: `'R$ '`). */
  prefix?: string;
  /** Casas decimais da máscara. Padrão 2 (quantidade/moeda); 5 p/ taxas/índices. */
  maxDecimals?: number;
  disabled?: boolean;
  readOnly?: boolean;
}

/** Número -> texto mascarado pt-BR (milhar "." e decimal ","), com prefixo opcional. */
function toMasked(
  value: number | undefined,
  prefix: string,
  maxDecimals: number
): string {
  if (value == null || Number.isNaN(value)) return '';
  const formatted = value.toLocaleString('pt-BR', {
    minimumFractionDigits: maxDecimals,
    maximumFractionDigits: maxDecimals,
  });
  return `${prefix}${formatted}`;
}

/**
 * Texto digitado -> número. Estilo "centavos": os dígitos preenchem da direita
 * para a esquerda conforme as casas decimais (ex.: 2 casas: "1500000" -> 15000,00;
 * 5 casas: "512345" -> 5,12345). Sem dígitos -> `undefined`.
 */
function fromInput(raw: string, maxDecimals: number): number | undefined {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return undefined;
  return Number(digits) / 10 ** maxDecimals;
}

/**
 * Campo numérico com máscara pt-BR **na digitação** para quantidades (com
 * decimal) e valores monetários. Integrado ao react-hook-form (controlled) e
 * guarda um `number` no formulário (não a string mascarada) — o payload sai
 * numérico. Para dinheiro, passe `prefix="R$ "`.
 */
export function NumberField<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, number | undefined>,
>({
  control,
  name,
  label,
  srOnlyLabel,
  id,
  placeholder,
  prefix = '',
  maxDecimals = 2,
  disabled,
  readOnly,
}: NumberFieldProps<TFieldValues, TName>) {
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });

  // O valor vem do `useWatch`, não do `field.value`: quando o campo é esvaziado
  // (`undefined`), o `useController` devolve o DEFAULT do formulário — e um campo
  // com valor carregado (edição) ressuscitava o valor inicial ao ser apagado. O
  // `useWatch` sem `defaultValue` entrega o valor real do formulário.
  const watched = useWatch({ control, name });
  const value = typeof watched === 'number' ? watched : undefined;

  // Placeholder padrão: o zero já mascarado (ex.: "0,00", "0,00000", "R$ 0,00")
  // — assim todo campo numérico mostra o formato esperado, sem ficar vazio.
  const resolvedPlaceholder = placeholder ?? toMasked(0, prefix, maxDecimals);

  return (
    <BaseField data-invalid={!!error}>
      <FieldLabel htmlFor={id} className={srOnlyLabel ? 'sr-only' : undefined}>
        {label}
      </FieldLabel>
      <Input
        id={id}
        inputMode="decimal"
        placeholder={resolvedPlaceholder}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={!!error || undefined}
        value={toMasked(value, prefix, maxDecimals)}
        onChange={(event) =>
          field.onChange(fromInput(event.target.value, maxDecimals))
        }
        onBlur={field.onBlur}
      />
      <FieldError errors={resolveFieldErrors(error)} />
    </BaseField>
  );
}
