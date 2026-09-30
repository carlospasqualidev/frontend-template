import { isAxiosError } from 'axios';
import { z } from 'zod';

import { api } from '@/services/api';
import { extractResponseIssues } from '@/services/api/types';

/*
 * Configurações do sistema no backend (`GET` e `PATCH /client/system-configs`,
 * ver `../server-template/docs/openapi.json`):
 *   - o item é identificado pela `key` (não há `id`);
 *   - a leitura devolve `{ systemConfigs }`, sem paginação nem `count`;
 *   - a gravação é UM lote `[{ key, value }]` numa chamada, tudo ou nada, e
 *     devolve `{ message, systemConfigs }` (a lista completa, igual à leitura).
 * O valor trafega sempre como string; `valueType` diz à tela como
 * renderizar/editar. Chaves, rótulos, tipos e regras são do catálogo do
 * servidor: a tela mostra o que ele devolve.
 */
const valueTypeSchema = z.enum(['string', 'int', 'float', 'boolean', 'json']);
export type SystemConfigValueType = z.infer<typeof valueTypeSchema>;

const systemConfigSchema = z.object({
  key: z.string(),
  module: z.string(),
  label: z.string(),
  description: z.string(),
  valueType: valueTypeSchema,
  value: z.string(),
});

const systemConfigsResponseSchema = z.object({
  systemConfigs: z.array(systemConfigSchema),
});

const updateSystemConfigsResponseSchema = systemConfigsResponseSchema.extend({
  message: z.string(),
});

export type SystemConfig = z.infer<typeof systemConfigSchema>;
export type SystemConfigsResponse = z.infer<typeof systemConfigsResponseSchema>;
export type UpdateSystemConfigsResponse = z.infer<
  typeof updateSystemConfigsResponseSchema
>;

/** Item do lote de gravação (`PATCH /client/system-configs`, `items`). */
export interface SystemConfigUpdateItem {
  key: string;
  value: string;
}

/** Recusa do servidor para uma configuração do lote, pela chave. */
export interface SystemConfigIssue {
  key: string;
  message: string;
}

const SYSTEM_CONFIGS_PATH = '/client/system-configs';

export async function fetchSystemConfigs(): Promise<SystemConfigsResponse> {
  const response = await api.get<unknown>(SYSTEM_CONFIGS_PATH);
  return systemConfigsResponseSchema.parse(response);
}

/**
 * Grava o lote inteiro numa chamada e devolve a lista completa, com o valor
 * normalizado pelo servidor. O `message` da resposta vira o toast de sucesso
 * pelo interceptor do `api`: quem chama não dispara toast próprio.
 *
 * O 400 volta sem toast, porque a mensagem dele abre com o caminho técnico do
 * item (`items.0.value: ...`): quem chama marca o campo pelos `issues`
 * (`findSystemConfigIssues`) e, sem item a marcar (a regra entre os prazos
 * conferida contra o valor gravado vem só com `message`), mostra o toast. As
 * demais falhas (403, 5xx, rede) seguem com o toast do interceptor.
 */
export async function updateSystemConfigs(
  items: SystemConfigUpdateItem[]
): Promise<UpdateSystemConfigsResponse> {
  const response = await api.patch<unknown>(
    SYSTEM_CONFIGS_PATH,
    { items },
    { silentError: [400] }
  );
  return updateSystemConfigsResponseSchema.parse(response);
}

// `items.<n>.value` (ou `.key`): `n` é a posição no lote enviado, não na tela.
const BATCH_ITEM_PATH = /^items\.(\d+)\.(?:key|value)$/;

/**
 * As recusas do 400 de `updateSystemConfigs` que apontam um item do lote,
 * traduzidas para a chave do item (`items` é o lote enviado). Vazio quando o
 * erro não é esse 400 ou não aponta item nenhum.
 */
export function findSystemConfigIssues(
  error: unknown,
  items: readonly SystemConfigUpdateItem[]
): SystemConfigIssue[] {
  if (!isAxiosError(error) || error.response?.status !== 400) return [];

  return extractResponseIssues(error.response.data).flatMap(
    ({ path, message }) => {
      const position = BATCH_ITEM_PATH.exec(path)?.at(1);
      const item =
        position === undefined ? undefined : items.at(Number(position));
      return item ? [{ key: item.key, message }] : [];
    }
  );
}

// Rótulo pt-BR do módulo dono da configuração, para os módulos do catálogo do
// servidor (switch — sem indexar objeto por variável).
export function systemConfigModuleLabel(module: string): string {
  switch (module) {
    case 'SECURITY':
      return 'Segurança';
    case 'NOTIFICATIONS':
      return 'Notificações';
    case 'GENERAL':
    default:
      return 'Geral';
  }
}
