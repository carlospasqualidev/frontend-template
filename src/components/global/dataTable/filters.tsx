import * as React from 'react';
import { Eraser, Loader2, Search } from 'lucide-react';

import { DateField } from '@/components/global/form/dateField';
import { InputField } from '@/components/global/form/inputField';
import { MultiSelect } from '@/components/global/form/multiSelectPrimitive';
import { Select } from '@/components/global/form/select';
import { Button } from '@/components/global/button/button';
import { Button as PrimitiveButton } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';

/** Valor interno do select que representa "sem filtro" (radix não aceita ''). */
const ALL_VALUE = '__all__';

export interface DateRangeValue {
  from: string;
  to: string;
}

/**
 * Valor de um filtro: string (texto/select/data), array (multiselect) ou objeto
 * (intervalo de datas).
 */
export type DataTableFilterValue = string | string[] | DateRangeValue;

/** Mapa `chave -> valor` enviado ao backend ao clicar em "Buscar". */
export type DataTableFilterValues = Record<string, DataTableFilterValue>;

interface BaseFilter {
  /** Chave usada no objeto de valores entregue ao `onSearch`. */
  key: string;
  /** Rótulo exibido acima do campo. */
  label: string;
  /** Placeholder do campo. */
  placeholder?: string;
}

export interface TextFilter extends BaseFilter {
  type: 'text';
}

export interface SelectFilter extends BaseFilter {
  type: 'select';
  options: { value: string; label: string }[];
  /** Rótulo da opção que limpa o select. Padrão: `'Todos'`. */
  allLabel?: string;
}

export interface MultiSelectFilter extends BaseFilter {
  type: 'multiSelect';
  options: { value: string; label: string }[];
  /** Exibe um campo de busca dentro do dropdown. */
  searchable?: boolean;
}

export interface DateFilter extends BaseFilter {
  type: 'date';
}

export interface DateRangeFilter extends BaseFilter {
  type: 'dateRange';
}

/** Faixa numérica (mín./máx.) — reutiliza o valor `{ from, to }` do intervalo. */
export interface NumberRangeFilter extends BaseFilter {
  type: 'numberRange';
  /** Observação curta exibida abaixo dos campos (ex.: como o filtro casa). */
  hint?: string;
}

export type DataTableFilter =
  | TextFilter
  | SelectFilter
  | MultiSelectFilter
  | DateFilter
  | DateRangeFilter
  | NumberRangeFilter;

// eslint-disable-next-line react-refresh/only-export-components
export function textFilter(config: Omit<TextFilter, 'type'>): TextFilter {
  return { type: 'text', ...config };
}

// eslint-disable-next-line react-refresh/only-export-components
export function selectFilter(config: Omit<SelectFilter, 'type'>): SelectFilter {
  return { type: 'select', ...config };
}

// eslint-disable-next-line react-refresh/only-export-components
export function multiSelectFilter(
  config: Omit<MultiSelectFilter, 'type'>
): MultiSelectFilter {
  return { type: 'multiSelect', ...config };
}

// eslint-disable-next-line react-refresh/only-export-components
export function dateFilter(config: Omit<DateFilter, 'type'>): DateFilter {
  return { type: 'date', ...config };
}

// eslint-disable-next-line react-refresh/only-export-components
export function dateRangeFilter(
  config: Omit<DateRangeFilter, 'type'>
): DateRangeFilter {
  return { type: 'dateRange', ...config };
}

// eslint-disable-next-line react-refresh/only-export-components
export function numberRangeFilter(
  config: Omit<NumberRangeFilter, 'type'>
): NumberRangeFilter {
  return { type: 'numberRange', ...config };
}

/** Estado interno: usa Map para acesso por chave dinâmica sem `obj[key]`. */
type FilterState = Map<string, DataTableFilterValue>;

function getString(values: FilterState, key: string): string {
  const value = values.get(key);
  return typeof value === 'string' ? value : '';
}

