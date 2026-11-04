import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Modal, ModalFooter } from '@/components/global/modal/modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/global/card/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'Globais/Modal',
  component: Modal,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Dialog no desktop, drawer no mobile (detecção automática via `useIsMobile`). Estado de abertura é controlado pelo consumidor.',
      },
    },
  },
  args: {
    title: '',
    description: '',
    children: null,
    open: false,
    setOpen: () => undefined,
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

function EditProfileDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        onClick={(event) => {
          event.currentTarget.blur();
          setOpen(true);
        }}
      >
        Abrir modal
      </Button>

      <Modal
        title="Editar perfil"
        description="Atualize seus dados pessoais e salve."
        open={open}
        setOpen={setOpen}
      >
        <form className="grid items-start gap-6">
          <div className="grid gap-3">
            <Label htmlFor="modal-story-email">E-mail</Label>
            <Input
              id="modal-story-email"
              type="email"
              defaultValue="usuario@empresa.com"
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="modal-story-username">Usuário</Label>
            <Input id="modal-story-username" defaultValue="@usuario" />
          </div>
          <ModalFooter>
            <Button onClick={() => setOpen(false)}>Salvar alterações</Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}

export const Vitrine: Story = {
  render: () => (
    <Card
      title="Modal responsivo"
      description="Abre como dialog no desktop e drawer no mobile (redimensione a janela para testar)."
    >
      <EditProfileDemo />
    </Card>
  ),
};

function StepsDemo() {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<'menu' | 'form'>('menu');

  return (
    <>
      <Button
        onClick={(event) => {
          event.currentTarget.blur();
          setStep('menu');
          setOpen(true);
        }}
      >
        Abrir fluxo com passos
      </Button>

      <Modal
        title={step === 'menu' ? 'Escolha uma opção' : 'Preencha os dados'}
        description={
          step === 'menu'
            ? 'O botão de voltar aparece só a partir do 2º passo.'
            : 'Use a seta ao lado do título para voltar ao passo anterior.'
        }
        open={open}
        setOpen={setOpen}
        onBack={step === 'form' ? () => setStep('menu') : undefined}
        backLabel="Voltar à seleção"
      >
        {step === 'menu' ? (
          <ModalFooter>
            <Button onClick={() => setStep('form')}>Continuar</Button>
          </ModalFooter>
        ) : (
          <form className="grid items-start gap-6">
            <div className="grid gap-3">
              <Label htmlFor="modal-story-step-name">Nome</Label>
              <Input id="modal-story-step-name" defaultValue="" />
            </div>
            <ModalFooter>
              <Button onClick={() => setOpen(false)}>Salvar</Button>
            </ModalFooter>
          </form>
        )}
      </Modal>
    </>
  );
}

function TwoButtonsDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        onClick={(event) => {
          event.currentTarget.blur();
          setOpen(true);
        }}
      >
        Abrir modal com dois botões
      </Button>

      <Modal
        title="Editar perfil"
        description="Dois botões ficam centralizados, cada um com a largura do texto."
        open={open}
        setOpen={setOpen}
      >
        <ModalFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Restaurar padrão
          </Button>
          <Button onClick={() => setOpen(false)}>Salvar alterações</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

export const ComDoisBotoes: Story = {
  render: () => (
    <Card
      title="Rodapé com dois botões"
      description="Um botão ocupa a linha toda; dois ou mais centralizam e quebram de linha se não couberem."
    >
      <TwoButtonsDemo />
    </Card>
  ),
};

export const ComVoltar: Story = {
  render: () => (
    <Card
      title="Botão de voltar (fluxo com passos)"
      description="Prop `onBack` opcional: mostra um ícone de voltar à esquerda do título, alinhado entre título e descrição."
    >
      <StepsDemo />
    </Card>
  ),
};
