import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  PageActions,
  PageActionsSlot,
} from '@/components/global/layout/pageActions';

describe('PageActions', () => {
  it('renderiza os children DENTRO do slot do header, não onde foi declarado', async () => {
    render(
      <div>
        <header data-testid="header">
          <PageActionsSlot />
        </header>
        <main data-testid="main">
          <PageActions>
            <button type="button">Novo usuário</button>
          </PageActions>
        </main>
      </div>
    );

    const button = await screen.findByRole('button', { name: 'Novo usuário' });

    // O portal é o ponto do componente: a tela declara a ação no seu JSX, mas
    // ela aparece no header global.
    expect(screen.getByTestId('header')).toContainElement(button);
    expect(screen.getByTestId('main')).not.toContainElement(button);
  });

  // Sem o slot montado (tela fora do Layout), o componente não pode quebrar o
  // render — só não exibe nada.
  it('sem o slot no documento, não renderiza nada (e não lança)', () => {
    render(
      <PageActions>
        <button type="button">Novo usuário</button>
      </PageActions>
    );

    expect(
      screen.queryByRole('button', { name: 'Novo usuário' })
    ).not.toBeInTheDocument();
  });

  it('remove as ações do header ao desmontar a tela', async () => {
    const { unmount } = render(
      <div>
        <PageActionsSlot />
        <PageActions>
          <button type="button">Novo usuário</button>
        </PageActions>
      </div>
    );

    await screen.findByRole('button', { name: 'Novo usuário' });

    unmount();

    expect(
      screen.queryByRole('button', { name: 'Novo usuário' })
    ).not.toBeInTheDocument();
  });

  it('o slot protege as ações do breadcrumb longo (não encolhe)', () => {
    const { container } = render(<PageActionsSlot />);

    expect(container.firstElementChild).toHaveClass('shrink-0', 'ml-auto');
  });
});
