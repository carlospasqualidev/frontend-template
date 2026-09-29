import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionValidation } from '@/components/global/layout/sessionValidation';
import { useSessionStore } from '@/hooks/useSessionStore';
import type { IUser } from '@/types/user/types';

const navigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}));

const validate = vi.fn();
const signOut = vi.fn();

vi.mock('@/services/session/sessionService', () => ({
  sessionService: {
    validate: () => validate(),
    signOut: () => signOut(),
  },
}));

const user: IUser = {
  id: '1',
  name: 'Maria Silva',
  email: 'maria@example.com',
  image: null,
  permissions: ['backoffice.users.read'],
  idleTimeoutMinutes: 20,
};

function renderGate() {
  return render(
    <SessionValidation>
      <div>Conteúdo protegido</div>
    </SessionValidation>
  );
}

beforeEach(() => {
  navigate.mockClear();
  validate.mockReset();
  signOut.mockReset().mockResolvedValue(undefined);
  useSessionStore.setState({ user: null });
});

afterEach(() => {
  useSessionStore.setState({ user: null });
});

describe('SessionValidation', () => {
  // O conteúdo protegido NÃO pode piscar antes de a sessão ser confirmada.
  it('mostra a tela de carregamento e esconde o conteúdo enquanto valida', () => {
    validate.mockReturnValue(new Promise(() => {}));
    renderGate();

    expect(
      screen.getByRole('progressbar', { name: 'Validando sessão' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument();
  });

  it('libera o conteúdo e popula a store quando a sessão é válida', async () => {
    validate.mockResolvedValue({ user });
    renderGate();

    expect(await screen.findByText('Conteúdo protegido')).toBeInTheDocument();
    expect(useSessionStore.getState().user).toEqual(user);
  });

  // Sessão já no store (navegação interna) não refaz a chamada — senão toda
  // troca de rota protegida bateria no backend de novo.
  it('com usuário já na store, libera direto sem revalidar', async () => {
    useSessionStore.setState({ user });
    renderGate();

    expect(await screen.findByText('Conteúdo protegido')).toBeInTheDocument();
    expect(validate).not.toHaveBeenCalled();
  });

  it('sessão inválida (401) manda para o login com replace', async () => {
    validate.mockRejectedValue(new Error('401'));
    renderGate();

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: '/login', replace: true })
    );
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument();
  });

  it('sessão inválida limpa o usuário da store', async () => {
    useSessionStore.setState({ user: null });
    validate.mockRejectedValue(new Error('401'));
    renderGate();

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    expect(useSessionStore.getState().user).toBeNull();
  });

  // Se o logout do servidor também falhar, o redirecionamento tem que acontecer
  // de qualquer forma — senão o usuário fica preso na tela de carregamento.
  it('redireciona mesmo se o signOut de limpeza falhar', async () => {
    validate.mockRejectedValue(new Error('401'));
    signOut.mockRejectedValue(new Error('offline'));
    renderGate();

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: '/login', replace: true })
    );
  });
});
