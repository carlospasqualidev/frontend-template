import { useId, type ChangeEvent } from 'react';
import {
  useController,
  useWatch,
  type Control,
  type FieldPathByValue,
  type FieldValues,
} from 'react-hook-form';

import {
  Field as BaseField,
  FieldDescription,
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
  /** Texto de apoio abaixo do campo. */
  description?: string;
  placeholder?: string;
  /** Prefixo visual para valores monetários (ex.: `'R$ '`). */
  prefix?: string;
  /** Casas decimais da máscara. Padrão 2 (quantidade/moeda); 5 p/ taxas/índices. */
  maxDecimals?: number;
  /**
   * Separador de milhar ("."). Padrão `true` (quantidade/moeda). Desligue em
   * campos que são número mas não quantidade — ano, por exemplo: "2.018"
   * leria como "dois mil e dezoito", não como o ano.
   */
  grouping?: boolean;
  /**
   * Aceita valor negativo (ex.: índice de correção que deflaciona). Padrão
   * `false`: só dígitos, como sempre. Ligado, o "-" digitado ou colado em
   * qualquer posição torna o valor negativo (e é exibido antes do prefixo:
   * "-R$ 1,50"); apagar o "-" volta ao positivo. O "-" sozinho vale `-0` (exibe
   * "-0,00") — o JSON serializa como `0`.
   */
  allowNegative?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}

const isNegative = (value: number): boolean =>
  value < 0 || Object.is(value, -0);

/** Número -> texto mascarado pt-BR (milhar "." e decimal ","), com prefixo opcional. */
function toMasked(
  value: number | undefined,
  prefix: string,
  maxDecimals: number,
  grouping: boolean,
  allowNegative = false
): string {
  if (value == null || Number.isNaN(value)) return '';
  const negative = allowNegative && isNegative(value);
  const formatted = (negative ? Math.abs(value) : value).toLocaleString(
    'pt-BR',
    {
      minimumFractionDigits: maxDecimals,
      maximumFractionDigits: maxDecimals,
      useGrouping: grouping,
    }
  );
  return `${negative ? '-' : ''}${prefix}${formatted}`;
}

/**
 * Texto digitado -> número. Estilo "centavos": os dígitos preenchem da direita
 * para a esquerda conforme as casas decimais (ex.: 2 casas: "1500000" -> 15000,00;
 * 5 casas: "512345" -> 5,12345). Sem dígitos -> `undefined`.
 *
 * **APAGAR ATÉ O ZERO É ESVAZIAR.** Com as casas fixas, o Backspace em "0,00"
 * deixa "0,0", que ainda é zero — e a máscara devolvia "0,00". Apagar dígito
 * por dígito nunca chegava ao campo vazio: parava no zero, e quem achava que
 * tinha limpado gravava zero. Onde vazio e zero dizem coisas diferentes
 * ("usar o padrão", "qualquer"), era o valor errado. Por isso uma EXCLUSÃO que
 * deixa só zeros vira `undefined`, igual a selecionar tudo e apagar. DIGITAR
 * zero continua sendo zero.
 */
function fromInput(
  raw: string,
  maxDecimals: number,
  isDeletion: boolean,
  allowNegative = false
): number | undefined {
  const digits = raw.replace(/\D/g, '');
  const negative = allowNegative && /[-−–]/.test(raw);
  // "-" isolado: só com allowNegative, e vale -0 (sinal pendente, exibe "-0,00").
  if (!digits && !negative) return undefined;
  const parsed = Number(digits || '0') / 10 ** maxDecimals;
  if (isDeletion && parsed === 0) return undefined;
  return negative ? -parsed : parsed;
}

/**
 * A edição tirou texto (Backspace, Delete, recortar)?
 *
 * Pelo `inputType` do evento, e não pelo tamanho do texto: selecionar
 * "R$ 5,00" e digitar 0 também encurta o texto, e é zero DIGITADO. O tamanho só
 * decide quando o navegador não informa o tipo.
 */
function isDeletionEvent(
  event: ChangeEvent<HTMLInputElement>,
  displayed: string
): boolean {
  const { inputType } = event.nativeEvent as Partial<InputEvent>;
  if (typeof inputType === 'string') return inputType.startsWith('delete');
  return event.target.value.length < displayed.length;
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
  id: idProp,
  description,
  placeholder,
  prefix = '',
  maxDecimals = 2,
  grouping = true,
  allowNegative = false,
  disabled,
  readOnly,
}: NumberFieldProps<TFieldValues, TName>) {
  // Sem `id`, o `htmlFor` não ligaria o rótulo (inclusive o `srOnlyLabel`) ao input.
  const generatedId = useId();
  const id = idProp ?? generatedId;

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
  const resolvedPlaceholder =
    placeholder ?? toMasked(0, prefix, maxDecimals, grouping);
  const masked = toMasked(value, prefix, maxDecimals, grouping, allowNegative);

  return (
    <BaseField data-invalid={!!error}>
      {label && (
        <FieldLabel
          htmlFor={id}
          className={srOnlyLabel ? 'sr-only' : undefined}
        >
          {label}
        </FieldLabel>
      )}
      <Input
        id={id}
        // O teclado "decimal" do celular não tem o sinal de menos.
        inputMode={allowNegative ? 'text' : 'decimal'}
        placeholder={resolvedPlaceholder}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={!!error || undefined}
        value={masked}
        onChange={(event) => {
          field.onChange(
            fromInput(
              event.target.value,
              maxDecimals,
              isDeletionEvent(event, masked),
              allowNegative
            )
          );
        }}
        onBlur={field.onBlur}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={resolveFieldErrors(error)} />
    </BaseField>
  );
}
