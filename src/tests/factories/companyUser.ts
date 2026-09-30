import { type CompanyUser } from '@/services/users/types';

/** Usuário do CRUD no formato do servidor, com dados fictícios. */
export function makeCompanyUser(
  overrides: Partial<CompanyUser> = {}
): CompanyUser {
  return {
    id: '01a0f253-fc4e-745c-b069-dff39ba3116e',
    name: 'Camila Oliveira',
    email: 'camila.oliveira@example.com',
    image: null,
    phone: null,
    isActive: true,
    idleTimeoutMinutes: null,
    lastLoginAt: '2026-09-28T18:30:00.000Z',
    roles: [{ id: '01a0ee28-61ed-7028-957f-9a3ab51f18f0', name: 'Suporte' }],
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-15T09:10:00.000Z',
    ...overrides,
  };
}
