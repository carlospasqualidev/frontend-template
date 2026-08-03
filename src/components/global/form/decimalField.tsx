import { useRef, useState } from 'react';
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

interface DecimalFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, number | undefined>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  /** Mantém o rótulo acessível (leitor de tela) mas oculto visualmente. */
  srOnlyLabel?: boolean;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

/** número -> texto pt-BR livre (decimal ","), sem forçar casas nem separador de milhar. */
function numberToText(value: number | undefined): string {
  if (value == null || Number.isNaN(value)) return '';
  return String(value).replace('.', ',');
}

/**
 * Sanitiza a digitação LIVRE: mantém dígitos, UMA vírgula (a posição é do
 * usuário — nada de máscara "centavos") e um sinal de menos inicial. Ponto
 * digitado vira vírgula (teclado numérico), para o decimal ser sempre ",".
 */
function sanitize(raw: string): string {
  let text = raw.replace(/\./g, ',').replace(/[^\d,-]/g, '');
  const negative = text.startsWith('-');
  text = text.replace(/-/g, '');
  const firstComma = text.indexOf(',');
  if (firstComma !== -1) {
    text =
      text.slice(0, firstComma + 1) +
      text.slice(firstComma + 1).replace(/,/g, '');
  }
  return (negative ? '-' : '') + text;
}

/** texto pt-BR -> número; vazio/parcial ("-", ",", "-,") -> undefined. */
function textToNumber(text: string): number | undefined {
  if (!text || text === '-' || text === ',' || text === '-,') return undefined;
  const parsed = Number(text.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Campo numérico de digitação LIVRE em pt-BR: o usuário posiciona a vírgula
 * manualmente e informa quantas casas quiser (sem a máscara "centavos" do
 * `NumberField`). Guarda um `number` no formulário. Use quando a precisão é do
 * usuário e varia por registro (ex.: uma medição onde "0,0003" e "200" convivem).
 * Para quantidade/moeda com casas fixas, use o `NumberField` (máscara).
 */
export function DecimalField<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, number | undefined>,
>({
  control,
  name,
  label,
  srOnlyLabel,
  id,
  placeholder,
  disabled,
  readOnly,
}: DecimalFieldProps<TFieldValues, TName>) {
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });

  // O valor vem do `useWatch`, não do `field.value`: quando o campo é esvaziado
  // (`undefined`), o `useController` devolve o DEFAULT do formulário — e um campo
  // opcional com valor carregado (edição) ressuscitava o valor inicial ao ser
  // apagado. O `useWatch` sem `defaultValue` entrega o valor real do formulário.
  const watched = useWatch({ control, name });
  const value = typeof watched === 'number' ? watched : undefined;

  // Buffer de texto local: preserva exatamente o que o usuário digita (inclusive
  // estados parciais como "0," ou "-"), enquanto o formulário guarda o número.
  const [text, setText] = useState(() => numberToText(value));
  // Ressincroniza o texto quando o valor muda POR FORA (reset/carga do
  // formulário), preservando o que o usuário digita (o `String(number)` perderia
  // "0," e zeros à direita). Detecta a mudança externa comparando o valor ENTRE
  // renders (não a cada render): assim um re-render com valor ainda defasado do
  // RHF, logo após a nossa própria digitação, não sobrescreve o texto. Padrão
  // "ajuste de estado no render" recomendado pelo React (sem `useEffect`).
  const lastValueRef = useRef(value);
  if (value !== lastValueRef.current) {
    lastValueRef.current = value;
    if (textToNumber(text) !== value) setText(numberToText(value));
  }

  function handleChange(raw: string) {
    const clean = sanitize(raw);
    setText(clean);
    field.onChange(textToNumber(clean));
  }

  return (
    <BaseField data-invalid={!!error}>
      <FieldLabel htmlFor={id} className={srOnlyLabel ? 'sr-only' : undefined}>
        {label}
      </FieldLabel>
      <Input
        id={id}
        inputMode="decimal"
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={!!error || undefined}
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={field.onBlur}
      />
      <FieldError errors={resolveFieldErrors(error)} />
    </BaseField>
  );
}
