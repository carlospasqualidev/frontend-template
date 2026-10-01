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
  DEFAULT_TIME_PARTS,
  extractTimeParts,
  formatDateTimeForDisplay,
  formatDateTimeForForm,
  formatDisplayValue,
  getSegmentDigitCount,
  maskDisplayValue,
  normalizeTimeParts,
  parseDateTimeValue,
  parseDateValue,
  parseDisplayValueToFormValue,
  resolveDateInMonth,
  type TimeParts,
} from '@/lib/dateTime/dateTimeFieldUtils';
import { getCalendarMonthBounds } from '@/lib/dateTime/utils';

type CalendarProps = Omit<
  React.ComponentProps<typeof Calendar>,
  'mode' | 'selected' | 'defaultMonth' | 'onSelect'
>;

type DateTimeFieldBaseProps = Omit<
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

type ControlledDateTimeFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
> = Omit<
  DateTimeFieldBaseProps,
  'value' | 'defaultValue' | 'onChange' | 'name'
> & {
  control: Control<TFieldValues>;
  name: TName;
  rules?: Omit<
    RegisterOptions<TFieldValues, TName>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >;
  defaultValue?: FieldPathValue<TFieldValues, TName>;
};

type UncontrolledDateTimeFieldProps = DateTimeFieldBaseProps & {
  control?: never;
  rules?: never;
};

type DateTimeFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
> =
  | ControlledDateTimeFieldProps<TFieldValues, TName>
  | UncontrolledDateTimeFieldProps;

/**
 * Mantém o foco (e o caret) no input ao clicar num adorno do campo. Os botões de
 * limpar e de horário atual agem SOBRE o input — tirar o foco dele é efeito
 * colateral indesejado do clique, não intenção do usuário.
 */
