import * as React from 'react';
import { Select as SelectPrimitive } from 'radix-ui';
import {
  useController,
  type Control,
  type FieldPathByValue,
  type FieldPathValue,
  type FieldValues,
  type RegisterOptions,
} from 'react-hook-form';

import { ComboboxInput } from './combobox';

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
import {
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  Select as BaseSelect,
} from '@/components/ui/select';

/**
 * Acima deste número de opções o `Select` liga a busca automaticamente (a menos
 * que `searchable` seja passado explicitamente). Listas curtas continuam como o
 * dropdown puro do Radix — sem uma caixa de busca inútil.
 */
const SEARCHABLE_OPTION_THRESHOLD = 8;

type SelectBaseProps = React.ComponentProps<typeof SelectPrimitive.Root> & {
  id?: string;
  label: string;
  /** Mantém o rótulo acessível (leitor de tela) mas oculto visualmente — para uso
   *  em células de tabela onde o cabeçalho da coluna já é o rótulo visual. */
  srOnlyLabel?: boolean;
  description?: string;
  placeholder?: string;
  errors?: FormFieldErrors;
  'aria-invalid'?: boolean;
  options: { value: string; label: string; disabled?: boolean }[];
  /**
   * Exibe um campo de busca no topo da lista (como o `MultiSelect`). Quando
   * omitido, liga automaticamente para listas longas (mais de
   * `SEARCHABLE_OPTION_THRESHOLD` opções); passe `true`/`false` para forçar. Como o
   * Radix Select não tem busca embutida, o modo pesquisável troca a renderização
   * para o núcleo do `Combobox` — mantendo a mesma API do `Select`.
   */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Texto exibido quando a busca não retorna opções. */
  emptyText?: string;
  /**
   * Só no modo `searchable`: portala o popover para o `body`. **Padrão `true`** —
   * espelha o Radix Select (que sempre portala), garantindo o posicionamento
   * correto sob o campo em qualquer página, mesmo com ancestrais que criam
   * containing block para `position: fixed` (transform/overflow/contain). Passe
   * `portal={false}` só DENTRO de um Dialog/Drawer, onde a roda do mouse precisa
   * rolar a lista (o `react-remove-scroll` do modal só libera o wheel em conteúdo
   * não portalado).
   */
  portal?: boolean;
};

type ControlledSelectProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
> = Omit<
  SelectBaseProps,
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

type UncontrolledSelectProps = SelectBaseProps & {
  control?: never;
  rules?: never;
};

type SelectProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
> = ControlledSelectProps<TFieldValues, TName> | UncontrolledSelectProps;

function SelectBase({
  id,
  label,
  srOnlyLabel,
  description,
  placeholder,
  errors,
  options,
  searchable,
  searchPlaceholder,
  emptyText,
  portal,
  value,
  defaultValue,
  onValueChange,
  disabled,
  'aria-invalid': ariaInvalid,
  ...props
}: SelectBaseProps) {
  const allErrors = resolveFieldErrors(errors);
  const invalid = hasFieldErrors(allErrors);
  const resolvedAriaInvalid = ariaInvalid ?? (invalid || undefined);

  // Fallback interno para o modo `searchable` uncontrolled (com `defaultValue`).
  // No modo Radix (não-pesquisável) quem cuida disso é o próprio Radix Select.
  const [internalValue, setInternalValue] = React.useState(
    typeof defaultValue === 'string' ? defaultValue : ''
  );
  const searchableValue = value === undefined ? internalValue : value;
  const handleSearchableChange = (next: string) => {
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
  };

  // Auto: liga a busca em listas longas; `searchable` explícito (true/false) força.
  const isSearchable = searchable ?? options.length > SEARCHABLE_OPTION_THRESHOLD;

  return (
    <BaseField data-invalid={invalid}>
      {label && (
        <FieldLabel htmlFor={id} className={srOnlyLabel ? 'sr-only' : undefined}>
          {label}
        </FieldLabel>
      )}

      {isSearchable ? (
        <ComboboxInput
          id={id}
          value={searchableValue}
          onValueChange={handleSearchableChange}
          options={options}
          placeholder={placeholder}
          searchPlaceholder={searchPlaceholder}
          emptyText={emptyText}
          disabled={disabled}
          portal={portal ?? true}
          aria-invalid={resolvedAriaInvalid}
        />
      ) : (
        <BaseSelect
          {...props}
          value={value}
          defaultValue={defaultValue}
          onValueChange={onValueChange}
          disabled={disabled}
        >
          <SelectTrigger id={id} aria-invalid={resolvedAriaInvalid}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options.map(({ label, value, disabled }) => (
                <SelectItem key={value} value={value} disabled={disabled}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </BaseSelect>
      )}

      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={allErrors} />
    </BaseField>
  );
}

function ControlledSelect<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
>({
  control,
  name,
  rules,
  defaultValue,
  errors,
  ...props
}: ControlledSelectProps<TFieldValues, TName>) {
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
    <SelectBase
      {...props}
      name={field.name}
      value={typeof field.value === 'string' ? field.value : ''}
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
  props: SelectProps<TFieldValues, TName>
): props is ControlledSelectProps<TFieldValues, TName> {
  return 'control' in props;
}

export function Select<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, string> = FieldPathByValue<
    TFieldValues,
    string
  >,
>(props: SelectProps<TFieldValues, TName>) {
  if (isControlled(props)) {
    return <ControlledSelect {...props} />;
  }

  return <SelectBase {...props} />;
}
