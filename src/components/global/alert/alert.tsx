import * as React from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';

import {
  Alert as AlertPrimitive,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type AlertVariant = 'default' | 'info' | 'success' | 'warning' | 'error';

interface IAlert {
  title: string;
  description?: string;
  variant?: AlertVariant;
  /** Sobrescreve o ícone padrão da variante. Passe `null` para omitir. */
  icon?: React.ReactNode;
  className?: string;
}

// Mesma paleta semântica do Badge (tokens em index.css) — um único verde/azul/
// âmbar/vermelho em todo o sistema. Banner soft-tint: fundo com 10% (claro) /
// 20% (dark) do tom, texto e ícone na cor cheia do token.
// Map (não Record indexado por variável) para não disparar object-injection.
const variantClasses = new Map<AlertVariant, string>([
  ['default', ''],
  ['info', 'border-info/25 bg-info/10 text-info dark:bg-info/20'],
  [
    'success',
    'border-success/25 bg-success/10 text-success dark:bg-success/20',
  ],
  [
    'warning',
    'border-warning/25 bg-warning/10 text-warning dark:bg-warning/20',
  ],
  [
    'error',
    'border-destructive/25 bg-destructive/10 text-destructive dark:bg-destructive/20',
  ],
]);

const variantDescriptionClasses = new Map<AlertVariant, string>([
  ['default', ''],
  ['info', 'text-info/90'],
  ['success', 'text-success/90'],
  ['warning', 'text-warning/90'],
  ['error', 'text-destructive/90'],
]);

const defaultIcons = new Map<AlertVariant, React.ReactNode>([
  ['default', null],
  ['info', <Info />],
  ['success', <CircleCheck />],
  ['warning', <TriangleAlert />],
  ['error', <CircleAlert />],
]);

/**
 * Banner inline para mensagens contextuais (info/success/warning/error).
 *
 * - `title`: obrigatório, sempre visível.
 * - `description`: opcional.
 * - `variant`: cor + ícone padrão. Sem `variant` ou `default`, fica neutro.
 * - `icon`: sobrescreve o ícone padrão. Passe `null` para omitir o ícone.
 */
export function Alert({
  title,
  description,
  variant = 'default',
  icon,
  className,
}: IAlert) {
  const resolvedIcon = icon === undefined ? defaultIcons.get(variant) : icon;

  return (
    <AlertPrimitive className={cn(variantClasses.get(variant), className)}>
      {resolvedIcon}
      <AlertTitle>{title}</AlertTitle>
      {description ? (
        <AlertDescription className={variantDescriptionClasses.get(variant)}>
          {description}
        </AlertDescription>
      ) : null}
    </AlertPrimitive>
  );
}
