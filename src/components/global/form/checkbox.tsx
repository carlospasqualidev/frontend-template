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
import { InfoTooltip } from '@/components/global/infoTooltip/infoTooltip';

type CheckboxBaseProps = React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  label: string;
  description?: string;
  /**
   * Dica curta num tooltip (ícone "i") ao lado do rótulo, para o detalhe que
   * explica a opção sem ocupar uma linha de `description`.
   */
  labelHint?: React.ReactNode;
  errors?: FormFieldErrors;
  /**
   * Esconde o rótulo visualmente, mantendo-o para o leitor de tela. Para a caixa
   * dentro de uma célula de tabela, onde o cabeçalho da coluna já é o rótulo
   * visual. O rótulo segue no DOM e ligado ao controle.
   */
  srOnlyLabel?: boolean;
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
  labelHint,
  errors,
  srOnlyLabel,
  ...props
}: CheckboxBaseProps) {
  /**
   * O `id` que associa rótulo e controle, DERIVADO quando ninguém o informa:
   * sem ele o `htmlFor` apontaria para `undefined` e o rótulo (inclusive o
   * `srOnlyLabel`) não nomearia o controle.
   */
  const generatedId = useId();
  const id = props.id ?? generatedId;

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

  const fieldLabel = label ? (
    <FieldLabel
      htmlFor={id}
      className={srOnlyLabel ? 'sr-only' : 'cursor-pointer'}
    >
      {label}
    </FieldLabel>
  ) : null;

  return (
    <BaseField data-invalid={invalid}>
      <BaseField orientation="horizontal">
        <BaseCheckbox
          aria-invalid={resolvedAriaInvalid}
          aria-describedby={resolvedAriaDescribedBy}
          {...checkboxProps}
          id={id}
          className="cursor-pointer"
        />
        {/* Com a dica, rótulo e ícone vão juntos: no campo horizontal o rótulo
            ganha `flex-auto` e, sozinho, empurraria a dica para a borda direita.
            A dica fica fora do `<label>` para não entrar no nome do campo. */}
        {labelHint ? (
          <span className="inline-flex items-center gap-1.5">
            {fieldLabel}
            <InfoTooltip label={labelHint} triggerLabel={`Sobre ${label}`} />
          </span>
        ) : (
          fieldLabel
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
  srOnlyLabel,
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