function preventFocusSteal(event: React.MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

function DateTimeFieldBase({
  id,
  name,
  label,
  description,
  placeholder = 'dd/mm/aaaa hh:mm',
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
}: DateTimeFieldBaseProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const popoverContentRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? '');
  const isControlled = value !== undefined;
  const resolvedValue = isControlled ? (value ?? '') : internalValue;
  const parsedDateTime = React.useMemo(
    () => parseDateTimeValue(resolvedValue),
    [resolvedValue]
  );
  const selectedDate = React.useMemo(
    () => parseDateValue(resolvedValue),
    [resolvedValue]
  );
  const [displayValue, setDisplayValue] = React.useState(() =>
    formatDisplayValue(resolvedValue)
  );
  const [timeDraft, setTimeDraft] = React.useState<TimeParts>(() =>
    extractTimeParts(parsedDateTime)
  );

  const allErrors = resolveFieldErrors(errors);
  const invalid = hasFieldErrors(allErrors);
  const resolvedAriaInvalid = ariaInvalid ?? (invalid || undefined);

  // Último valor que ESTE campo comitou. O efeito de sincronia abaixo ignora o
  // eco do próprio commit para não apagar o texto que está sendo digitado.
  const lastCommittedValue = React.useRef(resolvedValue);

  React.useEffect(() => {
    if (resolvedValue === lastCommittedValue.current) return;

    lastCommittedValue.current = resolvedValue;
    setDisplayValue(formatDisplayValue(resolvedValue));
    setTimeDraft(extractTimeParts(parsedDateTime));
  }, [parsedDateTime, resolvedValue]);

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

  const commitDateAndTime = React.useCallback(
    (date: Date, nextTimeParts: TimeParts) => {
      const normalized = normalizeTimeParts(nextTimeParts);
      const nextDate = new Date(date);

      nextDate.setHours(
        Number(normalized.hour),
        Number(normalized.minute),
        0,
        0
      );

      setTimeDraft(normalized);
      setDisplayValue(formatDateTimeForDisplay(nextDate));
      commitValue(formatDateTimeForForm(nextDate));
    },
    [commitValue]
  );

  const handleInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputEvent = event.nativeEvent as InputEvent | undefined;
      const isDeleting = inputEvent?.inputType?.startsWith('delete') ?? false;
      const rawValue = event.target.value;
      const rawCaret = event.target.selectionStart ?? rawValue.length;
      const maskOptions = {
        shouldAutoStartTime: !isDeleting,
        shouldAutoStartYear: !isDeleting,
      };
      const nextRawChar = rawValue.charAt(rawCaret);
      const prefixMaskOptions = {
        shouldAutoStartTime: !isDeleting && nextRawChar !== ' ',
        shouldAutoStartYear: !isDeleting && nextRawChar !== '/',
      };
      const nextDisplayValue = maskDisplayValue(rawValue, maskOptions);
      const maskedPrefix = maskDisplayValue(
        rawValue.slice(0, rawCaret),
        prefixMaskOptions
      );
      const nextFormValue = parseDisplayValueToFormValue(nextDisplayValue);
      let nextCaret = Math.min(maskedPrefix.length, nextDisplayValue.length);
      const separatorsBeforeCaret =
        nextDisplayValue.slice(0, nextCaret).match(/[/: ]/g)?.length ?? 0;
      const segmentIndex = separatorsBeforeCaret;
      const currentSegmentDigits = getSegmentDigitCount(
        nextDisplayValue,
        segmentIndex
      );
      const requiredDigits =
        nextRawChar === ' '
          ? 4
          : nextRawChar === '/' || nextRawChar === ':'
            ? 2
            : 0;
      const shouldAdvanceOverSeparator =
        !isDeleting &&
        inputEvent?.inputType === 'insertText' &&
        ['/', ' ', ':'].includes(nextRawChar) &&
        nextCaret === rawCaret &&
        currentSegmentDigits >= requiredDigits;

      if (shouldAdvanceOverSeparator) {
        nextCaret = Math.min(nextCaret + 1, nextDisplayValue.length);
      }

      setDisplayValue(nextDisplayValue);
      requestAnimationFrame(() => {
        const input = inputRef.current;

        if (input && document.activeElement === input) {
          input.setSelectionRange(nextCaret, nextCaret);
        }
      });

      if (!nextDisplayValue) {
        commitValue('');
        setTimeDraft(DEFAULT_TIME_PARTS);
        return;
      }

      // O valor do campo é SEMPRE ISO (`aaaa-mm-ddThh:mm`) ou vazio. Enquanto a
      // data/hora digitada está incompleta (`28/07/026`, `28/07/2026 1`), o campo
      // vale vazio — o texto parcial fica só na exibição. Comitá-lo levava a data
      // pt-BR crua para quem consome o campo (filtro → query string → backend).
      commitValue(nextFormValue ?? '');
    },
    [commitValue]
  );

  const handleCalendarSelect = React.useCallback(
    (nextDate: Date | undefined) => {
      if (!nextDate) {
        setDisplayValue('');
        setTimeDraft(DEFAULT_TIME_PARTS);
        commitValue('');
        onBlur?.();
        setOpen(false);
        return;
      }

      commitDateAndTime(nextDate, timeDraft);
      onBlur?.();
      setOpen(false);
    },
    [commitDateAndTime, commitValue, onBlur, timeDraft]
  );

  const handleCalendarMonthChange = React.useCallback(
    (nextMonth: Date) => {
      const preferredDay = selectedDate?.getDate() ?? 1;
      const nextDate = resolveDateInMonth(nextMonth, preferredDay);

      commitDateAndTime(nextDate, timeDraft);
      calendarProps?.onMonthChange?.(nextMonth);
    },
    [calendarProps, commitDateAndTime, selectedDate, timeDraft]
  );

  const handleClearValue = React.useCallback(() => {
    setDisplayValue('');
    setTimeDraft(DEFAULT_TIME_PARTS);
    commitValue('');
    onBlur?.();
    setOpen(false);
  }, [commitValue, onBlur]);

  const handleSetNow = React.useCallback(() => {
    const now = new Date();
    const nowTime = extractTimeParts(now);
    commitDateAndTime(now, nowTime);

    onBlur?.();
  }, [commitDateAndTime, onBlur]);

  const handleInputBlur = React.useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      if (open) {
        return;
      }

      const nextFocusedElement = event.relatedTarget;

      // O foco indo para um adorno do PRÓPRIO campo (limpar / horário atual /
      // abrir calendário) ou para o conteúdo do popover não é "sair do campo" —
      // não propague o blur. Sem esta guarda, clicar num desses botões com o
      // campo ainda vazio disparava a validação (`mode: 'onBlur'`) do valor
      // vazio e piscava o erro de obrigatório ANTES de o clique preencher a
      // data — o usuário via o erro e só o segundo clique "funcionava".
      // O valor digitado já é comitado a cada tecla em `handleInputChange`,
      // então adiar a normalização do blur aqui não perde nada.
      if (
        nextFocusedElement instanceof HTMLElement &&
        (fieldRef.current?.contains(nextFocusedElement) ||
          popoverContentRef.current?.contains(nextFocusedElement))
      ) {
        return;
      }

      const nextFormValue = parseDisplayValueToFormValue(displayValue);
      const parsedNextDate = nextFormValue
        ? parseDateTimeValue(nextFormValue)
        : undefined;

      if (parsedNextDate) {
        commitDateAndTime(parsedNextDate, extractTimeParts(parsedNextDate));
      } else if (displayValue) {
        // Ao sair do campo, data e hora incompleta é descartada: o campo fica
        // vazio em vez de exibir um texto que não corresponde a nenhum instante.
        // Campo já vazio não passa por aqui — comitar apagaria "não preenchido"
        // por "vazio" e sujaria o formulário só por passar o foco pelo campo.
        setDisplayValue('');
        setTimeDraft(DEFAULT_TIME_PARTS);
        commitValue('');
      }

      onBlur?.();
    },
    [commitDateAndTime, commitValue, displayValue, onBlur, open]
  );

  const handleTimeInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const [hour = '', minute = ''] = event.target.value.split(':');

      setTimeDraft({
        hour: hour.slice(0, 2),
        minute: minute.slice(0, 2),
      });
    },
    []
  );

  const handleTimeInputBlur = React.useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      const nextFocusedElement = event.relatedTarget;

      if (
        nextFocusedElement instanceof HTMLElement &&
        popoverContentRef.current?.contains(nextFocusedElement)
      ) {
        return;
      }

      const normalized = normalizeTimeParts(timeDraft);

      setTimeDraft(normalized);

      if (selectedDate) {
        commitDateAndTime(selectedDate, normalized);
        onBlur?.();
      }

      if (!selectedDate && displayValue) {
        const nextFormValue = parseDisplayValueToFormValue(displayValue);

        if (nextFormValue) {
          const parsedNextDate = parseDateTimeValue(nextFormValue);

          if (parsedNextDate) {
            commitDateAndTime(parsedNextDate, normalized);
          }
        }
      }
    },
    [commitDateAndTime, displayValue, onBlur, selectedDate, timeDraft]
  );

  const timeInputValue = React.useMemo(() => {
    const normalized = normalizeTimeParts({
      hour: timeDraft.hour || '00',
      minute: timeDraft.minute || '00',
    });
    return `${normalized.hour}:${normalized.minute}`;
  }, [timeDraft.hour, timeDraft.minute]);
  const hasValue = displayValue.trim().length > 0;
  const calendarMonthBounds = getCalendarMonthBounds();

  return (
    <BaseField data-invalid={invalid}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div ref={fieldRef} className="relative">
            <Input
              {...props}
              ref={inputRef}
              id={id}
              name={name}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder={placeholder}
              value={displayValue}
              disabled={disabled}
              aria-invalid={resolvedAriaInvalid}
              // pr-22 = os 3 adornos agrupados (3 × size-7 = 84px) + folga. Antes era
              // pr-28 com os botões espalhados em right-1/9/16, o que exigia um campo
              // mais largo que o padrão da barra de filtros (`sm:w-60`).
              className={cn('pr-22', className)}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
            />

            {/* Adornos AGRUPADOS num flex: o cluster ocupa só o que precisa e não
                depende de `right-N` calculado à mão por botão (que obrigava a reservar
                padding a mais e estourava a largura padrão do campo). */}
            <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center">
              {hasValue && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled}
                  aria-label="Limpar data e horário"
                  onMouseDown={preventFocusSteal}
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
                aria-label="Definir horário atual"
                onMouseDown={preventFocusSteal}
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
                  aria-label="Abrir calendário e horário"
                >
                  <CalendarIcon className="size-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
            </div>
          </div>
        </PopoverAnchor>

        <PopoverContent
          ref={popoverContentRef}
          className="w-auto overflow-hidden p-0"
          align="center"
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate}
            onSelect={handleCalendarSelect}
            onMonthChange={handleCalendarMonthChange}
            captionLayout="dropdown"
            startMonth={calendarMonthBounds.startMonth}
            endMonth={calendarMonthBounds.endMonth}
            {...calendarProps}
          />

          <div className="border-t border-border/60 bg-muted/20 px-2 py-1.5">
            <div className="mb-2 flex justify-center gap-1.5 text-[13px] font-medium text-muted-foreground">
              Horário
            </div>
            <div className="mb-0.5 flex items-center justify-center">
              <div className="relative">
                <Clock2Icon className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="time"
                  step={60}
                  min="00:00"
                  max="23:59"
                  value={timeInputValue}
                  className="h-8 w-[5.2rem] appearance-none pr-2 pl-7 text-xs tabular-nums [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none [&::-webkit-datetime-edit-millisecond-field]:hidden [&::-webkit-datetime-edit-second-field]:m-0 [&::-webkit-datetime-edit-second-field]:hidden [&::-webkit-datetime-edit-second-field]:p-0"
                  onChange={handleTimeInputChange}
                  onBlur={handleTimeInputBlur}
                  disabled={disabled}
                  aria-label="Horário"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={allErrors} />
    </BaseField>
  );
}

function ControlledDateTimeField<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
>({
  control,
  name,
  rules,
  defaultValue,
  errors,
  ...props
}: ControlledDateTimeFieldProps<TFieldValues, TName>) {
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
    <DateTimeFieldBase
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
  props: DateTimeFieldProps<TFieldValues, TName>
): props is ControlledDateTimeFieldProps<TFieldValues, TName> {
  return 'control' in props;
}

export function DateTimeField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPathByValue<TFieldValues, string> = FieldPathByValue<
    TFieldValues,
    string
  >,
>(props: DateTimeFieldProps<TFieldValues, TName>) {
  if (isControlled(props)) {
    return <ControlledDateTimeField {...props} />;
  }

  return <DateTimeFieldBase {...props} />;
}
