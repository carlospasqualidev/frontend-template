import * as React from 'react';
import { CalendarIcon, Clock2Icon, XIcon } from 'lucide-react';
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
  hasFieldErrors,
  resolveFieldErrors,
} from '@/lib/forms/errors';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Field as BaseField,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  PopoverAnchor,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  formatDateForDisplay,
  formatDateForForm,
  formatDisplayValue,
  maskDisplayValue,
  parseDateValue,
  parseDisplayValueToFormValue,
  resolveDateInMonth,
} from '@/lib/dateTime/dateFieldUtils';

type CalendarProps = Omit<
  React.ComponentProps<typeof Calendar>,
  'mode' | 'selected' | 'defaultMonth' | 'onSelect'
>;

type DateFieldBaseProps = Omit<
  React.ComponentProps<'input'>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'onBlur'
> & {
  label: string;
  description?: string;
  errors?: FormFieldErrors;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  calendarProps?: CalendarProps;
};

type ControlledDateFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
> = Omit<DateFieldBaseProps, 'value' | 'defaultValue' | 'onChange' | 'name'> & {
  control: Control<TFieldValues>;
  name: TName;
  rules?: Omit<
    RegisterOptions<TFieldValues, TName>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >;
  defaultValue?: FieldPathValue<TFieldValues, TName>;
};

type UncontrolledDateFieldProps = DateFieldBaseProps & {
  control?: never;
  rules?: never;
};

type DateFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
> = ControlledDateFieldProps<TFieldValues, TName> | UncontrolledDateFieldProps;

