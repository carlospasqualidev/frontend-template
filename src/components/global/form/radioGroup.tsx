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
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { fieldDescribedBy } from '@/components/global/form/fieldDescribedBy';
import {
  RadioGroup as BaseRadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';

export interface IRadioGroupOption {
  /** Valor técnico (o que vai para o formulário); nunca é mostrado. */
  value: string;
  /** Rótulo pt-BR mostrado na tela. */
  label: string;
  description?: string;
}

type RadioGroupBaseProps = Omit<
  React.ComponentProps<typeof BaseRadioGroup>,
  'children'
> & {
  /** Título do grupo (legenda do `fieldset`): obrigatório, é o nome acessível. */
  label: string;
  options: IRadioGroupOption[];
  errors?: FormFieldErrors;
  /**
   * Esconde a legenda visualmente, mantendo-a para o leitor de tela. A legenda
   * segue no DOM e ligada ao grupo.
   */
  srOnlyLabel?: boolean;
};

type ControlledRadioGroupProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
> = Omit<
  RadioGroupBaseProps,
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

type UncontrolledRadioGroupProps = RadioGroupBaseProps & {
  control?: never;
  rules?: never;
};

type RadioGroupProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
> =
  ControlledRadioGroupProps<TFieldValues, TName> | UncontrolledRadioGroupProps;

function RadioGroupBase({
  label,
  options,
  errors,
  srOnlyLabel,
  ...props
}: RadioGroupBaseProps) {
  /**
   * Prefixo que liga legenda, rótulos e descrições aos controles, DERIVADO
   * quando ninguém informa `id`: sem ele os `htmlFor` apontariam para
   * `undefined`.
   */
  const generatedId = useId();
  const baseId = props.id ?? generatedId;
  const legendId = `${baseId}-legend`;

  const allErrors = resolveFieldErrors(errors);
  const invalid = hasFieldErrors(allErrors);
  const {
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    ...groupProps
  } = props;
  const resolvedAriaInvalid = ariaInvalid ?? (invalid || undefined);
  // O erro é do grupo: vai no elemento `role="radiogroup"`. A descrição de cada
  // opção segue ligada à própria opção.
  const { errorId, describedBy } = fieldDescribedBy({
    id: baseId,
    hasDescription: false,
    errors: allErrors,
    ariaDescribedBy,
  });

  return (
    <FieldSet data-invalid={invalid}>
      <FieldLegend
        variant="label"
        id={legendId}
        className={srOnlyLabel ? 'sr-only' : undefined}
      >
        {label}
      </FieldLegend>
      <BaseRadioGroup
        aria-labelledby={legendId}
        aria-invalid={resolvedAriaInvalid}
        aria-describedby={describedBy}
        {...groupProps}
        id={baseId}
      >
        {options.map((option) => {
          const id = `${baseId}-option-${option.value}`;
          const descriptionId = option.description
            ? `${id}-description`
            : undefined;
          return (
            <BaseField key={option.value} orientation="horizontal">
              <RadioGroupItem
                id={id}
                value={option.value}
                aria-invalid={resolvedAriaInvalid}
                aria-describedby={descriptionId}
              />
              <div className="flex flex-col gap-0.5">
                <FieldLabel htmlFor={id} className="cursor-pointer">
                  {option.label}
                </FieldLabel>
                {option.description && (
                  <FieldDescription id={descriptionId}>
                    {option.description}
                  </FieldDescription>
                )}
              </div>
            </BaseField>
          );
        })}
      </BaseRadioGroup>
      <FieldError id={errorId} errors={allErrors} />
    </FieldSet>
  );
}

function ControlledRadioGroup<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
>({
  control,
  name,
  rules,
  defaultValue,
  errors,
  ...props
}: ControlledRadioGroupProps<TFieldValues, TName>) {
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
    <RadioGroupBase
      {...props}
      name={field.name}
      value={String(field.value ?? '')}
      onValueChange={field.onChange}
      errors={resolveFieldErrors(fieldError, errors)}
      disabled={props.disabled ?? field.disabled}
    />
  );
}

function isControlled<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
>(
  props: RadioGroupProps<TFieldValues, TName>
): props is ControlledRadioGroupProps<TFieldValues, TName> {
  return 'control' in props;
}

/** Escolha de UMA opção entre poucas (lista curta); rótulos pt-BR, valores técnicos. */
export function RadioGroup<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, string> = FieldPathByValue<
    TFieldValues,
    string
  >,
>(props: RadioGroupProps<TFieldValues, TName>) {
  if (isControlled(props)) {
    return <ControlledRadioGroup {...props} />;
  }

  return <RadioGroupBase {...props} />;
}
