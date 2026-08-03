/**
 * Shape parcial das respostas/erros do axios consumidos pelos interceptors.
 * Mantemos `data` como `unknown` para evitar mentir ao consumidor — quem usa
 * faz o narrow defensivo antes de acessar `message`.
 */
export interface ICatchHandler {
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
