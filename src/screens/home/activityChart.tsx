import { Card } from '@/components/global/card/card';
import { DemoNotice } from '@/components/global/demoNotice/demoNotice';
import { Typography } from '@/components/ui/typography';
import { DEMO_WEEKLY_ACTIVITY } from '@/screens/home/utils/homeDemo';

interface ActivityChartProps {
  className?: string;
}

/**
 * Logins por dia na semana: demonstração (o servidor não agrega a trilha por
 * dia). Mini gráfico de barras em CSS, sem biblioteca: cada barra tem a altura
 * relativa ao maior valor da série.
 */
export function ActivityChart({ className }: ActivityChartProps) {
  const max = Math.max(...DEMO_WEEKLY_ACTIVITY.map((point) => point.value));
  const total = DEMO_WEEKLY_ACTIVITY.reduce(
    (sum, point) => sum + point.value,
    0
  );

  return (
    <Card
      title="Atividade da semana"
      description={`${total} logins nos últimos 7 dias`}
      action={<DemoNotice />}
      className={className}
    >
      <div className="flex h-48 gap-2 sm:gap-3">
        {DEMO_WEEKLY_ACTIVITY.map((point) => {
          const heightPercent = max > 0 ? (point.value / max) * 100 : 0;
          return (
            <div
              key={point.label}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <span className="w-full text-center text-xs font-medium text-muted-foreground">
                {point.value}
              </span>
              {/* A área que sobra na coluna é a altura de 100%: sem ela, a
                  porcentagem da barra não tem referência e a barra achata. */}
              <div className="flex w-full flex-1 items-end">
                <div
                  role="img"
                  className="min-h-1 w-full rounded-md bg-primary/80 transition-[height] hover:bg-primary motion-reduce:transition-none"
                  style={{ height: `${heightPercent}%` }}
                  aria-label={`${point.label}: ${point.value} logins`}
                />
              </div>
              <Typography
                as="span"
                variant="small"
                className="text-xs text-muted-foreground"
              >
                {point.label}
              </Typography>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
