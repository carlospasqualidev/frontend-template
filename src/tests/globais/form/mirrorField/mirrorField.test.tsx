import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MirrorField } from '@/components/global/form/mirrorField';

describe('MirrorField (global)', () => {
  it('associa o rótulo ao campo e mostra o valor', () => {
    render(<MirrorField id="interest" label="Subtotal" value="R$ 12,50" />);

    const field = screen.getByLabelText('Subtotal');
    expect(field).toHaveValue('R$ 12,50');
  });

  it('sem id, ainda associa o rótulo ao campo e traz placeholder', () => {
    render(<MirrorField label="Taxa" value="R$ 3,00" />);

    const field = screen.getByLabelText('Taxa');
    expect(field).toHaveValue('R$ 3,00');
    expect(field).toHaveAttribute('placeholder', '—');
  });

  it('é inerte: somente leitura e fora da ordem de tabulação', () => {
    render(<MirrorField id="fine" label="Desconto" value="R$ 0,00" />);

    const field = screen.getByLabelText('Desconto');
    // Espelho de exibição: não se edita, não recebe foco por Tab e não
    // intercepta o ponteiro.
    expect(field).toHaveAttribute('readonly');
    expect(field).toHaveAttribute('tabindex', '-1');
    expect(field).toHaveClass('pointer-events-none', 'select-none');
  });

  it('com children, o rótulo nomeia o conteúdo (grupo rotulado)', () => {
    render(
      <MirrorField label="Origem">
        <a href="/origem">Ver origem</a>
      </MirrorField>
    );

    const group = screen.getByRole('group', { name: 'Origem' });
    expect(group).toContainElement(screen.getByRole('link'));
  });

  it('labelHint fica fora do <label> e nomeia o gatilho pelo campo', () => {
    render(<MirrorField label="Total" value="1,00" labelHint="Calculado." />);

    expect(screen.getByLabelText('Total')).toHaveValue('1,00');
    expect(
      screen.getByRole('button', { name: 'Sobre Total' })
    ).toBeInTheDocument();
  });

  it('srOnlyLabel esconde o rótulo do olho, não do leitor de tela', () => {
    render(
      <MirrorField id="adjustment" label="Ajuste" value="R$ 1,00" srOnlyLabel />
    );

    expect(screen.getByLabelText('Ajuste')).toBeInTheDocument();
    expect(screen.getByText('Ajuste')).toHaveClass('sr-only');
  });
});
