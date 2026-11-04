import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RoleDetailSkeleton } from '@/screens/roles/details/roleDetailSkeleton';

const TABS = [{ value: 'overview', label: 'Visão geral', icon: null }];
const WRITE_RULE =
  'Marcar uma ação de escrita marca também a de visualizar do mesmo grupo.';

describe('RoleDetailSkeleton', () => {
  it('com permissão de editar, reserva a regra de escrita sob "Permissões"', () => {
    render(<RoleDetailSkeleton tabs={TABS} />);

    expect(screen.getByText(WRITE_RULE)).toBeInTheDocument();
  });

  it('em modo leitura, não mostra a regra (como a tela carregada)', () => {
    render(<RoleDetailSkeleton tabs={TABS} readOnly />);

    expect(screen.getByText('Permissões')).toBeInTheDocument();
    expect(screen.queryByText(WRITE_RULE)).not.toBeInTheDocument();
  });
});
