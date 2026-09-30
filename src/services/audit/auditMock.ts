import type {
  AuditFieldChange,
  AuditFilterOptions,
  AuditLogDetail,
} from '@/services/audit/auditApi';
import { findMockSystemConfig } from '@/services/systemConfigs/systemConfigsApi';

/*
 * Dados MOCK da trilha de auditoria, no formato do servidor
 * (`../server-template`). Este arquivo inteiro sai ao trocar o mock pelo `api`:
 * nele o frontend faz o que no servidor é regra dele (rótulo dos campos, de→para
 * formatado, frase com o nome do registro), só para a demonstração se comportar
 * como a tela real.
 *
 * Os usuários são os da lista de usuários (mesmos ids e nomes), para a aba
 * "Atividade" do detalhe mostrar a linha do tempo de quem está na tela. Os
 * valores pessoais aparecem por decisão do dono (a trilha prova o que mudou).
 */

type AuditValue = string | number | boolean | null;
type AuditSnapshot = Record<string, AuditValue>;
type AuditMockEntity = 'User' | 'Role' | 'SystemConfig';

interface AuditEventSeed {
  createdAt: string;
  module: 'USERS' | 'SECURITY' | 'SETTINGS';
  entity: AuditMockEntity;
  entityId: string | null;
  action: 'create' | 'update' | 'delete' | 'statusChange' | 'login' | 'export';
  description: string;
  changedFields?: string[];
  before?: AuditSnapshot;
  after?: AuditSnapshot;
  userId: string | null;
}

/** Catálogo de `GET /client/audit-logs/options`, na ordem do servidor. */
export const MOCK_AUDIT_OPTIONS: AuditFilterOptions = {
  modules: [
    { value: 'USERS', label: 'Usuários' },
    { value: 'SECURITY', label: 'Segurança' },
    { value: 'SETTINGS', label: 'Configurações' },
  ],
  actions: [
    { value: 'create', label: 'Criação' },
    { value: 'update', label: 'Edição' },
    { value: 'delete', label: 'Exclusão' },
    { value: 'statusChange', label: 'Mudança de status' },
    { value: 'login', label: 'Login' },
    { value: 'export', label: 'Exportação' },
  ],
  entities: [
    { value: 'User', label: 'Usuário' },
    { value: 'Role', label: 'Cargo' },
    { value: 'SystemConfig', label: 'Configuração do sistema' },
  ],
};

/** Autores dos eventos (ids e nomes da lista de usuários). */
export const MOCK_AUDIT_AUTHORS = [
  { id: 'u_001', name: 'Ana Beatriz Silva', email: 'ana.silva@example.com' },
  {
    id: 'u_002',
    name: 'Bruno Henrique Souza',
    email: 'bruno.souza@example.com',
  },
  {
    id: 'u_003',
    name: 'Camila Oliveira',
    email: 'camila.oliveira@example.com',
  },
  {
    id: 'u_008',
    name: 'Henrique Pereira',
    email: 'henrique.pereira@example.com',
  },
];

// Rótulos do catálogo do servidor, na ordem em que o de→para mostra os campos.
const FIELD_LABELS = new Map<AuditMockEntity, ReadonlyMap<string, string>>([
  [
    'User',
    new Map([
      ['name', 'Nome'],
      ['email', 'E-mail'],
      ['phone', 'Telefone'],
      ['image', 'Foto'],
      ['password', 'Senha'],
      ['isActive', 'Ativo'],
      ['idleTimeoutMinutes', 'Tempo de inatividade (minutos)'],
      ['roles', 'Cargos'],
      ['lastLoginAt', 'Último acesso'],
    ]),
  ],
  [
    'Role',
    new Map([
      ['name', 'Nome'],
      ['description', 'Descrição'],
      ['permissions', 'Permissões'],
      ['isSystem', 'Cargo de sistema'],
    ]),
  ],
  [
    'SystemConfig',
    new Map([
      ['key', 'Chave'],
      ['value', 'Valor'],
    ]),
  ],
]);

const EMPTY_VALUE = '[Vazio]';
const REDACTED_VALUE = '[omitido]';

