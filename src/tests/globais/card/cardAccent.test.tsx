import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card } from '@/components/global/card/card';
import { cardAccentClass } from '@/components/global/card/accent';

describe('Card (global) — accent', () => {
  it('sem accent, o card não tem filete (nenhuma tela muda)', () => {
    const { container } = render(<Card title="Resumo">Conteúdo</Card>);

    const card = container.querySelector('[data-slot="card"]');
    expect(card).toBeInTheDocument();
    expect(card?.className).not.toMatch(/border-l-/);
  });

  it.each(['info', 'success', 'warning', 'destructive'] as const)(
    'accent="%s" aplica o filete do token semântico',
    (accent) => {
      const { container } = render(
        <Card title="Resumo" accent={accent}>
          Conteúdo
        </Card>
      );

      expect(container.querySelector('[data-slot="card"]')).toHaveClass(
        'border-l-4',
        `border-l-${accent}`
      );
    }
  );

  it('accent também vale no card recolhível', () => {
    const { container } = render(
      <Card title="Seção" accent="warning" expanded onToggle={() => undefined}>
        Conteúdo
      </Card>
    );

    expect(container.firstElementChild).toHaveClass('border-l-warning');
  });

  it('um border-* do className do consumidor não apaga o filete', () => {
    const { container } = render(
      <Card title="Resumo" accent="destructive" className="border-red-500">
        Conteúdo
      </Card>
    );

    expect(container.querySelector('[data-slot="card"]')).toHaveClass(
      'border-l-4',
      'border-l-destructive'
    );
  });

  it('cardAccentClass devolve vazio para valor desconhecido', () => {
    expect(cardAccentClass('outro' as never)).toBe('');
  });
});
