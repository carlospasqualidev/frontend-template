/**
 * Usuário da SESSÃO (login, register e `GET /client/users/me`), como o backend
 * entrega. Não confunda com o usuário do CRUD de usuários (`CompanyUser`, em
 * `services/users/types.ts`): lá `idleTimeoutMinutes` é o valor PRÓPRIO do
 * cadastro (`number | null`, `null` = herda da empresa); aqui é o valor já
 * RESOLVIDO. Nunca grave o usuário do CRUD
 * no store da sessão — a obrigatoriedade dos campos abaixo existe para o tipo
 * barrar essa cópia.
 */
export interface IUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  /**
   * Permissões efetivas do usuário, já achatadas pelo backend no formato
   * `modulo.entidade.acao` (ex.: `backoffice.users.read`). Usadas só para
   * AJUSTAR a UI (esconder item de menu/ação) — o backend continua sendo a
   * autoridade. Ver `lib/permissions.ts`.
   */
  permissions: string[];
  /**
   * Tempo de inatividade (min) até o logout automático, já resolvido pelo
   * backend (usuário → config de sistema `security.idleTimeoutMinutes` → 20).
   * Consumido pelo `IdleTimeout`.
   */
  idleTimeoutMinutes: number;
}
