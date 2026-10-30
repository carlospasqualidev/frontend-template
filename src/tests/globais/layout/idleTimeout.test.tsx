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

  it('recalcula pelo relógio ao voltar o foco e desloga mesmo sem ticks de timer', async () => {
    render(<Harness idleMinutes={2} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(screen.getByTestId('warning')).toHaveTextContent('on');

    // Aba em segundo plano/computador suspenso: o relógio avança mais de 60s,
    // mas nenhum tick de timer dispara nesse meio-tempo.
    await act(async () => {
      vi.setSystemTime(Date.now() + 61_000);
      window.dispatchEvent(new Event('focus'));
    });

    expect(signOutSpy).toHaveBeenCalledTimes(1);
  });

  it('evento storage de outra aba reinicia o cronômetro', async () => {
    render(<Harness idleMinutes={2} />);

    // Faltam 10s para o aviso apareceria (60s - 50s já passados).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50_000);
    });
    expect(screen.getByTestId('warning')).toHaveTextContent('off');

    await act(async () => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'app:lastActivityAt',
          newValue: String(Date.now()),
          storageArea: localStorage,
        })
      );
    });

    // Os 10s que faltavam no cronômetro antigo passam → não deveria ter avisado.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(screen.getByTestId('warning')).toHaveTextContent('off');
  });

  it('evento storage de outra aba fecha o aviso aberto nesta aba', async () => {
    render(<Harness idleMinutes={2} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(screen.getByTestId('warning')).toHaveTextContent('on');

    await act(async () => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'app:lastActivityAt',
          newValue: String(Date.now()),
          storageArea: localStorage,
        })
      );
    });

    expect(screen.getByTestId('warning')).toHaveTextContent('off');
    expect(signOutSpy).not.toHaveBeenCalled();
  });

  it('localStorage indisponível não quebra o hook (segue só nesta aba)', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(
      () => undefined
    );
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('storage bloqueado');
      });

    expect(() => render(<Harness idleMinutes={2} />)).not.toThrow();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(screen.getByTestId('warning')).toHaveTextContent('on');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(signOutSpy).toHaveBeenCalledTimes(1);

    setItemSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });
});
