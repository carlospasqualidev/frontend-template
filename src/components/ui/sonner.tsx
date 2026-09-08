import { Toaster as Sonner, type ToasterProps } from 'sonner';
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from 'lucide-react';

import { useTheme } from '@/hooks/useThemeProvider';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      richColors
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          // Sonner traz `z-index: 999999999` no próprio CSS — um número fora de
          // qualquer escala. Trazemos o toaster para a escala de camadas do
          // projeto (topo dela: acima de modal, popover e tooltip). Ver a seção
          // "CAMADAS (z-index)" em `src/index.css`.
          zIndex: 'var(--z-toast)',
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
          // Cores por tipo derivadas dos tokens semânticos (`--success` verde,
          // `--destructive` vermelho) — fundo tonalizado + borda e texto/ícone
          // saturados, legível em light e dark. `richColors` habilita o uso
          // destes vars por tipo. O mix é em `srgb` (não `oklch`): no espaço
          // oklch a interpolação de matiz contra um neutro puxa o tom para o
          // lado errado (verde chegava a virar laranja no dark) — em srgb o
          // matiz é preservado. Mistura sobre `--popover` (superfície) para tint
          // opaco.
          '--success-bg':
            'color-mix(in srgb, var(--success) 12%, var(--popover))',
          '--success-border':
            'color-mix(in srgb, var(--success) 55%, var(--popover))',
          '--success-text': 'var(--success)',
          '--error-bg':
            'color-mix(in srgb, var(--destructive) 12%, var(--popover))',
          '--error-border':
            'color-mix(in srgb, var(--destructive) 55%, var(--popover))',
          '--error-text': 'var(--destructive)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'cn-toast',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
