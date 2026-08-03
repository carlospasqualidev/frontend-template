export interface IUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  /**
   * Permissões efetivas do usuário, achatadas em strings pelo mapper da sessão.
   * Usadas só para AJUSTAR a UI (esconder item de menu/ação) — o backend continua
   * sendo a autoridade. Ver `lib/permissions.ts`.
   */
  permissions?: string[];
  /**
   * Tempo de inatividade (min) até o logout automático, resolvido pelo backend
   * (usuário → config de sistema → default). Consumido pelo `IdleTimeout`.
   */
  idleTimeoutMinutes?: number | null;
}
