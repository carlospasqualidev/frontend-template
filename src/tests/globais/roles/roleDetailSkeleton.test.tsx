import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RoleDetailSkeleton } from '@/screens/roles/details/roleDetailSkeleton';

const TABS = [
  { value: 'overview', icon: null, label: 'Visão geral' },
  { value: 'users', icon: null, label: 'Usuários' },
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
