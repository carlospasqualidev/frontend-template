import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NotFound } from '@/components/global/layout/notFound';
import { SuspenseFallback } from '@/components/global/layout/suspenseFallback';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...props
  }: { to: string; children: ReactNode } & Record<string, unknown>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe('NotFound', () => {
  it('explica o 404 em pt-BR', () => {
    render(<NotFound />);

    expect(screen.getByText('Erro 404')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Página não encontrada' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('A página que você procura não existe ou foi movida.')
    ).toBeInTheDocument();
  });

  // A saída é um LINK de verdade (`href`), não um botão que navega: o usuário
  // pode abrir em nova aba / copiar o endereço.
  it('oferece a volta ao início como link com href', () => {
    render(<NotFound />);

    expect(
      screen.getByRole('link', { name: 'Voltar para o início' })
    ).toHaveAttribute('href', '/');
  });
});

describe('SuspenseFallback', () => {
  it('anuncia o carregamento para leitor de tela', () => {
    render(<SuspenseFallback />);

    const status = screen.getByRole('status', {
      name: 'Carregando próxima tela',
    });
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  // É uma barra de 2px que não ocupa altura visível: o fallback de ROTA não
  // deve empurrar o conteúdo nem substituir skeleton de dado.
  it('não ocupa altura visível (barra fina no topo)', () => {
    render(<SuspenseFallback />);

    expect(
      screen.getByRole('status', { name: 'Carregando próxima tela' })
    ).toHaveClass('h-0.5', 'w-full');
  });
});