function DateFieldBase({
  id,
  name,
  label,
  description,
  placeholder = 'dd/mm/aaaa',
  errors,
  value,
  defaultValue,
  onChange,
  onBlur,
  disabled,
  className,
  'aria-invalid': ariaInvalid,
  calendarProps,
  ...props
}: DateFieldBaseProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? '');
  const isControlled = value !== undefined;
  const resolvedValue = isControlled ? (value ?? '') : internalValue;
  const [displayValue, setDisplayValue] = React.useState(() =>
    formatDisplayValue(resolvedValue)
  );

  const allErrors = resolveFieldErrors(errors);
  const invalid = hasFieldErrors(allErrors);
  const resolvedAriaInvalid = ariaInvalid ?? (invalid || undefined);
  const selectedDate = React.useMemo(
    () => parseDateValue(resolvedValue),
    [resolvedValue]
  );

  // Último valor que ESTE campo comitou. O efeito de sincronia abaixo ignora o
  // eco do próprio commit para não apagar o texto que está sendo digitado.
  const lastCommittedValue = React.useRef(resolvedValue);

  React.useEffect(() => {
    if (resolvedValue === lastCommittedValue.current) return;

    lastCommittedValue.current = resolvedValue;
    setDisplayValue(formatDisplayValue(resolvedValue));
  }, [resolvedValue]);

  const commitValue = React.useCallback(
    (nextValue: string) => {
      lastCommittedValue.current = nextValue;

      if (!isControlled) {
        setInternalValue(nextValue);
      }

      onChange?.(nextValue);
    },
    [isControlled, onChange]
  );

  const handleInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputEvent = event.nativeEvent as InputEvent | undefined;
      const isDeleting = inputEvent?.inputType?.startsWith('delete') ?? false;
      // Apagando, a máscara não reinsere a barra do ano — senão ela volta a cada
      // tecla e o campo trava em `28/07/`, sem deixar apagar para trás.
      const nextDisplayValue = maskDisplayValue(event.target.value, {
        shouldAutoStartYear: !isDeleting,
      });
      const nextFormValue = parseDisplayValueToFormValue(nextDisplayValue);

      setDisplayValue(nextDisplayValue);

      // O valor do campo é SEMPRE ISO (`aaaa-mm-dd`) ou vazio. Enquanto a data
      // digitada está incompleta/inexistente (`28/07/026`), o campo vale vazio —
      // o texto parcial fica só na exibição. Comitá-lo levava a data pt-BR crua
      // para quem consome o campo (filtro → query string → backend).
      commitValue(nextFormValue ?? '');
    },
    [commitValue]
  );

  const handleCalendarSelect = React.useCallback(
    (nextDate: Date | undefined) => {
      const nextFormValue = nextDate ? formatDateForForm(nextDate) : '';
      const nextDisplayValue = nextDate ? formatDateForDisplay(nextDate) : '';

      setDisplayValue(nextDisplayValue);
      commitValue(nextFormValue);
      onBlur?.();
      setOpen(false);
    },
    [commitValue, onBlur]
  );

  const handleCalendarMonthChange = React.useCallback(
    (nextMonth: Date) => {
      const preferredDay = selectedDate?.getDate() ?? 1;
      const nextDate = resolveDateInMonth(nextMonth, preferredDay);

      setDisplayValue(formatDateForDisplay(nextDate));
      commitValue(formatDateForForm(nextDate));
      calendarProps?.onMonthChange?.(nextMonth);
    },
    [calendarProps, commitValue, selectedDate]
  );

  const handleClearValue = React.useCallback(() => {
    setDisplayValue('');
    commitValue('');
    onBlur?.();
    setOpen(false);
  }, [commitValue, onBlur]);

  const handleSetNow = React.useCallback(() => {
    const now = new Date();

    setDisplayValue(formatDateForDisplay(now));
    commitValue(formatDateForForm(now));
    onBlur?.();
  }, [commitValue, onBlur]);

  const handleInputBlur = React.useCallback(() => {
    const nextFormValue = parseDisplayValueToFormValue(displayValue);

    // Ao sair do campo, data incompleta/inexistente é descartada: o campo fica
    // vazio em vez de exibir um texto que não corresponde a nenhuma data. Campo
    // já vazio não passa por aqui — comitar apagaria "não preenchido" por
    // "vazio" e sujaria o formulário só por passar o foco pelo campo.
    if (displayValue) {
      setDisplayValue(nextFormValue ? formatDisplayValue(nextFormValue) : '');
      commitValue(nextFormValue ?? '');
    }

    onBlur?.();
  }, [commitValue, displayValue, onBlur]);
  const hasValue = displayValue.trim().length > 0;

  return (
    <BaseField data-invalid={invalid}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            <Input
              {...props}
              id={id}
              name={name}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder={placeholder}
              value={displayValue}
              disabled={disabled}
              aria-invalid={resolvedAriaInvalid}
              className={cn('pr-28', className)}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
            />

            {hasValue && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                aria-label="Limpar data"
                className="absolute top-1/2 right-16 -translate-y-1/2! transition-colors active:-translate-y-1/2!"
                onClick={handleClearValue}
              >
                <XIcon className="size-4 text-muted-foreground" />
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              aria-label="Definir data atual"
              className="absolute top-1/2 right-9 -translate-y-1/2! transition-colors active:-translate-y-1/2!"
              onClick={handleSetNow}
            >
              <Clock2Icon className="size-4 text-muted-foreground" />
            </Button>

            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                aria-label="Abrir calendário"
                className="absolute top-1/2 right-1 -translate-y-1/2! transition-colors active:-translate-y-1/2!"
              >
                <CalendarIcon className="size-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
          </div>
        </PopoverAnchor>

        <PopoverContent className="w-auto overflow-hidden p-0" align="center">
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate}
            onSelect={handleCalendarSelect}
            onMonthChange={handleCalendarMonthChange}
            captionLayout="dropdown"
            {...calendarProps}
          />
        </PopoverContent>
      </Popover>

      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={allErrors} />
    </BaseField>
  );
}

function ControlledDateField<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
>({
  control,
  name,
  rules,
  defaultValue,
  errors,
  ...props
}: ControlledDateFieldProps<TFieldValues, TName>) {
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
    <DateFieldBase
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
  props: DateFieldProps<TFieldValues, TName>
): props is ControlledDateFieldProps<TFieldValues, TName> {
  return 'control' in props;
}

export function DateField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, string> = FieldPathByValue<
    TFieldValues,
    string
  >,
>(props: DateFieldProps<TFieldValues, TName>) {
  if (isControlled(props)) {
    return <ControlledDateField {...props} />;
  }

  return <DateFieldBase {...props} />;
}
