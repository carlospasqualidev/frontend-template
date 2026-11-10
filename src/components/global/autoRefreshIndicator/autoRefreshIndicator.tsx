import * as React from 'react';
import { Loader2 } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const RADIUS = 7;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function getReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * O pulso de que a tela se atualiza sozinha enquanto uma consulta roda em
 * intervalo (polling).
 *
 * O anel se preenche ao longo do intervalo até a próxima consulta e reinicia a
 * cada resposta (`cycleKey`, ex.: `dataUpdatedAt`); enquanto a consulta está no
 * ar, vira um giro. Com `prefers-reduced-motion`, o anel fica parado (o `animate`
 * do SVG não é alcançado pelo `motion-reduce:` do Tailwind) e o giro é desligado.
 *
 * Monte-o só enquanto o polling roda: não há lógica de foco nem de parada aqui.
 */
export function AutoRefreshIndicator({
  intervalMs,
  cycleKey,
  fetching,
  tooltip,
}: {
  intervalMs: number;
  /** Muda a cada resposta (ex.: `dataUpdatedAt`): reinicia a animação do anel. */
  cycleKey: number;
  /** A consulta está no ar agora. */
  fetching: boolean;
  /** Texto do tooltip; sem ele, usa o padrão com o intervalo. */
  tooltip?: string;
}) {
  const reducedMotion = React.useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion
  );
  const seconds = Math.round(intervalMs / 1000);
  const tooltipText =
    tooltip ?? `Esta tela se atualiza sozinha a cada ${seconds}s.`;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="status"
            tabIndex={0}
            aria-label={`Atualizando automaticamente: ${tooltipText}`}
            className="inline-flex size-4 shrink-0 items-center justify-center text-primary"
          >
            {fetching ? (
              <Loader2
                className="size-4 animate-spin motion-reduce:animate-none"
                aria-hidden
              />
            ) : (
              <svg
                viewBox="0 0 18 18"
                className="size-4 -rotate-90"
                aria-hidden
              >
                <circle
                  cx="9"
                  cy="9"
                  r={RADIUS}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity={0.2}
                  strokeWidth={2}
                />
                <circle
                  key={cycleKey}
                  cx="9"
                  cy="9"
                  r={RADIUS}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={
                    reducedMotion ? CIRCUMFERENCE / 2 : undefined
                  }
                >
                  {reducedMotion ? null : (
                    <animate
                      attributeName="stroke-dashoffset"
                      from={CIRCUMFERENCE}
                      to="0"
                      dur={`${intervalMs}ms`}
                      repeatCount="indefinite"
                    />
                  )}
                </circle>
              </svg>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
