import { useId, useLayoutEffect, useReducer, useRef, useState } from 'react';
import {
  useController,
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
import { fieldDescribedBy } from '@/components/global/form/fieldDescribedBy';
import { Input } from '@/components/ui/input';
import {
  hasFieldErrors,
  resolveFieldErrors,
  type FormFieldErrors,
} from '@/lib/forms/errors';
import { formatCep } from '@/lib/masks/cep';
import { formatCnpj, formatCpf, formatCpfOrCnpj } from '@/lib/masks/document';
import { onlyDigits } from '@/lib/masks/onlyDigits';
import { formatPhone } from '@/lib/masks/phone';

/**
 * - `cpf`, `cnpj`, `cep`, `phone`: máscara viva de cada formato.
 * - `document`: CPF até 11 dígitos, CNPJ acima.
 * - `digits`: só algarismos, sem pontuação e sem limite.
 * - `none`: campo comum, sem máscara (para o campo que alterna e-mail e telefone).
 */
export type MaskKind =
  'cpf' | 'cnpj' | 'document' | 'cep' | 'phone' | 'digits' | 'none';

function apply(mask: MaskKind, value: string): string {
  switch (mask) {
    case 'cpf':
      return formatCpf(value);
    case 'cnpj':
      return formatCnpj(value);
    case 'document':
      return formatCpfOrCnpj(value);
    case 'cep':
      return formatCep(value);
    case 'phone':
      return formatPhone(value);
    case 'digits':
      return onlyDigits(value);
    case 'none':
      return value;
  }
}

/**
 * O que o formulário guarda sai da mesma função que exibe: com máscara, os
 * dígitos do que aparece (o corte no tamanho da máscara vale para as duas
 * pontas); sem máscara, o texto como foi digitado.
 */
function store(mask: MaskKind, value: string): string {
  return mask === 'none' ? value : onlyDigits(apply(mask, value));
}

/** Posição logo depois do `count`-ésimo dígito do texto exibido (0 sem dígitos). */
function cursorAfterDigits(text: string, count: number): number {
  if (count <= 0) return 0;

  let seen = 0;
  for (const [index, char] of [...text].entries()) {
    if (/\d/.test(char)) seen += 1;
    if (seen === count) return index + 1;
  }
  return text.length;
}

type MaskedInputFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
> = Omit<
  React.ComponentProps<'input'>,
  'value' | 'defaultValue' | 'onChange' | 'name'
> & {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  /** Mantém o rótulo acessível (leitor de tela) mas oculto visualmente. */
  srOnlyLabel?: boolean;
  description?: string;
  errors?: FormFieldErrors;
  mask: MaskKind;
};

/**
 * Campo com máscara viva, **só controlado** (`control` + `name`; não há modo
 * `register`, diferente do `InputField`). A pessoa vê o valor mascarado
 * (`12.345.678/0001-90`) e o formulário guarda só os dígitos
 * (`12345678000190`), como a API recebe. Com máscara o campo é sempre
 * `type="text"` com `inputMode="numeric"`; o `type` do chamador só vale em
 * `mask="none"`.
 */
export function MaskedInputField<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
>({
  control,
  name,
  label,
  srOnlyLabel,
  description,
  errors,
  mask,
  className,
  type,
  id: idProp,
  ref: forwardedRef,
  onCompositionStart,
  onCompositionEnd,
  'aria-describedby': ariaDescribedBy,
  ...props
}: MaskedInputFieldProps<TFieldValues, TName>) {
  const { field, fieldState } = useController({ control, name });
  // Sem `id`, o `htmlFor` não ligaria o rótulo (inclusive o `srOnlyLabel`) ao controle.
  const generatedId = useId();
  const id = idProp ?? generatedId;

  const [, rerender] = useReducer((count: number) => count + 1, 0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pendingDigitsBeforeCursor = useRef<number | null>(null);
  // Durante a composição (IME) o campo mostra o texto cru do IME; a máscara
  // entra uma vez, no `compositionend`.
  const [composingText, setComposingText] = useState<string | null>(null);
  const composingBaseDigits = useRef<string | null>(null);
  const displayValue =
    composingText ?? apply(mask, String(field.value ?? ''));

  function setInputRef(element: HTMLInputElement | null): void {
    inputRef.current = element;
    if (typeof forwardedRef === 'function') forwardedRef(element);
    else if (forwardedRef) forwardedRef.current = element;
  }

  useLayoutEffect(() => {
    const digitsBefore = pendingDigitsBeforeCursor.current;
    pendingDigitsBeforeCursor.current = null;
    if (digitsBefore === null || !inputRef.current) return;

    const position = cursorAfterDigits(displayValue, digitsBefore);
    inputRef.current.setSelectionRange(position, position);
  });

  function settleCursor(digitsBeforeCursor: number): void {
    pendingDigitsBeforeCursor.current = digitsBeforeCursor;
    rerender();
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const target = event.target;
    const inputType = (event.nativeEvent as InputEvent).inputType ?? '';
    const previousDigits = onlyDigits(displayValue);
    const insertedText = (event.nativeEvent as InputEvent).data ?? '';
    const isTyping = inputType === 'insertText' && insertedText.length === 1;
    const isDelete =
      inputType === 'deleteContentBackward' ||
      inputType === 'deleteContentForward';

    if (composingBaseDigits.current !== null) {
      setComposingText(target.value);
      return;
    }

    // Telefone: digitação (`insertText` de um caractere ou composição) que
    // acrescenta exatamente um dígito e passaria de onze é ignorada. Colar,
    // arrastar, substituir e autofill (sem `inputType`) sempre seguem o caminho
    // da colagem, que normaliza o `55`/`0` e formata.
    const isTypingLike =
      (inputType === 'insertText' && insertedText.length <= 1) ||
      inputType === 'insertCompositionText';
    const nextDigits = onlyDigits(target.value);
    if (
      mask === 'phone' &&
      isTypingLike &&
      nextDigits.length > 11 &&
      nextDigits.length === previousDigits.length + 1
    ) {
      return;
    }

    const caretIsCollapsed = target.selectionStart === target.selectionEnd;
    const digitsBeforeCaret = onlyDigits(
      target.value.slice(0, target.selectionStart ?? 0)
    ).length;

    if (
      mask !== 'none' &&
      isDelete &&
      caretIsCollapsed &&
      onlyDigits(target.value) === previousDigits
    ) {
      // Só um caractere da máscara sumiu: apaga o dígito vizinho.
      const removeAt =
        inputType === 'deleteContentBackward'
          ? digitsBeforeCaret - 1
          : digitsBeforeCaret;

      if (removeAt < 0 || removeAt >= previousDigits.length) {
        settleCursor(digitsBeforeCaret);
        field.onChange(previousDigits);
        return;
      }

      settleCursor(removeAt);
      field.onChange(
        store(
          mask,
          previousDigits.slice(0, removeAt) + previousDigits.slice(removeAt + 1)
        )
      );
      return;
    }

    // Digitar ou apagar um dígito no meio mantém o cursor onde ele estava.
    if (mask !== 'none' && (isTyping || isDelete) && caretIsCollapsed) {
      settleCursor(digitsBeforeCaret);
    }

    field.onChange(store(mask, target.value));
  }

  function handleCompositionStart(
    event: React.CompositionEvent<HTMLInputElement>
  ): void {
    onCompositionStart?.(event);
    if (mask === 'none') return;

    composingBaseDigits.current = onlyDigits(displayValue);
    setComposingText(event.currentTarget.value);
  }

  function finishComposition(target: HTMLInputElement): void {
    const baseDigits = composingBaseDigits.current;
    if (baseDigits === null) return;

    composingBaseDigits.current = null;
    setComposingText(null);

    const nextDigits = onlyDigits(target.value);
    if (
      mask === 'phone' &&
      nextDigits.length > 11 &&
      nextDigits.length === baseDigits.length + 1
    ) {
      return;
    }

    settleCursor(
      onlyDigits(target.value.slice(0, target.selectionStart ?? 0)).length
    );
    field.onChange(store(mask, target.value));
  }

  function handleCompositionEnd(
    event: React.CompositionEvent<HTMLInputElement>
  ): void {
    onCompositionEnd?.(event);
    finishComposition(event.currentTarget);
  }

  function handleBlur(): void {
    if (inputRef.current) finishComposition(inputRef.current);
    field.onBlur();
  }

  const messages = resolveFieldErrors(fieldState.error, errors);
  const invalid = hasFieldErrors(messages);
  const { descriptionId, errorId, describedBy } = fieldDescribedBy({
    id,
    hasDescription: Boolean(description),
    errors: messages,
    ariaDescribedBy,
  });

  return (
    <BaseField data-invalid={invalid} className={className}>
      {label && (
        <FieldLabel
          htmlFor={id}
          className={srOnlyLabel ? 'sr-only' : undefined}
        >
          {label}
        </FieldLabel>
      )}

      <Input
        {...props}
        id={id}
        type={mask === 'none' ? type : 'text'}
        inputMode={mask === 'none' ? props.inputMode : 'numeric'}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        name={field.name}
        onBlur={handleBlur}
        ref={setInputRef}
        value={displayValue}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        disabled={props.disabled ?? field.disabled}
      />

      {description && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
      <FieldError id={errorId} errors={messages} />
    </BaseField>
  );
}
