import * as React from 'react';
import { ChevronDown } from 'lucide-react';

import {
  Card as CardPrimitive,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface ICardBase {
  title: string;
  description?: string;
  /**
   * Ação do cabeçalho (ex.: botão "Adicionar …"), renderizada **alinhada à
   * direita** do título/descrição. Use isto para a ação primária de uma seção —
   * não coloque o botão de adicionar solto acima/dentro do conteúdo.
   */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Modo recolhível: o título vira o gatilho (chevron + clique) e o corpo só
 * aparece quando `expanded`. Controlado, para a tela decidir quais seções abrem
 * por padrão e conseguir revelar uma seção recolhida (ex.: a que tem erro de
 * validação). A ação do cabeçalho fica fora do gatilho.
 */
interface ICollapsibleCardSection {
  expanded: boolean;
  onToggle: () => void;
}

interface IStaticCard {
  expanded?: never;
  onToggle?: never;
}

export type ICard = ICardBase & (ICollapsibleCardSection | IStaticCard);

function isCollapsible(
  props: ICard
): props is ICardBase & ICollapsibleCardSection {
  return 'expanded' in props;
}

export function Card(props: ICard) {
  const { title, description, action, children, className } = props;

  const cardClassName = cn(
    'rounded-2xl border border-border/70 shadow-sm ring-0 sm:rounded-3xl dark:shadow-none',
    className
  );

  if (!isCollapsible(props)) {
    return (
      <CardPrimitive className={cardClassName}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </CardPrimitive>
    );
  }

  const { expanded, onToggle } = props;

  return (
    <Collapsible asChild open={expanded} onOpenChange={() => onToggle()}>
      <CardPrimitive className={cardClassName}>
        <CardHeader>
          <CardTitle>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-2 rounded-sm text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <ChevronDown
                  className={cn(
                    'size-4 shrink-0 text-muted-foreground transition-transform',
                    !expanded && '-rotate-90'
                  )}
                />
                {title}
              </button>
            </CollapsibleTrigger>
          </CardTitle>
          {/* Recuo do chevron (size-4 + gap-2) para a descrição alinhar com o título. */}
          {description && (
            <CardDescription className="pl-6">{description}</CardDescription>
          )}
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
        <CollapsibleContent>
          <CardContent>{children}</CardContent>
        </CollapsibleContent>
      </CardPrimitive>
    </Collapsible>
  );
}
