import { QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRouter,
  notFound,
  RouterProvider,
  type AnyRouter,
} from '@tanstack/react-router';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@/hooks/useSessionStore';
import { ThemeProvider } from '@/hooks/useThemeProvider';
import { router as appRouter } from '@/routes';
import { sendErrorMessage } from '@/services/api/errorHandlers';
import { makeTestQueryClient } from '@/tests/helpers/renderRoutes';
import type { IUser } from '@/types/user/types';

// O que as telas de teste lançam no render enquanto `active` (por padrão, o
// `RENDER_ERROR`).
const renderFailure = vi.hoisted(() => ({
  active: true,
  error: undefined as unknown,
}));

const RENDER_ERROR = new Error('Falha de render do teste');

vi.mock('@/services/api/errorHandlers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/errorHandlers')>()),
  sendErrorMessage: vi.fn(),
}));

// As telas no lugar das reais, pelo mesmo módulo que as rotas carregam: a
// árvore de rotas, o layout protegido e o menu são os do app.
vi.mock('@/screens/home', () => ({
  DashboardPage: () => <p>Início carregado</p>,
}));

vi.mock('@/screens/settings', () => ({
  SettingsPage: () => {
    if (renderFailure.active) throw renderFailure.error;
    return <p>Configurações carregadas</p>;
  },
}));

vi.mock('@/screens/session/login', () => ({
  LoginScreen: () => {
    if (renderFailure.active) throw renderFailure.error;
    return <p>Login carregado</p>;
  },
}));

const SESSION_USER: IUser = {
  id: '01a0f253-fc4e-745c-b069-dff39ba3116e',
  name: 'Camila Oliveira',
  email: 'camila.oliveira@example.com',
  image: null,
  permissions: ['backoffice.systemConfigs.read'],
  idleTimeoutMinutes: 20,
};

// O título com o aviso: o adaptador reporta o erro e marca a tela como
// reportada (`reported`). Sem isso, o `ErrorFallback` mostra o título neutro.
const ERROR_HEADING = /Encontramos um problema e nossa equipe foi notificada/;

// A árvore de rotas e as opções do app, com o histórico em memória em `url`.
function openApp(url: string): AnyRouter {
  const router = createRouter({
    ...appRouter.options,
    routeTree: appRouter.routeTree,
    history: createMemoryHistory({ initialEntries: [url] }),
  });
  render(
    <ThemeProvider storageKey="test-theme">
      <QueryClientProvider client={makeTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  );
  return router;
}

function go(router: AnyRouter, to: string) {
  return act(async () => {
    await router.navigate({ to });
  });
}

beforeEach(() => {
  renderFailure.active = true;
  renderFailure.error = RENDER_ERROR;
  vi.mocked(sendErrorMessage).mockClear();
  // O React e o roteador escrevem no console o erro que a tela de erro pegou.
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  useSessionStore.getState().setUser(null);
  localStorage.clear();
});

describe('Tela de erro das rotas protegidas', () => {
  beforeEach(() => {
    useSessionStore.getState().setUser(SESSION_USER);
  });

  it('o erro no render de uma tela troca só o conteúdo: o menu continua, o erro é reportado e a tela diz que a equipe foi notificada', async () => {
    const router = openApp('/');
    await screen.findByText('Início carregado');

    await go(router, '/settings');

    expect(
      await screen.findByRole('heading', { name: ERROR_HEADING })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Início' })).toBeInTheDocument();
    expect(screen.getByText(SESSION_USER.name)).toBeInTheDocument();
    expect(sendErrorMessage).toHaveBeenCalledTimes(1);
    expect(sendErrorMessage).toHaveBeenCalledWith({
      error: RENDER_ERROR,
    });
  });

  it('"Tentar novamente" com a tela ainda quebrada mostra a tela de erro outra vez e reporta de novo', async () => {
    const user = userEvent.setup();
    openApp('/settings');
    const heading = await screen.findByRole('heading', {
      name: ERROR_HEADING,
    });

    await user.click(screen.getByRole('button', { name: /Tentar novamente/ }));

    await waitFor(() => expect(sendErrorMessage).toHaveBeenCalledTimes(2));
    expect(heading).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: ERROR_HEADING })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Início' })).toBeInTheDocument();
  });

  it('"Tentar novamente" desenha a tela de novo', async () => {
    const user = userEvent.setup();
    openApp('/settings');
    await screen.findByRole('heading', { name: ERROR_HEADING });

    renderFailure.active = false;
    await user.click(screen.getByRole('button', { name: /Tentar novamente/ }));

    expect(
      await screen.findByText('Configurações carregadas')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: ERROR_HEADING })
    ).not.toBeInTheDocument();
  });

  // O `router.invalidate()` refaz o carregamento da rota: um clique duplo não
  // pode refazer duas vezes, e a pessoa vê que a tentativa está em curso.
  it('"Tentar novamente" fica desabilitado enquanto o carregamento da rota não termina', async () => {
    const user = userEvent.setup();
    const router = openApp('/settings');
    await screen.findByRole('heading', { name: ERROR_HEADING });

    const invalidate = router.invalidate.bind(router);
    let finishLoading: (() => void) | undefined;
    const invalidateSpy = vi
      .spyOn(router, 'invalidate')
      .mockImplementation((opts) =>
        new Promise<void>((resolve) => {
          finishLoading = resolve;
        }).then(() => invalidate(opts))
      );

    renderFailure.active = false;
    await user.dblClick(
      screen.getByRole('button', { name: /Tentar novamente/ })
    );

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('button', { name: /Tentar novamente/ })
    ).toBeDisabled();

    await act(async () => finishLoading?.());

    expect(
      await screen.findByText('Configurações carregadas')
    ).toBeInTheDocument();
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
  });

  // Como nos boundaries de rota do TanStack Router: `notFound()` não é erro.
  it('o `notFound()` lançado no render de uma tela mostra a página não encontrada, não a tela de erro', async () => {
    renderFailure.error = notFound();
    openApp('/settings');

    expect(
      await screen.findByRole('heading', { name: 'Página não encontrada' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: ERROR_HEADING })
    ).not.toBeInTheDocument();
    expect(sendErrorMessage).not.toHaveBeenCalled();
  });

  it('ir para outra tela pelo menu limpa o erro', async () => {
    const user = userEvent.setup();
    openApp('/settings');
    await screen.findByRole('heading', { name: ERROR_HEADING });

    await user.click(screen.getByRole('link', { name: 'Início' }));

    expect(await screen.findByText('Início carregado')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: ERROR_HEADING })
    ).not.toBeInTheDocument();
  });
});

describe('Tela de erro das rotas públicas', () => {
  it('o erro no login mostra a tela de erro sem o menu, reporta e "Tentar novamente" desenha de novo', async () => {
    const user = userEvent.setup();
    openApp('/login');

    expect(
      await screen.findByRole('heading', { name: ERROR_HEADING })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Início' })
    ).not.toBeInTheDocument();
    expect(sendErrorMessage).toHaveBeenCalledWith({
      error: RENDER_ERROR,
    });

    renderFailure.active = false;
    await user.click(screen.getByRole('button', { name: /Tentar novamente/ }));

    expect(await screen.findByText('Login carregado')).toBeInTheDocument();
  });
});
