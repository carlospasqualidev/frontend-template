import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@/hooks/useSessionStore';
import { DashboardPage } from '@/screens/home';
import { fetchAuditLogs } from '@/services/audit/auditApi';
import { fetchUsers } from '@/services/users/userListApi';
import {
  makeTestQueryClient,
  renderRoutes,
} from '@/tests/helpers/renderRoutes';
import type { IUser } from '@/types/user/types';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

vi.mock('@/services/users/userListApi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/users/userListApi')>();
  return { ...actual, fetchUsers: vi.fn() };
});

vi.mock('@/services/audit/auditApi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/audit/auditApi')>();
  return { ...actual, fetchAuditLogs: vi.fn() };
});

const ALL_PERMISSIONS = [
  'backoffice.audit.read',
  'backoffice.systemConfigs.read',
  'backoffice.users.create',
  'backoffice.users.read',
];

function signIn(permissions: string[]) {
  const user: IUser = {
    id: '01a0f253-fc4e-745c-b069-dff39ba3116e',
    name: 'Maria Silva',
    email: 'maria@example.com',
    image: null,
    permissions,
    idleTimeoutMinutes: 20,
  };
  useSessionStore.setState({ user });
}

const LOG = {
  id: '01a0f253-fc4e-745c-b069-dff39ba31170',
  module: 'USERS',
  entity: 'User',
  entityId: '01a0f253-fc4e-745c-b069-dff39ba31171',
  action: 'create',
  description: 'Criou o usuário "Bruno Lima".',
  changedFields: [],
  userId: '01a0f253-fc4e-745c-b069-dff39ba3116e',
  userName: 'Maria Silva',
  createdAt: '2026-09-30T12:00:00.000Z',
};

let queryClient: ReturnType<typeof makeTestQueryClient>;

function renderHome() {
  return renderRoutes({
    queryClient,
    initialUrl: '/',
    routes: [{ path: '/', component: DashboardPage }],
  });
}

async function statCard(label: string): Promise<HTMLElement> {
  const card = (await screen.findByText(label)).closest('article');
  if (!card) throw new Error(`Indicador ${label} ausente.`);
  return card;
}

async function cardOf(title: string): Promise<HTMLElement> {
  const card = (
    await screen.findByText(title, { selector: '[data-slot="card-title"]' })
  ).closest('[data-slot="card"]');
  if (!(card instanceof HTMLElement)) throw new Error(`Card ${title} ausente.`);
  return card;
}

beforeEach(() => {
  queryClient = makeTestQueryClient();
  signIn(ALL_PERMISSIONS);
  vi.mocked(fetchUsers)
    .mockReset()
    .mockImplementation(async (params) => ({
      users: [],
      count: params.createdFrom ? 146 : 1284,
    }));
  vi.mocked(fetchAuditLogs)
    .mockReset()
    .mockResolvedValue({ logs: [LOG], count: 1 });
  vi.mocked(toast).mockClear();
  vi.mocked(toast.error).mockClear();
});

afterEach(() => {
  queryClient.clear();
  useSessionStore.setState({ user: null });
  vi.useRealTimers();
});

