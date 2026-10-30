import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { useSessionStore } from '@/hooks/useSessionStore';

// Aviso com contagem regressiva antes de deslogar.
export const WARNING_SECONDS = 60;
// Eventos que contam como "atividade" e reiniciam o cronômetro de inatividade.
const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'wheel',
] as const;

// Sincronização entre abas: instante da última atividade e sinal de logout.
const ACTIVITY_STORAGE_KEY = 'app:lastActivityAt';
const LOGOUT_STORAGE_KEY = 'app:idleLogoutAt';

function writeStoredTimestamp(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value));
  } catch (error) {
    console.info('Não foi possível salvar o cronômetro de inatividade.', error);
  }
}

/**
 * Lógica do logout por inatividade (usada pelo `IdleTimeout` do layout). Após
 * `idleMinutes` de inatividade, dispara um aviso com contagem regressiva de
 * `WARNING_SECONDS`; ao zerar, encerra a sessão. Atividade antes do aviso reinicia
 * o cronômetro; durante o aviso, só `continueSession` cancela o logout.
 *
 * O cronômetro e a contagem regressiva são calculados a partir de instantes
 * absolutos (`Date.now()`), nunca por decremento a cada tick: um `setTimeout`
 * atrasado (aba em segundo plano, janela minimizada, máquina suspensa) não
 * atrasa o logout, porque cada disparo recalcula o tempo restante contra o
 * relógio real. Atividade e logout são sincronizados entre abas via
 * `localStorage`.
 */
export function useIdleLogout(idleMinutes: number, enabled: boolean) {
  const signOut = useSessionStore((state) => state.signOut);
  const navigate = useNavigate();

  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_SECONDS);

  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const warningRef = useRef(false);
  const lastActivityRef = useRef(0);
  // `check` se reagenda recursivamente; o ref evita referenciar a própria
  // variável antes de declarada (TDZ) e mantém o `setTimeout` sempre na
  // versão mais recente da função.
  const checkRef = useRef<() => void>(() => {});

  const clearIdleTimer = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = undefined;
    }
  }, []);

  const logout = useCallback(
    async (options?: { broadcast?: boolean }) => {
      clearIdleTimer();
      warningRef.current = false;
      setWarning(false);
      if (options?.broadcast !== false) {
        writeStoredTimestamp(LOGOUT_STORAGE_KEY, Date.now());
      }
      await signOut();
      // A sessão acabou: uma edição não salva não tem mais onde ser salva, e a
      // saída não passa pelo guard de edição não salva.
      navigate({ to: '/login', ignoreBlocker: true });
      toast.info('Sessão encerrada por inatividade.');
    },
    [clearIdleTimer, signOut, navigate]
  );

  // Recalcula, a partir do relógio real, se já é hora do aviso ou do logout, e
  // reagenda o próximo disparo — nunca decrementa um contador.
  const check = useCallback(() => {
    const now = Date.now();
    const logoutAt = lastActivityRef.current + idleMinutes * 60_000;
    const warnAt = logoutAt - WARNING_SECONDS * 1000;

    if (now >= logoutAt) {
      void logout();
      return;
    }

    clearIdleTimer();

    if (now >= warnAt) {
      if (!warningRef.current) {
        warningRef.current = true;
        setWarning(true);
      }
      setSecondsLeft(Math.max(0, Math.ceil((logoutAt - now) / 1000)));
      idleTimer.current = setTimeout(
        () => checkRef.current(),
        Math.min(1000, logoutAt - now)
      );
    } else {
      if (warningRef.current) {
        warningRef.current = false;
        setWarning(false);
      }
      idleTimer.current = setTimeout(() => checkRef.current(), warnAt - now);
    }
  }, [idleMinutes, logout, clearIdleTimer]);

  useEffect(() => {
    checkRef.current = check;
  }, [check]);

  const continueSession = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    writeStoredTimestamp(ACTIVITY_STORAGE_KEY, now);
    warningRef.current = false;
    setWarning(false);
    check();
  }, [check]);

  useEffect(() => {
    if (!enabled) return undefined;

    lastActivityRef.current = Date.now();
    check();

    const onActivity = () => {
      // Enquanto o aviso está aberto, só o botão "Continuar" reinicia (não o mouse).
      if (warningRef.current) return;
      const now = Date.now();
      // Throttle: reidratar o timer no máximo 1x/s (mousemove dispara muito).
      if (now - lastActivityRef.current < 1000) return;
      lastActivityRef.current = now;
      writeStoredTimestamp(ACTIVITY_STORAGE_KEY, now);
      check();
    };

    // Atividade ou logout disparado por outra aba.
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== localStorage) return;

      if (event.key === ACTIVITY_STORAGE_KEY) {
        const timestamp = event.newValue ? Number(event.newValue) : null;
        if (!timestamp || !Number.isFinite(timestamp)) return;
        if (timestamp > lastActivityRef.current) {
          lastActivityRef.current = timestamp;
        }
        if (warningRef.current) {
          warningRef.current = false;
          setWarning(false);
        }
        check();
        return;
      }

      if (event.key === LOGOUT_STORAGE_KEY && event.newValue) {
        void logout({ broadcast: false });
      }
    };

    // Timers atrasam/congelam em segundo plano: ao voltar, recalcula na hora.
    const onFocusOrVisible = () => check();

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true })
    );
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onFocusOrVisible);
    window.addEventListener('focus', onFocusOrVisible);

    return () => {
      clearIdleTimer();
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, onActivity)
      );
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
      window.removeEventListener('focus', onFocusOrVisible);
    };
  }, [enabled, check, clearIdleTimer, logout]);

  return { warning, secondsLeft, continueSession };
}