function getStringArray(values: FilterState, key: string): string[] {
  const value = values.get(key);
  return Array.isArray(value) ? value : [];
}

function getRange(values: FilterState, key: string): DateRangeValue {
  const value = values.get(key);
  return value && !Array.isArray(value) && typeof value === 'object'
    ? value
    : { from: '', to: '' };
}

function emptyValueFor(filter: DataTableFilter): DataTableFilterValue {
  if (filter.type === 'dateRange' || filter.type === 'numberRange')
    return { from: '', to: '' };
  if (filter.type === 'multiSelect') return [];
  return '';
}

function buildInitialValues(
  filters: DataTableFilter[],
  defaultValues?: DataTableFilterValues
): FilterState {
  const defaults = new Map(Object.entries(defaultValues ?? {}));

  return new Map(
    filters.map((filter) => [
      filter.key,
      defaults.get(filter.key) ?? emptyValueFor(filter),
    ])
  );
}

/** Converte para Record descartando valores vazios (não enviados ao backend). */
function toPayload(values: FilterState): DataTableFilterValues {
  const entries: [string, DataTableFilterValue][] = [];

  for (const [key, value] of values) {
    if (typeof value === 'string') {
      if (value && value !== ALL_VALUE) {
        entries.push([key, value]);
      }
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        entries.push([key, value]);
      }
    } else if (value.from || value.to) {
      entries.push([key, value]);
    }
  }

  return Object.fromEntries(entries);
}

function renderFilter(
  filter: DataTableFilter,
  values: FilterState,
  setValue: (key: string, value: DataTableFilterValue) => void
) {
  // Id estável por filtro para associar `<FieldLabel htmlFor>` ao controle
  // (a11y + permite `getByLabel` nos testes).
  const fieldId = `filter-${filter.key}`;

  switch (filter.type) {
    case 'text':
      return (
        <InputField
          id={fieldId}
          label={filter.label}
          placeholder={filter.placeholder}
          value={getString(values, filter.key)}
          onChange={(event) => setValue(filter.key, event.target.value)}
        />
      );
    case 'select': {
      const selected = getString(values, filter.key);
      return (
        <Select
          id={fieldId}
          label={filter.label}
          placeholder={filter.placeholder ?? filter.allLabel ?? 'Todos'}
          options={[
            { value: ALL_VALUE, label: filter.allLabel ?? 'Todos' },
            ...filter.options,
          ]}
          value={selected || ALL_VALUE}
          onValueChange={(value) =>
            setValue(filter.key, value === ALL_VALUE ? '' : value)
          }
        />
      );
    }
    case 'multiSelect':
      return (
        <Field>
          <FieldLabel htmlFor={fieldId}>{filter.label}</FieldLabel>
          <MultiSelect
            id={fieldId}
            options={filter.options}
            value={getStringArray(values, filter.key)}
            onValueChange={(next) => setValue(filter.key, next)}
            placeholder={filter.placeholder ?? 'Selecione...'}
            searchable={filter.searchable}
            className="w-full"
          />
        </Field>
      );
    case 'date':
      return (
        <DateField
          id={fieldId}
          label={filter.label}
          placeholder={filter.placeholder}
          value={getString(values, filter.key)}
          onChange={(value) => setValue(filter.key, value)}
        />
      );
    case 'dateRange': {
      const range = getRange(values, filter.key);
      // Cada data ocupa a MESMA largura de um filtro simples (`sm:w-60`) em vez de
      // dividir uma largura fixa: a barra de filtros fica com todos os campos do
      // mesmo tamanho, independente do tipo.
      return (
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <div className="w-full sm:w-60">
            <DateField
              id={`${fieldId}-from`}
              label={`${filter.label} (de)`}
              value={range.from}
              onChange={(value) =>
                setValue(filter.key, { ...range, from: value })
              }
            />
          </div>
          <div className="w-full sm:w-60">
            <DateField
              id={`${fieldId}-to`}
              label={`${filter.label} (até)`}
              value={range.to}
              onChange={(value) =>
                setValue(filter.key, { ...range, to: value })
              }
            />
          </div>
        </div>
      );
    }
    case 'numberRange': {
      const range = getRange(values, filter.key);
      return (
        <div className="space-y-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            <div className="w-full sm:w-60">
              <InputField
                id={`${fieldId}-from`}
                label={`${filter.label} (de)`}
                type="number"
                inputMode="decimal"
                placeholder="mín."
                value={range.from}
                onChange={(event) =>
                  setValue(filter.key, { ...range, from: event.target.value })
                }
              />
            </div>
            <div className="w-full sm:w-60">
              <InputField
                id={`${fieldId}-to`}
                label={`${filter.label} (até)`}
                type="number"
                inputMode="decimal"
                placeholder="máx."
                value={range.to}
                onChange={(event) =>
                  setValue(filter.key, { ...range, to: event.target.value })
                }
              />
            </div>
          </div>
          {filter.hint ? (
            <p className="text-xs text-muted-foreground">{filter.hint}</p>
          ) : null}
        </div>
      );
    }
  }
}

