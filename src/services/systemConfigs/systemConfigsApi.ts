import { AxiosError, AxiosHeaders } from 'axios';
import { z } from 'zod';

import { catchHandler, thenHandler } from '@/services/api/errorHandlers';

/*
 * Configurações do sistema — versão TEMPLATE com dados MOCK, já no contrato do
 * backend (`GET` e `PATCH /client/system-configs`, ver
 * `../server-template/docs/openapi.json`):
 *   - o item é identificado pela `key` (não há `id`);
 *   - a leitura devolve `{ systemConfigs }`, sem paginação nem `count`;
 *   - a gravação é UM lote `[{ key, value }]` numa chamada, tudo ou nada, e
 *     devolve `{ message, systemConfigs }` (a lista completa, igual à leitura).
 * O valor trafega sempre como string; `valueType` diz à tela como
 * renderizar/editar. Para trocar pelo backend, reimplemente as duas funções com
 * o `api` mantendo a assinatura. Aqui o `update` muta o mock em memória, então a
 * alteração "persiste" durante a sessão (até recarregar a página).
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

let MOCK_CONFIGS: SystemConfig[] = [
  {
    key: 'app.name', module: 'GENERAL', label: 'Nome da aplicação',
    description: 'Exibido no cabeçalho e nos e-mails do sistema.',
    valueType: 'string', value: 'Meu Produto',
  },
  {
    key: 'app.supportEmail', module: 'GENERAL', label: 'E-mail de suporte',
    description: 'Destino dos chamados enviados pelos usuários.',
    valueType: 'string', value: 'suporte@example.com',
  },
  {
    key: 'app.itemsPerPage', module: 'GENERAL', label: 'Itens por página',
    description: 'Tamanho padrão das listagens.',
    valueType: 'int', value: '25',
  },
  {
    key: 'security.idleTimeoutMinutes', module: 'SECURITY',
    label: 'Tempo de inatividade até o logout (min)',
    description:
      'Minutos sem atividade até a sessão ser encerrada no navegador. Vale para os usuários sem um tempo próprio no cadastro.',
    valueType: 'int', value: '20',
  },
  {
    key: 'security.enforce2fa', module: 'SECURITY', label: 'Exigir autenticação em duas etapas',
    description: 'Obriga o segundo fator no login de todos os usuários.',
    valueType: 'boolean', value: 'false',
  },
  {
    key: 'security.passwordPolicy', module: 'SECURITY', label: 'Política de senha (JSON)',
    description: 'Regras aplicadas na criação e troca de senha.',
    valueType: 'json', value: '{\n  "minLength": 8,\n  "requireNumber": true\n}',
  },
  {
    key: 'notifications.email', module: 'NOTIFICATIONS', label: 'Notificações por e-mail',
    description: 'Envia avisos operacionais por e-mail.',
    valueType: 'boolean', value: 'true',
  },
  {
    key: 'notifications.dailyDigest', module: 'NOTIFICATIONS', label: 'Resumo diário',
    description: 'Envia um consolidado das atividades do dia.',
    valueType: 'boolean', value: 'false',
  },
  {
    key: 'integrations.webhookUrl', module: 'INTEGRATIONS', label: 'URL de webhook',
    description: 'Endpoint chamado a cada evento relevante.',
    valueType: 'string', value: 'https://hooks.example.com/inbound',
  },
];

const MOCK_DELAY_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchSystemConfigs(): Promise<SystemConfigsResponse> {
  await sleep(MOCK_DELAY_MS);
  return systemConfigsResponseSchema.parse({ systemConfigs: MOCK_CONFIGS });
}

interface MockValidationIssue {
  path: string;
  message: string;
}

/**
 * O que o servidor recusa no lote com 400, sem gravar nada: lote vazio e chave
 * fora do catálogo. Mesmos `path` e `message` do backend.
 */
function findBatchIssues(
  items: SystemConfigUpdateItem[]
): MockValidationIssue[] {
  if (items.length === 0) {
    return [{ path: 'items', message: 'Informe ao menos uma configuração.' }];
  }

  const knownKeys = new Set(MOCK_CONFIGS.map((config) => config.key));
  return items.flatMap((item, index) =>
    knownKeys.has(item.key)
      ? []
      : [{ path: `items.${index}.key`, message: 'Configuração desconhecida.' }]
  );
}

/**
 * Rejeita como o `api` rejeitaria o 400 do servidor: um `AxiosError` com
 * `{ message, issues }` na resposta (o `message` é o do primeiro item, com o
 * `path` na frente), e o toast pelo mesmo `catchHandler` do interceptor.
 */
function rejectAsServer(issues: MockValidationIssue[]): never {
  const [firstIssue] = issues;
  const data = {
    message: firstIssue
      ? `${firstIssue.path}: ${firstIssue.message}`
      : 'Dados inválidos.',
    issues,
  };
  const config = { headers: new AxiosHeaders() };
  const error = new AxiosError(
    'Request failed with status code 400',
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    { data, status: 400, statusText: 'Bad Request', headers: {}, config }
  );

  catchHandler(error);
  throw error;
}

/**
 * Grava o lote inteiro numa chamada e devolve a lista completa atualizada. O
 * `message` da resposta vira o toast de sucesso — no backend, pelo interceptor
 * do `api`; aqui o mock o repassa ao mesmo `thenHandler` para a tela se
 * comportar igual. Quem chama não dispara toast próprio. Lote vazio ou com
 * chave desconhecida é recusado inteiro, como no servidor (toast de erro pelo
 * `catchHandler`, nada gravado).
 */
export async function updateSystemConfigs(
  items: SystemConfigUpdateItem[]
): Promise<UpdateSystemConfigsResponse> {
  await sleep(MOCK_DELAY_MS);
  const issues = findBatchIssues(items);
  if (issues.length > 0) {
    rejectAsServer(issues);
  }

  const valueByKey = new Map(items.map((item) => [item.key, item.value]));
  MOCK_CONFIGS = MOCK_CONFIGS.map((config) => ({
    ...config,
    value: valueByKey.get(config.key) ?? config.value,
  }));

  const response = updateSystemConfigsResponseSchema.parse({
    message: 'Configurações atualizadas.',
    systemConfigs: MOCK_CONFIGS,
  });
  thenHandler({ data: response });
  return response;
}

// Rótulo pt-BR do módulo dono da configuração (switch — sem indexar objeto por
// variável).
export function systemConfigModuleLabel(module: string): string {
  switch (module) {
    case 'SECURITY':
      return 'Segurança';
    case 'NOTIFICATIONS':
      return 'Notificações';
    case 'INTEGRATIONS':
      return 'Integrações';
    case 'GENERAL':
    default:
      return 'Geral';
  }
}
