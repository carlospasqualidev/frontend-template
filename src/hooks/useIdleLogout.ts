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

/**
 * Lógica do logout por inatividade (usada pelo `IdleTimeout` do layout). Após
 * `idleMinutes` de inatividade, dispara um aviso com contagem regressiva de
 * `WARNING_SECONDS`; ao zerar, encerra a sessão. Atividade antes do aviso reinicia
 * o cronômetro; durante o aviso, só `continueSession` cancela o logout.
 */
export function useIdleLogout(idleMinutes: number, enabled: boolean) {
  const signOut = useSessionStore((state) => state.signOut);
  const navigate = useNavigate();

  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_SECONDS);

  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const countdown = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined
  );
  const warningRef = useRef(false);
  const lastActivity = useRef(0);

  const clearAll = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (countdown.current) clearInterval(countdown.current);
  }, []);

  const logout = useCallback(async () => {
    clearAll();
    warningRef.current = false;
    setWarning(false);
    await signOut();
    navigate({ to: '/login' });
    toast.info('Sessão encerrada por inatividade.');
  }, [clearAll, signOut, navigate]);

  const startCountdown = useCallback(() => {
    warningRef.current = true;
    setWarning(true);
    setSecondsLeft(WARNING_SECONDS);
    countdown.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          void logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [logout]);

  const armIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    // Dispara o AVISO faltando `WARNING_SECONDS` para o fim do tempo total.
    const preWarnMs = Math.max(
      0,
      idleMinutes * 60_000 - WARNING_SECONDS * 1000
    );
    idleTimer.current = setTimeout(startCountdown, preWarnMs);
  }, [idleMinutes, startCountdown]);

  const continueSession = useCallback(() => {
    if (countdown.current) clearInterval(countdown.current);
    warningRef.current = false;
    setWarning(false);
    armIdle();
  }, [armIdle]);

  useEffect(() => {
    if (!enabled) return undefined;

    armIdle();
    const onActivity = () => {
      // Enquanto o aviso está aberto, só o botão "Continuar" reinicia (não o mouse).
      if (warningRef.current) return;
      const now = Date.now();
      // Throttle: reidratar o timer no máximo 1x/s (mousemove dispara muito).
      if (now - lastActivity.current < 1000) return;
      lastActivity.current = now;
      armIdle();
    };
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true })
    );

    return () => {
      clearAll();
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, onActivity)
      );
    };
  }, [enabled, armIdle, clearAll]);

  return { warning, secondsLeft, continueSession };
}
