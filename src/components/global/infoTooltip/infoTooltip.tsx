import { Info } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface IInfoTooltip {
  /** Conteúdo exibido no tooltip (texto ou nós). */
  label: React.ReactNode;
  /** Rótulo acessível do gatilho. Padrão: "Mais informações". */
  triggerLabel?: string;
  className?: string;
}

/**
 * Ícone de informação (`i`) que revela um tooltip ao passar o mouse ou focar.
 * Gatilho é um `<button>` (acessível por teclado) com `aria-label`. Traz o
 * próprio `TooltipProvider`, então pode ser usado solto em qualquer tela.
 */
export function InfoTooltip({
  label,
  triggerLabel = 'Mais informações',
  className,
}: IInfoTooltip) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={triggerLabel}
            className={cn(
              'inline-flex text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none',
              className
            )}
          >
            <Info className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="text-left whitespace-pre-line">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
