import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ExternalLink } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  replace?: boolean;
  /**
   * Ícone "abrir em nova aba" ao lado do texto. Ligado por padrão — ver a regra
   * de hyperlink em docs/conventions/routes-and-screens.md. Desligue (`false`) apenas onde o ícone não faz
   * sentido: navegação estrutural (sidebar, breadcrumb, abas), link dentro de
   * frase corrida e link que já aponta para fora (`target="_blank"`).
   */
  newTabIcon?: boolean;
  /** Rótulo acessível do ícone. Padrão: "Abrir em nova aba". */
  newTabLabel?: string;
};

const defaultStyles =
  'text-primary underline underline-offset-4 transition-colors hover:text-primary/80';

function isExternalLink(href: string) {
  if (href.startsWith('mailto:') || href.startsWith('tel:')) {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const url = new URL(href, window.location.href);
    return url.origin !== window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Link da aplicação. **Todo hyperlink do sistema passa por aqui** — nunca use
 * `<button onClick={navigate}>` para navegar (ver docs/conventions/routes-and-screens.md).
 *
 * Por que importa: um `<button>` não tem `href`, então Ctrl/Cmd+clique, clique do
 * meio, "abrir em nova aba" e arrastar para os favoritos simplesmente não
 * funcionam — o usuário perde a navegação que espera de qualquer link da web.
 * Aqui o elemento é uma `<a href>` de verdade: o roteamento em SPA só acontece no
 * clique simples com o botão esquerdo, e **qualquer** modificador (Ctrl, Cmd,
 * Shift, Alt) ou botão do meio cai no comportamento nativo do navegador.
 */
export function Link({
  href,
  target,
  rel,
  className,
  replace,
  onClick,
  download,
  newTabIcon = true,
  newTabLabel = 'Abrir em nova aba',
  children,
  ...props
}: LinkProps) {
  const navigate = useNavigate();
  const external =
    isExternalLink(href) || target === '_blank' || href.startsWith('#');
  const resolvedRel =
    target === '_blank' ? (rel ?? 'noreferrer noopener') : rel;
  // Link que já abre fora (ou âncora na própria página) não ganha o ícone: seria
  // redundante no primeiro caso e sem sentido no segundo.
  const showNewTabIcon = newTabIcon && !external && !download;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      external ||
      download ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    navigate({ to: href, replace: Boolean(replace) });
  };

  const anchor = (
    <a
      href={href}
      target={target}
      rel={resolvedRel}
      className={cn(defaultStyles, className)}
      onClick={handleClick}
      download={download}
      {...props}
    >
      {children}
    </a>
  );

  if (!showNewTabIcon) return anchor;

  return (
    <span className="inline-flex items-center gap-1">
      {anchor}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* Âncora de verdade (não botão) para o ícone também aceitar clique do
                meio, "copiar endereço" e o resto do menu de contexto. */}
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={newTabLabel}
              className="text-muted-foreground transition-colors hover:text-primary"
              // Nova aba sempre: não deixa o roteador SPA capturar este clique.
              onClick={(event) => event.stopPropagation()}
            >
              <ExternalLink aria-hidden className="size-3.5" />
            </a>
          </TooltipTrigger>
          <TooltipContent>{newTabLabel}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
}
