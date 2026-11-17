import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Modal, ModalActions } from '@/components/global/modal/modal';
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
  const [dirty, setDirty] = React.useState(false);

  return (
    <>
      <Button
        onClick={(event) => {
          event.currentTarget.blur();
          setDirty(false);
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
        <form
          id="modal-story-profile-form"
          className="grid items-start gap-6"
          onInput={() => setDirty(true)}
          onSubmit={(event) => {
            event.preventDefault();
            setOpen(false);
          }}
        >
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
        </form>
        <ModalActions>
          <Button
            type="submit"
            form="modal-story-profile-form"
            disabled={!dirty}
          >
            Salvar alterações
          </Button>
        </ModalActions>
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
  const [dirty, setDirty] = React.useState(false);

  return (
    <>
      <Button
        onClick={(event) => {
          event.currentTarget.blur();
          setStep('menu');
          setDirty(false);
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
          <ModalActions>
            <Button onClick={() => setStep('form')}>Continuar</Button>
          </ModalActions>
        ) : (
          <>
            <form
              className="grid items-start gap-6"
              onInput={() => setDirty(true)}
            >
              <div className="grid gap-3">
                <Label htmlFor="modal-story-step-name">Nome</Label>
                <Input id="modal-story-step-name" defaultValue="" />
              </div>
            </form>
            <ModalActions>
              <Button disabled={!dirty} onClick={() => setOpen(false)}>
                Salvar
              </Button>
            </ModalActions>
          </>
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
        <ModalActions>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Restaurar padrão
          </Button>
          <Button onClick={() => setOpen(false)}>Salvar alterações</Button>
        </ModalActions>
      </Modal>
    </>
  );
}

const LONG_BODY_SECTIONS = Array.from(
  { length: 12 },
  (_, index) => `Cláusula ${index + 1}`
);

function LongBodyDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        onClick={(event) => {
          event.currentTarget.blur();
          setOpen(true);
        }}
      >
        Abrir modal com corpo longo
      </Button>

      <Modal title="Termos de uso" open={open} setOpen={setOpen}>
        <div className="space-y-4 text-sm">
          {LONG_BODY_SECTIONS.map((section) => (
            <p key={section}>
              <strong>{section}.</strong> O conteúdo rola dentro do corpo; o
              rodapé com as ações fica fixo embaixo, sempre à vista.
            </p>
          ))}
        </div>
        <ModalActions>
          <Button onClick={() => setOpen(false)}>Li e concordo</Button>
        </ModalActions>
      </Modal>
    </>
  );
}

export const ComCorpoLongo: Story = {
  render: () => (
    <Card
      title="Rodapé fixo"
      description="As ações do `ModalActions` ficam fora da área que rola: o corpo rola, o rodapé não."
    >
      <LongBodyDemo />
    </Card>
  ),
};

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

function HeaderActionDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        onClick={(event) => {
          event.currentTarget.blur();
          setOpen(true);
        }}
      >
        Abrir modal com ação no cabeçalho
      </Button>

      <Modal
        title="Contrato.pdf"
        open={open}
        setOpen={setOpen}
        size="xl"
        headerAction={
          <Button variant="outline" size="sm">
            Baixar
          </Button>
        }
      >
        <p>Corpo largo: no tamanho xl o corpo chega a 85% da altura da tela.</p>
      </Modal>
    </>
  );
}

export const ComAcaoNoCabecalho: Story = {
  render: () => (
    <Card
      title="Ação no cabeçalho"
      description="`headerAction` fica à direita, antes do X; `xl` e `2xl` têm corpo mais alto."
    >
      <HeaderActionDemo />
    </Card>
  ),
};

function BlockingDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        onClick={(event) => {
          event.currentTarget.blur();
          setOpen(true);
        }}
      >
        Abrir modal bloqueante
      </Button>

      <Modal
        title="Aceite os termos"
        open={open}
        setOpen={setOpen}
        dismissible={false}
      >
        <ModalActions>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Recusar
          </Button>
          <Button onClick={() => setOpen(false)}>Aceitar</Button>
        </ModalActions>
      </Modal>
    </>
  );
}

export const Bloqueante: Story = {
  render: () => (
    <Card
      title="Modal bloqueante"
      description="Com `dismissible={false}` Esc, clique fora e X não fecham: só os botões do conteúdo."
    >
      <BlockingDemo />
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
