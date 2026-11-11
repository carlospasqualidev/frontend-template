import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface IFilterButtonOption<TValue extends string = string> {
  value: TValue;
  label: string;
  /** Contador ao lado do rótulo; `undefined` enquanto não chegou (mostra "…"). */
  count?: number;
}

interface IFilterButtons<TValue extends string = string> {
  /** Nome do grupo para leitor de tela. */
  label: string;
  options: IFilterButtonOption<TValue>[];
  value: TValue;
  onValueChange: (value: TValue) => void;
  /** Mostra o contador de cada opção, com "…" até ele chegar. */
  showCounts?: boolean;
  className?: string;
}

/**
 * Grupo de botões de escolha única, com contador opcional: as "visões" de uma
 * listagem. Quem usa decide o que a escolha faz (em geral, grava um search param).
 *
 * O selecionado usa `variant="default"` (cor primária) e anuncia `aria-pressed`;
 * os demais ficam em contorno. Não aplica nada sozinho nem navega: é só a
 * escolha. Quando não cabe na largura, o grupo rola de lado em vez de esconder
 * opção; o `-m-1 p-1` evita que o anel de foco seja cortado pelo scroll.
 */
export function FilterButtons<TValue extends string = string>({
  label,
  options,
  value,
  onValueChange,
  showCounts = false,
  className,
}: IFilterButtons<TValue>): React.JSX.Element {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('-m-1 flex gap-2 overflow-x-auto p-1', className)}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={selected ? 'default' : 'outline'}
            aria-pressed={selected}
            onClick={() => onValueChange(option.value)}
          >
            {option.label}{' '}
            {showCounts && (
              <span className="tabular-nums opacity-80">
                {option.count === undefined ? '…' : option.count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
