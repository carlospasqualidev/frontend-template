import * as React from 'react';
import { Loader2 } from 'lucide-react';

import { Button as ButtonPrimitive } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
}

export function Button({
  loading,
  disabled,
  children,
  tooltip,
  asChild,
  'aria-label': ariaLabel,
  ...props
}: IButton) {
  const button = (
    <ButtonPrimitive
      asChild={asChild}
      disabled={loading || disabled}
      aria-label={ariaLabel ?? tooltip}
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

  if (!tooltip || asChild) return button;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
