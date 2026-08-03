import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { ToggleTheme } from '@/components/global/layout/toggleTheme';
import { ThemeProvider } from '@/hooks/useThemeProvider';

function renderToggle() {
  return render(
    <ThemeProvider storageKey="test-theme">
      <ToggleTheme />
    </ThemeProvider>
  );
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark', 'light');
});

describe('ToggleTheme', () => {
  // Botão só-ícone: precisa de nome acessível E tooltip (ver a11y no CLAUDE.md).
  it('o gatilho é um botão-ícone com nome acessível', () => {
    renderToggle();

    expect(
      screen.getByRole('button', { name: 'Alternar tema' })
    ).toBeInTheDocument();
  });

  it('revela o tooltip no hover', async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.hover(screen.getByRole('button', { name: 'Alternar tema' }));

    expect(
      (await screen.findAllByText('Alternar tema')).length
    ).toBeGreaterThan(0);
  });

  it('abre o menu com as três opções de tema', async () => {
    renderToggle();

    await userEvent.click(
      screen.getByRole('button', { name: 'Alternar tema' })
    );

    expect(
      await screen.findByRole('menuitem', { name: 'Claro' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Escuro' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Sistema' })
    ).toBeInTheDocument();
  });

  it('escolher "Escuro" aplica a classe dark no documento e persiste', async () => {
    renderToggle();

    await userEvent.click(
      screen.getByRole('button', { name: 'Alternar tema' })
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Escuro' })
    );

    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('test-theme')).toBe('dark');
  });

  it('escolher "Claro" remove a classe dark', async () => {
    renderToggle();

    await userEvent.click(
      screen.getByRole('button', { name: 'Alternar tema' })
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Escuro' })
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Alternar tema' })
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Claro' })
    );

    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem('test-theme')).toBe('light');
  });

  // `matchMedia` do setup responde `matches: false` → sistema em claro.
  it('escolher "Sistema" segue a preferência do SO', async () => {
    renderToggle();

    await userEvent.click(
      screen.getByRole('button', { name: 'Alternar tema' })
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Sistema' })
    );

    expect(localStorage.getItem('test-theme')).toBe('system');
    expect(document.documentElement).not.toHaveClass('dark');
  });
});
