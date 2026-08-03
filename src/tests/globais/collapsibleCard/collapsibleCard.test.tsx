import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CollapsibleCard } from '@/components/global/collapsibleCard/collapsibleCard';

function Harness({
  onToggle,
  ...props
}: {
  onToggle?: () => void;
  accent?: boolean;
  initialExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(props.initialExpanded ?? false);
  return (
    <CollapsibleCard
      accent={props.accent}
      expanded={expanded}
      onToggle={() => {
        onToggle?.();
        setExpanded((value) => !value);
      }}
      title={<span className="font-medium">Dioxinas e Furanos</span>}
      summary="1 método"
      actions={<button type="button">ação</button>}
    >
      <p>corpo do card</p>
    </CollapsibleCard>
  );
}

describe('CollapsibleCard (global)', () => {
  it('mostra título e resumo; o corpo só aparece quando expandido', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByText('Dioxinas e Furanos')).toBeInTheDocument();
    expect(screen.getByText('1 método')).toBeInTheDocument();
    // Recolhido: corpo ausente.
    expect(screen.queryByText('corpo do card')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Dioxinas e Furanos/ })
    );
    expect(screen.getByText('corpo do card')).toBeInTheDocument();
  });

  it('o gatilho reflete o estado em aria-expanded e tem cursor-pointer', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<Harness onToggle={onToggle} />);

    const trigger = screen.getByRole('button', { name: /Dioxinas e Furanos/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveClass('cursor-pointer');

    await user.click(trigger);
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('renderiza as ações fora do gatilho (não disparam o toggle)', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<Harness onToggle={onToggle} />);

    await user.click(screen.getByRole('button', { name: 'ação' }));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('accent aplica o acento lateral da marca no container', () => {
    const { container } = render(<Harness accent initialExpanded />);
    expect(container.firstElementChild).toHaveClass('border-l-primary');
  });
});
