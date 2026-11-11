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
  MultiSelect as BaseMultiSelect,
  type MultiSelectOption,
} from './multiSelectPrimitive';

import {
  type FormFieldErrors,
  resolveFieldErrors,
  hasFieldErrors,
} from '@/lib/forms/errors';
import { cn } from '@/lib/utils';
import {
  Field as BaseField,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';

type MultiSelectBaseProps = Omit<
  React.ComponentProps<typeof BaseMultiSelect>,
  'options'
> & {
  label: string;
  /** Mantém o rótulo acessível (leitor de tela) mas oculto visualmente. */
  srOnlyLabel?: boolean;
  description?: string;
  errors?: FormFieldErrors;
  options: MultiSelectOption[];
};

type ControlledMultiSelectProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string[]>,
> = Omit<
  MultiSelectBaseProps,
  'value' | 'defaultValue' | 'onValueChange' | 'name'
> & {
  control: Control<TFieldValues>;
  name: TName;
  rules?: Omit<
    RegisterOptions<TFieldValues, TName>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >;
  defaultValue?: FieldPathValue<TFieldValues, TName>;
};

type UncontrolledMultiSelectProps = MultiSelectBaseProps & {
  control?: never;
  rules?: never;
};

type MultiSelectProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string[]>,
> =
  | ControlledMultiSelectProps<TFieldValues, TName>
  | UncontrolledMultiSelectProps;

function MultiSelectBase({
  id: idProp,
  label,
  srOnlyLabel,
  description,
  errors,
  options,
  'aria-invalid': ariaInvalid,
  ...props
}: MultiSelectBaseProps) {
  const allErrors = resolveFieldErrors(errors);
  const invalid = hasFieldErrors(allErrors);
  const resolvedAriaInvalid = ariaInvalid ?? (invalid || undefined);
  // Sem `id`, o `htmlFor` não ligaria o rótulo (inclusive o `srOnlyLabel`) ao controle.
  const generatedId = useId();
  const id = idProp ?? generatedId;

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

      <BaseMultiSelect
        {...props}
        id={id}
        options={options}
        aria-invalid={resolvedAriaInvalid}
        className={cn('w-full', props.className)}
      />

      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={allErrors} />
    </BaseField>
  );
}

function ControlledMultiSelect<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string[]>,
>({
  control,
  name,
  rules,
  defaultValue,
  errors,
  ...props
}: ControlledMultiSelectProps<TFieldValues, TName>) {
  const {
    field,
    fieldState: { error: fieldError },
  } = useController({
    control,
    name,
    rules,
    defaultValue,
  });

  return (
    <MultiSelectBase
      {...props}
      name={field.name}
      value={Array.isArray(field.value) ? field.value : []}
      onValueChange={field.onChange}
      errors={resolveFieldErrors(fieldError, errors)}
      disabled={props.disabled ?? field.disabled}
    />
  );
}

function isControlled<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string[]>,
>(
  props: MultiSelectProps<TFieldValues, TName>
): props is ControlledMultiSelectProps<TFieldValues, TName> {
  return 'control' in props;
}

export function MultiSelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, string[]> = FieldPathByValue<
    TFieldValues,
    string[]
  >,
>(props: MultiSelectProps<TFieldValues, TName>) {
  if (isControlled(props)) {
    return <ControlledMultiSelect {...props} />;
  }

  return <MultiSelectBase {...props} />;
}
