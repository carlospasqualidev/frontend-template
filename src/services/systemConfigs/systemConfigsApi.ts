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
    key: 'audit.anonymizeAfterMonths', module: 'SECURITY',
    label: 'Prazo para anonimizar a auditoria (meses)',
    description:
      'Meses até cada evento da auditoria perder o autor, o IP, o navegador e os dados pessoais registrados. O que foi feito continua no histórico.',
    valueType: 'int', value: '12',
  },
  {
    key: 'audit.deleteAfterMonths', module: 'SECURITY',
    label: 'Prazo para apagar a auditoria (meses)',
    description:
      'Meses até cada evento da auditoria ser apagado de vez. Precisa ser maior que o prazo para anonimizar.',
    valueType: 'int', value: '60',
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

/**
 * Rótulo e tipo de uma configuração do mock, ou `undefined` para chave fora
 * dele. Existe para o mock da auditoria (`services/audit/auditMock.ts`) montar
 * a frase e formatar o `value` pelo tipo da chave, como o servidor faz pelo
 * catálogo dele. Sai com os dados em memória ao trocar este serviço pelo `api`.
 */
export function findMockSystemConfig(
  key: string
): Pick<SystemConfig, 'label' | 'valueType'> | undefined {
  const config = MOCK_CONFIGS.find((candidate) => candidate.key === key);
  return config && { label: config.label, valueType: config.valueType };
}

interface MockValidationIssue {
  path: string;
  message: string;
}

interface MockErrorBody {
  message: string;
  issues?: MockValidationIssue[];
}

const ANONYMIZE_KEY = 'audit.anonymizeAfterMonths';
const DELETE_KEY = 'audit.deleteAfterMonths';

// Faixa (inteiro, em meses) de cada prazo de retenção da auditoria, como no
// catálogo do servidor.
const RETENTION_RANGES = new Map<string, { min: number; max: number }>([
  [ANONYMIZE_KEY, { min: 1, max: 120 }],
  [DELETE_KEY, { min: 2, max: 240 }],
]);

// Inteiro como o servidor aceita no texto do valor (até 15 dígitos).
const INTEGER_TEXT = /^-?\d{1,15}$/;

// Regra entre os prazos, no texto do servidor (abre com o rótulo do prazo para
// apagar, o item que o erro aponta).
const RETENTION_ORDER_MESSAGE =
  'Prazo para apagar a auditoria (meses): Informe um valor maior que o prazo para anonimizar.';

/** O que o servidor diz de um prazo de retenção inválido, sem o rótulo; `null` se vale. */
function retentionValueProblem(
  range: { min: number; max: number },
  value: string
): string | null {
  if (!INTEGER_TEXT.test(value)) return 'Informe um número inteiro.';

  const months = Number(value);
  return months < range.min || months > range.max
    ? `Informe um valor de ${range.min} a ${range.max} meses.`
    : null;
}

/**
 * O que o servidor recusa item a item com 400, sem gravar nada: lote vazio,
 * chave fora do catálogo e prazo de retenção que não é inteiro ou está fora da
 * faixa. `path` e `message` no formato do backend (a mensagem do valor abre com
 * o rótulo da configuração).
 */
function findBatchIssues(
  items: SystemConfigUpdateItem[]
): MockValidationIssue[] {
  if (items.length === 0) {
    return [{ path: 'items', message: 'Informe ao menos uma configuração.' }];
  }

  const configsByKey = new Map(MOCK_CONFIGS.map((config) => [config.key, config]));
  return items.flatMap((item, index) => {
    const config = configsByKey.get(item.key);
    if (!config) {
      return [{ path: `items.${index}.key`, message: 'Configuração desconhecida.' }];
    }

    const range = RETENTION_RANGES.get(item.key);
    const problem = range ? retentionValueProblem(range, item.value) : null;
    return problem
      ? [
          {
            path: `items.${index}.value`,
            message: `${config.label}: ${problem}`,
          },
        ]
      : [];
  });
}

/** Corpo do 400 de validação do servidor: o `message` é o do primeiro item, com o `path` na frente. */
function toValidationError(issues: MockValidationIssue[]): MockErrorBody {
  const [firstIssue] = issues;
  return {
    message: firstIssue
      ? `${firstIssue.path}: ${firstIssue.message}`
      : 'Dados inválidos.',
    issues,
  };
}

/**
 * Regra entre os prazos de retenção, como o servidor: o prazo para apagar tem
 * de ficar maior que o para anonimizar, com o valor do lote, senão o gravado.
 * Com as duas chaves no lote, a recusa é de validação e aponta o item do prazo
 * para apagar (`issues`); com uma só, conferida contra o gravado, volta só com
 * `message`. `null` quando o lote respeita a regra (ou não a toca).
 */
function findRetentionOrderError(
  items: SystemConfigUpdateItem[]
): MockErrorBody | null {
  const batchValues = new Map(items.map((item) => [item.key, item.value]));
  if (!batchValues.has(ANONYMIZE_KEY) && !batchValues.has(DELETE_KEY)) {
    return null;
  }

  const monthsAfter = (key: string) =>
    Number(
      batchValues.get(key) ??
        MOCK_CONFIGS.find((config) => config.key === key)?.value
    );
  if (monthsAfter(DELETE_KEY) > monthsAfter(ANONYMIZE_KEY)) return null;

  if (batchValues.has(ANONYMIZE_KEY) && batchValues.has(DELETE_KEY)) {
    const deleteIndex = items.findIndex((item) => item.key === DELETE_KEY);
    return toValidationError([
      { path: `items.${deleteIndex}.value`, message: RETENTION_ORDER_MESSAGE },
    ]);
  }

  return { message: RETENTION_ORDER_MESSAGE };
}

/**
 * Rejeita como o `api` rejeitaria o 400 do servidor: um `AxiosError` com o
 * corpo na resposta, e o toast pelo mesmo `catchHandler` do interceptor.
 */
function rejectAsServer(data: MockErrorBody): never {
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
 * comportar igual. Quem chama não dispara toast próprio. Lote vazio, com chave
 * desconhecida, com prazo de retenção inválido ou que deixe o prazo para apagar
 * a auditoria não maior que o para anonimizar é recusado inteiro, como no
 * servidor (toast de erro pelo `catchHandler`, nada gravado).
 */
export async function updateSystemConfigs(
  items: SystemConfigUpdateItem[]
): Promise<UpdateSystemConfigsResponse> {
  await sleep(MOCK_DELAY_MS);
  const issues = findBatchIssues(items);
  if (issues.length > 0) {
    rejectAsServer(toValidationError(issues));
  }
  const retentionOrderError = findRetentionOrderError(items);
  if (retentionOrderError) {
    rejectAsServer(retentionOrderError);
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
