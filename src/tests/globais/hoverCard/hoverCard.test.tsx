import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { HoverCard } from '@/components/global/hoverCard/hoverCard';

function renderHoverCard() {
  return render(
    <HoverCard
      openDelay={0}
      closeDelay={0}
      trigger={<button type="button">Maria Silva</button>}
    >
      <p>Administradora desde 2024</p>
    </HoverCard>
  );
}

describe('HoverCard (global)', () => {
  it('mantém o gatilho visível e o conteúdo fechado por padrão', () => {
    renderHoverCard();

    expect(
      screen.getByRole('button', { name: 'Maria Silva' })
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Administradora desde 2024')
    ).not.toBeInTheDocument();
  });

  it('revela o conteúdo no hover', async () => {
    const user = userEvent.setup();
    renderHoverCard();

    await user.hover(screen.getByRole('button', { name: 'Maria Silva' }));

    expect(
      await screen.findByText('Administradora desde 2024')
    ).toBeInTheDocument();
  });

  it('esconde o conteúdo ao sair do gatilho', async () => {
    const user = userEvent.setup();
    renderHoverCard();

    const trigger = screen.getByRole('button', { name: 'Maria Silva' });
    await user.hover(trigger);
    await screen.findByText('Administradora desde 2024');

    await user.unhover(trigger);

    await waitFor(() =>
      expect(
        screen.queryByText('Administradora desde 2024')
      ).not.toBeInTheDocument()
    );
  });

  // O trigger é `asChild`: o elemento passado continua sendo o elemento real
  // (focável por teclado), e não um wrapper extra.
  it('preserva o elemento do gatilho (asChild) e abre pelo foco', async () => {
    const user = userEvent.setup();
    renderHoverCard();

    await user.tab();

    expect(screen.getByRole('button', { name: 'Maria Silva' })).toHaveFocus();
    expect(
      await screen.findByText('Administradora desde 2024')
    ).toBeInTheDocument();
  });
});
