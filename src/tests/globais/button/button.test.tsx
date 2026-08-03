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
