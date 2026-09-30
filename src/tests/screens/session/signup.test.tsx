import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { ZodError } from 'zod';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@/hooks/useSessionStore';
import { ThemeProvider } from '@/hooks/useThemeProvider';
import { SignupScreen } from '@/screens/session/signup';
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

const VALID = {
  name: 'Maria Silva',
  email: 'maria@example.com',
  password: 'segredo-123',
};

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

/** Preenche o cadastro (colando o texto: os limites pedem valores longos) e envia. */
async function submitSignup(values: Partial<typeof VALID> = {}) {
  const { name, email, password } = { ...VALID, ...values };
  const user = userEvent.setup();
  render(
    <ThemeProvider storageKey="test-theme">
      <SignupScreen />
    </ThemeProvider>
  );

  const fill = async (label: string, value: string) => {
    await user.click(screen.getByLabelText(label));
    await user.paste(value);
  };
  await fill('Nome', name);
  await fill('E-mail', email);
  await fill('Senha', password);
  await fill('Confirmar senha', password);
  await user.click(screen.getByRole('button', { name: 'Criar conta' }));
}

function flushMacrotask() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('SignupScreen: validação no limite do `register`', () => {
  it.each([
    {
      field: 'nome curto',
      values: { name: 'M' },
      message: 'O nome deve ter pelo menos 2 caracteres.',
    },
    {
      field: 'nome longo',
      values: { name: 'M'.repeat(121) },
      message: 'O nome deve ter no máximo 120 caracteres.',
    },
    {
      field: 'senha curta',
      values: { password: 'a'.repeat(7) },
      message: 'A senha deve ter pelo menos 8 caracteres.',
    },
    {
      field: 'senha longa',
      values: { password: 'a'.repeat(73) },
      message: 'A senha deve ter no máximo 72 caracteres.',
    },
  ])('$field: mostra "$message" e não envia', async ({ values, message }) => {
    const adapter = vi.fn(respondWith(201, {}));
    axiosApi.defaults.adapter = adapter;

    await submitSignup(values);

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(adapter).not.toHaveBeenCalled();
  });

  it.each([
    { limit: 'mínimos', values: { name: 'Ma', password: 'a'.repeat(8) } },
    {
      limit: 'máximos',
      values: { name: 'M'.repeat(120), password: 'a'.repeat(72) },
    },
  ])('envia com nome e senha nos limites $limit', async ({ values }) => {
    const adapter = vi.fn(respondWith(409, { message: 'E-mail em uso.' }));
    axiosApi.defaults.adapter = adapter;

    await submitSignup(values);

    await waitFor(() => expect(adapter).toHaveBeenCalledTimes(1));
  });
});

describe('SignupScreen: envio', () => {
  it('cadastro recusado: mostra o toast do servidor, sem rejeição sem tratamento', async () => {
    axiosApi.defaults.adapter = respondWith(409, {
      message: 'Já existe uma conta com este e-mail.',
    });

    await submitSignup();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Já existe uma conta com este e-mail.',
        { id: 'errorToastId' }
      )
    );
    expect(
      await screen.findByRole('button', { name: 'Criar conta' })
    ).toBeEnabled();
    await flushMacrotask();

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(unhandledRejection).not.toHaveBeenCalled();
    expect(sendErrorMessage).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('resposta fora do contrato: avisa o usuário e reporta o erro', async () => {
    axiosApi.defaults.adapter = respondWith(201, { success: true });

    await submitSignup();

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
