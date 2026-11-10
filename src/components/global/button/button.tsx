import * as React from 'react';
import { Loader2 } from 'lucide-react';

import { disabledName } from './disabledName';

import { Button as ButtonPrimitive } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface IButton extends React.ComponentProps<typeof ButtonPrimitive> {
  loading?: boolean;
  /**
   * Texto do tooltip revelado no hover/foco. **Obrigatório para ações renderizadas
   * SÓ como ícone** (ver `CLAUDE.md` → Acessibilidade). Quando informado e
   * `aria-label` não é passado, também vira o `aria-label` (leitor de tela). Traz o
   * próprio `TooltipProvider` (como o `InfoTooltip`) — funciona em qualquer tela sem
   * provider ancestral. Ignorado quando `asChild` (o botão é um `Slot` para outro
   * gatilho — o tooltip deve ser montado no próprio gatilho pela tela).
   */
  tooltip?: string;
  /**
   * Motivo de o controle estar indisponível. Com `disabled`, o botão NÃO usa o
   * `disabled` nativo: fica visível e focável (Tab), com `aria-disabled`, clique e
   * Enter bloqueados, o motivo no tooltip e o nome acessível "rótulo: motivo". O
   * rótulo é o `aria-label` ou, na falta dele, o `tooltip`. Passe `''` quando não
   * há motivo a dizer: o botão continua focável e só perde a parte ": motivo".
   * Ignorado sem `disabled`.
   */
  disabledReason?: string;
}

// Modo `disabledReason`: hover e active não valem. A classe `aria-disabled:hover:*`
// tem especificidade maior que o `hover:*` do primitivo (que fica intacto, sem afetar
// botão sem `aria-disabled`) e repete a cor de repouso de cada variante.
const SOFT_DISABLED_BASE =
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:active:translate-y-0';

const softDisabledVariantClasses = new Map<string, string>([
  [
    'outline',
    'aria-disabled:hover:bg-background aria-disabled:hover:text-inherit dark:aria-disabled:hover:bg-input/30',
  ],
  ['secondary', 'aria-disabled:hover:bg-secondary'],
  [
    'ghost',
    'aria-disabled:hover:bg-transparent aria-disabled:hover:text-inherit dark:aria-disabled:hover:bg-transparent',
  ],
  [
    'destructive',
    'aria-disabled:hover:bg-destructive/10 dark:aria-disabled:hover:bg-destructive/20',
  ],
  [
    'brand',
    'aria-disabled:hover:bg-primary/10 dark:aria-disabled:hover:bg-primary/20',
  ],
  ['link', 'aria-disabled:hover:no-underline'],
]);

function softDisabledClasses(variant: string | null | undefined): string {
  return cn(
    SOFT_DISABLED_BASE,
    softDisabledVariantClasses.get(variant ?? 'default')
  );
}

export function Button({
  loading,
  disabled,
  children,
  tooltip,
  asChild,
  disabledReason,
  variant,
  onClick,
  className,
  'aria-label': ariaLabel,
  ...props
}: IButton) {
  const soft = !loading && disabled && disabledReason !== undefined;
  const label = ariaLabel ?? tooltip;
  const tooltipText = soft ? disabledReason || tooltip : tooltip;

  const button = (
    <ButtonPrimitive
      asChild={asChild}
      variant={variant}
      disabled={loading || (disabled && !soft)}
      aria-label={soft && label ? disabledName(label, disabledReason) : label}
      aria-disabled={soft || undefined}
      className={cn(soft && softDisabledClasses(variant), className)}
      onClick={
        soft
          ? (event) => {
              event.preventDefault();
            }
          : onClick
      }
      {...props}
    >
      {/*
        Com `asChild` o primitivo é um `Slot`, que exige UM único elemento filho —
        o slot do spinner (mesmo como `null`) fazia o React quebrar com
        "React.Children.only". Nesse modo quem renderiza o conteúdo é o elemento
        passado (um `<a>`, por exemplo), então o spinner não se aplica.
      */}
      {asChild ? (
        children
      ) : (
        <>
          {loading ? <Loader2 className="animate-spin" /> : null}
          {children}
        </>
      )}
    </ButtonPrimitive>
  );

  if (!tooltipText || asChild) return button;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
