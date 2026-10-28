import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { InfoTooltip } from '@/components/global/infoTooltip/infoTooltip';

describe('InfoTooltip (global)', () => {
  it('renderiza o gatilho com o rótulo acessível padrão', () => {
    render(<InfoTooltip label="Ajuda" />);
    expect(
      screen.getByRole('button', { name: 'Mais informações' })
    ).toBeInTheDocument();
  });

  it('aceita um rótulo de gatilho customizado', () => {
    render(<InfoTooltip label="Ajuda" triggerLabel="Detalhes do campo" />);
    expect(
      screen.getByRole('button', { name: 'Detalhes do campo' })
    ).toBeInTheDocument();
  });

  it('revela o conteúdo ao focar o gatilho', async () => {
    const user = userEvent.setup();
    render(<InfoTooltip label="Formato padrão: CSV" />);

    await user.tab();
    // Radix renderiza o conteúdo (pode haver cópia acessível duplicada).
    expect(
      (await screen.findAllByText('Formato padrão: CSV')).length
    ).toBeGreaterThan(0);
  });

  it('ao clicar, fixa o conteúdo num popover', async () => {
    const user = userEvent.setup();
    render(<InfoTooltip label="Formato padrão: CSV" />);

    await user.click(screen.getByRole('button', { name: 'Mais informações' }));

    expect(await screen.findByRole('dialog')).toHaveTextContent(
      'Formato padrão: CSV'
    );
  });

  describe('popover fixado', () => {
    const open = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(
        screen.getByRole('button', { name: 'Mais informações' })
      );
      return screen.findByRole('dialog', { name: 'Mais informações' });
    };

    it('o tooltip some enquanto o popover está aberto', async () => {
      const user = userEvent.setup();
      render(<InfoTooltip label="Formato padrão: CSV" />);

      await user.hover(
        screen.getByRole('button', { name: 'Mais informações' })
      );
      expect(await screen.findByRole('tooltip')).toBeInTheDocument();

      await open(user);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      expect(screen.getAllByText('Formato padrão: CSV')).toHaveLength(1);
    });

    it('Escape fecha, devolve o foco ao gatilho e não reabre o tooltip', async () => {
      const user = userEvent.setup();
      render(<InfoTooltip label="Formato padrão: CSV" />);
      await open(user);

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Mais informações' })
      ).toHaveFocus();
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('entrar e sair do gatilho com a dica fixada não deixa o tooltip preso', async () => {
      const user = userEvent.setup();
      render(
        <>
          <p>Fora</p>
          <InfoTooltip label="Formato padrão: CSV" />
        </>
      );
      const trigger = screen.getByRole('button', { name: 'Mais informações' });
      await open(user);

      await user.unhover(trigger);
      await user.hover(trigger);
      await user.unhover(trigger);
      await user.keyboard('{Escape}');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('clique fora fecha', async () => {
      const user = userEvent.setup();
      render(
        <>
          <p>Fora</p>
          <InfoTooltip label="Formato padrão: CSV" />
        </>
      );
      await open(user);

      await user.click(screen.getByText('Fora'));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
