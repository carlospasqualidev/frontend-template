import { z } from 'zod';

/**
 * Schema das variáveis de ambiente expostas ao client (prefixo `VITE_`).
 *
 * A validação roda na inicialização do app: se algo estiver ausente ou
 * malformado, o app falha rápido com uma mensagem clara em vez de quebrar
 * silenciosamente em runtime.
 *
 * Ao adicionar uma nova env, declare-a aqui e em `.env.example`.
 */
const envSchema = z.object({
  /**
   * URL base da API. Aceita:
   * - URL absoluta (dev local): `http://localhost:8080/api`
   * - caminho same-origin (deploy): `/api` — o nginx do container faz proxy
   *   de /api para o backend na rede interna, então o navegador chama a própria
   *   origem (sem CORS; cookie de sessão HTTP-only continua same-site).
   */
  VITE_API_URL: z
    .string()
    .min(1)
    .refine((value) => value.startsWith('/') || URL.canParse(value), {
      message:
        'Informe uma URL absoluta (http://...) ou um caminho same-origin iniciado por "/".',
    }),
  /** Nome do projeto, usado em logs de erro. */
  VITE_PROJECT_NAME: z.string().min(1).default('Frontend'),
  /** Ambiente lógico do projeto (ex.: Sandbox, Production). */
  VITE_PROJECT_ENVIRONMENT: z.string().optional(),
  /** Lado da aplicação (ex.: Client, Backoffice). */
  VITE_PROJECT_SIDE: z.string().optional(),
  /** Endpoint opcional para reporte de erros em produção. */
  VITE_ERROR_LOG_URL: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.url().optional()
  ),
  /**
   * Implementação da sessão (`services/session/sessionService.ts`):
   * - `api` (padrão): autentica no backend (`../server-template`).
   * - `fake`: sessão fictícia em cookie, sem backend (demonstração, testes e E2E).
   */
  VITE_SESSION_MODE: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.enum(['api', 'fake']).default('api')
  ),
});

export type SessionMode = z.infer<typeof envSchema>['VITE_SESSION_MODE'];

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');

  console.error(`Variáveis de ambiente inválidas:\n${details}`);
  throw new Error(
    'Variáveis de ambiente inválidas. Verifique seu arquivo .env (use .env.example como base).'
  );
}

export const env = parsed.data;
