import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ErrorFallback } from '@/components/global/errorFallback';
import {
  makeTestQueryClient,
  renderRoutes,
} from '@/tests/helpers/renderRoutes';

function renderFallback(resetErrorBoundary = vi.fn()) {
  render(
    <ErrorFallback
      error={new Error('boom')}
      resetErrorBoundary={resetErrorBoundary}
    />
  );
  return { resetErrorBoundary };
}

// A variante `content` fica dentro do `Layout`, com o roteador: o link para o
// início é o `Link` global.
function renderContentFallback(props: { onRetry?: () => unknown } = {}) {
  return renderRoutes({
    routes: [
      {
        path: '/settings',
        component: () => <ErrorFallback variant="content" {...props} />,
      },
      { path: '/', component: () => <p>Início carregado</p> },
    ],
    initialUrl: '/settings',
    queryClient: makeTestQueryClient(),
  });
}

// A própria home quebrada: a tela de erro fica em `/`.
function renderContentFallbackAtHome() {
  return renderRoutes({
    routes: [
      {
        path: '/',
        component: () => <ErrorFallback variant="content" onRetry={vi.fn()} />,
      },
    ],
    initialUrl: '/',
    queryClient: makeTestQueryClient(),
  });
}

function retryButton() {
  return screen.getByRole('button', { name: /Tentar novamente/ });
}

const REPORTED_HEADING =
  /Encontramos um problema e nossa equipe foi notificada/;

describe('ErrorFallback', () => {
  it('explica o problema em pt-BR, sem vazar detalhe técnico', () => {
    renderFallback();

    expect(
      screen.getByRole('heading', { name: 'Oops! Algo deu errado.' })
    ).toBeInTheDocument();
    // A mensagem crua do erro (stack, "boom") não é conteúdo de UI.
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
  });

  // O erro de query tratado na tela (`onRetry={refetch}`) não chama o
  // `sendErrorMessage`: a tela não pode afirmar um aviso que não houve.
  it('sem `reported`, o título fica neutro e não diz que a equipe foi notificada', () => {
    render(<ErrorFallback onRetry={vi.fn()} />);

    expect(
      screen.getByRole('heading', { name: 'Oops! Algo deu errado.' })
    ).toBeInTheDocument();
    expect(screen.queryByText(/notificada/)).not.toBeInTheDocument();
  });

  it('com `reported`, o título diz que a equipe foi notificada', () => {
    render(
      <ErrorFallback
        error={new Error('boom')}
        resetErrorBoundary={vi.fn()}
        reported
      />
    );

    expect(
      screen.getByRole('heading', { name: REPORTED_HEADING })
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Oops! Algo deu errado.')
    ).not.toBeInTheDocument();
  });

  it('oferece o caminho de recuperação como botão', () => {
    renderFallback();

    expect(retryButton()).toBeInTheDocument();
  });

  // É o que refaz a tela no `ErrorBoundary` do app: sem isso a tela fica presa
  // no fallback até um F5.
  it('dispara resetErrorBoundary ao clicar em "Tentar novamente"', async () => {
    const { resetErrorBoundary } = renderFallback();

    await userEvent.click(retryButton());

    expect(resetErrorBoundary).toHaveBeenCalledTimes(1);
  });

  // Dentro do `Layout` a tela de erro fica no lugar do conteúdo: ocupar a
  // altura da janela empurraria o fim dela para baixo do cabeçalho.
  it('ocupa a tela inteira por padrão, e só o conteúdo na variante `content`', async () => {
    const { container } = render(
      <ErrorFallback error={new Error('boom')} resetErrorBoundary={vi.fn()} />
    );
    expect(container.firstElementChild).toHaveClass('min-h-screen');

    renderContentFallback({ onRetry: vi.fn() });
    const content = await screen.findByText(/Tente de novo ou volte para o/);
    expect(content.closest('.min-h-screen')).toBeNull();
  });

  // Com a sessão de pé, "atualize a página para restabelecer a sessão" não é o
  // caminho: a pessoa tenta de novo ou sai para o início.
  it('na variante `content`, orienta tentar de novo ou voltar ao início, com o link para `/`', async () => {
    const user = userEvent.setup();
    const { router } = renderContentFallback({ onRetry: vi.fn() });

    const home = await screen.findByRole('link', { name: 'início' });
    expect(home).toHaveAttribute('href', '/');
    expect(screen.queryByText(/Atualize a página/)).not.toBeInTheDocument();

    await user.click(home);

    expect(await screen.findByText('Início carregado')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  // Na própria home, o link para o início não levaria a lugar nenhum: fica só
  // "Tentar novamente".
  it('na variante `content` em `/`, não mostra o link para o início e mantém "Tentar novamente"', async () => {
    renderContentFallbackAtHome();

    expect(
      await screen.findByText('Tente de novo em instantes.')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'início' })
    ).not.toBeInTheDocument();
    expect(retryButton()).toBeInTheDocument();
  });

  it('na tela cheia, orienta atualizar a página, sem o link para o início', () => {
    renderFallback();

    expect(screen.getByText(/Atualize a página/)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  // O erro de query tratado na tela: `<ErrorFallback variant="content"
  // onRetry={refetch} />`, fora de qualquer error boundary.
  it('com `onRetry`, "Tentar novamente" a chama sem argumentos, no lugar do resetErrorBoundary', async () => {
    const onRetry = vi.fn();
    const resetErrorBoundary = vi.fn();
    render(
      <ErrorFallback
        onRetry={onRetry}
        resetErrorBoundary={resetErrorBoundary}
      />
    );

    await userEvent.click(retryButton());

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith();
    expect(resetErrorBoundary).not.toHaveBeenCalled();
  });

  it('enquanto a promessa do `onRetry` não termina, o botão fica desabilitado e um segundo clique não chama de novo', async () => {
    const user = userEvent.setup();
    let finishRetry: (() => void) | undefined;
    const onRetry = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishRetry = resolve;
        })
    );
    render(<ErrorFallback onRetry={onRetry} />);

    await user.dblClick(retryButton());

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(retryButton()).toBeDisabled();

    // A nova tentativa falhou de novo e a tela de erro continua: o botão volta.
    await act(async () => finishRetry?.());
    expect(retryButton()).toBeEnabled();
  });

  it('sem `onRetry` nem resetErrorBoundary, não mostra um botão que não faz nada', () => {
    render(<ErrorFallback />);

    expect(
      screen.queryByRole('button', { name: /Tentar novamente/ })
    ).not.toBeInTheDocument();
  });
});
