import * as React from 'react';
import {
  useController,
  type Control,
  type FieldPathByValue,
  type FieldValues,
} from 'react-hook-form';
import { CheckIcon, ChevronDownIcon, SearchIcon, XIcon } from 'lucide-react';

import {
  Field as BaseField,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useInModal } from '@/components/global/modal/inModalContext';
import {
  hasFieldErrors,
  resolveFieldErrors,
  type FormFieldErrors,
} from '@/lib/forms/errors';
import { cn } from '@/lib/utils';

// No mobile (ponteiro de toque) NÃO autofocamos a busca: o autofoco abre o teclado
// automaticamente e, dentro do drawer, empurra o modal para cima e deixa um vão
// vazio ao fechar (o teclado esconde e o layout não se recompõe). No desktop
// (ponteiro fino) mantém o autofoco para digitar de imediato. No toque, o usuário
// ainda pode tocar na busca para filtrar; a lista já aparece pronta para seleção.
function shouldAutoFocusSearch(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return true;
  return !window.matchMedia('(pointer: coarse)').matches;
}

export interface ComboboxInputProps {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  /**
   * Portala o popover para o `body`. **Por padrão é automático pelo contexto**:
   * `false` dentro de um `Modal` (senão abre atrás dele e a roda não rola a lista),
   * `true` em página (ancora sob o campo). Só passe explicitamente para forçar.
   */
  portal?: boolean;
  /**
   * Exibe um botão "X" para limpar a seleção (volta a `''`). Só aparece quando há
   * valor selecionado e o campo não está desabilitado. Use em campos opcionais.
   */
  clearable?: boolean;
  'aria-invalid'?: boolean;
}

/**
 * Núcleo do combobox: gatilho + popover com busca e seleção única. Reutilizado
 * pelo `Select` global no modo `searchable` (o Radix Select não tem busca).
 */
export function ComboboxInput({
  id,
  value,
  onValueChange,
  options,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Buscar...',
  emptyText = 'Nenhuma opção encontrada.',
  disabled,
  portal,
  clearable,
  'aria-invalid': ariaInvalid,
}: ComboboxInputProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  // Default do portal pelo contexto: dentro de um `Modal` NÃO portala (o popover
  // abriria atrás do modal e a roda do mouse não rolaria); em página, portala
  // (ancora sob o campo). A prop `portal` explícita sempre vence.
  const inModal = useInModal();
  const resolvedPortal = portal ?? !inModal;

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? null;
  const showClear = Boolean(clearable && value && !disabled);
  const normalized = search.trim().toLowerCase();
  const filtered = normalized
    ? options.filter((option) =>
        option.label.toLowerCase().includes(normalized)
      )
    : options;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch('');
      }}
    >
      <div className="relative">
        <PopoverTrigger
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          className={cn(
            'flex h-8 w-full cursor-pointer items-center rounded-lg border border-input bg-transparent py-1 pr-8 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:bg-input/30 dark:hover:bg-input/50',
            showClear && 'pr-14'
          )}
        >
          <span
            className={cn(
              'line-clamp-1 flex-1 text-left',
              !selectedLabel && 'text-muted-foreground'
            )}
          >
            {selectedLabel ?? placeholder}
          </span>
        </PopoverTrigger>
        {/* Seta e X são absolutos (fora do flow) para o X não empurrar/cobrir a seta. */}
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        {showClear && (
          <button
            type="button"
            aria-label="Limpar seleção"
            onClick={() => onValueChange('')}
            className="absolute top-1/2 right-8 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none dark:hover:bg-muted/50"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>

      <PopoverContent
        align="start"
        portal={resolvedPortal}
        className="w-(--radix-popover-trigger-width) gap-1.5 p-1"
      >
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus={shouldAutoFocusSearch()}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 w-full rounded-md border border-input bg-transparent pr-2.5 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
          />
        </div>

        {/* Scroll NATIVO (não o ScrollArea do Radix): dentro de um Dialog/Drawer o
            react-remove-scroll só libera a roda do mouse em containers de overflow
            nativo — com o ScrollArea a lista não rola no wheel. */}
        <div role="listbox" className="max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-1.5 py-6 text-center text-sm text-muted-foreground">
              {emptyText}
            </p>
          ) : (
            filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                disabled={option.disabled}
                onClick={() => {
                  onValueChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 rounded-md py-1.5 pr-2 pl-1.5 text-left text-sm select-none hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
                  option.value === value && 'bg-accent'
                )}
              >
                <span className="flex-1">{option.label}</span>
                {option.value === value && (
                  <CheckIcon className="size-4 shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface ComboboxBaseProps {
  id?: string;
  label: string;
  /** Mantém o rótulo acessível (leitor de tela) mas oculto visualmente — para uso
   *  em células de tabela onde o cabeçalho da coluna já é o rótulo visual. */
  srOnlyLabel?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  options: { value: string; label: string }[];
  errors?: FormFieldErrors;
  disabled?: boolean;
  /**
   * Portala o conteúdo do popover para o `body`. **Automático pelo contexto**:
   * `false` dentro de um `Modal` (o `InModalContext` sinaliza), `true` em página.
   * Não é preciso passar manualmente; a prop existe só como escape hatch para
   * forçar. Ver `CLAUDE.md` → "Lista suspensa dentro de Dialog/Drawer".
   */
  portal?: boolean;
  /**
   * Exibe um botão "X" para limpar a seleção (volta a `''`). Use em campos
   * opcionais onde faz sentido desfazer a escolha.
   */
  clearable?: boolean;
}

type ControlledComboboxProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
> = ComboboxBaseProps & {
  control: Control<TFieldValues>;
  name: TName;
};

type UncontrolledComboboxProps = ComboboxBaseProps & {
  control?: never;
  value: string;
  onValueChange: (value: string) => void;
};

function ComboboxField({
  id,
  label,
  srOnlyLabel,
  errors,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  portal,
  clearable,
  value,
  onValueChange,
}: ComboboxBaseProps & {
  value: string;
  onValueChange: (value: string) => void;
}) {
  const allErrors = resolveFieldErrors(errors);
  const invalid = hasFieldErrors(allErrors);

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
      <ComboboxInput
        id={id}
        value={value}
        onValueChange={onValueChange}
        options={options}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyText={emptyText}
        disabled={disabled}
        portal={portal}
        clearable={clearable}
        aria-invalid={invalid || undefined}
      />
      <FieldError errors={allErrors} />
    </BaseField>
  );
}

function ControlledCombobox<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
>({ control, name, ...rest }: ControlledComboboxProps<TFieldValues, TName>) {
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });

  return (
    <ComboboxField
      {...rest}
      errors={error}
      value={typeof field.value === 'string' ? field.value : ''}
      onValueChange={field.onChange}
    />
  );
}

function isControlled<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
>(
  props:
    | ControlledComboboxProps<TFieldValues, TName>
    | UncontrolledComboboxProps
): props is ControlledComboboxProps<TFieldValues, TName> {
  return 'control' in props;
}

/**
 * Select **pesquisável** de seleção única, integrado ao react-hook-form
 * (controlled via `control` + `name`) ou uncontrolled (`value` + `onValueChange`).
 * Use quando a lista de opções é grande — o
 * `Select` global (Radix) não tem busca.
 */
export function Combobox<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
>(
  props:
    | ControlledComboboxProps<TFieldValues, TName>
    | UncontrolledComboboxProps
) {
  if (isControlled(props)) {
    return <ControlledCombobox {...props} />;
  }
  return <ComboboxField {...props} />;
}
