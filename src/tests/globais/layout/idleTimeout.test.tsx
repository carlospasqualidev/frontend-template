import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const navigateSpy = vi.fn();
const signOutSpy = vi.fn(() => Promise.resolve());

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigateSpy }));
vi.mock('sonner', () => ({ toast: { info: vi.fn() } }));
vi.mock('@/hooks/useSessionStore', () => ({
  useSessionStore: (
    selector: (state: {
      signOut: () => Promise<void>;
      user: unknown;
    }) => unknown
  ) => selector({ signOut: signOutSpy, user: { id: '1' } }),
}));

// Importado depois dos mocks.
import { useIdleLogout } from '@/hooks/useIdleLogout';

function Harness({ idleMinutes }: { idleMinutes: number }) {
  const { warning, secondsLeft, continueSession } = useIdleLogout(
    idleMinutes,
    true
  );
  return (
    <div>
      <span data-testid="warning">{warning ? 'on' : 'off'}</span>
      <span data-testid="secs">{secondsLeft}</span>
      <button type="button" onClick={continueSession}>
        continuar
      </button>
    </div>
  );
}

describe('useIdleLogout — logout por inatividade', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    navigateSpy.mockClear();
    signOutSpy.mockClear();
  });
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('exibe o aviso faltando 60s e encerra a sessão ao zerar a contagem', async () => {
    // idle = 2 min → aviso após 60s (120s - 60s); depois 60s de contagem.
    render(<Harness idleMinutes={2} />);
    expect(screen.getByTestId('warning')).toHaveTextContent('off');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(screen.getByTestId('warning')).toHaveTextContent('on');
    expect(screen.getByTestId('secs')).toHaveTextContent('60');

    // Ninguém interage durante os 60s → desloga.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(signOutSpy).toHaveBeenCalledTimes(1);
    // A sessão acabou: a saída não passa pelo guard de edição não salva.
    expect(navigateSpy).toHaveBeenCalledWith({
      to: '/login',
      ignoreBlocker: true,
    });
  });

  it('"continuar" cancela o logout e reinicia o cronômetro', async () => {
    render(<Harness idleMinutes={2} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(screen.getByTestId('warning')).toHaveTextContent('on');

    await act(async () => {
      screen.getByRole('button', { name: 'continuar' }).click();
    });
    expect(screen.getByTestId('warning')).toHaveTextContent('off');

    // Passa os 60s da contagem que existiria → NÃO desloga (foi cancelada).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(signOutSpy).not.toHaveBeenCalled();
  });
});
