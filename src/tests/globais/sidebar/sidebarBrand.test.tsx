import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SidebarBrand } from '@/components/global/sidebar/sidebarBrand';

vi.mock('@/lib/constants/sidebar', () => ({
  sidebarData: {
    header: { name: 'Minha Empresa', description: 'Sandbox', logo: 'ME' },
    nav: [],
    links: [],
  },
}));

describe('SidebarBrand', () => {
  it('exibe nome, ambiente e as iniciais do projeto', () => {
    render(<SidebarBrand />);

    expect(screen.getByText('Minha Empresa')).toBeInTheDocument();
    // A descrição é o AMBIENTE (Sandbox/Produção) — é o que evita salvar num
    // ambiente achando que é outro.
    expect(screen.getByText('Sandbox')).toBeInTheDocument();
    expect(screen.getByText('ME')).toBeInTheDocument();
  });

  // Nome longo trunca em vez de esticar a sidebar (largura fixa).
  it('trunca os textos em vez de esticar a sidebar', () => {
    render(<SidebarBrand />);

    expect(screen.getByText('Minha Empresa')).toHaveClass('truncate');
    expect(screen.getByText('Sandbox')).toHaveClass('truncate');
  });
});
