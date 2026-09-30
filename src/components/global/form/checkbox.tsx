import { useId } from 'react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
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
import { Checkbox as BaseCheckbox } from '@/components/ui/checkbox';

type CheckboxBaseProps = React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  label: string;
  description?: string;
  errors?: FormFieldErrors;
};

type ControlledCheckboxProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, boolean>,
> = Omit<
  CheckboxBaseProps,
  'checked' | 'defaultChecked' | 'onCheckedChange' | 'name'
> & {
  control: Control<TFieldValues>;
  name: TName;
  rules?: Omit<
    RegisterOptions<TFieldValues, TName>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >;
  defaultValue?: FieldPathValue<TFieldValues, TName>;
};

type UncontrolledCheckboxProps = CheckboxBaseProps & {
  control?: never;
  rules?: never;
};

type CheckboxProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, boolean>,
> = ControlledCheckboxProps<TFieldValues, TName> | UncontrolledCheckboxProps;

function CheckboxBase({
  label,
  description,
  errors,
  ...props
}: CheckboxBaseProps) {
  const allErrors = resolveFieldErrors(errors);
  const invalid = hasFieldErrors(allErrors);
  const descriptionId = useId();
  const {
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    ...checkboxProps
  } = props;
  const resolvedAriaInvalid = ariaInvalid ?? (invalid || undefined);
  // A descrição é a descrição acessível do controle: o leitor de tela a lê
  // junto do rótulo (ex.: por que o item está desabilitado).
  const resolvedAriaDescribedBy =
    [description ? descriptionId : undefined, ariaDescribedBy]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <BaseField data-invalid={invalid}>
      <BaseField orientation="horizontal">
        <BaseCheckbox
          aria-invalid={resolvedAriaInvalid}
          aria-describedby={resolvedAriaDescribedBy}
          {...checkboxProps}
          className="cursor-pointer"
        />
        {label && (
          <FieldLabel htmlFor={props.id} className="cursor-pointer">
            {label}
          </FieldLabel>
        )}
      </BaseField>
      {description && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
      <FieldError errors={allErrors} />
    </BaseField>
  );
}

function ControlledCheckbox<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, boolean>,
>({
  control,
  name,
  rules,
  defaultValue,
  label,
  description,
  errors,
  ...props
}: ControlledCheckboxProps<TFieldValues, TName>) {
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
    <CheckboxBase
      {...props}
      label={label}
      description={description}
      name={field.name}
      checked={Boolean(field.value)}
      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
      errors={resolveFieldErrors(fieldError, errors)}
      disabled={props.disabled ?? field.disabled}
    />
  );
}

function isControlled<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, boolean>,
>(
  props: CheckboxProps<TFieldValues, TName>
): props is ControlledCheckboxProps<TFieldValues, TName> {
  return 'control' in props;
}

export function Checkbox<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, boolean> = FieldPathByValue<
    TFieldValues,
    boolean
  >,
>(props: CheckboxProps<TFieldValues, TName>) {
  if (isControlled(props)) {
    return <ControlledCheckbox {...props} />;
  }

  return <CheckboxBase {...props} />;
}