describe('Home — números reais', () => {
  it('mostra o total de usuários e os novos no mês pelo `count` do servidor', async () => {
    renderHome();

    const total = await statCard('Usuários totais');
    await waitFor(() => expect(total).toHaveTextContent('1.284'));
    expect(await statCard('Novos este mês')).toHaveTextContent('146');
    // Números reais não levam o aviso de demonstração.
    expect(
      within(total).queryByText('Dados de demonstração')
    ).not.toBeInTheDocument();
  });

  it('pede uma linha só e, para os novos, desde o dia 1º do mês local', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 30, 15, 45));
    renderHome();

    await waitFor(() => expect(fetchUsers).toHaveBeenCalledTimes(2));
    expect(fetchUsers).toHaveBeenCalledWith({ page: 0, pageSize: 1 });
    expect(fetchUsers).toHaveBeenCalledWith({
      page: 0,
      pageSize: 1,
      createdFrom: new Date(2026, 8, 1).toISOString(),
    });
  });

  it('sem `backoffice.users.read`, os dois indicadores somem sem chamar o servidor', async () => {
    signIn(['backoffice.audit.read']);
    renderHome();

    await screen.findByText('Criou o usuário "Bruno Lima".');
    expect(screen.queryByText('Usuários totais')).not.toBeInTheDocument();
    expect(screen.queryByText('Novos este mês')).not.toBeInTheDocument();
    expect(fetchUsers).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  // A estrutura fica na tela; só o número e os eventos viram skeleton.
  it('enquanto carrega, o rótulo continua e só o dado vira skeleton', async () => {
    vi.mocked(fetchUsers).mockReturnValue(new Promise(() => {}));
    vi.mocked(fetchAuditLogs).mockReturnValue(new Promise(() => {}));
    renderHome();

    const total = await statCard('Usuários totais');
    expect(within(total).getByText('na empresa')).toBeInTheDocument();
    expect(total.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
    const activity = await cardOf('Atividade recente');
    expect(
      activity.querySelector('ol[aria-hidden="true"]')
    ).toBeInTheDocument();
    expect(
      within(activity).getByRole('link', { name: 'Ver auditoria' })
    ).toBeInTheDocument();
  });

  it('na falha da leitura, o indicador mostra que não carregou', async () => {
    vi.mocked(fetchUsers).mockRejectedValue(new Error('503'));
    renderHome();

    const total = await statCard('Usuários totais');
    await waitFor(() =>
      expect(total).toHaveTextContent('Não foi possível carregar.')
    );
    expect(total).toHaveTextContent('—');
  });
});

describe('Home — atividade recente', () => {
  it('mostra os eventos mais recentes da trilha, com autor e o link da auditoria', async () => {
    renderHome();

    const card = await cardOf('Atividade recente');
    expect(
      await within(card).findByText('Criou o usuário "Bruno Lima".')
    ).toBeInTheDocument();
    expect(within(card).getByText(/Maria Silva ·/)).toBeInTheDocument();
    expect(
      within(card).getByRole('link', { name: 'Ver auditoria' })
    ).toHaveAttribute('href', '/audit-logs');
    expect(fetchAuditLogs).toHaveBeenCalledWith({
      page: 0,
      pageSize: 5,
      orderBy: 'createdAt',
      order: 'desc',
    });
  });

  it('sem eventos, diz que não há nada ainda', async () => {
    vi.mocked(fetchAuditLogs).mockResolvedValue({ logs: [], count: 0 });
    renderHome();

    expect(
      await screen.findByText('Nenhum evento registrado ainda.')
    ).toBeInTheDocument();
  });

  it('na falha, oferece tentar de novo', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchAuditLogs).mockRejectedValueOnce(new Error('503'));
    renderHome();

    await user.click(
      await screen.findByRole('button', { name: 'Tentar novamente' })
    );

    expect(
      await screen.findByText('Criou o usuário "Bruno Lima".')
    ).toBeInTheDocument();
  });

  it('sem `backoffice.audit.read`, o bloco some sem chamar o servidor', async () => {
    signIn(['backoffice.users.read']);
    renderHome();

    const total = await statCard('Usuários totais');
    await waitFor(() => expect(total).toHaveTextContent('1.284'));
    expect(screen.queryByText('Atividade recente')).not.toBeInTheDocument();
    expect(fetchAuditLogs).not.toHaveBeenCalled();
  });
});

describe('Home — atalhos', () => {
  it('são links de verdade para as telas que a pessoa pode abrir', async () => {
    renderHome();

    const links = within(await cardOf('Acesso rápido'))
      .getAllByRole('link')
      .map((link) => [link.textContent, link.getAttribute('href')]);
    expect(links).toEqual([
      [expect.stringContaining('Gerenciar usuários'), '/users'],
      [expect.stringContaining('Novo usuário'), '/users/create'],
      [expect.stringContaining('Abrir auditoria'), '/audit-logs'],
      [expect.stringContaining('Configurações'), '/settings'],
      [expect.stringContaining('Minha conta'), '/account'],
    ]);
  });

  it('sem permissão nenhuma, sobra só "Minha conta"', async () => {
    signIn([]);
    renderHome();

    const links = within(await cardOf('Acesso rápido')).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/account',
    ]);
  });
});

describe('Home — demonstração', () => {
  it('as métricas sem rota, a série semanal e as pendências levam o aviso', async () => {
    renderHome();

    for (const label of ['Sessões ativas', 'Convites pendentes']) {
      expect(
        within(await statCard(label)).getByText('Dados de demonstração')
      ).toBeVisible();
    }
    for (const title of ['Atividade da semana', 'Pendências']) {
      expect(
        within(await cardOf(title)).getByText('Dados de demonstração')
      ).toBeVisible();
    }
    expect(
      within(await cardOf('Acesso rápido')).queryByText('Dados de demonstração')
    ).not.toBeInTheDocument();
    await screen.findByText('Criou o usuário "Bruno Lima".');
    expect(
      within(await cardOf('Atividade recente')).queryByText(
        'Dados de demonstração'
      )
    ).not.toBeInTheDocument();
  });

  it('"Abrir" de uma pendência diz que nada mudou', async () => {
    const user = userEvent.setup();
    renderHome();

    const [first] = within(await cardOf('Pendências')).getAllByRole('button', {
      name: 'Abrir',
    });
    if (!first) throw new Error('Pendência ausente.');
    await user.click(first);

    expect(toast).toHaveBeenCalledWith(
      'Dados de demonstração: nada foi alterado.',
      { id: 'demoActionToastId' }
    );
  });
});
