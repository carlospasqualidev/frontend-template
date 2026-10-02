import * as React from 'react';
import { ChevronDownIcon, SearchIcon, XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

export type MultiSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Texto exibido quando nada está selecionado. */
  placeholder?: string;
  /** Exibe um campo de busca no topo da lista. */
  searchable?: boolean;
  /**
   * Busca no SERVIDOR: recebe o texto digitado (e `''` ao fechar a lista), e a
   * lista mostra `options` como vieram, sem filtrar aqui — quem chama busca e
   * troca as opções (com debounce). Liga o campo de busca. As opções já
   * marcadas que saírem do resultado continuam no topo da lista e no gatilho;
   * as que chegam marcadas de fora (ex.: da URL) precisam vir em `options`.
   */
  onSearchChange?: (search: string) => void;
  /** Busca em andamento (com `onSearchChange`): a lista vazia diz "Buscando...". */
  loading?: boolean;
  searchPlaceholder?: string;
  /** Texto exibido quando a busca não retorna opções. */
  emptyText?: string;
  /**
   * Máximo de rótulos exibidos no gatilho antes de resumir para
   * "N selecionados".
   */
  maxDisplay?: number;
  size?: 'sm' | 'default';
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  /**
   * Exibe um botão "X" no gatilho para limpar toda a seleção sem abrir a lista.
   * Só aparece quando há itens selecionados e o campo não está desabilitado.
   * (A lista também tem o "Limpar seleção" no rodapé quando aberta.)
   */
  clearable?: boolean;
  'aria-invalid'?: boolean;
};

/**
 * Linha de opção memoizada: só re-renderiza quando o SEU `checked` muda (ou a
 * opção/handler). Sem isto, marcar uma opção re-renderizava TODAS as linhas
 * (cada uma com um `Checkbox`), o que pesa com muitas opções. `onToggle` precisa
 * ser estável (ver `useCallback` no componente pai).
 */
const MultiSelectOptionRow = React.memo(function MultiSelectOptionRow({
  option,
  checked,
  onToggle,
}: {
  option: MultiSelectOption;
  checked: boolean;
  onToggle: (value: string) => void;
}) {
  return (
    <label
      data-slot="multi-select-item"
      data-checked={checked || undefined}
      className="flex w-full cursor-pointer items-center gap-2 rounded-md py-1.5 pr-2 pl-1.5 text-sm select-none hover:bg-accent hover:text-accent-foreground has-disabled:pointer-events-none has-disabled:opacity-50"
    >
      <Checkbox
        checked={checked}
        disabled={option.disabled}
        onCheckedChange={() => onToggle(option.value)}
      />
      <span className="flex-1">{option.label}</span>
    </label>
  );
});

function MultiSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Selecione...',
  searchable = false,
  onSearchChange,
  loading = false,
  searchPlaceholder = 'Buscar...',
  emptyText = 'Nenhuma opção encontrada.',
  maxDisplay = 3,
  size = 'default',
  disabled,
  id,
  name,
  className,
  clearable,
  'aria-invalid': ariaInvalid,
}: MultiSelectProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState<string[]>(
    defaultValue ?? []
  );
  const selected = isControlled ? value : internalValue;

  const serverSearch = onSearchChange !== undefined;
  const showSearch = searchable || serverSearch;
  const [search, setSearch] = React.useState('');

  // Rótulo das opções marcadas aqui. Na busca no servidor, a opção marcada sai
  // de `options` quando a busca muda; o rótulo guardado a mantém no gatilho e
  // no topo da lista (para desmarcar).
  const [pinnedLabels, setPinnedLabels] = React.useState<
    ReadonlyMap<string, string>
  >(() => new Map());

  // Lookup O(1) do estado selecionado (evita `selected.includes` por opção).
  const selectedSet = React.useMemo(() => new Set(selected), [selected]);

  // `commit`/`toggle` ESTÁVEIS (deps vazias, via refs) — para as linhas memoizadas
  // não re-renderizarem só porque o handler mudou de identidade a cada render.
  // Os refs são sincronizados em efeito (nunca escritos durante o render).
  const selectedRef = React.useRef(selected);
  const optionsRef = React.useRef(options);
  const isControlledRef = React.useRef(isControlled);
  const onValueChangeRef = React.useRef(onValueChange);
  React.useEffect(() => {
    selectedRef.current = selected;
    optionsRef.current = options;
    isControlledRef.current = isControlled;
    onValueChangeRef.current = onValueChange;
  });

  const commit = React.useCallback((next: string[]) => {
    if (!isControlledRef.current) setInternalValue(next);
    onValueChangeRef.current?.(next);
  }, []);

  const toggle = React.useCallback(
    (optionValue: string) => {
      const current = selectedRef.current;
      if (current.includes(optionValue)) {
        commit(current.filter((item) => item !== optionValue));
        return;
      }

      const option = optionsRef.current.find(
        (item) => item.value === optionValue
      );
      if (option) {
        setPinnedLabels((previous) =>
          new Map(previous).set(option.value, option.label)
        );
      }
      commit([...current, optionValue]);
    },
    [commit]
  );

  // Marcadas que não estão em `options` (saíram do resultado da busca), com o
  // rótulo guardado.
  const pinnedSelected = React.useMemo(() => {
    const listed = new Set(options.map((option) => option.value));
    return selected.flatMap((item) => {
      const label = pinnedLabels.get(item);
      return !listed.has(item) && label !== undefined
        ? [{ value: item, label }]
        : [];
    });
  }, [options, selected, pinnedLabels]);

  const display = React.useMemo(() => {
    const labels = [
      ...options
        .filter((option) => selectedSet.has(option.value))
        .map((option) => option.label),
      ...pinnedSelected.map((option) => option.label),
    ];
    if (labels.length === 0) return null;
    return labels.length > maxDisplay
      ? `${labels.length} selecionados`
      : labels.join(', ');
  }, [options, pinnedSelected, selectedSet, maxDisplay]);

  const showClear = Boolean(clearable && selected.length > 0 && !disabled);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredOptions = React.useMemo(() => {
    if (serverSearch) return [...pinnedSelected, ...options];
    return searchable && normalizedSearch
      ? options.filter((option) =>
          option.label.toLowerCase().includes(normalizedSearch)
        )
      : options;
  }, [options, pinnedSelected, serverSearch, searchable, normalizedSearch]);

  const changeSearch = (next: string) => {
    setSearch(next);
    onSearchChange?.(next);
  };

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open && search) {
          changeSearch('');
        }
      }}
    >
      <div className={cn('relative w-fit', className)}>
        <PopoverTrigger
          id={id}
          type="button"
          role="combobox"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          data-slot="multi-select-trigger"
          data-size={size}
          className={cn(
            'flex w-full cursor-pointer items-center rounded-lg border border-input bg-transparent py-2 pr-8 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
            showClear && 'pr-14'
          )}
        >
          <span
            className={cn(
              'line-clamp-1 flex-1 text-left',
              !display && 'text-muted-foreground'
            )}
          >
            {display ?? placeholder}
          </span>
        </PopoverTrigger>
        {/* Seta e X são absolutos (fora do flow) para o X não empurrar/cobrir a seta. */}
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        {showClear && (
          <button
            type="button"
            aria-label="Limpar seleção"
            onClick={() => commit([])}
            className="absolute top-1/2 right-8 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none dark:hover:bg-muted/50"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>

      {name &&
        selected.map((item) => (
          <input key={item} type="hidden" name={name} value={item} />
        ))}

      <PopoverContent
        align="start"
        data-slot="multi-select-content"
        className="w-(--radix-popover-trigger-width) gap-1.5 p-1"
      >
        {showSearch && (
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => changeSearch(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-8 w-full rounded-md border border-input bg-transparent pr-2.5 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>
        )}

        <ScrollArea viewportClassName="max-h-72">
          <div
            role="group"
            aria-busy={serverSearch && loading ? true : undefined}
          >
            {filteredOptions.length === 0 ? (
              <p className="px-1.5 py-6 text-center text-sm text-muted-foreground">
                {serverSearch && loading ? 'Buscando...' : emptyText}
              </p>
            ) : (
              filteredOptions.map((option) => (
                <MultiSelectOptionRow
                  key={option.value}
                  option={option}
                  checked={selectedSet.has(option.value)}
                  onToggle={toggle}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => commit([])}
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <XIcon className="size-3.5" />
            Limpar seleção
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { MultiSelect };
