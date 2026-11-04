import { useState, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
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
  description = 'Atualize seus dados.',
}: {
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
      >
        <p>Conteúdo do modal</p>
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
