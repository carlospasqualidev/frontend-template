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
 * o `api` mantendo a assinatura. Aqui o `update` grava em memória, então a
 * alteração "persiste" durante a sessão (até recarregar a página).
 *
 * O catálogo do mock espelha o do servidor
 * (`../server-template/src/modules/systemConfigs/systemConfig.catalog.ts`): as
 * mesmas chaves, na mesma ordem, com rótulo, descrição, tipo, padrão e regra
 * literais. Chave nova nasce no catálogo do servidor e só depois é copiada
 * para cá: a tela não mostra configuração que o servidor não tem.
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

/** Valor já convertido, por tipo, como no servidor. */
interface SystemConfigValueByType {
  string: string;
  int: number;
  float: number;
  boolean: boolean;
  json: unknown;
}

interface MockConfigDefinitionOf<TType extends SystemConfigValueType> {
  key: string;
  module: string;
  label: string;
  description: string;
  valueType: TType;
  /** Vale enquanto nada for gravado. */
  defaultValue: SystemConfigValueByType[TType];
  /** Regra da chave sobre o valor já convertido (faixa, formato, tamanho). Sem ela, vale só o tipo. */
  rule?: z.ZodType<
    SystemConfigValueByType[TType],
    SystemConfigValueByType[TType]
  >;
}

/** Definição de uma configuração do mock, como a do catálogo do servidor. */
type MockConfigDefinition = {
  [TType in SystemConfigValueType]: MockConfigDefinitionOf<TType>;
}[SystemConfigValueType];

const IDLE_TIMEOUT_MINUTES_RANGE = { min: 1, max: 480 } as const;
const IDLE_TIMEOUT_RANGE_MESSAGE = `Informe um valor de ${IDLE_TIMEOUT_MINUTES_RANGE.min} a ${IDLE_TIMEOUT_MINUTES_RANGE.max} minutos.`;

// Faixas dos prazos de retenção da trilha de auditoria, em meses. A exclusão
// também precisa vir depois da anonimização.
const AUDIT_ANONYMIZE_AFTER_MONTHS_RANGE = { min: 1, max: 120 } as const;
const AUDIT_DELETE_AFTER_MONTHS_RANGE = { min: 2, max: 240 } as const;

function monthsRule(range: { min: number; max: number }) {
  const message = `Informe um valor de ${range.min} a ${range.max} meses.`;

  return z.number().min(range.min, message).max(range.max, message);
}

// E-mail como o `emailSchema` do servidor (sem espaço nas pontas, em
// minúsculas).
const emailRule = z
  .string({ message: 'Informe o e-mail.' })
  .trim()
  .toLowerCase()
  .max(254, 'O e-mail deve ter no máximo 254 caracteres.')
  .pipe(
    z.email({ message: 'O e-mail deve possuir o formato email@example.com.' })
  );

const MOCK_CATALOG: readonly MockConfigDefinition[] = [
  {
    key: 'app.name',
    module: 'GENERAL',
    label: 'Nome da aplicação',
    description:
      'Nome exibido na interface e nas comunicações enviadas aos usuários.',
    valueType: 'string',
    defaultValue: 'Meu Produto',
    rule: z
      .string()
      .trim()
      .min(1, 'Informe o nome.')
      .max(120, 'Use no máximo 120 caracteres.'),
  },
  {
    key: 'app.supportEmail',
    module: 'GENERAL',
    label: 'E-mail de suporte',
    description: 'Endereço que os usuários veem para pedir ajuda.',
    valueType: 'string',
    defaultValue: 'suporte@example.com',
    rule: emailRule,
  },
  {
    key: 'security.idleTimeoutMinutes',
    module: 'SECURITY',
    label: 'Tempo de inatividade até o logout (min)',
    description:
      'Minutos sem atividade até a sessão ser encerrada no navegador. Vale para os usuários sem um tempo próprio no cadastro.',
    valueType: 'int',
    defaultValue: 20,
    rule: z
      .number()
      .min(IDLE_TIMEOUT_MINUTES_RANGE.min, IDLE_TIMEOUT_RANGE_MESSAGE)
      .max(IDLE_TIMEOUT_MINUTES_RANGE.max, IDLE_TIMEOUT_RANGE_MESSAGE),
  },
  {
    key: 'audit.anonymizeAfterMonths',
    module: 'SECURITY',
    label: 'Prazo para anonimizar a auditoria (meses)',
    description:
      'Meses até cada evento da auditoria perder o autor, o IP, o navegador e os dados pessoais registrados. O que foi feito continua no histórico.',
    valueType: 'int',
    defaultValue: 12,
    rule: monthsRule(AUDIT_ANONYMIZE_AFTER_MONTHS_RANGE),
  },
  {
    key: 'audit.deleteAfterMonths',
    module: 'SECURITY',
    label: 'Prazo para apagar a auditoria (meses)',
    description:
      'Meses até cada evento da auditoria ser apagado de vez. Precisa ser maior que o prazo para anonimizar.',
    valueType: 'int',
    defaultValue: 60,
    rule: monthsRule(AUDIT_DELETE_AFTER_MONTHS_RANGE),
  },
  {
    key: 'notifications.email',
    module: 'NOTIFICATIONS',
    label: 'Notificações por e-mail',
    description: 'Envia por e-mail os avisos do sistema.',
    valueType: 'boolean',
    defaultValue: true,
  },
];

