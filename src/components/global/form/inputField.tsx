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
import { Input } from '@/components/ui/input';

type InputFieldBaseProps = React.ComponentProps<'input'> & {
  label: string;
  /** Mantém o rótulo acessível (leitor de tela) mas oculto visualmente — para uso
   *  em células de tabela onde o cabeçalho da coluna já é o rótulo visual. */
  srOnlyLabel?: boolean;
  description?: string;
  errors?: FormFieldErrors;
};

type ControlledInputFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
> = Omit<
  InputFieldBaseProps,
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

type UncontrolledInputFieldProps = InputFieldBaseProps & {
  control?: never;
  rules?: never;
};

type InputFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
> =
  ControlledInputFieldProps<TFieldValues, TName> | UncontrolledInputFieldProps;

function InputFieldBase({
  label,
  srOnlyLabel,
  description,
  type,
  id,
  'aria-invalid': ariaInvalid,
  errors,
  ...props
}: InputFieldBaseProps) {
  const allErrors = resolveFieldErrors(errors);
  const invalid = hasFieldErrors(allErrors);
  const resolvedAriaInvalid = ariaInvalid ?? (invalid || undefined);

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

      <Input
        id={id}
        type={type}
        aria-invalid={resolvedAriaInvalid}
        {...props}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={allErrors} />
    </BaseField>
  );
}

function ControlledInputField<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
>({
  control,
  name,
  rules,
  defaultValue,
  errors,
  ...props
}: ControlledInputFieldProps<TFieldValues, TName>) {
  const {
    field,
    fieldState: { error: fieldError },
  } = useController({ control, name, rules, defaultValue });

  return (
    <InputFieldBase
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
  props: InputFieldProps<TFieldValues, TName>
): props is ControlledInputFieldProps<TFieldValues, TName> {
  return 'control' in props;
}

/**
 * Campo de input integrado ao react-hook-form.
 *
 * - **Não controlado**: espalhe `register('campo')` e passe `errors`.
 * - **Controlado**: passe `control` + `name` (mesmo padrão de `Select`,
 *   `Checkbox`, `DateField` e `DateTimeField`).
 */
export function InputField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, string> = FieldPathByValue<
    TFieldValues,
    string
  >,
>(props: InputFieldProps<TFieldValues, TName>) {
  if (isControlled(props)) {
    return <ControlledInputField {...props} />;
  }

  return <InputFieldBase {...props} />;
}
