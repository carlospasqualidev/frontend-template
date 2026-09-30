import { useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import type { FallbackProps } from 'react-error-boundary';

import { Button } from '@/components/global/button/button';
import { Link } from '@/components/global/link/link';
import { Separator } from '@/components/ui/separator';
import { Typography } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

/**
 * `screen`: tela cheia, fora do `Layout` (o `ErrorBoundary` do app, as rotas
 * públicas). `content`: no lugar do conteúdo da tela, dentro do `Layout`, com
 * o menu e o cabeçalho visíveis.
 */
export type ErrorFallbackVariant = 'screen' | 'content';

export interface IErrorFallbackProps extends Partial<FallbackProps> {
  variant?: ErrorFallbackVariant;
  /**
   * O que "Tentar novamente" faz, no lugar do `resetErrorBoundary`: o erro de
   * query tratado na própria tela (`onRetry={refetch}`) ou o adaptador do
   * roteador. É chamada sem argumentos. Se devolver uma promessa, o botão fica
   * desabilitado, em carregamento, até ela terminar.
   */
  onRetry?: () => unknown;
  /**
   * Quem desenha a tela reportou o erro (`sendErrorMessage`): só então o título
   * diz que a equipe foi notificada. Marque só onde o reporte acontece de fato
   * (o `RouteErrorFallback`, o `ErrorBoundary` do `App.tsx`). O erro de query
   * tratado na tela (`onRetry={refetch}`) não é reportado, e o título fica
   * neutro.
   */
  reported?: boolean;
}

/**
 * A orientação da variante `content`, dentro do roteador: o link para o início
 * some quando a tela já é o início, porque ali ele não levaria a lugar nenhum.
 */
function ContentGuidance() {
  const pathname = useLocation({ select: (location) => location.pathname });

  if (pathname === '/') {
    return (
      <Typography variant="muted" align="center">
        Tente de novo em instantes.
      </Typography>
    );
  }

  return (
    <Typography variant="muted" align="center">
      Tente de novo ou volte para o{' '}
      <Link href="/" newTabIcon={false}>
        início
      </Link>
      .
    </Typography>
  );
}

export function ErrorFallback({
  resetErrorBoundary,
  onRetry,
  variant = 'screen',
  reported = false,
}: IErrorFallbackProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const isScreen = variant === 'screen';
  const retry = onRetry ?? resetErrorBoundary;

  // Chamada sem argumentos: `onRetry={refetch}` não recebe o evento de clique
  // como opções do `refetch`.
  async function handleRetry(action: () => unknown) {
    setIsRetrying(true);
    try {
      await action();
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden',
        isScreen ? 'min-h-screen w-full bg-muted/40 px-6 py-10' : 'py-10'
      )}
    >
      {isScreen && (
        <div className="bg-[radial-gradient(circle_at_top,var(--color-primary),transparent_45%)]/8 absolute inset-0" />
      )}

      <div className="relative w-full max-w-xl rounded-3xl border border-border/60 bg-background/95 p-8 shadow-lg shadow-foreground/5 backdrop-blur sm:p-10">
        <div className="mx-auto flex max-w-md flex-col items-center gap-5 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-7" />
          </div>

          <div className="space-y-3">
            <Typography
              as="span"
              variant="small"
              className="text-muted-foreground"
            >
              Erro inesperado
            </Typography>

            <Typography as="h1" variant="h3" align="center">
              {reported
                ? 'Oops! Encontramos um problema e nossa equipe foi notificada.'
                : 'Oops! Algo deu errado.'}
            </Typography>

            {isScreen ? (
              <Typography variant="muted" align="center">
                Atualize a página para tentar restabelecer a sessão e continuar
                de onde você parou.
              </Typography>
            ) : (
              <ContentGuidance />
            )}
          </div>

          {retry && (
            <>
              <Separator className="max-w-24" />

              <Button
                type="button"
                size="lg"
                className="w-full sm:w-auto"
                loading={isRetrying}
                onClick={() => void handleRetry(retry)}
              >
                {!isRetrying && <RefreshCcw className="size-4" />}
                Tentar novamente
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
