import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NoAccess } from '@/components/global/noAccess/noAccess';

describe('NoAccess (global)', () => {
  it('mostra o título e a descrição padrão com o ícone', () => {
    const { container } = render(<NoAccess />);

    expect(screen.getByText('Sem acesso')).toBeInTheDocument();
    expect(
      screen.getByText('Você não tem acesso a esta área.')
    ).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('sobrescreve a descrição quando informada', () => {
    render(<NoAccess description="Peça acesso ao administrador." />);

    expect(
      screen.getByText('Peça acesso ao administrador.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Você não tem acesso a esta área.')
    ).not.toBeInTheDocument();
  });
});
