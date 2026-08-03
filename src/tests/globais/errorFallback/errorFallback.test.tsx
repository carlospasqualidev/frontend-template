import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ErrorFallback } from '@/components/global/errorFallback';

function renderFallback(resetErrorBoundary = vi.fn()) {
  render(
    <ErrorFallback
      error={new Error('boom')}
      resetErrorBoundary={resetErrorBoundary}
    />
  );
  return { resetErrorBoundary };
}

describe('ErrorFallback', () => {
  it('explica o problema em pt-BR, sem vazar detalhe técnico', () => {
    renderFallback();

    expect(
      screen.getByRole('heading', {
        name: /Encontramos um problema e nossa equipe foi notificada/,
      })
    ).toBeInTheDocument();
    // A mensagem crua do erro (stack, "boom") não é conteúdo de UI.
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
  });

  it('oferece o caminho de recuperação como botão', () => {
    renderFallback();

    expect(
      screen.getByRole('button', { name: /Tentar novamente/ })
    ).toBeInTheDocument();
  });

  // É o que remonta a rota (`router.invalidate()` via boundary) — sem isso a
  // tela fica presa no fallback até um F5.
  it('dispara resetErrorBoundary ao clicar em "Tentar novamente"', async () => {
    const { resetErrorBoundary } = renderFallback();

    await userEvent.click(
      screen.getByRole('button', { name: /Tentar novamente/ })
    );

    expect(resetErrorBoundary).toHaveBeenCalledTimes(1);
  });
});
