import { type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface CollapsibleCardProps {
  /** Conteúdo do cabeçalho após o chevron (nome + badge). Compõe o gatilho clicável. */
  title: ReactNode;
  /** Resumo à direita do cabeçalho (ex.: "1 método · %"), estilizado como muted. */
  summary?: ReactNode;
  /** Ações à direita (fora do gatilho): botões-ícone (padrão, remover, etc.). */
  actions?: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  /** Acento lateral esquerdo na cor da marca (ex.: item padrão / de destaque). */
  accent?: boolean;
  /** Classe extra no container (ex.: `opacity-60` para item cancelado). */
  className?: string;
  /** Classe do corpo expandido (layout do conteúdo — grid, space-y, etc.). */
  bodyClassName?: string;
  children: ReactNode;
}

/**
 * Card recolhível (accordion) PADRÃO do sistema: cabeçalho sempre visível
 * (chevron + título + resumo + ações) e corpo revelado ao expandir, com
 * **animação suave de altura** ao abrir E fechar (Radix `Collapsible` +
 * keyframes `collapsible-down/up`). Só o CONTEÚDO interno muda entre os usos.
 * Use em coleções de itens editáveis, onde cada item tem um corpo próprio (ex.: os
 * itens de um pedido). Controlado por `expanded`/`onToggle`.
 *
 * Para uma **seção de página** recolhível, use o `Card` com `expanded`/`onToggle`
 * (ele já é o container padrão de seção) — não este componente.
 */
export function CollapsibleCard({
  title,
  summary,
  actions,
  expanded,
  onToggle,
  accent,
  className,
  bodyClassName,
  children,
}: CollapsibleCardProps) {
  return (
    <Collapsible
      open={expanded}
      onOpenChange={() => onToggle()}
      className={cn(
        'overflow-hidden rounded-lg border',
        accent && 'border-l-2 border-l-primary',
        className
      )}
    >
      {/* Cabeçalho sempre visível: chevron, título, resumo e ações. */}
      <div className="flex items-center gap-2 bg-muted/40 px-3 py-2">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-sm text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ChevronDown
              className={cn(
                'size-4 shrink-0 text-muted-foreground transition-transform',
                !expanded && '-rotate-90'
              )}
            />
            {title}
            {summary != null && (
              <span className="ml-auto shrink-0 pl-2 text-sm text-muted-foreground">
                {summary}
              </span>
            )}
          </button>
        </CollapsibleTrigger>
        {actions && (
          <div className="flex shrink-0 items-center gap-1">{actions}</div>
        )}
      </div>

      <CollapsibleContent>
        <div className={cn('border-t p-3', bodyClassName)}>{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