// Booleano e número de configuração como o servidor os grava no texto do `value`.
const CONFIG_BOOLEAN_TEXTS = new Map([
  ['true', true],
  ['false', false],
]);
const CONFIG_NUMBER_TEXT = /^-?\d+$|^-?\d+\.\d+$/;

function formatValue(value: AuditValue | undefined): string {
  if (value === undefined || value === null || value === '') return EMPTY_VALUE;
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'number') return String(value).replace('.', ',');
  return value;
}

/** Texto do `value` de volta ao tipo da chave (o do mock de configurações); texto fora do tipo fica como está. */
function toConfigValue(key: string, text: string): AuditValue {
  switch (findMockSystemConfig(key)?.valueType) {
    case 'boolean':
      return CONFIG_BOOLEAN_TEXTS.get(text) ?? text;
    case 'int':
    case 'float':
      return CONFIG_NUMBER_TEXT.test(text) ? Number(text) : text;
    default:
      return text;
  }
}

/**
 * `value` de configuração como o servidor o mostra no de→para: pelo tipo da
 * chave (`Sim`/`Não`, número com vírgula). Chave fora do catálogo e texto que
 * não é do tipo (`[omitido]`) saem como gravados.
 */
export function formatConfigValue(
  key: string,
  value: AuditValue | undefined
): string {
  return formatValue(
    typeof value === 'string' ? toConfigValue(key, value) : value
  );
}

function shownFields(seed: AuditEventSeed): string[] {
  switch (seed.action) {
    case 'update':
    case 'statusChange':
      return seed.changedFields ?? [];
    case 'create':
      return Object.keys(seed.after ?? {});
    case 'delete':
      return Object.keys(seed.before ?? {});
    case 'login':
    case 'export':
      return [];
  }
}

/**
 * De→para como o servidor monta: campos na ordem do catálogo; segredo alterado
 * (sem chave em nenhum dos lados, ex.: a senha) sai `[omitido]`; na criação e na
 * exclusão, campo vazio dos dois lados não entra.
 */
function toFieldChanges(seed: AuditEventSeed): AuditFieldChange[] {
  const labels = FIELD_LABELS.get(seed.entity) ?? new Map<string, string>();
  const fields = shownFields(seed);
  const ordered = [
    ...[...labels.keys()].filter((field) => fields.includes(field)),
    ...fields.filter((field) => !labels.has(field)),
  ];
  const before = new Map(Object.entries(seed.before ?? {}));
  const after = new Map(Object.entries(seed.after ?? {}));

  const format = (field: string, value: AuditValue | undefined) =>
    seed.entity === 'SystemConfig' && field === 'value' && seed.entityId
      ? formatConfigValue(seed.entityId, value)
      : formatValue(value);

  const changes = ordered.map((field) => {
    const isHidden = !before.has(field) && !after.has(field);
    return {
      field,
      label: labels.get(field) ?? field,
      from: isHidden ? REDACTED_VALUE : format(field, before.get(field)),
      to: isHidden ? REDACTED_VALUE : format(field, after.get(field)),
    };
  });

  const skipsEmpty = seed.action === 'create' || seed.action === 'delete';
  return skipsEmpty
    ? changes.filter(
        (change) => change.from !== EMPTY_VALUE || change.to !== EMPTY_VALUE
      )
    : changes;
}

function login(userId: string, createdAt: string): AuditEventSeed {
  return {
    createdAt,
    module: 'SECURITY',
    entity: 'User',
    entityId: userId,
    action: 'login',
    description: 'Entrou no sistema.',
    userId,
  };
}

function userStatusChange(
  userId: string,
  name: string,
  isActive: boolean,
  createdAt: string,
  authorId: string
): AuditEventSeed {
  return {
    createdAt,
    module: 'SECURITY',
    entity: 'User',
    entityId: userId,
    action: 'statusChange',
    description: isActive
      ? `Desbloqueou o usuário "${name}".`
      : `Bloqueou o usuário "${name}".`,
    changedFields: ['isActive'],
    before: { isActive: !isActive },
    after: { isActive },
    userId: authorId,
  };
}

