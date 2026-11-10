import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@/components/global/button/button';

describe('Button (global)', () => {
  it('renderiza children e dispara onClick em estado normal', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Salvar</Button>);

    const button = screen.getByRole('button', { name: 'Salvar' });
    await userEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('a variante `brand` pinta o botão em soft-tint da marca, sem o fundo cheio do default', () => {
    render(<Button variant="brand">Importar</Button>);

    const button = screen.getByRole('button', { name: 'Importar' });
    expect(button).toHaveClass('bg-primary/10', 'text-primary');
    expect(button).not.toHaveClass('bg-primary');
  });

  it('exibe spinner e desabilita o botão quando loading=true', () => {
    render(<Button loading>Salvar</Button>);

    const button = screen.getByRole('button', { name: /salvar/i });
    expect(button).toBeDisabled();
    // O spinner do lucide renderiza um SVG dentro do botão
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('não dispara onClick enquanto loading=true', async () => {
    const handleClick = vi.fn();
    render(
      <Button loading onClick={handleClick}>
        Salvar
      </Button>
    );

    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('respeita disabled passado explicitamente sem precisar de loading', () => {
    render(<Button disabled>Salvar</Button>);

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
  });

  it('com `tooltip` deriva o nome acessível e revela o tooltip no hover (traz o próprio provider)', async () => {
    const user = userEvent.setup();
    render(
      <Button variant="ghost" size="icon" tooltip="Remover item">
        <span aria-hidden>×</span>
      </Button>
    );

    // O tooltip vira o aria-label (nome acessível) do botão-ícone.
    const button = screen.getByRole('button', { name: 'Remover item' });
    await user.hover(button);

    // O conteúdo do tooltip aparece (role="tooltip"); usa findAllBy pois o Radix
    // pode espelhar o texto para o leitor de tela.
    expect((await screen.findAllByText('Remover item')).length).toBeGreaterThan(
      0
    );
  });

  it('`aria-label` explícito tem prioridade sobre o texto do `tooltip`', () => {
    render(
      <Button variant="ghost" size="icon" tooltip="Dica" aria-label="Fechar">
        <span aria-hidden>×</span>
      </Button>
    );

    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
  });

  // Regressão: no modo `asChild` o primitivo é um `Slot` (React.Children.only), e
  // o slot do spinner fazia o render quebrar. Usado por ações que precisam ser um
  // link de verdade (abrir em nova aba com o clique do meio).
  it('com `asChild` aplica o estilo no elemento filho (ex.: um link) sem quebrar', () => {
    render(
      <Button asChild variant="ghost" size="icon" aria-label="Abrir registro">
        <a href="/records/1">
          <span aria-hidden>→</span>
        </a>
      </Button>
    );

    const link = screen.getByRole('link', { name: 'Abrir registro' });
    expect(link).toHaveAttribute('href', '/records/1');
    expect(link).toHaveAttribute('data-slot', 'button');
  });
});

describe('Button (global): disabledReason', () => {
  it('fica focável por Tab, com aria-disabled e nome "rótulo: motivo"', async () => {
    const user = userEvent.setup();
    render(
      <Button disabled disabledReason="Sem permissão" tooltip="Excluir">
        x
      </Button>
    );

    await user.tab();
    const button = screen.getByRole('button', {
      name: 'Excluir: Sem permissão',
    });
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
  });

  it('Enter e clique não chamam onClick', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Button
        disabled
        disabledReason="Sem permissão"
        aria-label="Excluir"
        onClick={handleClick}
      >
        x
      </Button>
    );

    await user.tab();
    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('type=submit não envia o formulário por Enter num campo', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((event: React.FormEvent) =>
      event.preventDefault()
    );
    render(
      <form onSubmit={handleSubmit}>
        <input aria-label="Nome" />
        <Button
          type="submit"
          disabled
          disabledReason="Preencha o nome"
          aria-label="Salvar"
        >
          x
        </Button>
      </form>
    );

    await user.type(screen.getByRole('textbox'), 'a{Enter}');
    await user.click(screen.getByRole('button'));

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("com '' continua focável e o nome é só o rótulo", async () => {
    const user = userEvent.setup();
    render(
      <Button disabled disabledReason="" aria-label="Excluir">
        x
      </Button>
    );

    await user.tab();
    expect(screen.getByRole('button', { name: 'Excluir' })).toHaveFocus();
  });

  it('loading vence: volta ao disabled nativo, sem aria-disabled', () => {
    render(
      <Button loading disabled disabledReason="Motivo" aria-label="Salvar">
        x
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Salvar' });
    expect(button).toBeDisabled();
    expect(button).not.toHaveAttribute('aria-disabled');
  });

  it('sem efeito de hover nem de active no modo aria-disabled (classe)', () => {
    render(
      <Button
        variant="outline"
        disabled
        disabledReason="Motivo"
        aria-label="Excluir"
      >
        x
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button.className).toContain('aria-disabled:hover:bg-background');
    expect(button.className).toContain('aria-disabled:active:translate-y-0');
    expect(button.className).toContain('hover:bg-muted');
  });
});

describe('Button (global): sem disabledReason não mexe no hover do consumidor', () => {
  it('mantém o className de hover do consumidor e não adiciona classe aria-disabled', () => {
    render(
      <Button variant="ghost" className="hover:bg-secondary">
        Dia
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Dia' });
    expect(button).toHaveClass('hover:bg-secondary');
    expect(button.className).not.toContain('aria-disabled:hover');
    expect(button).not.toHaveAttribute('aria-disabled');
  });
});
