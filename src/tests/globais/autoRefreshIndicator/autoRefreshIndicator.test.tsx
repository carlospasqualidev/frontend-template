import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AutoRefreshIndicator } from '@/components/global/autoRefreshIndicator/autoRefreshIndicator';

function stubReducedMotion(matches: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

describe('AutoRefreshIndicator (global)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('com fetching mostra o spinner e não o anel', () => {
    const { container } = render(
      <AutoRefreshIndicator intervalMs={5000} cycleKey={1} fetching />
    );

    expect(container.querySelector('.animate-spin')).toHaveClass(
      'motion-reduce:animate-none'
    );
    expect(container.querySelector('circle')).not.toBeInTheDocument();
  });

  it('sem fetching mostra o anel com dur igual ao intervalo', () => {
    const { container } = render(
      <AutoRefreshIndicator intervalMs={5000} cycleKey={1} fetching={false} />
    );

    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
    expect(container.querySelectorAll('circle')).toHaveLength(2);
    expect(container.querySelector('animate')).toHaveAttribute('dur', '5000ms');
  });

  it('mudar o cycleKey remonta o círculo de progresso', () => {
    const { container, rerender } = render(
      <AutoRefreshIndicator intervalMs={5000} cycleKey={1} fetching={false} />
    );
    const before = container.querySelectorAll('circle')[1];

    rerender(
      <AutoRefreshIndicator intervalMs={5000} cycleKey={2} fetching={false} />
    );
    const after = container.querySelectorAll('circle')[1];

    expect(after).not.toBe(before);
    expect(before?.isConnected).toBe(false);
  });

  it('expõe role status com aria-label', () => {
    render(<AutoRefreshIndicator intervalMs={5000} cycleKey={1} fetching />);

    expect(
      screen.getByRole('status', {
        name: 'Atualizando automaticamente: Esta tela se atualiza sozinha a cada 5s.',
      })
    ).toBeInTheDocument();
  });

  it('é alcançável por Tab: mostra o tooltip no foco e o nome inclui o texto', async () => {
    render(
      <AutoRefreshIndicator
        intervalMs={5000}
        cycleKey={1}
        fetching={false}
        tooltip="Texto da tela"
      />
    );

    await userEvent.tab();

    const indicator = screen.getByRole('status', {
      name: 'Atualizando automaticamente: Texto da tela',
    });
    expect(indicator).toHaveFocus();
    expect(
      (await screen.findAllByText('Texto da tela')).length
    ).toBeGreaterThan(0);
  });

  it('usa o tooltip da prop', async () => {
    render(
      <AutoRefreshIndicator
        intervalMs={5000}
        cycleKey={1}
        fetching={false}
        tooltip="Texto da tela"
      />
    );

    await userEvent.hover(screen.getByRole('status'));

    expect(
      (await screen.findAllByText('Texto da tela')).length
    ).toBeGreaterThan(0);
  });

  it('sem a prop, o tooltip é genérico e sem texto de domínio', async () => {
    render(
      <AutoRefreshIndicator intervalMs={5000} cycleKey={1} fetching={false} />
    );

    await userEvent.hover(screen.getByRole('status'));

    const [tip] = await screen.findAllByText(
      'Esta tela se atualiza sozinha a cada 5s.'
    );
    expect(tip?.textContent).not.toMatch(/importa/i);
  });

  it('com prefers-reduced-motion o anel fica parado, sem animate', () => {
    stubReducedMotion(true);
    const { container } = render(
      <AutoRefreshIndicator intervalMs={5000} cycleKey={1} fetching={false} />
    );

    expect(container.querySelectorAll('circle')).toHaveLength(2);
    expect(container.querySelector('animate')).not.toBeInTheDocument();
  });
});