function userRolesChange(
  userId: string,
  name: string,
  roles: { from: string | null; to: string | null },
  createdAt: string,
  authorId: string
): AuditEventSeed {
  return {
    createdAt,
    module: 'SECURITY',
    entity: 'User',
    entityId: userId,
    action: 'update',
    description: `Alterou os cargos do usuário "${name}".`,
    changedFields: ['roles'],
    before: { roles: roles.from },
    after: { roles: roles.to },
    userId: authorId,
  };
}

// Frase com o rótulo da chave no mock de configurações, como o servidor a monta
// pelo catálogo dele.
function configChange(
  key: string,
  value: { from: string; to: string },
  createdAt: string,
  authorId: string
): AuditEventSeed {
  return {
    createdAt,
    module: 'SETTINGS',
    entity: 'SystemConfig',
    entityId: key,
    action: 'update',
    description: `Alterou a configuração "${findMockSystemConfig(key)?.label ?? key}".`,
    changedFields: ['value'],
    before: { value: value.from },
    after: { value: value.to },
    userId: authorId,
  };
}

const CAMILA: AuditSnapshot = {
  name: 'Camila Oliveira',
  email: 'camila.oliveira@example.com',
  phone: null,
  image: null,
  idleTimeoutMinutes: null,
};

const CAMILA_WITH_CONTACT: AuditSnapshot = {
  ...CAMILA,
  phone: '48999990003',
  idleTimeoutMinutes: 30,
};

