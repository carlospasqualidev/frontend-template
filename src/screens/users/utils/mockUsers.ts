import { type SortingState } from '@tanstack/react-table';

import {
  type DataTableFilterValues,
  type DateRangeValue,
} from '@/components/global/dataTable/filters';
import {
  type ManagedUser,
  type UserPermission,
  type UserSession,
} from '@/screens/users/utils/types';

/**
 * Base mockada simulando uma listagem real de usuários do sistema.
 * Substituir por chamada ao backend (`api.get('/users', ...)`) quando a API
 * estiver disponível.
 */
export const MOCK_USERS: ManagedUser[] = [
  {
    id: 'u_001',
    name: 'Ana Beatriz Silva',
    email: 'ana.silva@example.com',
    image: null,
    role: 'admin',
    status: 'active',
    createdAt: '2024-02-12',
    lastLoginAt: '2026-05-28',
  },
  {
    id: 'u_002',
    name: 'Bruno Henrique Souza',
    email: 'bruno.souza@example.com',
    image: null,
    role: 'manager',
    status: 'active',
    createdAt: '2024-03-04',
    lastLoginAt: '2026-05-27',
  },
  {
    id: 'u_003',
    name: 'Camila Oliveira',
    email: 'camila.oliveira@example.com',
    image: null,
    role: 'member',
    status: 'active',
    createdAt: '2024-04-18',
    lastLoginAt: '2026-05-22',
  },
  {
    id: 'u_004',
    name: 'Daniel Ferreira',
    email: 'daniel.ferreira@empresa.com.br',
    image: null,
    role: 'member',
    status: 'inactive',
    createdAt: '2024-05-09',
    lastLoginAt: '2025-12-14',
  },
  {
    id: 'u_005',
    name: 'Eduarda Martins',
    email: 'eduarda.martins@example.com',
    image: null,
    role: 'viewer',
    status: 'pending',
    createdAt: '2024-06-22',
    lastLoginAt: null,
  },
  {
    id: 'u_006',
    name: 'Felipe Augusto Lima',
    email: 'felipe.lima@example.com',
    image: null,
    role: 'manager',
    status: 'active',
    createdAt: '2024-07-01',
    lastLoginAt: '2026-05-25',
  },
  {
    id: 'u_007',
    name: 'Gabriela Castro',
    email: 'gabriela.castro@example.com',
    image: null,
    role: 'member',
    status: 'blocked',
    createdAt: '2024-07-19',
    lastLoginAt: '2026-01-08',
  },
  {
    id: 'u_008',
    name: 'Henrique Pereira',
    email: 'henrique.pereira@example.com',
    image: null,
    role: 'admin',
    status: 'active',
    createdAt: '2024-08-03',
    lastLoginAt: '2026-05-29',
  },
  {
    id: 'u_009',
    name: 'Isabela Ribeiro',
    email: 'isabela.ribeiro@example.com',
    image: null,
    role: 'member',
    status: 'active',
    createdAt: '2024-08-30',
    lastLoginAt: '2026-05-19',
  },
  {
    id: 'u_010',
    name: 'João Pedro Almeida',
    email: 'joao.almeida@empresa.com.br',
    image: null,
    role: 'viewer',
    status: 'inactive',
    createdAt: '2024-09-12',
    lastLoginAt: '2025-11-02',
  },
  {
    id: 'u_011',
    name: 'Karen Nogueira',
    email: 'karen.nogueira@example.com',
    image: null,
    role: 'member',
    status: 'pending',
    createdAt: '2024-09-28',
    lastLoginAt: null,
  },
  {
    id: 'u_012',
    name: 'Lucas Mendonça',
    email: 'lucas.mendonca@example.com',
    image: null,
    role: 'manager',
    status: 'active',
    createdAt: '2024-10-15',
    lastLoginAt: '2026-05-26',
  },
  {
    id: 'u_013',
    name: 'Mariana Carvalho',
    email: 'mariana.carvalho@example.com',
    image: null,
    role: 'admin',
    status: 'active',
    createdAt: '2024-10-30',
    lastLoginAt: '2026-05-28',
  },
  {
    id: 'u_014',
    name: 'Nicolas Barbosa',
    email: 'nicolas.barbosa@example.com',
    image: null,
    role: 'viewer',
    status: 'active',
    createdAt: '2024-11-11',
    lastLoginAt: '2026-04-12',
  },
  {
    id: 'u_015',
    name: 'Olivia Cunha',
    email: 'olivia.cunha@example.com',
    image: null,
    role: 'member',
    status: 'active',
    createdAt: '2024-12-02',
    lastLoginAt: '2026-05-20',
  },
  {
    id: 'u_016',
    name: 'Paulo Roberto Tavares',
    email: 'paulo.tavares@empresa.com.br',
    image: null,
    role: 'manager',
    status: 'inactive',
    createdAt: '2024-12-19',
    lastLoginAt: '2025-09-30',
  },
  {
    id: 'u_017',
    name: 'Quésia Lopes',
    email: 'quesia.lopes@example.com',
    image: null,
    role: 'member',
    status: 'pending',
    createdAt: '2025-01-08',
    lastLoginAt: null,
  },
  {
    id: 'u_018',
    name: 'Rafael Schmidt',
    email: 'rafael.schmidt@example.com',
    image: null,
    role: 'admin',
    status: 'active',
    createdAt: '2025-01-23',
    lastLoginAt: '2026-05-29',
  },
  {
    id: 'u_019',
    name: 'Sabrina Duarte',
    email: 'sabrina.duarte@example.com',
    image: null,
    role: 'member',
    status: 'blocked',
    createdAt: '2025-02-05',
    lastLoginAt: '2026-02-18',
  },
  {
    id: 'u_020',
    name: 'Thiago Moreira',
    email: 'thiago.moreira@example.com',
    image: null,
    role: 'viewer',
    status: 'active',
    createdAt: '2025-02-21',
    lastLoginAt: '2026-05-15',
  },
  {
    id: 'u_021',
    name: 'Úrsula Cavalcanti',
    email: 'ursula.cavalcanti@example.com',
    image: null,
    role: 'member',
    status: 'active',
    createdAt: '2025-03-04',
    lastLoginAt: '2026-05-24',
  },
  {
    id: 'u_022',
    name: 'Vinícius Andrade',
    email: 'vinicius.andrade@example.com',
    image: null,
    role: 'manager',
    status: 'active',
    createdAt: '2025-03-17',
    lastLoginAt: '2026-05-27',
  },
  {
    id: 'u_023',
    name: 'Wesley Pinto',
    email: 'wesley.pinto@empresa.com.br',
    image: null,
    role: 'member',
    status: 'inactive',
    createdAt: '2025-04-02',
    lastLoginAt: '2025-10-25',
  },
  {
    id: 'u_024',
    name: 'Yasmin Rocha',
    email: 'yasmin.rocha@example.com',
    image: null,
    role: 'viewer',
    status: 'pending',
    createdAt: '2025-04-19',
    lastLoginAt: null,
  },
  {
    id: 'u_025',
    name: 'Zeca Aguiar',
    email: 'zeca.aguiar@example.com',
    image: null,
    role: 'member',
    status: 'active',
    createdAt: '2025-05-06',
    lastLoginAt: '2026-05-18',
  },
  {
    id: 'u_026',
    name: 'Alice Bernardes',
    email: 'alice.bernardes@example.com',
    image: null,
    role: 'admin',
    status: 'active',
    createdAt: '2025-05-23',
    lastLoginAt: '2026-05-29',
  },
  {
    id: 'u_027',
    name: 'Bernardo Cruz',
    email: 'bernardo.cruz@example.com',
    image: null,
    role: 'manager',
    status: 'active',
    createdAt: '2025-06-09',
    lastLoginAt: '2026-05-23',
  },
  {
    id: 'u_028',
    name: 'Clara Vasconcelos',
    email: 'clara.vasconcelos@example.com',
    image: null,
    role: 'member',
    status: 'active',
    createdAt: '2025-06-27',
    lastLoginAt: '2026-05-26',
  },
  {
    id: 'u_029',
    name: 'Diego Macedo',
    email: 'diego.macedo@empresa.com.br',
    image: null,
    role: 'viewer',
    status: 'blocked',
    createdAt: '2025-07-14',
    lastLoginAt: '2026-03-04',
  },
  {
    id: 'u_030',
    name: 'Elisa Antunes',
    email: 'elisa.antunes@example.com',
    image: null,
    role: 'member',
    status: 'active',
    createdAt: '2025-08-01',
    lastLoginAt: '2026-05-21',
  },
  {
    id: 'u_031',
    name: 'Fábio Resende',
    email: 'fabio.resende@example.com',
    image: null,
    role: 'manager',
    status: 'inactive',
    createdAt: '2025-08-18',
    lastLoginAt: '2026-01-22',
  },
  {
    id: 'u_032',
    name: 'Giovanna Salles',
    email: 'giovanna.salles@example.com',
    image: null,
    role: 'member',
    status: 'pending',
    createdAt: '2025-09-05',
    lastLoginAt: null,
  },
  {
    id: 'u_033',
    name: 'Hugo Cardoso',
    email: 'hugo.cardoso@example.com',
    image: null,
    role: 'admin',
    status: 'active',
    createdAt: '2025-09-22',
    lastLoginAt: '2026-05-28',
  },
  {
    id: 'u_034',
    name: 'Iara Monteiro',
    email: 'iara.monteiro@example.com',
    image: null,
    role: 'viewer',
    status: 'active',
    createdAt: '2025-10-10',
    lastLoginAt: '2026-05-14',
  },
  {
    id: 'u_035',
    name: 'Júlio Maciel',
    email: 'julio.maciel@empresa.com.br',
    image: null,
    role: 'member',
    status: 'active',
    createdAt: '2025-10-28',
    lastLoginAt: '2026-05-22',
  },
  {
    id: 'u_036',
    name: 'Larissa Brito',
    email: 'larissa.brito@example.com',
    image: null,
    role: 'manager',
    status: 'active',
    createdAt: '2025-11-15',
    lastLoginAt: '2026-05-27',
  },
  {
    id: 'u_037',
    name: 'Murilo Faria',
    email: 'murilo.faria@example.com',
    image: null,
    role: 'member',
    status: 'pending',
    createdAt: '2025-12-03',
    lastLoginAt: null,
  },
  {
    id: 'u_038',
    name: 'Natália Quintela',
    email: 'natalia.quintela@example.com',
    image: null,
    role: 'viewer',
    status: 'active',
    createdAt: '2025-12-20',
    lastLoginAt: '2026-05-09',
  },
  {
    id: 'u_039',
    name: 'Otávio Pinheiro',
    email: 'otavio.pinheiro@example.com',
    image: null,
    role: 'admin',
    status: 'active',
    createdAt: '2026-01-07',
    lastLoginAt: '2026-05-29',
  },
  {
    id: 'u_040',
    name: 'Priscila Camargo',
    email: 'priscila.camargo@example.com',
    image: null,
    role: 'member',
    status: 'active',
    createdAt: '2026-01-24',
    lastLoginAt: '2026-05-26',
  },
];