// Valor gravado na sessão, por chave, no texto em que a API o devolve. Sem
// gravação, vale o padrão do catálogo.
const storedValues = new Map<string, string>();

function findDefinition(key: string): MockConfigDefinition | undefined {
  return MOCK_CATALOG.find((candidate) => candidate.key === key);
}

// Mensagens sem o valor recebido: quem monta o erro prefixa o rótulo.
const MAX_SYSTEM_CONFIG_VALUE_LENGTH = 10_000;

const valueText = z
  .string()
  .max(
    MAX_SYSTEM_CONFIG_VALUE_LENGTH,
    `Use no máximo ${MAX_SYSTEM_CONFIG_VALUE_LENGTH} caracteres.`
  );

// Até 15 dígitos: acima disso o número perde precisão no `Number`.
const intValue = valueText
  .regex(/^-?\d{1,15}$/, 'Informe um número inteiro.')
  .transform(Number);

const floatValue = valueText
  .regex(
    /^-?\d{1,15}$|^-?\d{1,15}\.\d{1,15}$/,
    'Informe um número, com ponto como separador decimal.'
  )
  .transform(Number);

const booleanValue = valueText
  .regex(/^(true|false)$/, 'Use true ou false.')
  .transform((text) => text === 'true');

const jsonValue = valueText.transform((text, context) => {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    context.addIssue({ code: 'custom', message: 'Informe um JSON válido.' });
    return z.NEVER;
  }
});

function withRule<TValue>(
  parser: z.ZodType<TValue, string>,
  rule: z.ZodType<TValue, TValue> | undefined
): z.ZodType<TValue, string> {
  return rule ? parser.pipe(rule) : parser;
}

/** Texto → valor tipado, como o servidor: converte pelo `valueType` e aplica a regra da chave. */
function valueSchemaFor(
  definition: MockConfigDefinition
): z.ZodType<unknown, string> {
  switch (definition.valueType) {
    case 'string':
      return withRule(valueText, definition.rule);
    case 'int':
      return withRule(intValue, definition.rule);
    case 'float':
      return withRule(floatValue, definition.rule);
    case 'boolean':
      return withRule(booleanValue, definition.rule);
    case 'json':
      return withRule(jsonValue, definition.rule);
  }
}

/** Valor tipado → texto gravado e devolvido pela API (`'true'`, `'20'`, JSON compacto). */
function serializeValue(
  valueType: SystemConfigValueType,
  value: unknown
): string {
  return valueType === 'json' ? JSON.stringify(value) : String(value);
}

/** Valor efetivo em texto: o gravado, senão o padrão do catálogo. */
function effectiveValue(definition: MockConfigDefinition): string {
  return (
    storedValues.get(definition.key) ??
    serializeValue(definition.valueType, definition.defaultValue)
  );
}

/** O catálogo inteiro, na ordem do servidor, com o valor efetivo. */
function listMockConfigs(): SystemConfig[] {
  return MOCK_CATALOG.map((definition) => ({
    key: definition.key,
    module: definition.module,
    label: definition.label,
    description: definition.description,
    valueType: definition.valueType,
    value: effectiveValue(definition),
  }));
}

const MOCK_DELAY_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchSystemConfigs(): Promise<SystemConfigsResponse> {
  await sleep(MOCK_DELAY_MS);
  return systemConfigsResponseSchema.parse({
    systemConfigs: listMockConfigs(),
  });
}

/**
 * Rótulo e tipo de uma configuração do mock, ou `undefined` para chave fora
 * dele. Existe para o mock da auditoria (`services/audit/auditMock.ts`) montar
 * a frase e formatar o `value` pelo tipo da chave, como o servidor faz pelo
 * catálogo dele. Sai com o catálogo do mock ao trocar este serviço pelo `api`.
 */
export function findMockSystemConfig(
  key: string
): Pick<SystemConfig, 'label' | 'valueType'> | undefined {
  const definition = findDefinition(key);
  return (
    definition && { label: definition.label, valueType: definition.valueType }
  );
}

/**
 * Chave e módulo de cada configuração do mock, na ordem do catálogo, sem
 * valor. Existe para o skeleton da tela de configurações reservar um card por
 * grupo e uma linha por chave enquanto a leitura não volta. Sai com o catálogo
 * do mock ao trocar este serviço pelo `api`.
 */
