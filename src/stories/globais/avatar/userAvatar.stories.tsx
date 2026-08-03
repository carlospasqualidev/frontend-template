import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Card } from '@/components/global/card/card';
import { UserAvatar } from '@/components/global/avatar/userAvatar';
import { Typography } from '@/components/ui/typography';

const meta = {
  title: 'Globais/UserAvatar',
  component: UserAvatar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Avatar de usuário com fallback automático de iniciais quando a imagem está ausente ou falha ao carregar. Encapsula `Avatar`, `AvatarImage`, `AvatarFallback` e a regra de `getInitials`.',
      },
    },
  },
  args: { name: 'Maria Souza' },
} satisfies Meta<typeof UserAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vitrine: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card
        title="Tamanhos"
        description="Três tamanhos pré-definidos. `default` é o usado em listas."
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <UserAvatar name="Maria Souza" size="sm" />
            <Typography variant="muted" className="text-xs">
              sm
            </Typography>
          </div>
          <div className="flex flex-col items-center gap-2">
            <UserAvatar name="Maria Souza" />
            <Typography variant="muted" className="text-xs">
              default
            </Typography>
          </div>
          <div className="flex flex-col items-center gap-2">
            <UserAvatar name="Maria Souza" size="lg" />
            <Typography variant="muted" className="text-xs">
              lg
            </Typography>
          </div>
        </div>
      </Card>

      <Card
        title="Iniciais por nome"
        description="Um nome → duas primeiras letras. Múltiplos → primeira + última inicial."
      >
        <div className="flex flex-wrap items-center gap-4">
          <UserAvatar name="Ana" />
          <UserAvatar name="João Silva" />
          <UserAvatar name="Maria de Lourdes Souza" />
          <UserAvatar name="  " />
        </div>
        <Typography variant="muted" className="mt-3 text-xs">
          "Ana" → AN · "João Silva" → JS · "Maria de Lourdes Souza" → MS · vazio
          → ?
        </Typography>
      </Card>

      <Card
        title="Com imagem"
        description="Quando `imageUrl` carrega, sobrepõe as iniciais."
      >
        <div className="flex items-center gap-4">
          <UserAvatar
            name="Ana Beatriz"
            imageUrl="https://i.pravatar.cc/120?img=5"
            size="lg"
          />
          <UserAvatar
            name="João Pedro"
            imageUrl="https://i.pravatar.cc/120?img=12"
          />
          <UserAvatar
            name="Carla Mendes"
            imageUrl="https://example.invalid/x.png"
          />
        </div>
        <Typography variant="muted" className="mt-3 text-xs">
          A última imagem aponta para uma URL inválida — o fallback assume.
        </Typography>
      </Card>

      <Card
        title="Customização visual"
        description="`className` e `fallbackClassName` permitem usos especiais (ex.: cantos arredondados no sidebar)."
      >
        <div className="flex items-center gap-4">
          <UserAvatar
            name="Sofia Ramos"
            className="rounded-lg"
            fallbackClassName="rounded-lg"
          />
          <Typography variant="muted" className="text-xs">
            rounded-lg (uso do sidebar)
          </Typography>
        </div>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Os três tamanhos vêm do primitivo `Avatar` (`sm` 24px, `default` 32px, `lg` 40px). Para tamanhos arbitrários, passe `className` com `size-*`.',
      },
    },
  },
};
