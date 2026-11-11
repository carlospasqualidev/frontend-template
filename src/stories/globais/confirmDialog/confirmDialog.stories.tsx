import * as React from 'react';
import { toast } from 'sonner';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { ConfirmDialog } from '@/components/global/confirmDialog/confirmDialog';
import { InputField } from '@/components/global/form/inputField';
import { Button } from '@/components/global/button/button';
import { Card } from '@/components/global/card/card';

const CONFIRM_MS = 1500;

const meta = {
  title: 'Globais/ConfirmDialog',
  component: ConfirmDialog,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Confirmação para ações destrutivas/reversíveis. **Uncontrolled** (`trigger` + estado interno) ou **controlled** (`open`/`setOpen`). Loading interno automático e auto-close em sucesso. A severidade aparece no filete lateral e no ícone: vermelho (`destructive`) para o que não se desfaz, âmbar (`warning`) nos demais; o ícone é decorativo e o significado está no título e na descrição.',
      },
    },
  },
  args: {
    title: '',
    description: '',
    trigger: null,
    onConfirm: () => undefined,
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-3">
      <ConfirmDialog
        open={open}
        setOpen={setOpen}
        title="Arquivar item?"
        description="O item será movido para a lista de arquivados."
        confirmLabel="Arquivar"
        onConfirm={async () => {
          await new Promise((resolve) => setTimeout(resolve, CONFIRM_MS));
          toast.success('Item arquivado.');
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setOpen(true)}>
          Abrir via botão
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            toast.info('Abrindo dialog em 1 segundo...');
            setTimeout(() => setOpen(true), 1000);
          }}
        >
          Abrir via timer
        </Button>
      </div>
    </div>
  );
}

function DoubleConfirmationDemo() {
  const [showSecondStep, setShowSecondStep] = React.useState(false);
  const [isBlocked, setIsBlocked] = React.useState(false);
  const [confirmationText, setConfirmationText] = React.useState('');

  const handleFirstConfirm = () => {
    setShowSecondStep(true);
  };

  const handleFinalConfirm = async () => {
    if (confirmationText !== 'BLOQUEAR') {
      toast.error('Digite BLOQUEAR para confirmar a ação.');
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, CONFIRM_MS));
    setShowSecondStep(false);
    setIsBlocked(true);
    toast.success('Ação confirmada. Usuário bloqueado.');
  };

  return (
    <div className="space-y-4">
      <ConfirmDialog
        title="Bloquear usuário?"
        description="A ação é irreversível. No próximo passo, confirme digitando BLOQUEAR."
        confirmLabel="Continuar"
        destructive
        trigger={<Button variant="destructive">Bloquear usuário</Button>}
        onConfirm={handleFirstConfirm}
      />

      {showSecondStep && (
        <Card
          title="Confirmação final"
          description="Digite a palavra exata para concluir a ação irreversível."
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Digite a palavra <strong>BLOQUEAR</strong> para concluir a ação.
            </p>
            <InputField
              label="Palavra de confirmação"
              value={confirmationText}
              onChange={(event) => setConfirmationText(event.target.value)}
              placeholder="BLOQUEAR"
            />
            <Button variant="destructive" onClick={handleFinalConfirm}>
              Confirmar bloqueio
            </Button>
          </div>
        </Card>
      )}

      {isBlocked && (
        <p className="text-success-foreground text-sm">
          Usuário bloqueado com sucesso.
        </p>
      )}
    </div>
  );
}

export const Vitrine: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card
        title="Destrutivo (uncontrolled)"
        description="Trigger abre o dialog; estado interno. Filete e ícone vermelhos."
      >
        <ConfirmDialog
          title="Excluir registro?"
          description="Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          destructive
          trigger={<Button variant="destructive">Excluir</Button>}
          onConfirm={async () => {
            await new Promise((resolve) => setTimeout(resolve, CONFIRM_MS));
            toast.success('Registro excluído.');
          }}
        />
      </Card>

      <Card
        title="Padrão (uncontrolled)"
        description="Confirmação para ações reversíveis. Filete e ícone âmbar."
      >
        <ConfirmDialog
          title="Publicar agora?"
          description="O conteúdo ficará visível para todos os usuários."
          confirmLabel="Publicar"
          trigger={<Button>Publicar</Button>}
          onConfirm={async () => {
            await new Promise((resolve) => setTimeout(resolve, CONFIRM_MS));
            toast.success('Publicado.');
          }}
        />
      </Card>

      <Card
        title="Controlled"
        description="Abre por atalho, evento programático ou múltiplos triggers."
      >
        <ControlledDemo />
      </Card>

      <Card
        title="Erro propagando do onConfirm"
        description="Quando a promise lança, o dialog permanece aberto, o botão sai do loading e o erro sobe — em produção, o interceptor do `api` já mostra o toast."
      >
        <ConfirmDialog
          title="Encerrar todas as sessões?"
          description="Todos os outros dispositivos precisarão fazer login novamente."
          confirmLabel="Encerrar todas"
          destructive
          trigger={<Button variant="destructive">Encerrar todas</Button>}
          onConfirm={async () => {
            await new Promise((resolve) => setTimeout(resolve, CONFIRM_MS));
            toast.error('Falha ao encerrar sessões. Tente novamente.');
            throw new Error('Falha simulada na API.');
          }}
        />
      </Card>
    </div>
  ),
};

export const DoubleConfirmation: Story = {
  render: () => (
    <Card
      title="Dupla confirmação"
      description="Fluxo recomendado para ações críticas que exigem uma segunda validação explícita."
    >
      <DoubleConfirmationDemo />
    </Card>
  ),
};