export function listMockSystemConfigOutline(): Pick<
  SystemConfig,
  'key' | 'module'
>[] {
  return MOCK_CATALOG.map(({ key, module }) => ({ key, module }));
}

interface MockValidationIssue {
  path: string;
  message: string;
}

interface MockErrorBody {
  message: string;
  issues?: MockValidationIssue[];
}

interface ParsedBatch {
  issues: MockValidationIssue[];
  /** Os itens com o valor normalizado (`'020'` vira `'20'`, e-mail em minúsculas), quando não há `issues`. */
  items: SystemConfigUpdateItem[];
}

/**
 * O que o servidor recusa item a item com 400, sem gravar nada: lote vazio,
 * chave fora do catálogo e valor fora do tipo ou da regra da chave. `path` e
 * `message` no formato do backend (a mensagem do valor abre com o rótulo da
 * configuração).
 */
function parseBatch(items: SystemConfigUpdateItem[]): ParsedBatch {
  if (items.length === 0) {
    return {
      issues: [
        { path: 'items', message: 'Informe ao menos uma configuração.' },
      ],
      items: [],
    };
  }

  const issues: MockValidationIssue[] = [];
  const parsedItems: SystemConfigUpdateItem[] = [];
  items.forEach((item, index) => {
    const definition = findDefinition(item.key);
    if (!definition) {
      issues.push({
        path: `items.${index}.key`,
        message: 'Configuração desconhecida.',
      });
      return;
    }

    const parsed = valueSchemaFor(definition).safeParse(item.value);
    if (!parsed.success) {
      issues.push(
        ...parsed.error.issues.map((issue) => ({
          path: `items.${index}.value`,
          message: `${definition.label}: ${issue.message}`,
        }))
      );
      return;
    }

    parsedItems.push({
      key: item.key,
      value: serializeValue(definition.valueType, parsed.data),
    });
  });

  return { issues, items: parsedItems };
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

const ANONYMIZE_KEY = 'audit.anonymizeAfterMonths';
const DELETE_KEY = 'audit.deleteAfterMonths';

// Regra entre os prazos, no texto do servidor (abre com o rótulo do prazo para
// apagar, o item que o erro aponta).
const RETENTION_ORDER_MESSAGE =
  'Prazo para apagar a auditoria (meses): Informe um valor maior que o prazo para anonimizar.';

/**
 * Regra entre os prazos de retenção, como o servidor: o prazo para apagar tem
 * de ficar maior que o para anonimizar, com o valor do lote, senão o gravado,
 * senão o padrão. Com as duas chaves no lote, a recusa é de validação e aponta
 * o item do prazo para apagar (`issues`); com uma só, conferida contra o
 * gravado, volta só com `message`. `null` quando o lote respeita a regra (ou
 * não a toca).
 */
function findRetentionOrderError(
  items: SystemConfigUpdateItem[]
): MockErrorBody | null {
  const batchValues = new Map(items.map((item) => [item.key, item.value]));
  if (!batchValues.has(ANONYMIZE_KEY) && !batchValues.has(DELETE_KEY)) {
    return null;
  }

  const monthsAfter = (key: string) => {
    const definition = findDefinition(key);
    return Number(
      batchValues.get(key) ?? (definition && effectiveValue(definition))
    );
  };
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
 * Grava o lote inteiro numa chamada e devolve a lista completa atualizada, com
 * o valor normalizado como o servidor grava. O `message` da resposta vira o
 * toast de sucesso — no backend, pelo interceptor do `api`; aqui o mock o
 * repassa ao mesmo `thenHandler` para a tela se comportar igual. Quem chama
 * não dispara toast próprio. Lote vazio, com chave desconhecida, com valor fora
 * do tipo ou da regra da chave, ou que deixe o prazo para apagar a auditoria
 * não maior que o para anonimizar é recusado inteiro, como no servidor (toast
 * de erro pelo `catchHandler`, nada gravado).
 */
export async function updateSystemConfigs(
  items: SystemConfigUpdateItem[]
): Promise<UpdateSystemConfigsResponse> {
  await sleep(MOCK_DELAY_MS);
  const batch = parseBatch(items);
  if (batch.issues.length > 0) {
    rejectAsServer(toValidationError(batch.issues));
  }
  const retentionOrderError = findRetentionOrderError(batch.items);
  if (retentionOrderError) {
    rejectAsServer(retentionOrderError);
  }

  batch.items.forEach((item) => storedValues.set(item.key, item.value));

  const response = updateSystemConfigsResponseSchema.parse({
    message: 'Configurações atualizadas.',
    systemConfigs: listMockConfigs(),
  });
  thenHandler({ data: response });
  return response;
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
