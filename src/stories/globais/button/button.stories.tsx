import * as React from 'react';
import { Mail, Plus, Trash2 } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Button } from '@/components/global/button/button';
import { Typography } from '@/components/ui/typography';

const meta = {
  title: 'Globais/Button',
  component: Button,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Estende o Button do shadcn com a prop `loading` — exibe spinner antes do label e desabilita o botão automaticamente. Mantém todas as variantes/tamanhos do primitivo.',
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <Typography variant="small">{title}</Typography>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </section>
  );
}

function LoadingDemo() {
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!loading) return;
    const timeout = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timeout);
  }, [loading]);

  return (
    <div className="flex flex-wrap gap-2">
      <Button loading={loading} onClick={() => setLoading(true)}>
        Default
      </Button>
      <Button
        loading={loading}
        onClick={() => setLoading(true)}
        variant="secondary"
      >
        Secondary
      </Button>
      <Button
        loading={loading}
        onClick={() => setLoading(true)}
        variant="destructive"
      >
        Destructive
      </Button>
      <Button
        loading={loading}
        onClick={() => setLoading(true)}
        variant="outline"
      >
        Outline
      </Button>
    </div>
  );
}

export const Vitrine: Story = {
  render: () => (
    <div className="space-y-6">
      <Section title="Variantes">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="brand">Brand</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </Section>

      <Section title="Tamanhos">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Adicionar">
          <Plus />
        </Button>
      </Section>

      <Section title="Com ícone">
        <Button>
          <Mail />
          Enviar e-mail
        </Button>
        <Button variant="destructive">
          <Trash2 />
          Excluir
        </Button>
      </Section>

      <Section title="Loading (clique para simular 2s)">
        <LoadingDemo />
      </Section>

      <Section title="Disabled e loading">
        <Button>Normal</Button>
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
        <Button loading disabled>
          Loading + Disabled
        </Button>
      </Section>
    </div>
  ),
};
