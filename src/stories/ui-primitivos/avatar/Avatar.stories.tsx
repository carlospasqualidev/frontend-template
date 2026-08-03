import { UserRound } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@/components/ui/avatar';
import { Card } from '@/components/global/card/card';

const meta = {
  title: 'UI primitivos/Avatar',
  component: Avatar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Avatar de usuário com imagem opcional, fallback (texto ou ícone), badge de status e suporte a agrupamento. Tamanhos: `sm`, `default`, `lg`.',
      },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vitrine: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card
        title="Imagem + fallback"
        description="Imagem com fallback caso falhe."
      >
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage src="/imagem-inexistente.png" alt="Ana Silva" />
            <AvatarFallback>AS</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>
              <UserRound />
            </AvatarFallback>
          </Avatar>
        </div>
      </Card>

      <Card title="Tamanhos" description="sm / default / lg via prop size.">
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback>SM</AvatarFallback>
          </Avatar>
          <Avatar size="default">
            <AvatarFallback>MD</AvatarFallback>
          </Avatar>
          <Avatar size="lg">
            <AvatarFallback>LG</AvatarFallback>
          </Avatar>
        </div>
      </Card>

      <Card
        title="Com badge"
        description="Pílula no canto inferior direito — uso típico: status online."
      >
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>AS</AvatarFallback>
            <AvatarBadge className="bg-green-500" />
          </Avatar>
          <Avatar size="lg">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>SC</AvatarFallback>
            <AvatarBadge className="bg-amber-500" />
          </Avatar>
        </div>
      </Card>

      <Card
        title="Grupo de avatares"
        description="Avatares sobrepostos + contador de excedentes."
      >
        <AvatarGroup>
          <Avatar>
            <AvatarFallback>AS</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>JP</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>MC</AvatarFallback>
          </Avatar>
          <AvatarGroupCount>+5</AvatarGroupCount>
        </AvatarGroup>
      </Card>
    </div>
  ),
};
