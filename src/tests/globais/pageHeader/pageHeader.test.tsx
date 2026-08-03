import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageHeader } from '@/components/global/pageHeader/pageHeader';

describe('PageHeader', () => {
  it('renderiza o título como heading de nível 1', () => {
    render(<PageHeader title="Início" description="Resumo do seu dia." />);

    // `as="h1"` com peso visual de h3: a hierarquia semântica é o que importa
    // para leitor de tela e SEO, não o tamanho.
    expect(
      screen.getByRole('heading', { level: 1, name: 'Início' })
    ).toBeInTheDocument();
  });

  it('renderiza a descrição', () => {
    render(<PageHeader title="Início" description="Resumo do seu dia." />);

    expect(screen.getByText('Resumo do seu dia.')).toBeInTheDocument();
  });

  it('renderiza as ações quando informadas', () => {
    render(
      <PageHeader
        title="Usuários"
        description="Gerencie o acesso ao sistema."
        actions={<button type="button">Novo usuário</button>}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Novo usuário' })
    ).toBeInTheDocument();
  });

  it('sem `actions`, não renderiza o container de ações', () => {
    const { container } = render(
      <PageHeader title="Início" description="Resumo do seu dia." />
    );

    expect(container.querySelector('.shrink-0')).not.toBeInTheDocument();
  });
});
