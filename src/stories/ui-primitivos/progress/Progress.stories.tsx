import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/global/card/card';
import { Progress } from '@/components/ui/progress';
import { Typography } from '@/components/ui/typography';

const meta = {
  title: 'UI primitivos/Progress',
  component: Progress,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Barra de progresso determinística. Use quando você sabe quanto falta (upload, onboarding, sincronização). Para carregamento indeterminado, prefira `Skeleton` ou spinner.',
      },
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

function AnimatedProgressDemo() {
  const [value, setValue] = React.useState(0);
  const [started, setStarted] = React.useState(false);
  const running = started && value < 100;

  React.useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setValue((prev) => prev + 5), 150);
    return () => clearTimeout(id);
  }, [running, value]);

  const start = () => {
    setValue(0);
    setStarted(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Typography as="span" variant="muted">
          Enviando arquivo...
        </Typography>
        <Typography as="span" variant="small">
          {value}%
        </Typography>
      </div>
      <Progress value={value} />
      <Button variant="outline" onClick={start} disabled={running}>
        {value >= 100 ? 'Recomeçar' : 'Iniciar upload'}
      </Button>
    </div>
  );
}

export const Vitrine: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card
        title="Valores fixos"
        description="Exibição de progresso em diferentes estágios."
      >
        <div className="space-y-4">
          {[0, 25, 50, 75, 100].map((value) => (
            <div key={value} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{value}%</span>
              </div>
              <Progress value={value} />
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="Animado"
        description="Caso real: upload simulado avançando 5% a cada 150ms."
      >
        <AnimatedProgressDemo />
      </Card>
    </div>
  ),
};
