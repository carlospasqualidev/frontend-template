import type { Meta, StoryObj } from '@storybook/tanstack-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card } from '@/components/global/card/card';

const meta = {
  title: 'UI primitivos/Accordion',
  component: Accordion,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Lista expansível para FAQ, configurações agrupadas e seções secundárias. Use `type="single" collapsible` para abrir apenas um item por vez (caso clássico) ou `type="multiple"` para permitir vários abertos.',
      },
    },
  },
  args: { type: 'single' },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vitrine: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card
        title="FAQ (single, collapsible)"
        description="Um item por vez. Clicar no aberto fecha — comportamento padrão de FAQ."
      >
        <Accordion type="single" collapsible defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>Como redefinir minha senha?</AccordionTrigger>
            <AccordionContent>
              Acesse "Minha conta" → "Segurança" e clique em "Alterar senha".
              Você receberá um link de redefinição no e-mail cadastrado.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>
              Posso ter mais de uma conta no mesmo e-mail?
            </AccordionTrigger>
            <AccordionContent>
              Não. Cada e-mail pode estar associado a apenas uma conta ativa no
              sistema.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>
              Onde vejo o histórico de acesso?
            </AccordionTrigger>
            <AccordionContent>
              Em "Minha conta" → "Segurança" → "Sessões ativas". Lá você também
              pode encerrar dispositivos remotos.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      <Card
        title="Configurações agrupadas (multiple)"
        description="Permite vários itens abertos ao mesmo tempo — útil para revisar várias seções juntas."
      >
        <Accordion type="multiple" defaultValue={['notif']}>
          <AccordionItem value="profile">
            <AccordionTrigger>Perfil público</AccordionTrigger>
            <AccordionContent>
              Nome, biografia e foto que aparecem para outros usuários.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="notif">
            <AccordionTrigger>Notificações</AccordionTrigger>
            <AccordionContent>
              Canais habilitados, frequência e tipos de eventos rastreados.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="privacy">
            <AccordionTrigger>Privacidade</AccordionTrigger>
            <AccordionContent>
              Quem pode ver seu perfil, mensagens diretas e atividade recente.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </div>
  ),
};
