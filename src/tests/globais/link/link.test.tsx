import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { Link } from '@/components/global/link/link';

describe('Link (global)', () => {
  it('renderiza um anchor com href e classes padrão', () => {
    render(
      <Link href="https://example.com" className="custom-class">
        Exemplo
      </Link>
    );

    const anchor = screen.getByRole('link', { name: 'Exemplo' });
    expect(anchor).toHaveAttribute('href', 'https://example.com');
    expect(anchor).toHaveClass('custom-class');
    expect(anchor).not.toHaveAttribute('rel');
  });

  it('adiciona rel noreferrer noopener quando target _blank não passa rel', () => {
    render(
      <Link href="https://example.com" target="_blank">
        Nova aba
      </Link>
    );

    const anchor = screen.getByRole('link', { name: 'Nova aba' });
    expect(anchor).toHaveAttribute('target', '_blank');
    expect(anchor).toHaveAttribute('rel', 'noreferrer noopener');
  });

  it('preserva o onClick sem cancelar o comportamento nativo', async () => {
    const handleClick = vi.fn();
    render(
      <Link href="https://example.com" onClick={handleClick}>
        Clique
      </Link>
    );

    await userEvent.click(screen.getByRole('link', { name: 'Clique' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('navega internamente via roteador quando o href for same-origin', async () => {
    render(<Link href="/login">Login interno</Link>);

    const link = screen.getByRole('link', { name: 'Login interno' });
    await userEvent.click(link);

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login', replace: false });
  });
});

// Regra de hyperlink de docs/conventions/routes-and-screens.md: link é `<a href>`, nunca `<button onClick>`.
// Sem href o usuário perde Ctrl+clique, clique do meio e "abrir em nova aba" —
// exatamente a navegação que se espera de qualquer link.
describe('Link (global) — abrir em outra aba', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('Ctrl+clique NÃO roteia na SPA: deixa o navegador abrir noutra aba', async () => {
    // `userEvent.setup()` mantém o modificador pressionado entre keyboard e click —
    // a API direta cria uma instância nova por chamada e perde esse estado.
    const user = userEvent.setup();
    render(<Link href="/records/ABC">ABC</Link>);

    await user.keyboard('{Control>}');
    await user.click(screen.getByRole('link', { name: 'ABC' }));
    await user.keyboard('{/Control}');

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('Meta (Cmd) e Shift também caem no comportamento nativo', async () => {
    const user = userEvent.setup();
    render(<Link href="/reports/recall?source=ABC">ABC</Link>);
    const link = screen.getByRole('link', { name: 'ABC' });

    await user.keyboard('{Meta>}');
    await user.click(link);
    await user.keyboard('{/Meta}');
    expect(mockNavigate).not.toHaveBeenCalled();

    await user.keyboard('{Shift>}');
    await user.click(link);
    await user.keyboard('{/Shift}');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('mostra por padrão o ícone de abrir em nova aba, com o MESMO href', () => {
    render(<Link href="/records/ABC">ABC</Link>);

    const newTab = screen.getByRole('link', { name: 'Abrir em nova aba' });
    expect(newTab).toHaveAttribute('href', '/records/ABC');
    expect(newTab).toHaveAttribute('target', '_blank');
    expect(newTab).toHaveAttribute('rel', 'noreferrer noopener');
  });

  it('o rótulo do ícone é customizável (contexto para o leitor de tela)', () => {
    render(
      <Link href="/records/ABC" newTabLabel="Abrir o registro ABC em nova aba">
        ABC
      </Link>
    );

    expect(
      screen.getByRole('link', { name: 'Abrir o registro ABC em nova aba' })
    ).toBeInTheDocument();
  });

  it('clicar no ícone não dispara o roteador da SPA', async () => {
    render(<Link href="/records/ABC">ABC</Link>);

    await userEvent.click(
      screen.getByRole('link', { name: 'Abrir em nova aba' })
    );

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('não repete o ícone em link que JÁ abre fora (seria redundante)', () => {
    render(
      <Link href="https://example.com" target="_blank">
        Externo
      </Link>
    );

    expect(
      screen.queryByRole('link', { name: 'Abrir em nova aba' })
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('não mostra o ícone em link de download', () => {
    render(
      <Link href="/arquivo.pdf" download>
        Baixar
      </Link>
    );

    expect(
      screen.queryByRole('link', { name: 'Abrir em nova aba' })
    ).not.toBeInTheDocument();
  });

  it('permite desligar o ícone onde ele não faz sentido (sidebar, breadcrumb, frase)', () => {
    render(
      <Link href="/login" newTabIcon={false}>
        Entrar
      </Link>
    );

    expect(
      screen.queryByRole('link', { name: 'Abrir em nova aba' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('com o ícone ligado, o clique simples segue roteando na SPA', async () => {
    render(<Link href="/reports/recall?source=ABC">ABC</Link>);

    await userEvent.click(screen.getByRole('link', { name: 'ABC' }));

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/reports/recall?source=ABC',
      replace: false,
    });
  });
});
