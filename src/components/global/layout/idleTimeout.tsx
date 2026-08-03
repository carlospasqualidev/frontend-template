import { Button } from '@/components/global/button/button';
import { Modal, ModalFooter } from '@/components/global/modal/modal';
import { useIdleLogout } from '@/hooks/useIdleLogout';
import { useSessionStore } from '@/hooks/useSessionStore';

// Rede de segurança caso a sessão não traga o valor (o backend já resolve o
// efetivo: usuário → config de sistema → default).
const DEFAULT_IDLE_MINUTES = 20;

/**
 * Handler GLOBAL de inatividade (montado no layout protegido). Após o tempo de
 * inatividade (por usuário → config de sistema → default, resolvido no backend),
 * exibe um modal de contagem regressiva (~60s) e encerra a sessão se o usuário não
 * continuar. Ver `useIdleLogout` para a lógica dos cronômetros.
 */
export function IdleTimeout() {
  const user = useSessionStore((state) => state.user);
  const idleMinutes =
    user?.idleTimeoutMinutes && user.idleTimeoutMinutes > 0
      ? user.idleTimeoutMinutes
      : DEFAULT_IDLE_MINUTES;

  const { warning, secondsLeft, continueSession } = useIdleLogout(
    idleMinutes,
    !!user
  );

  return (
    <Modal
      open={warning}
      // Fechar (X / clique fora) conta como "estou aqui" → continua a sessão.
      setOpen={(value) => {
        const next = typeof value === 'function' ? value(warning) : value;
        if (!next) continueSession();
      }}
      title="Sessão prestes a expirar"
      description="Você está inativo há um tempo. Por segurança, sua sessão será encerrada automaticamente."
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Encerrando em{' '}
        <span className="font-semibold text-foreground tabular-nums">
          {secondsLeft}s
        </span>
        . Deseja continuar conectado?
      </p>
      <ModalFooter>
        <Button type="button" onClick={continueSession}>
          Continuar conectado
        </Button>
      </ModalFooter>
    </Modal>
  );
}
