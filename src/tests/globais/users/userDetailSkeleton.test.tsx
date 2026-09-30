import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UserDetailSkeleton } from '@/screens/users/details/userDetailSkeleton';

const TABS = [
  { value: 'overview', icon: null, label: 'Visão geral' },
  { value: 'roles', icon: null, label: 'Cargos' },
];

describe('UserDetailSkeleton', () => {
  it('mostra as abas paradas e os cards da visão geral com os rótulos reais', () => {
    const { container } = render(<UserDetailSkeleton tabs={TABS} />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'Visão geral',
      'Cargos',
    ]);
    for (const tab of tabs) expect(tab).toBeDisabled();

    const titles = [
      ...container.querySelectorAll('[data-slot="card-title"]'),
    ].map((title) => title.textContent);
    expect(titles).toEqual(['Identificação', 'Acesso', 'Foto', 'Situação']);

    // Rótulos fixos ficam visíveis; só os valores viram skeleton.
    for (const label of [
      'Nome',
      'E-mail',
      'Telefone',
      'Status',
      'Último acesso',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length
    ).toBeGreaterThan(0);
  });
});
