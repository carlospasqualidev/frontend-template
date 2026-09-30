import { dateRangeParams } from '@/lib/listQueryParams';
import { type AuditListParams } from '@/services/audit/auditApi';
import { type UserListParams } from '@/services/users/userListApi';

/*
 * A home não tem rota própria no servidor: os números saem do `count` da
 * listagem de usuários (`GET /client/users`, exige `backoffice.users.read`) e a
 * atividade recente, da trilha (`GET /client/audit-logs`, exige
 * `backoffice.audit.read`), pelos serviços desses módulos (com o Zod do
 * contrato). Aqui ficam só os parâmetros dessas leituras. A tela usa as chaves
 * das listagens (`userKeys.list`, `auditKeys.list`): criar ou excluir um
 * usuário, que já invalida a listagem, atualiza a home junto.
 */

/** Total de usuários da empresa: só o `count` interessa, uma linha basta. */
export const TOTAL_USERS_PARAMS: UserListParams = { page: 0, pageSize: 1 };

/** `AAAA-MM-01` do mês de `today`, no fuso de quem usa. */
function firstDayOfMonth(today: Date): string {
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${today.getFullYear()}-${month}-01`;
}

/**
 * Novos no mês: cadastrados desde o primeiro dia do mês de `today`, à
 * meia-noite local, em ISO 8601 UTC (`createdFrom` é inclusivo). Só o `count`.
 */
export function newUsersThisMonthParams(today: Date): UserListParams {
  return {
    page: 0,
    pageSize: 1,
    createdFrom: dateRangeParams({ from: firstDayOfMonth(today), to: '' }).from,
  };
}

/** Quantos eventos a "Atividade recente" mostra. */
export const RECENT_ACTIVITY_SIZE = 5;

/** Os eventos mais recentes da trilha, do mais novo para o mais antigo. */
export const RECENT_ACTIVITY_PARAMS: AuditListParams = {
  page: 0,
  pageSize: RECENT_ACTIVITY_SIZE,
  orderBy: 'createdAt',
  order: 'desc',
};
