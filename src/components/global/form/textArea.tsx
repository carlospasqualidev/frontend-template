import { useId } from 'react';
import {
  useController,
  type Control,
  type FieldPathByValue,
  type FieldPathValue,
  type FieldValues,
  type RegisterOptions,
} from 'react-hook-form';

import {
  type FormFieldErrors,
  resolveFieldErrors,
  hasFieldErrors,
} from '@/lib/forms/errors';
import {
  Field as BaseField,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { fieldDescribedBy } from '@/components/global/form/fieldDescribedBy';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type TextAreaBaseProps = React.ComponentProps<'textarea'> & {
  label: string;
  /** Mantém o rótulo acessível (leitor de tela) mas oculto visualmente. */
  srOnlyLabel?: boolean;
  description?: string;
  errors?: FormFieldErrors;
};

type ControlledTextAreaProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
> = Omit<
  TextAreaBaseProps,
  'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'name'
> & {
  control: Control<TFieldValues>;
  name: TName;
  rules?: Omit<
    RegisterOptions<TFieldValues, TName>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >;
  defaultValue?: FieldPathValue<TFieldValues, TName>;
};

type UncontrolledTextAreaProps = TextAreaBaseProps & {
  control?: never;
  rules?: never;
};

type TextAreaProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
> = ControlledTextAreaProps<TFieldValues, TName> | UncontrolledTextAreaProps;

function TextAreaBase({
  id: idProp,
  label,
  srOnlyLabel,
  description,
  errors,
  className,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
  ...props
}: TextAreaBaseProps) {
  const allErrors = resolveFieldErrors(errors);
  const invalid = hasFieldErrors(allErrors);
  const resolvedAriaInvalid = ariaInvalid ?? (invalid || undefined);
  // Sem `id`, o `htmlFor` não ligaria o rótulo (inclusive o `srOnlyLabel`) ao controle.
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const { descriptionId, errorId, describedBy } = fieldDescribedBy({
    id,
    hasDescription: Boolean(description),
    errors: allErrors,
    ariaDescribedBy,
  });

  return (
    <BaseField data-invalid={invalid}>
      {label && (
        <FieldLabel
          htmlFor={id}
          className={srOnlyLabel ? 'sr-only' : undefined}
        >
          {label}
        </FieldLabel>
      )}
      <Textarea
        id={id}
        aria-invalid={resolvedAriaInvalid}
        aria-describedby={describedBy}
        {...props}
        className={cn('min-h-28 resize-none', className)}
      />
      {description && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
      <FieldError id={errorId} errors={allErrors} />
    </BaseField>
  );
}

function ControlledTextArea<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
>({
  control,
  name,
  rules,
  defaultValue,
  errors,
  ...props
}: ControlledTextAreaProps<TFieldValues, TName>) {
  const {
    field,
    fieldState: { error: fieldError },
  } = useController({ control, name, rules, defaultValue });

  return (
    <TextAreaBase
      {...props}
      name={field.name}
      value={typeof field.value === 'string' ? field.value : ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      errors={resolveFieldErrors(fieldError, errors)}
      disabled={props.disabled ?? field.disabled}
    />
  );
}

function isControlled<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
>(
  props: TextAreaProps<TFieldValues, TName>
): props is ControlledTextAreaProps<TFieldValues, TName> {
  return 'control' in props;
}

/**
 * Campo de textarea integrado ao react-hook-form.
 *
 * - **Não controlado**: espalhe `register('campo')` e passe `errors`.
 * - **Controlado**: passe `control` + `name` (mesmo padrão de `InputField`,
 *   `Select`, `Checkbox`, `DateField` e `DateTimeField`).
 */
export function TextArea<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, string> = FieldPathByValue<
    TFieldValues,
    string
  >,
>(props: TextAreaProps<TFieldValues, TName>) {
  if (isControlled(props)) {
    return <ControlledTextArea {...props} />;
  }

  return <TextAreaBase {...props} />;
}
