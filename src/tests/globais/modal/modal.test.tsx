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
}: {
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
        description="Atualize seus dados."
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
});
