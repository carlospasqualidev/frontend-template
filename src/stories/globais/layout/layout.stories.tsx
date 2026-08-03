import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Card } from '@/components/global/card/card';
import { NotFound } from '@/components/global/layout/notFound';
import { SuspenseFallback } from '@/components/global/layout/suspenseFallback';
import { ToggleTheme } from '@/components/global/layout/toggleTheme';
import { Typography } from '@/components/ui/typography';

const meta = {
  title: 'Globais/Layout',
  component: ToggleTheme,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Peças de "chrome" do layout que uma tela nunca monta à mão: o alternador de tema (vive no menu do usuário), o fallback de carregamento de ROTA e a tela de 404. Aparecem aqui para ficarem no radar — reuse em vez de recriar.',
      },
    },
  },
} satisfies Meta<typeof ToggleTheme>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vitrine: Story = {
  render: () => (
    <div className="space-y-4">
      <Card
        title="ToggleTheme"
        description="Botão-ícone com menu de 3 opções (Claro / Escuro / Sistema). Já vive no menu do usuário da sidebar — não duplique um seletor de tema na tela."
      >
        <div className="flex items-center gap-3">
          <ToggleTheme />
          <Typography variant="muted">
            O sol/lua troca conforme o tema ativo; o rótulo acessível e o
            tooltip são "Alternar tema".
          </Typography>
        </div>
      </Card>

      <Card
        title="SuspenseFallback"
        description="Indicador do carregamento do CHUNK da próxima rota: uma barra de 2px que não ocupa altura visível. Não use como substituto de skeleton de dado — o carregamento de dados é responsabilidade da tela, com skeleton no lugar do valor."
      >
        <div className="space-y-2">
          <SuspenseFallback />
          <Typography variant="muted">
            Com `defaultPreload: 'intent'`, a rota é pré-carregada no hover —
            por isso este fallback quase nunca aparece.
          </Typography>
        </div>
      </Card>

      <Card
        title="NotFound"
        description="Tela de 404 do router (`notFoundComponent` da raiz). A saída é um LINK de verdade para o início — não um botão que navega."
      >
        {/* `min-h-svh` do componente é reduzido aqui só para caber na vitrine. */}
        <div className="overflow-hidden rounded-lg border [&>div]:min-h-64">
          <NotFound />
        </div>
      </Card>
    </div>
  ),
};
