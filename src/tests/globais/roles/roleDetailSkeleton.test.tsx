import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RoleDetailSkeleton } from '@/screens/roles/details/roleDetailSkeleton';

const TABS = [
  { value: 'overview', label: 'Visão geral' },
  { value: 'users', label: 'Usuários' },
];

describe('RoleDetailSkeleton', () => {
  it('mostra as abas paradas e os cards da visão geral com os rótulos reais', () => {
    const { container } = render(<RoleDetailSkeleton tabs={TABS} />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'Visão geral',
      'Usuários',
    ]);
    for (const tab of tabs) expect(tab).toBeDisabled();

    // Como as abas reais: um pipe decorativo entre elas, sem ícone.
    const pipes = container.querySelectorAll(
      '[role="tablist"] > [aria-hidden]'
    );
    expect(pipes).toHaveLength(1);
    expect(pipes[0]).toHaveTextContent('|');
    expect(container.querySelector('[role="tab"] svg')).toBeNull();

    const titles = [
      ...container.querySelectorAll('[data-slot="card-title"]'),
    ].map((title) => title.textContent);
    expect(titles).toEqual(['Identificação', 'Resumo', 'Permissões']);

    // Rótulos fixos ficam visíveis; só os valores viram skeleton.
    for (const label of [
      'Nome',
      'Descrição',
      'Usuários',
      'Criado em',
      'Última alteração',
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length
    ).toBeGreaterThan(0);
  });
});
