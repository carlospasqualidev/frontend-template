import * as React from 'react';
import {
  DayPicker,
  type DropdownProps,
  getDefaultClassNames,
  useDayPicker,
  type DayButton,
  type Locale,
} from 'react-day-picker';
import { ptBR } from 'react-day-picker/locale';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function formatMonthDropdownLabel(date: Date, localeCode?: string) {
  const localizedShortMonth = date.toLocaleString(localeCode, {
    month: 'short',
  });
  const withoutTrailingDot = localizedShortMonth.replace(/\.$/, '');

  if (!withoutTrailingDot) {
    return localizedShortMonth;
  }

  return (
    withoutTrailingDot.charAt(0).toUpperCase() + withoutTrailingDot.slice(1)
  );
}

function CalendarDropdown({
  options,
  className,
  value,
  disabled,
  onChange,
  'aria-label': ariaLabel,
}: DropdownProps) {
  const selectedValue = value?.toString() ?? '';

  return (
    <Select
      value={selectedValue}
      disabled={disabled}
      onValueChange={(nextValue) => {
        onChange?.({
          target: { value: nextValue },
          currentTarget: { value: nextValue },
        } as React.ChangeEvent<HTMLSelectElement>);
      }}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        size="sm"
        className={cn('h-7 min-w-20 gap-1 rounded-md', className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72 w-auto min-w-0">
        {options?.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value.toString()}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Navegação do calendário com QUATRO botões, compartilhada por todos os date pickers:
 * `«`/`‹` à esquerda recuam ano/mês, `›`/`»` à direita avançam mês/ano. O mês e o ano (dropdowns ou
 * rótulo) ficam no centro. Substitui a navegação padrão (só mês) via `components.Nav`.
 *
 * O `className` que o DayPicker injeta já posiciona a barra (absoluta, `justify-between`); os botões
 * são `pointer-events-auto` porque a barra em si é `pointer-events-none`. Mês usa os limites do próprio
 * DayPicker (`previousMonth`/`nextMonth`, que respeitam `startMonth`/`endMonth`); ano desloca o mês atual.
 */
function CalendarNav({ className }: { className?: string }) {
  const { months, previousMonth, nextMonth, goToMonth } = useDayPicker();
  const currentMonth = months[0]?.date;

  const irParaOutroAno = (delta: number) => {
    if (!currentMonth) return;
    const alvo = new Date(currentMonth);
    alvo.setFullYear(alvo.getFullYear() + delta);
    goToMonth(alvo);
  };

  const botaoClassName =
    'pointer-events-auto size-(--cell-size) p-0 select-none';

  return (
    <div className={className}>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          aria-label="Ano anterior"
          disabled={!currentMonth}
          className={botaoClassName}
          onClick={() => irParaOutroAno(-1)}
        >
          <ChevronsLeftIcon className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          aria-label="Mês anterior"
          disabled={!previousMonth}
          className={botaoClassName}
          onClick={() => previousMonth && goToMonth(previousMonth)}
        >
          <ChevronLeftIcon className="size-4" />
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          aria-label="Próximo mês"
          disabled={!nextMonth}
          className={botaoClassName}
          onClick={() => nextMonth && goToMonth(nextMonth)}
        >
          <ChevronRightIcon className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          aria-label="Próximo ano"
          disabled={!currentMonth}
          className={botaoClassName}
          onClick={() => irParaOutroAno(1)}
        >
          <ChevronsRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  hideNavigation = false,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant'];
}) {
  const defaultClassNames = getDefaultClassNames();
  const resolvedLocale = locale ?? ptBR;

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      hideNavigation={hideNavigation}
      className={cn(
        'group/calendar bg-background p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent',
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      locale={resolvedLocale}
      formatters={{
        formatMonthDropdown: (date) =>
          formatMonthDropdownLabel(date, resolvedLocale.code),
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn(
          'relative flex flex-col gap-4 md:flex-row',
          defaultClassNames.months
        ),
        // Largura mínima para o cabeçalho caber sem sobreposição: os 4 botões de navegação (« ‹ › »)
        // nas pontas + os dropdowns de mês/ano no centro não cabem na largura compacta do grid, e os
        // botões colavam nos dropdowns.
        month: cn(
          'flex w-full min-w-[18rem] flex-col gap-4',
          defaultClassNames.month
        ),
        nav: cn(
          // `z-20` põe a barra ACIMA do `month_caption` (`z-10`): o caption é `w-full` e, com o padding
          // que reserva espaço para os botões, cobriria a área deles e engoliria o clique. A barra é
          // `pointer-events-none` e só os botões são `pointer-events-auto`, então o centro (dropdowns de
          // mês/ano) segue recebendo clique por baixo.
          'pointer-events-none absolute inset-x-0 top-0 z-20 flex w-full items-center justify-between gap-1',
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          'pointer-events-auto size-(--cell-size) p-0 select-none aria-disabled:opacity-50',
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          'pointer-events-auto size-(--cell-size) p-0 select-none aria-disabled:opacity-50',
          defaultClassNames.button_next
        ),
        month_caption: cn(
          // `px` reserva o espaço dos DOIS botões de nav de cada lado (ano + mês) MAIS uma folga, para o
          // mês/ano central não ficar embaixo nem colado neles.
          'relative z-10 flex h-(--cell-size) w-full items-center justify-center px-[calc(var(--cell-size)*2+0.5rem)]',
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          'flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium',
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          'relative rounded-(--cell-radius)',
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          'absolute inset-0 bg-popover opacity-0',
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          'font-medium select-none',
          captionLayout === 'label'
            ? 'text-sm'
            : 'flex items-center gap-1 rounded-(--cell-radius) text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground',
          defaultClassNames.caption_label
        ),
        month_grid: cn('w-full border-collapse', defaultClassNames.month_grid),
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'flex-1 rounded-(--cell-radius) text-[0.8rem] font-normal text-muted-foreground select-none',
          defaultClassNames.weekday
        ),
        week: cn('mt-2 flex w-full', defaultClassNames.week),
        week_number_header: cn(
          'w-(--cell-size) select-none',
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          'text-[0.8rem] text-muted-foreground select-none',
          defaultClassNames.week_number
        ),
        day: cn(
          'group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)',
          props.showWeekNumber
            ? '[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)'
            : '[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)',
          defaultClassNames.day
        ),
        range_start: cn(
          'relative isolate z-0 rounded-l-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-muted',
          defaultClassNames.range_start
        ),
        range_middle: cn('rounded-none', defaultClassNames.range_middle),
        range_end: cn(
          'relative isolate z-0 rounded-r-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-muted',
          defaultClassNames.range_end
        ),
        today: cn(
          'rounded-(--cell-radius) bg-muted text-foreground data-[selected=true]:rounded-none',
          defaultClassNames.today
        ),
        outside: cn(
          'text-muted-foreground aria-selected:text-muted-foreground',
          defaultClassNames.outside
        ),
        disabled: cn(
          'text-muted-foreground opacity-50',
          defaultClassNames.disabled
        ),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Dropdown: CalendarDropdown,
        Nav: CalendarNav,
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === 'left') {
            return (
              <ChevronLeftIcon className={cn('size-4', className)} {...props} />
            );
          }

          if (orientation === 'right') {
            return (
              <ChevronRightIcon
                className={cn('size-4', className)}
                {...props}
              />
            );
          }

          return (
            <ChevronDownIcon className={cn('size-4', className)} {...props} />
          );
        },
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={resolvedLocale} {...props} />
        ),
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        'relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-r-(--cell-radius) data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-l-(--cell-radius) data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-foreground [&>span]:text-xs [&>span]:opacity-70',
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
