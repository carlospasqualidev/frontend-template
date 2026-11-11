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
import { Switch as BaseSwitch } from '@/components/ui/switch';

type SwitchBaseProps = React.ComponentProps<typeof BaseSwitch> & {
  label: string;
  description?: string;
  errors?: FormFieldErrors;
  /**
   * Esconde o rótulo visualmente, mantendo-o para o leitor de tela. Para o
   * interruptor dentro de uma célula de tabela, onde o cabeçalho da coluna já é
   * o rótulo visual. O rótulo segue no DOM e ligado ao controle.
   */
  srOnlyLabel?: boolean;
};

type ControlledSwitchProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, boolean>,
> = Omit<
  SwitchBaseProps,
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

type UncontrolledSwitchProps = SwitchBaseProps & {
  control?: never;
  rules?: never;
};

type SwitchProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, boolean>,
> = ControlledSwitchProps<TFieldValues, TName> | UncontrolledSwitchProps;

function SwitchBase({
  label,
  description,
  errors,
  srOnlyLabel,
  ...props
}: SwitchBaseProps) {
  /**
   * O `id` que associa rótulo e controle, DERIVADO quando ninguém o informa:
   * sem ele o `htmlFor` apontaria para `undefined` e o rótulo (inclusive o
   * `srOnlyLabel`) não nomearia o controle.
   */
  const generatedId = useId();
  const id = props.id ?? generatedId;

  const allErrors = resolveFieldErrors(errors);
  const invalid = hasFieldErrors(allErrors);
  const {
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    ...switchProps
  } = props;
  const resolvedAriaInvalid = ariaInvalid ?? (invalid || undefined);
  const { descriptionId, errorId, describedBy } = fieldDescribedBy({
    id,
    hasDescription: Boolean(description),
    errors: allErrors,
    ariaDescribedBy,
  });

  return (
    <BaseField data-invalid={invalid}>
      <BaseField orientation="horizontal">
        <BaseSwitch
          aria-invalid={resolvedAriaInvalid}
          aria-describedby={describedBy}
          {...switchProps}
          id={id}
          className="cursor-pointer"
        />
        {label && (
          <FieldLabel
            htmlFor={id}
            className={srOnlyLabel ? 'sr-only' : 'cursor-pointer'}
          >
            {label}
          </FieldLabel>
        )}
      </BaseField>
      {description && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
      <FieldError id={errorId} errors={allErrors} />
    </BaseField>
  );
}

function ControlledSwitch<
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
  srOnlyLabel,
  ...props
}: ControlledSwitchProps<TFieldValues, TName>) {
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
    <SwitchBase
      {...props}
      label={label}
      description={description}
      srOnlyLabel={srOnlyLabel}
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
  props: SwitchProps<TFieldValues, TName>
): props is ControlledSwitchProps<TFieldValues, TName> {
  return 'control' in props;
}

export function Switch<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, boolean> = FieldPathByValue<
    TFieldValues,
    boolean
  >,
>(props: SwitchProps<TFieldValues, TName>) {
  if (isControlled(props)) {
    return <ControlledSwitch {...props} />;
  }

  return <SwitchBase {...props} />;
}