const EVENT_SEEDS: AuditEventSeed[] = [
  // Camila Oliveira (u_003): a linha do tempo mais longa, que pagina na aba
  // "Atividade" do detalhe do usuário.
  {
    createdAt: '2024-04-18T13:00:00.000Z',
    module: 'USERS',
    entity: 'User',
    entityId: 'u_003',
    action: 'create',
    description: 'Criou o usuário "Camila Oliveira".',
    after: { ...CAMILA, isActive: true },
    userId: 'u_001',
  },
  userRolesChange(
    'u_003',
    'Camila Oliveira',
    { from: null, to: 'Visualizador' },
    '2024-04-18T13:01:00.000Z',
    'u_001'
  ),
  login('u_003', '2024-04-19T11:20:00.000Z'),
  userRolesChange(
    'u_003',
    'Camila Oliveira',
    { from: 'Visualizador', to: 'Membro' },
    '2024-05-20T10:00:00.000Z',
    'u_008'
  ),
  {
    createdAt: '2025-02-03T16:20:00.000Z',
    module: 'USERS',
    entity: 'User',
    entityId: 'u_003',
    action: 'update',
    description: 'Editou o usuário "Camila Oliveira".',
    changedFields: ['idleTimeoutMinutes', 'phone'],
    before: CAMILA,
    after: CAMILA_WITH_CONTACT,
    userId: 'u_001',
  },
  {
    createdAt: '2025-06-10T09:00:00.000Z',
    module: 'USERS',
    entity: 'User',
    entityId: 'u_003',
    action: 'update',
    description: 'Editou o usuário "Camila Oliveira".',
    changedFields: ['password'],
    before: CAMILA_WITH_CONTACT,
    after: CAMILA_WITH_CONTACT,
    userId: 'u_001',
  },
  userStatusChange(
    'u_003',
    'Camila Oliveira',
    false,
    '2025-09-02T18:45:00.000Z',
    'u_008'
  ),
  userStatusChange(
    'u_003',
    'Camila Oliveira',
    true,
    '2025-09-03T08:15:00.000Z',
    'u_008'
  ),
  login('u_003', '2026-05-08T12:05:00.000Z'),
  login('u_003', '2026-05-14T12:10:00.000Z'),
  login('u_003', '2026-05-19T13:30:00.000Z'),
  login('u_003', '2026-05-22T11:45:00.000Z'),

  userStatusChange(
    'u_007',
    'Gabriela Castro',
    false,
    '2026-01-08T19:30:00.000Z',
    'u_008'
  ),
  {
    createdAt: '2026-01-24T12:00:00.000Z',
    module: 'USERS',
    entity: 'User',
    entityId: 'u_040',
    action: 'create',
    description: 'Criou o usuário "Priscila Camargo".',
    after: {
      name: 'Priscila Camargo',
      email: 'priscila.camargo@example.com',
      phone: '11988887777',
      image: null,
      isActive: true,
      idleTimeoutMinutes: null,
    },
    userId: 'u_001',
  },
  {
    createdAt: '2026-02-10T11:00:00.000Z',
    module: 'SECURITY',
    entity: 'Role',
    entityId: 'role_auditor',
    action: 'create',
    description: 'Criou o cargo "Auditor".',
    after: {
      name: 'Auditor',
      description: 'Consulta a trilha de auditoria.',
      permissions: 'backoffice.audit.read, backoffice.users.read',
    },
    userId: 'u_008',
  },
  // Usuário excluído: fora da lista de usuários, o histórico continua legível.
  {
    createdAt: '2026-03-12T15:00:00.000Z',
    module: 'USERS',
    entity: 'User',
    entityId: 'u_041',
    action: 'delete',
    description: 'Excluiu o usuário "Rodrigo Teixeira".',
    before: {
      name: 'Rodrigo Teixeira',
      email: 'rodrigo.teixeira@example.com',
      phone: null,
      image: null,
      isActive: false,
      idleTimeoutMinutes: 15,
    },
    userId: 'u_001',
  },
  {
    createdAt: '2026-04-01T14:00:00.000Z',
    module: 'SECURITY',
    entity: 'Role',
    entityId: 'role_support',
    action: 'update',
    description: 'Editou o cargo "Suporte".',
    changedFields: ['permissions', 'description'],
    before: {
      name: 'Suporte',
      description: 'Atende os chamados.',
      permissions: 'backoffice.users.read',
    },
    after: {
      name: 'Suporte',
      description: 'Atende os chamados e consulta a auditoria.',
      permissions: 'backoffice.audit.read, backoffice.users.read',
    },
    userId: 'u_001',
  },
  {
    createdAt: '2026-04-20T09:30:00.000Z',
    module: 'SECURITY',
    entity: 'Role',
    entityId: 'role_intern',
    action: 'delete',
    description: 'Excluiu o cargo "Estagiário".',
    before: {
      name: 'Estagiário',
      description: null,
      permissions: 'backoffice.users.read',
    },
    userId: 'u_008',
  },
  configChange(
    'security.idleTimeoutMinutes',
    { from: '30', to: '20' },
    '2026-05-05T10:00:00.000Z',
    'u_001'
  ),
  configChange(
    'notifications.email',
    { from: 'false', to: 'true' },
    '2026-05-06T09:00:00.000Z',
    'u_008'
  ),
  {
    createdAt: '2026-05-12T17:00:00.000Z',
    module: 'USERS',
    entity: 'User',
    entityId: null,
    action: 'export',
    description: 'Exportou a lista de usuários em CSV.',
    after: { formato: 'CSV', busca: 'oliveira' },
    userId: 'u_002',
  },
  configChange(
    'audit.anonymizeAfterMonths',
    { from: '24', to: '12' },
    '2026-05-25T16:00:00.000Z',
    'u_001'
  ),
  login('u_002', '2026-05-27T09:10:00.000Z'),
  login('u_001', '2026-05-28T12:00:00.000Z'),
  login('u_008', '2026-05-29T08:30:00.000Z'),
];

const AUTHORS_BY_ID = new Map(
  MOCK_AUDIT_AUTHORS.map((author) => [author.id, author])
);

/** Eventos no formato do detalhe (`GET /client/audit-logs/:auditLogId`). */
export const MOCK_AUDIT_LOGS: AuditLogDetail[] = EVENT_SEEDS.map(
  (seed, index) => ({
    id: `log_${String(index + 1).padStart(3, '0')}`,
    module: seed.module,
    entity: seed.entity,
    entityId: seed.entityId,
    action: seed.action,
    description: seed.description,
    changedFields: seed.changedFields ?? [],
    userId: seed.userId,
    createdAt: seed.createdAt,
    before: seed.before ?? null,
    after: seed.after ?? null,
    user: seed.userId ? (AUTHORS_BY_ID.get(seed.userId) ?? null) : null,
    fieldChanges: toFieldChanges(seed),
  })
);
