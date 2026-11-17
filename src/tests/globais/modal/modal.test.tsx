import { useState, type ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  Modal,
  ModalActions,
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

  it('com headerAction e sem campo no corpo, o foco vai ao diálogo e não ao botão do cabeçalho', async () => {
    render(
      <Harness
        initialOpen
        headerAction={<button type="button">Baixar</button>}
        body={<p>Sem campos</p>}
      />
    );

    await waitFor(() => expect(screen.getByRole('dialog')).toHaveFocus());
    expect(screen.getByRole('button', { name: 'Baixar' })).not.toHaveFocus();
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

  it('o Dialog limita a altura total ao viewport, o corpo rola e o rodapé fica fixo', () => {
    render(<Harness initialOpen size="2xl" />);

    expect(screen.getByRole('dialog')).toHaveClass(
      'max-h-[calc(100dvh-2rem)]',
      'grid-rows-[auto_minmax(0,1fr)_auto]'
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
describe('ModalActions (global)', () => {
  function mockMobile(matches: boolean): void {
    window.matchMedia = (query) =>
      ({
        matches,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }

  function footerOf(element: HTMLElement): HTMLElement | null {
    return element.closest('[data-slot="modal-footer"]');
  }

  beforeEach(() => mockMobile(false));

  it('renderiza as ações no rodapé do modal, fora do corpo que rola', () => {
    render(
      <Harness
        initialOpen
        body={
          <>
            <p>Conteúdo do modal</p>
            <ModalActions>
              <button type="button">Salvar</button>
            </ModalActions>
          </>
        }
      />
    );

    const footer = footerOf(screen.getByRole('button', { name: 'Salvar' }));
    expect(footer).not.toBeNull();
    expect(footer).not.toContainElement(screen.getByText('Conteúdo do modal'));
    expect(footer?.parentElement).toBe(screen.getByRole('dialog'));
  });

  it('aplica a regra de layout: centraliza, quebra de linha e o botão único ocupa 100%', () => {
    render(
      <Harness
        initialOpen
        body={
          <ModalActions>
            <button type="button">Salvar</button>
          </ModalActions>
        }
      />
    );

    expect(
      footerOf(screen.getByRole('button', { name: 'Salvar' }))
    ).toHaveClass(
      'flex-wrap',
      'justify-center',
      'gap-2',
      '[&>:not(button)]:basis-full',
      '[&>button:only-of-type]:basis-full'
    );
  });

  it('com dois botões, mantém a ordem do DOM (negativa à esquerda)', () => {
    render(
      <Harness
        initialOpen
        body={
          <ModalActions>
            <button type="button">Recusar</button>
            <button type="button">Aceitar</button>
          </ModalActions>
        }
      />
    );

    const footer = footerOf(screen.getByRole('button', { name: 'Recusar' }));
    expect(
      Array.from(footer?.querySelectorAll(':scope > button') ?? []).map(
        (button) => button.textContent
      )
    ).toEqual(['Recusar', 'Aceitar']);
  });

  it('acompanha o condicional: um botão, depois dois irmãos no mesmo rodapé', () => {
    function Conditional({ canDelete }: { canDelete: boolean }) {
      return (
        <Harness
          initialOpen
          body={
            <ModalActions>
              <button type="button">Salvar</button>
              {canDelete && <button type="button">Excluir</button>}
            </ModalActions>
          }
        />
      );
    }
    const { rerender } = render(<Conditional canDelete={false} />);
    const footer = footerOf(screen.getByRole('button', { name: 'Salvar' }));
    expect(footer?.querySelectorAll(':scope > button')).toHaveLength(1);

    rerender(<Conditional canDelete />);
    expect(footer?.querySelectorAll(':scope > button')).toHaveLength(2);
  });

  it('sem ModalActions, o rodapé fica vazio e sai do layout por empty:hidden', () => {
    render(<Harness initialOpen />);

    const footer = screen
      .getByRole('dialog')
      .querySelector('[data-slot="modal-footer"]');
    expect(footer).toBeEmptyDOMElement();
    expect(footer).toHaveClass('empty:hidden');
  });

  it('texto ao lado do botão ocupa a linha inteira', () => {
    render(
      <Harness
        initialOpen
        body={
          <ModalActions>
            <p>Esta ação não pode ser desfeita.</p>
            <button type="button">Excluir</button>
          </ModalActions>
        }
      />
    );

    const footer = footerOf(
      screen.getByText('Esta ação não pode ser desfeita.')
    );
    expect(footer).toHaveClass(
      '[&>:not(button)]:basis-full',
      '[&>:not(button)]:text-center'
    );
    expect(footer?.querySelectorAll(':scope > button')).toHaveLength(1);
  });

  it('o submit no rodapé envia o formulário do corpo pelo atributo form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <Harness
        initialOpen
        body={
          <>
            <form id="modal-test-form" onSubmit={onSubmit}>
              <label htmlFor="modal-test-name">Nome</label>
              <input id="modal-test-name" />
            </form>
            <ModalActions>
              <button type="submit" form="modal-test-form">
                Salvar
              </button>
            </ModalActions>
          </>
        }
      />
    );

    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    await user.type(screen.getByLabelText('Nome'), 'Ana{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it('no Drawer (mobile), as ações também vão para o rodapé', () => {
    mockMobile(true);
    render(
      <Harness
        initialOpen
        body={
          <ModalActions>
            <button type="button">Salvar</button>
          </ModalActions>
        }
      />
    );

    const footer = footerOf(screen.getByRole('button', { name: 'Salvar' }));
    expect(footer?.parentElement).toBe(screen.getByRole('dialog'));
  });

  it('ao abrir, o foco inicial vai ao campo do corpo, não à ação do rodapé', async () => {
    const user = userEvent.setup();
    render(
      <Harness
        body={
          <>
            <label htmlFor="modal-focus-name">Nome</label>
            <input id="modal-focus-name" />
            <ModalActions>
              <button type="button">Salvar</button>
            </ModalActions>
          </>
        }
      />
    );

    await user.click(screen.getByRole('button', { name: 'Abrir' }));

    await waitFor(() => expect(screen.getByLabelText('Nome')).toHaveFocus());
  });

  it('sem campo no corpo, o foco inicial vai à primeira ação do rodapé', async () => {
    const user = userEvent.setup();
    render(
      <Harness
        body={
          <>
            <p>Texto</p>
            <ModalActions>
              <button type="button">Continuar</button>
            </ModalActions>
          </>
        }
      />
    );

    await user.click(screen.getByRole('button', { name: 'Abrir' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Continuar' })).toHaveFocus()
    );
  });

  it('fora de um Modal, falha com erro explícito', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() =>
      render(
        <ModalActions>
          <button type="button">Salvar</button>
        </ModalActions>
      )
    ).toThrow('ModalActions must be rendered inside a Modal.');
  });
});
