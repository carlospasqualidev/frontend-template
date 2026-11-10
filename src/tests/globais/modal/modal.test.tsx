import { useState, type ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  Modal,
  ModalFooter,
  type ModalSize,
} from '@/components/global/modal/modal';

function Harness({
  initialOpen = false,
  size,
  onBack,
  backLabel,
  icon,
  headerAction,
  dismissible,
  description = 'Atualize seus dados.',
  body = <p>Conteúdo do modal</p>,
}: {
  body?: ReactNode;
  headerAction?: ReactNode;
  dismissible?: boolean;
  description?: string | null;
  initialOpen?: boolean;
  size?: ModalSize;
  onBack?: () => void;
  backLabel?: string;
  icon?: ReactNode;
}) {
  const [open, setOpen] = useState(initialOpen);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      <Modal
        open={open}
        setOpen={setOpen}
        size={size}
        title="Editar perfil"
        description={description ?? undefined}
        onBack={onBack}
        backLabel={backLabel}
        icon={icon}
        headerAction={headerAction}
        dismissible={dismissible}
      >
        {body}
      </Modal>
    </>
  );
}

describe('Modal (global)', () => {
  beforeEach(() => {
    // Desktop por padrão (matchMedia mock retorna false para max-width: 767px).
    window.matchMedia = (query) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList;
  });

  it('não renderiza conteúdo quando open=false', () => {
    render(<Harness />);

    expect(screen.queryByText('Editar perfil')).not.toBeInTheDocument();
    expect(screen.queryByText('Conteúdo do modal')).not.toBeInTheDocument();
  });

  it('renderiza title, description e children quando aberto', async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    expect(screen.getByText('Editar perfil')).toBeInTheDocument();
    expect(screen.getByText('Atualize seus dados.')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo do modal')).toBeInTheDocument();
  });

  it('com descrição, liga o diálogo a ela por aria-describedby', () => {
    render(<Harness initialOpen />);

    const description = screen.getByText('Atualize seus dados.');
    expect(screen.getByRole('dialog')).toHaveAttribute(
      'aria-describedby',
      description.id
    );
  });

  it('sem descrição, não renderiza elemento de descrição nem aria-describedby', () => {
    render(<Harness initialOpen description={null} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelector('[data-slot="dialog-description"]')).toBeNull();
    expect(dialog).not.toHaveAttribute('aria-describedby');
    expect(screen.getByText('Editar perfil')).toBeInTheDocument();
  });

  it('no mobile (Drawer), sem descrição, também não renderiza descrição nem aria-describedby', () => {
    window.matchMedia = (query) =>
      ({
        matches: true,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList;

    render(<Harness initialOpen description={null} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelector('[data-slot="drawer-description"]')).toBeNull();
    expect(dialog).not.toHaveAttribute('aria-describedby');
  });

  it('headerAction aparece no cabeçalho, em ml-auto shrink-0, no Dialog', () => {
    render(
      <Harness
        initialOpen
        headerAction={<button type="button">Baixar</button>}
      />
    );

    const action = screen.getByRole('button', { name: 'Baixar' });
    expect(action.parentElement).toHaveClass('ml-auto', 'shrink-0');
    expect(screen.getByRole('dialog').contains(action)).toBe(true);
  });

  it('headerAction também aparece no Drawer (mobile)', () => {
    window.matchMedia = (query) =>
      ({
        matches: true,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList;

    render(
      <Harness
        initialOpen
        headerAction={<button type="button">Baixar</button>}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Baixar' }).parentElement
    ).toHaveClass('ml-auto', 'shrink-0');
  });

  it('dismissible padrão: o X existe e o Esc fecha', async () => {
    render(<Harness initialOpen />);

    expect(screen.getByRole('button', { name: /fechar|close/i })).toBeTruthy();
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('dismissible padrão: clique fora fecha (controle do bloqueante)', async () => {
    render(<Harness initialOpen />);

    await userEvent.setup({ pointerEventsCheck: 0 }).click(document.body);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('com headerAction, o foco inicial vai ao primeiro campo do corpo', async () => {
    render(
      <Harness
        initialOpen
        headerAction={<button type="button">Baixar</button>}
        body={<input aria-label="Nome" />}
      />
    );

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveFocus()
    );
  });

  it('o foco inicial pula file input oculto, hidden e tabindex=-1 e vai ao primeiro campo real', async () => {
    render(
      <Harness
        initialOpen
        headerAction={<button type="button">Baixar</button>}
        body={
          <>
            <input
              type="file"
              aria-label="Arquivo"
              style={{ display: 'none' }}
            />
            <input type="hidden" name="token" />
            <input aria-label="Ignorado" tabIndex={-1} />
            <input aria-label="Nome" />
          </>
        }
      />
    );

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveFocus()
    );
  });

  it('no Drawer, o foco inicial não é forçado ao campo do corpo', async () => {
    window.matchMedia = (query) =>
      ({
        matches: true,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList;

    render(
      <Harness
        initialOpen
        headerAction={<button type="button">Baixar</button>}
        body={<input aria-label="Nome" />}
      />
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByRole('textbox', { name: 'Nome' })).not.toHaveFocus();
  });

  it('o Dialog limita a altura total ao viewport e o corpo rola', () => {
    render(<Harness initialOpen size="2xl" />);

    expect(screen.getByRole('dialog')).toHaveClass(
      'max-h-[calc(100dvh-2rem)]',
      'grid-rows-[auto_minmax(0,1fr)]'
    );
  });

  it('dismissible=false: sem X, Esc e clique fora não fecham, e o cabeçalho não reserva pr-12', async () => {
    render(<Harness initialOpen dismissible={false} />);

    expect(
      screen.queryByRole('button', { name: /fechar|close/i })
    ).not.toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.setup({ pointerEventsCheck: 0 }).click(document.body);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const header = screen
      .getByText('Editar perfil')
      .closest('[data-slot="dialog-header"]');
    expect(header).not.toHaveClass('pr-12');
  });

  it('dismissible=false no Drawer: Esc não fecha', async () => {
    window.matchMedia = (query) =>
      ({
        matches: true,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList;

    render(<Harness initialOpen dismissible={false} />);
    await userEvent.keyboard('{Escape}');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it.each([
    [true, 'ligado'],
    [false, 'desligado'],
  ])('sem descrição fica sem aria-describedby, dismissible %s', (value) => {
    render(<Harness initialOpen description={null} dismissible={value} />);

    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
  });

  it.each([
    ['default', 'max-h-[70dvh]'],
    ['lg', 'max-h-[70dvh]'],
    ['xl', 'max-h-[85dvh]'],
    ['2xl', 'max-h-[85dvh]'],
  ] as const)('size=%s limita o corpo a %s', (size, expected) => {
    render(<Harness initialOpen size={size} />);

    const viewport = screen
      .getByText('Conteúdo do modal')
      .closest('[data-slot="scroll-area-viewport"]');
    expect(viewport).toHaveClass(expected);
  });

  it('inicializa aberto quando open=true desde o start', () => {
    render(<Harness initialOpen />);

    expect(screen.getByText('Editar perfil')).toBeInTheDocument();
  });

  it('aplica a largura padrão no desktop', () => {
    render(<Harness initialOpen />);

    expect(screen.getByRole('dialog')).toHaveClass('sm:max-w-lg');
  });

  it('aplica a largura maior quando size="xl"', () => {
    render(<Harness initialOpen size="xl" />);

    expect(screen.getByRole('dialog')).toHaveClass('sm:max-w-5xl');
  });

  it('aplica a largura máxima quando size="2xl"', () => {
    render(<Harness initialOpen size="2xl" />);

    expect(screen.getByRole('dialog')).toHaveClass('sm:max-w-6xl');
  });

  it('não mostra o botão de voltar quando onBack não é informado', () => {
    render(<Harness initialOpen />);

    expect(
      screen.queryByRole('button', { name: 'Voltar' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Voltar' })
    ).not.toBeInTheDocument();
  });

  it('mostra o botão de voltar com o rótulo padrão e dispara onBack ao clicar', async () => {
    const onBack = vi.fn();
    render(<Harness initialOpen onBack={onBack} />);

    const backButton = screen.getByRole('button', { name: 'Voltar' });
    await userEvent.click(backButton);

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('usa backLabel como nome acessível do botão de voltar', () => {
    render(
      <Harness initialOpen onBack={() => undefined} backLabel="Trocar opção" />
    );
    render(
      <Harness initialOpen onBack={() => undefined} backLabel="Trocar opção" />
    );

    expect(
      screen.getByRole('button', { name: 'Trocar opção' })
    ).toBeInTheDocument();
  });
});

describe('ModalFooter (global)', () => {
  it('renderiza os botões de ação passados como children', () => {
    render(
      <ModalFooter>
        <button type="button">Salvar</button>
      </ModalFooter>
    );

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('centraliza e quebra de linha, com o botão único em 100% por only-of-type', () => {
    render(
      <ModalFooter>
        <button type="button">Salvar</button>
      </ModalFooter>
    );

    expect(screen.getByRole('button').parentElement).toHaveClass(
      'flex-wrap',
      'justify-center',
      'gap-2',
      '[&>button:only-of-type]:basis-full'
    );
  });

  it('com dois botões, mantém ambos no DOM, na ordem, sob a mesma regra', () => {
    render(
      <ModalFooter>
        <button type="button">Cancelar</button>
        <button type="button">Confirmar</button>
      </ModalFooter>
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual([
      'Cancelar',
      'Confirmar',
    ]);
    expect(buttons[0].parentElement).toHaveClass('justify-center');
    expect(
      buttons[0].parentElement?.querySelectorAll('button:only-of-type')
    ).toHaveLength(0);
  });

  it('com condicional falsa, o único botão fica sob a regra de 100%; com verdadeira, são dois irmãos centralizados', () => {
    const Footer = ({ canDelete }: { canDelete: boolean }) => (
      <ModalFooter>
        <button type="button">Salvar</button>
        {canDelete && <button type="button">Excluir</button>}
      </ModalFooter>
    );
    const { container, rerender } = render(<Footer canDelete={false} />);
    const footer = container.firstElementChild;
    expect(footer).toHaveClass(
      'flex-wrap',
      'justify-center',
      '[&>button:only-of-type]:basis-full'
    );
    expect(footer?.querySelectorAll(':scope > button')).toHaveLength(1);

    rerender(<Footer canDelete />);
    expect(footer?.querySelectorAll(':scope > button')).toHaveLength(2);
    expect(footer).toHaveClass('justify-center', 'gap-2');
  });

  it('marca o rodapé com data-slot="modal-footer"', () => {
    const { container } = render(
      <ModalFooter>
        <button type="button">Salvar</button>
      </ModalFooter>
    );

    expect(container.firstElementChild).toHaveAttribute(
      'data-slot',
      'modal-footer'
    );
  });

  it('texto ao lado do botão: linha inteira centralizada, e o botão segue sendo o único <button> filho', () => {
    const { container } = render(
      <ModalFooter>
        <p>Esta ação não pode ser desfeita.</p>
        <button type="button">Excluir</button>
      </ModalFooter>
    );
    const footer = container.firstElementChild;

    expect(footer).toHaveClass(
      '[&>:not(button)]:basis-full',
      '[&>:not(button)]:text-center',
      '[&>button:only-of-type]:basis-full'
    );
    expect(footer?.querySelector(':scope > p')?.tagName).toBe('P');
    expect(footer?.querySelectorAll(':scope > button')).toHaveLength(1);
  });
});