interface QueryUsersInput {
  filters: DataTableFilterValues;
  sort: SortingState;
  page: number;
  pageSize: number;
}

function getString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value : [];
}

function getDateRange(value: unknown): DateRangeValue {
  return value && !Array.isArray(value) && typeof value === 'object'
    ? (value as DateRangeValue)
    : { from: '', to: '' };
}

function compareUsers(
  a: ManagedUser,
  b: ManagedUser,
  columnId: string
): number {
  if (columnId === 'name') return a.name.localeCompare(b.name);
  if (columnId === 'createdAt') return a.createdAt.localeCompare(b.createdAt);
  if (columnId === 'lastLoginAt') {
    return (a.lastLoginAt ?? '').localeCompare(b.lastLoginAt ?? '');
  }
  return 0;
}

/**
 * Simula a busca server-side: aplica filtros, ordenação e paginação sobre o
 * mock. Quando integrar o backend, substituir esta função por uma chamada
 * `api.get('/users', { params: { ... } })` — a forma do retorno é a mesma.
 */
export function queryUsers({
  filters,
  sort,
  page,
  pageSize,
}: QueryUsersInput): ManagedUser[] {
  const search = getString(filters.q).trim().toLowerCase();
  const roles = getStringArray(filters.role);
  const status = getString(filters.status);
  const createdAt = getDateRange(filters.createdAt);

  const filtered = MOCK_USERS.filter((user) => {
    if (search) {
      const haystack = `${user.name} ${user.email}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (roles.length > 0 && !roles.includes(user.role)) return false;
    if (status && user.status !== status) return false;
    if (createdAt.from && user.createdAt < createdAt.from) return false;
    if (createdAt.to && user.createdAt > createdAt.to) return false;
    return true;
  });

  const sortDescriptor = sort[0];
  const ordered = sortDescriptor
    ? [...filtered].sort((a, b) => {
        const result = compareUsers(a, b, sortDescriptor.id);
        return sortDescriptor.desc ? -result : result;
      })
    : filtered;

  return ordered.slice(page * pageSize, page * pageSize + pageSize);
}

export function findUserById(id: string): ManagedUser | undefined {
  return MOCK_USERS.find((user) => user.id === id);
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Ids no formato do catálogo do backend (`modulo.entidade.acao`), os mesmos
// nomes que chegam em `user.permissions` da sessão.
const BASE_PERMISSIONS: Omit<UserPermission, 'granted'>[] = [
  {
    id: 'backoffice.users.read',
    label: 'Visualizar usuários',
    description: 'Acessa a lista e os detalhes dos usuários do sistema.',
  },
  {
    id: 'backoffice.users.update',
    label: 'Editar usuário',
    description:
      'Edita os dados e bloqueia ou desbloqueia contas de outros usuários.',
  },
  {
    id: 'backoffice.roles.read',
    label: 'Visualizar cargos',
    description: 'Consulta os cargos da empresa e as permissões de cada um.',
  },
  {
    id: 'backoffice.roles.update',
    label: 'Editar cargo',
    description: 'Altera o nome, a descrição e as permissões dos cargos.',
  },
  {
    id: 'backoffice.audit.read',
    label: 'Visualizar trilha de auditoria',
    description: 'Acessa o log de auditoria com ações de toda a organização.',
  },
  {
    id: 'backoffice.systemConfigs.update',
    label: 'Editar configurações',
    description: 'Altera os parâmetros de sistema da empresa.',
  },
];

/**
 * Mapeia papéis para permissões padrão. Em backend real, esse cruzamento
 * acontece no servidor — aqui é apenas uma referência visual. `Map` (e não
 * `Record` indexado pelo papel): `.get()` não é sink de object injection.
 */
const PERMISSIONS_BY_ROLE = new Map<ManagedUser['role'], string[]>([
  [
    'admin',
    [
      'backoffice.users.read',
      'backoffice.users.update',
      'backoffice.roles.read',
      'backoffice.roles.update',
      'backoffice.audit.read',
      'backoffice.systemConfigs.update',
    ],
  ],
  [
    'manager',
    [
      'backoffice.users.read',
      'backoffice.users.update',
      'backoffice.roles.read',
      'backoffice.audit.read',
    ],
  ],
  ['member', ['backoffice.users.read', 'backoffice.roles.read']],
  ['viewer', ['backoffice.users.read']],
]);

export function getUserPermissions(user: ManagedUser): UserPermission[] {
  const granted = new Set(PERMISSIONS_BY_ROLE.get(user.role));
  return BASE_PERMISSIONS.map((permission) => ({
    ...permission,
    granted: granted.has(permission.id),
  }));
}

const SESSION_TEMPLATES: Omit<UserSession, 'id' | 'lastActiveAt' | 'current'>[] =
  [
    {
      device: 'MacBook Pro',
      browser: 'Chrome 132',
      location: 'São Paulo, BR',
      ip: '187.45.12.88',
    },
    {
      device: 'iPhone 15',
      browser: 'Safari Mobile',
      location: 'São Paulo, BR',
      ip: '187.45.12.88',
    },
    {
      device: 'Windows 11',
      browser: 'Edge 131',
      location: 'Rio de Janeiro, BR',
      ip: '201.18.94.31',
    },
  ];

export function getUserSessions(user: ManagedUser): UserSession[] {
  if (!user.lastLoginAt) return [];

  return SESSION_TEMPLATES.map((template, index) => ({
    id: `${user.id}_sess_${index}`,
    ...template,
    current: index === 0,
    lastActiveAt: addDays(user.lastLoginAt!, -index * 3),
  }));
}
