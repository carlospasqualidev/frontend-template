import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '@/components/global/card/card';

describe('Card (global)', () => {
  it('renderiza title, description e children', () => {
    render(
      <Card title="Resumo" description="Visão consolidada do dia.">
        <p>Conteúdo do card</p>
      </Card>
    );

    expect(screen.getByText('Resumo')).toBeInTheDocument();
    expect(screen.getByText('Visão consolidada do dia.')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo do card')).toBeInTheDocument();
  });

  it('renderiza a ação do cabeçalho quando `action` é passado', () => {
    render(
      <Card
        title="Itens"
        action={<button type="button">Adicionar item</button>}
      >
        <p>Lista</p>
      </Card>
    );

    expect(
      screen.getByRole('button', { name: 'Adicionar item' })
    ).toBeInTheDocument();
  });
});

function CollapsibleHarness({
  onToggle,
  initialExpanded = false,
}: {
  onToggle?: () => void;
  initialExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(initialExpanded);
  return (
    <Card
      title="Dados do documento"
      description="Informações impressas no PDF."
      action={<button type="button">Baixar</button>}
      expanded={expanded}
      onToggle={() => {
        onToggle?.();
        setExpanded((value) => !value);
      }}
    >
      <p>Conteúdo da seção</p>
    </Card>
  );
}

describe('Card recolhível (expanded/onToggle)', () => {
  it('recolhido esconde o corpo; título e descrição continuam visíveis', () => {
    render(<CollapsibleHarness />);

    expect(screen.getByText('Dados do documento')).toBeInTheDocument();
    expect(
      screen.getByText('Informações impressas no PDF.')
    ).toBeInTheDocument();
    expect(screen.queryByText('Conteúdo da seção')).not.toBeInTheDocument();
  });

  it('o título é o gatilho: revela o corpo e reflete o estado em aria-expanded', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<CollapsibleHarness onToggle={onToggle} />);

    const trigger = screen.getByRole('button', { name: 'Dados do documento' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Conteúdo da seção')).toBeInTheDocument();
  });

  it('a ação do cabeçalho fica fora do gatilho e não recolhe a seção', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<CollapsibleHarness onToggle={onToggle} initialExpanded />);

    await user.click(screen.getByRole('button', { name: 'Baixar' }));
    expect(onToggle).not.toHaveBeenCalled();
    expect(screen.getByText('Conteúdo da seção')).toBeInTheDocument();
  });

  it('sem `expanded` o card não vira gatilho — o corpo fica sempre visível', () => {
    render(
      <Card title="Resumo" description="Sempre aberto.">
        <p>Corpo estático</p>
      </Card>
    );

    expect(
      screen.queryByRole('button', { name: 'Resumo' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Corpo estático')).toBeInTheDocument();
  });
});
