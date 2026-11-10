import { ComboboxInput } from '@/components/global/form/combobox';
import {
  useAsyncOptions,
  type AsyncOption,
} from '@/components/global/form/useAsyncOptions';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import {
  hasFieldErrors,
  resolveFieldErrors,
  type FormFieldErrors,
} from '@/lib/forms/errors';

export interface AsyncComboboxProps {
  id: string;
  label: string;
  /** Mantém o rótulo acessível mas oculto — só em célula de tabela, onde o cabeçalho já rotula. */
  srOnlyLabel?: boolean;
  placeholder?: string;
  /** Texto curto sob o campo, para uma restrição da lista. */
  description?: string;
  searchPlaceholder?: string;
  value: string;
  onValueChange: (value: string) => void;
  /**
   * Recebe o termo e devolve as opções já recortadas pelo servidor. Passe uma
   * função estável (`useCallback`): uma nova a cada render perde o debounce.
   */
  onSearch: (term: string) => Promise<AsyncOption[]>;
  /** Caracteres antes de consultar. Padrão: 3. */
  minChars?: number;
  /**
   * O rótulo do valor atual, quando quem chama já o conhece.
   *
   * O campo só lembra o rótulo do que ELE MESMO procurou: um valor que chegou
   * pela URL nunca passou por uma busca, então sem isto o gatilho mostraria o
   * identificador cru. O rótulo não vai na URL de propósito: nome é dado pessoal.
   */
  selectedLabel?: string;
  errors?: FormFieldErrors;
  disabled?: boolean;
  clearable?: boolean;
}

/**
 * Escolha ÚNICA numa lista que mora no servidor.
 *
 * Um `Select` ou `Combobox` comum recebe a lista inteira e filtra no navegador.
 * Quando a lista não cabe na resposta (milhares de registros), filtrar no
 * cliente descarta o que o servidor achou por outro critério: uma busca por
 * documento devolve a linha certa, e o filtro por rótulo a esconde.
 *
 * Exemplo: um campo "Responsável" cujas opções vêm de `GET /users?search=`;
 * `onSearch` é `(term) => fetchUsers(term).then(toOptions)`, em `useCallback`.
 *
 * A mecânica (debounce, descarte de resposta velha, memória de rótulos) é do
 * `useAsyncOptions`, compartilhada com qualquer campo de busca no servidor.
 */
export function AsyncCombobox({
  id,
  label,
  srOnlyLabel,
  placeholder = 'Selecione...',
  description,
  searchPlaceholder = 'Buscar...',
  value,
  onValueChange,
  onSearch,
  minChars = 3,
  selectedLabel,
  errors,
  disabled,
  clearable,
}: AsyncComboboxProps) {
  const messages = resolveFieldErrors(errors);
  const { loading, search, withSelected, labelOf } = useAsyncOptions({
    onSearch,
    minChars,
  });

  // O selecionado entra na lista com o rótulo lembrado. `selectedLabel` só vale
  // quando o campo não conhece o rótulo (valor vindo da URL): o lembrado vence,
  // para um `selectedLabel` antigo não rotular a opção recém-escolhida.
  const useInformedLabel = Boolean(selectedLabel) && labelOf(value) === value;
  const options = withSelected(value ? [value] : []).map((option) =>
    option.value === value && useInformedLabel
      ? { ...option, label: selectedLabel ?? option.label }
      : option
  );

  return (
    <Field>
      <FieldLabel htmlFor={id} className={srOnlyLabel ? 'sr-only' : undefined}>
        {label}
      </FieldLabel>

      <ComboboxInput
        id={id}
        value={value}
        onValueChange={onValueChange}
        options={options}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyText="Nenhum resultado."
        minChars={minChars}
        loading={loading}
        onSearchChange={search}
        disabled={disabled}
        clearable={clearable}
        aria-invalid={hasFieldErrors(messages) || undefined}
      />

      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={messages} />
    </Field>
  );
}