interface DataTableFiltersProps {
  filters: DataTableFilter[];
  /** Valores iniciais dos filtros. */
  defaultValues?: DataTableFilterValues;
  /** Chamado ao clicar em "Buscar" (ou "Limpar"), já sem valores vazios. */
  onSearch: (values: DataTableFilterValues) => void;
  /** Quando verdadeiro, desabilita os botões e exibe loading no botão de buscar. */
  isLoading?: boolean;
  /**
   * Conteúdo opcional à esquerda da linha dos botões "Limpar"/"Buscar" (ex.: um
   * aviso/resumo). Fica alinhado à esquerda; os botões permanecem à direita.
   */
  leadingActions?: React.ReactNode;
}

/**
 * Cabeçalho de filtros da `DataTable`. Renderiza os campos a partir de uma
 * config declarativa (no mesmo estilo das `columns`) e só dispara `onSearch` ao
 * clicar em "Buscar" — pensado para filtragem server-side, evitando requests a
 * cada tecla.
 *
 * ```tsx
 * const filters = [
 *   textFilter({ key: 'email', label: 'E-mail' }),
 *   selectFilter({ key: 'status', label: 'Status', options }),
 *   dateRangeFilter({ key: 'period', label: 'Período' }),
 * ];
 *
 * <DataTableFilters filters={filters} onSearch={handleSearch} />
 * ```
 */
export function DataTableFilters({
  filters,
  defaultValues,
  onSearch,
  isLoading,
  leadingActions,
}: DataTableFiltersProps) {
  const initialValues = React.useMemo(
    () => buildInitialValues(filters, defaultValues),
    [filters, defaultValues]
  );
  const [values, setValues] = React.useState<FilterState>(initialValues);

  const setValue = (key: string, value: DataTableFilterValue) =>
    setValues((previous) => new Map(previous).set(key, value));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch(toPayload(values));
  };

  const handleClear = () => {
    setValues(buildInitialValues(filters));
    onSearch({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-4">
      <div className="flex flex-wrap items-end gap-4">
        {filters.map((filter) => (
          <div
            key={filter.key}
            className={
              filter.type === 'dateRange' || filter.type === 'numberRange'
                ? 'w-full sm:w-auto'
                : 'w-full sm:w-60'
            }
          >
            {renderFilter(filter, values, setValue)}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {leadingActions ? (
          <div className="mr-auto">{leadingActions}</div>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          onClick={handleClear}
          disabled={isLoading}
        >
          <Eraser />
          Limpar
        </Button>
        {isLoading ? (
          <PrimitiveButton type="submit">
            <Loader2 className="mr-2 animate-spin" /> Buscar
          </PrimitiveButton>
        ) : (
          <Button type="submit">
            <Search />
            Buscar
          </Button>
        )}
      </div>
    </form>
  );
}
