import { useRef, useState } from 'react';
import { Info } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
 * Ícone de informação (`i`) que revela um tooltip ao passar o mouse ou focar e,
 * ao clicar (ou tocar, onde não há hover), fixa o mesmo conteúdo num popover não
 * modal. Gatilho é um `<button>` (acessível por teclado) com `aria-label`. Traz
 * o próprio `TooltipProvider`, então pode ser usado solto em qualquer tela.
 */
export function InfoTooltip({
  label,
  triggerLabel = 'Mais informações',
  className,
}: IInfoTooltip) {
  const [pinned, setPinned] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const restoringFocus = useRef(false);

  // Ao fechar o popover, o foco volta ao gatilho, mas sem reabrir o tooltip.
  function restoreFocusQuietly(event: Event): void {
    event.preventDefault();
    restoringFocus.current = true;
    triggerRef.current?.focus({ preventScroll: true });
    restoringFocus.current = false;
  }

  function handlePinChange(open: boolean): void {
    setPinned(open);
    setHoverOpen(false);
  }

  function handleHoverChange(open: boolean): void {
    if (open && (pinned || restoringFocus.current)) return;
    setHoverOpen(open);
  }

  return (
    <TooltipProvider>
      <Popover modal={false} open={pinned} onOpenChange={handlePinChange}>
        <Tooltip open={!pinned && hoverOpen} onOpenChange={handleHoverChange}>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                ref={triggerRef}
                type="button"
                aria-label={triggerLabel}
                className={cn(
                  'inline-flex text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none',
                  className
                )}
              >
                <Info className="size-4" />
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent className="text-left whitespace-pre-line">
            {label}
          </TooltipContent>
        </Tooltip>
        <PopoverContent
          aria-label={triggerLabel}
          onCloseAutoFocus={restoreFocusQuietly}
          className="w-fit max-w-xs text-left text-xs font-normal whitespace-pre-line"
        >
          {label}
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}
