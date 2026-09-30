import { z } from 'zod';

declare module 'axios' {
  interface AxiosRequestConfig {
    /**
     * Não exibe o toast de erro do interceptor nesta chamada. `true` silencia
     * qualquer falha; uma lista de status HTTP (`[401]`) silencia só as
     * respostas com esses status, e as demais falhas (outro status, rede fora,
     * sem resposta) continuam com o toast. A rejeição sempre chega a quem
     * chamou, que passa a ser o responsável por decidir o que o usuário vê.
     * Uso: a falha esperada, que não é erro para o usuário (ex.: o 401 de
     * `GET /client/users/me` sem sessão, na abertura do app).
     */
    silentError?: SilentError;
  }
}

/** `true` silencia toda falha; a lista, só as respostas com esses status. */
export type SilentError = boolean | readonly number[];

/**
 * Shape parcial das respostas/erros do axios consumidos pelos interceptors.
 * Mantemos `data` como `unknown` para evitar mentir ao consumidor — quem usa
 * faz o narrow defensivo antes de acessar `message`.
 */
export interface ICatchHandler {
  config?: {
    silentError?: SilentError;
  };
  response?: {
    data?: unknown;
    status?: number;
  };
}

export interface IThenHandler {
  data?: unknown;
}

/** Type guard: a resposta carrega `data.message: string`? */
export function hasResponseMessage(
  value: unknown
): value is { message: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as { message: unknown }).message === 'string'
  );
}

/**
 * Extrai a mensagem amigável de um erro da API. Cobre o formato plano
 * (`{ message }`) e o **envelopado** em uma chave (`{ ServerMessage: { message } }`,
 * `{ error: { message } }`, …) — comum em backends que padronizam a resposta.
 * Retorna `null` quando não há mensagem.
 *
 * Confira o contrato REAL de erro do backend ao integrar: sem isto, toda falha
 * envelopada cai no toast genérico ("Erro 400") e o usuário perde a explicação
 * que o servidor mandou.
 */
export function extractResponseMessage(value: unknown): string | null {
  if (hasResponseMessage(value)) {
    return value.message;
  }

  if (typeof value === 'object' && value !== null) {
    for (const nested of Object.values(value)) {
      if (hasResponseMessage(nested)) {
        return nested.message;
      }
    }
  }

  return null;
}

const responseIssuesSchema = z.object({
  issues: z.array(z.object({ path: z.string(), message: z.string() })),
});

/** Campo recusado num erro de validação da API (`path` como `items.0.value`). */
export type ResponseIssue = z.infer<
  typeof responseIssuesSchema
>['issues'][number];

/**
 * Extrai os `issues` do corpo de um erro de validação do backend (`{ message,
 * issues: [{ path, message }] }`), para a tela marcar o campo. Lista vazia
 * quando o erro não traz `issues` no formato do contrato.
 */
export function extractResponseIssues(value: unknown): ResponseIssue[] {
  const parsed = responseIssuesSchema.safeParse(value);
  return parsed.success ? parsed.data.issues : [];
}
