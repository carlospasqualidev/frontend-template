import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@/components/global/button/button';
import { DemoNotice } from '@/components/global/demoNotice/demoNotice';
import {
  DEMO_ACTION_MESSAGE,
  notifyDemoAction,
} from '@/components/global/demoNotice/notifyDemoAction';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

describe('DemoNotice (global)', () => {
  it('o badge (padrão) mostra o rótulo curto, visível e lido pelo leitor de tela', () => {
    const { container } = render(<DemoNotice />);

    const badge = screen.getByText('Dados de demonstração');
    expect(badge).toBeVisible();
    expect(badge).toHaveAttribute('data-slot', 'badge');
    // Cor da paleta de status, que tem o tom do claro e do escuro.
    expect(badge).toHaveAttribute('data-variant', 'warning');
    // O ícone é decoração: quem dá o significado é o texto.
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });

  it('o banner é uma nota com o rótulo e a explicação padrão', () => {
    render(<DemoNotice variant="banner" />);

    const note = screen.getByRole('note', { name: 'Dados de demonstração' });
    expect(note).toHaveTextContent('Dados de demonstração');
    expect(note).toHaveTextContent(
      'Exemplo de tela: o servidor ainda não tem esta função, e nada aqui é gravado.'
    );
    // Aviso fixo da página: não interrompe o leitor de tela como um alerta.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(note.className).toContain('dark:bg-warning/20');
  });

  it('o banner aceita a explicação própria da parte da tela', () => {
    render(
      <DemoNotice
        variant="banner"
        description="As faturas abaixo são um exemplo."
      />
    );

    expect(screen.getByRole('note')).toHaveTextContent(
      'As faturas abaixo são um exemplo.'
    );
  });
});

describe('notifyDemoAction', () => {
  it('avisa que nada foi alterado, num toast só', async () => {
    const user = userEvent.setup();
    render(<Button onClick={notifyDemoAction}>Encerrar</Button>);

    await user.click(screen.getByRole('button', { name: 'Encerrar' }));

    expect(DEMO_ACTION_MESSAGE).toBe(
      'Dados de demonstração: nada foi alterado.'
    );
    expect(toast).toHaveBeenCalledWith(DEMO_ACTION_MESSAGE, {
      id: 'demoActionToastId',
    });
  });
});
