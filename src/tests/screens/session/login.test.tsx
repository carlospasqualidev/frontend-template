import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { ZodError } from 'zod';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@/hooks/useSessionStore';
import { ThemeProvider } from '@/hooks/useThemeProvider';
import { LoginScreen } from '@/screens/session/login';
import { axiosApi } from '@/services/api/api';
import { sendErrorMessage } from '@/services/api/errorHandlers';
import { respondWith } from '@/tests/helpers/axiosAdapter';

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));

// JSX no factory usaria o `react/jsx-runtime` antes de ele inicializar: o
// `createElement` vem do próprio factory.
vi.mock('@tanstack/react-router', async () => {
  const { createElement } = await import('react');
  return {
    Link: ({ to, children }: { to: string; children: React.ReactNode }) =>
      createElement('a', { href: to }, children),
    useNavigate: () => navigate,
  };
});

vi.mock('@/services/api/errorHandlers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/errorHandlers')>()),
  sendErrorMessage: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// A tela fala com o backend pelo `sessionService`, sem rede: o adapter do
// `axiosApi` responde. Assim o toast do interceptor e o `.parse` da resposta
// rodam como em produção.
const originalAdapter = axiosApi.defaults.adapter;
const unhandledRejection = vi.fn();
let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  process.on('unhandledRejection', unhandledRejection);
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  process.off('unhandledRejection', unhandledRejection);
  axiosApi.defaults.adapter = originalAdapter;
  useSessionStore.setState({ user: null });
  localStorage.clear();
  consoleError.mockRestore();
  vi.clearAllMocks();
});

async function submitLogin() {
  const user = userEvent.setup();
  render(
    <ThemeProvider storageKey="test-theme">
      <LoginScreen />
    </ThemeProvider>
  );

  await user.type(screen.getByLabelText('E-mail'), 'maria@example.com');
  await user.type(screen.getByLabelText('Senha'), 'segredo-123');
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
}

/** Um ciclo de macrotask: o `unhandledRejection` do Node sai depois dele. */
function flushMacrotask() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('LoginScreen', () => {
  it('com credencial aceita, grava o usuário e vai para o início', async () => {
    axiosApi.defaults.adapter = respondWith(200, {
      success: true,
      user: {
        id: 'b6f1c7a2-0000-4000-8000-000000000001',
        name: 'Maria Silva',
        email: 'maria@example.com',
        image: null,
        permissions: ['backoffice.users.read'],
        idleTimeoutMinutes: 20,
      },
    });

    await submitLogin();

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: '/', replace: true })
    );
    expect(useSessionStore.getState().user?.email).toBe('maria@example.com');
  });

  // Recusa do servidor: o toast é o do interceptor, com a mensagem dele; a
  // tela não repete o toast nem deixa a rejeição sem tratamento.
  it('login recusado: mostra o toast do servidor, sem rejeição sem tratamento', async () => {
    axiosApi.defaults.adapter = respondWith(401, {
      message: 'E-mail ou senha inválidos.',
    });

    await submitLogin();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('E-mail ou senha inválidos.', {
        id: 'errorToastId',
      })
    );
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeEnabled();
    await flushMacrotask();

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(unhandledRejection).not.toHaveBeenCalled();
    expect(sendErrorMessage).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(useSessionStore.getState().user).toBeNull();
  });

  // Resposta 200 fora do contrato: o `.parse` recusa. Não é erro do usuário,
  // é falha inesperada — mensagem genérica e reporte como erro.
  it('resposta fora do contrato: avisa o usuário e reporta o erro', async () => {
    axiosApi.defaults.adapter = respondWith(200, {
      success: true,
      user: { id: 'b6f1c7a2-0000-4000-8000-000000000001' },
    });

    await submitLogin();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Não foi possível concluir agora. Tente novamente em instantes.',
        { id: 'errorToastId' }
      )
    );
    await flushMacrotask();

    expect(sendErrorMessage).toHaveBeenCalledWith({
      error: expect.any(ZodError),
    });
    expect(consoleError).toHaveBeenCalled();
    expect(unhandledRejection).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(useSessionStore.getState().user).toBeNull();
  });
});
