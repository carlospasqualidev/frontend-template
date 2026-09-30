import { AxiosError, AxiosHeaders } from 'axios';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { validateDataTableSearch } from '@/components/global/dataTable/dataTableSearch';
import { useSessionStore } from '@/hooks/useSessionStore';
import { UsersPage } from '@/screens/users/list';
import { deleteUser, setUserActive } from '@/services/users/userFormApi';
import { fetchUsers } from '@/services/users/userListApi';
import {
  fetchRoleDetail,
  searchRoleOptions,
} from '@/services/users/userRolesApi';
import { makeCompanyUser } from '@/tests/factories/companyUser';
import {
  makeTestQueryClient,
  renderRoutes,
} from '@/tests/helpers/renderRoutes';
import type { IUser } from '@/types/user/types';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

// Mocka só o transporte; a montagem dos parâmetros é a real.
vi.mock('@/services/users/userListApi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/users/userListApi')>();
  return { ...actual, fetchUsers: vi.fn() };
});

vi.mock('@/services/users/userRolesApi', () => ({
  searchRoleOptions: vi.fn(),
  fetchRoleDetail: vi.fn(),
}));

vi.mock('@/services/users/userFormApi', () => ({
  setUserActive: vi.fn(),
  deleteUser: vi.fn(),
}));

const ALL_PERMISSIONS = [
  'backoffice.users.read',
  'backoffice.users.create',
  'backoffice.users.update',
  'backoffice.users.delete',
  'backoffice.roles.read',
];

function signIn(permissions: string[]) {
  const user: IUser = {
    id: 'u_admin',
    name: 'Maria Silva',
    email: 'maria@example.com',
    image: null,
    permissions,
    idleTimeoutMinutes: 20,
  };
  useSessionStore.setState({ user });
}

const CAMILA = makeCompanyUser({
  id: 'u-camila',
  name: 'Camila Oliveira',
  email: 'camila@example.com',
  roles: [
    { id: 'role-financeiro', name: 'Financeiro' },
    { id: 'role-suporte', name: 'Suporte' },
  ],
});

const BRUNO = makeCompanyUser({
  id: 'u-bruno',
  name: 'Bruno Lima',
  email: 'bruno@example.com',
  isActive: false,
  lastLoginAt: null,
  roles: [],
});

let queryClient: ReturnType<typeof makeTestQueryClient>;

function renderUsers(filters?: Record<string, unknown>) {
  const search = filters
    ? `?filters=${encodeURIComponent(JSON.stringify(filters))}`
    : '';
  return renderRoutes({
    queryClient,
    initialUrl: `/users${search}`,
    routes: [
      {
        path: '/users',
        component: UsersPage,
        validateSearch: validateDataTableSearch,
      },
    ],
  });
}

function rowOf(name: string): HTMLElement {
  const row = screen.getByText(name).closest('tr');
  if (!row) throw new Error(`Linha de ${name} ausente.`);
  return row;
}

async function chooseRowAction(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
  action: string
) {
  await user.click(
    within(rowOf(name)).getByRole('button', { name: 'Abrir menu' })
  );
  await user.click(await screen.findByRole('menuitem', { name: action }));
}

function badRequest(message: string): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(
    'Bad Request',
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    {
      data: { message },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config,
    }
  );
}

function notFound(): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(
    'Not Found',
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    {
      data: { message: 'Cargo não encontrado.' },
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config,
    }
  );
}

beforeEach(() => {
  queryClient = makeTestQueryClient();
  signIn(ALL_PERMISSIONS);
  vi.mocked(fetchUsers)
    .mockReset()
    .mockResolvedValue({ users: [CAMILA, BRUNO], count: 2 });
  vi.mocked(searchRoleOptions)
    .mockReset()
    .mockImplementation(async (search) => [
      search === ''
        ? {
            id: 'role-financeiro',
            name: 'Financeiro',
            description: null,
            isSystem: false,
          }
        : {
            id: 'role-900',
            name: `Resultado de ${search}`,
            description: null,
            isSystem: false,
          },
    ]);
  vi.mocked(fetchRoleDetail)
    .mockReset()
    .mockImplementation(async (id) => ({
      id,
      name: 'Auditoria',
      description: null,
      isSystem: false,
      permissions: [],
    }));
  vi.mocked(setUserActive).mockReset();
  vi.mocked(deleteUser).mockReset();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});

afterEach(() => {
  queryClient.clear();
  useSessionStore.setState({ user: null });
});

describe('UsersPage — listagem', () => {
  it('mostra os usuários do servidor com cargos, status e último acesso', async () => {
    renderUsers();

    await screen.findByText('Camila Oliveira');
    const camila = rowOf('Camila Oliveira');
    expect(within(camila).getByText('camila@example.com')).toBeInTheDocument();
    expect(within(camila).getByText('Financeiro')).toBeInTheDocument();
    expect(within(camila).getByText('Suporte')).toBeInTheDocument();
    expect(within(camila).getByText('Ativo')).toBeInTheDocument();

    const bruno = rowOf('Bruno Lima');
    expect(within(bruno).getByText('Bloqueado')).toBeInTheDocument();
    expect(within(bruno).getByText('Sem cargo')).toBeInTheDocument();
    expect(within(bruno).getByText('Nunca acessou')).toBeInTheDocument();

    const headers = screen
      .getAllByRole('columnheader')
      .map((header) => header.textContent?.trim());
    expect(headers).toEqual(
      expect.arrayContaining([
        'Nome',
        'E-mail',
        'Cargos',
        'Status',
        'Último acesso',
        'Criado em',
      ])
    );
  });

  it('manda os filtros da URL ao servidor, a partir da primeira página', async () => {
    renderUsers({
      search: 'cam',
      roleId: ['role-financeiro'],
      isActive: 'true',
    });

    await waitFor(() => expect(fetchUsers).toHaveBeenCalled());
    expect(fetchUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 0,
        pageSize: 25,
        search: 'cam',
        roleId: 'role-financeiro',
        isActive: 'true',
      })
    );
  });

  // Paginação exata pelo `count`: 1 linha nesta página, mas 30 no total.
  it('habilita a próxima página pelo total do servidor', async () => {
    vi.mocked(fetchUsers).mockResolvedValue({ users: [CAMILA], count: 30 });
    renderUsers();

    await screen.findByText('Camila Oliveira');
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeEnabled();
  });

  it('desabilita a próxima página quando o total cabe nesta', async () => {
    renderUsers();

    await screen.findByText('Camila Oliveira');
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();
  });
});

describe('UsersPage — filtro "Cargos"', () => {
  // Empresa com mais cargos que uma página: as opções vêm da busca do
  // servidor, pelo que a pessoa digita, com debounce.
  it('busca as opções no servidor pelo que é digitado', async () => {
    const user = userEvent.setup();
    renderUsers();

    await waitFor(() => expect(searchRoleOptions).toHaveBeenCalledWith(''));
    await user.click(screen.getByLabelText('Cargos'));
    expect(
      await screen.findByRole('checkbox', { name: 'Financeiro' })
    ).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'Buscar...' }), 'au');

    expect(
      await screen.findByRole('checkbox', { name: 'Resultado de au' })
    ).toBeInTheDocument();
    // Uma busca pelo termo inteiro, não uma por tecla.
    expect(searchRoleOptions).toHaveBeenCalledWith('au');
    expect(searchRoleOptions).not.toHaveBeenCalledWith('a');
    expect(
      screen.queryByRole('checkbox', { name: 'Financeiro' })
    ).not.toBeInTheDocument();
  });

  // O cargo da URL pode não estar entre os primeiros da busca: o nome vem da
  // leitura dele.
  it('mostra o nome do cargo aplicado pela URL', async () => {
    renderUsers({ roleId: ['role-auditoria'] });

    await waitFor(() =>
      expect(screen.getByLabelText('Cargos')).toHaveTextContent('Auditoria')
    );
    expect(fetchRoleDetail).toHaveBeenCalledWith('role-auditoria');
    expect(fetchUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({ roleId: 'role-auditoria' })
    );
  });

  // Link antigo com um cargo que foi excluído (404 na leitura dele): o id sai
  // da busca e da URL, sem toast, e o filtro mostra só o cargo que existe.
  it('tira da busca e da URL o cargo que o servidor não tem mais', async () => {
    vi.mocked(fetchRoleDetail).mockImplementation(async (id) => {
      if (id === 'role-excluido') throw notFound();
      return {
        id,
        name: 'Auditoria',
        description: null,
        isSystem: false,
        permissions: [],
      };
    });
    const { router } = renderUsers({
      search: 'cam',
      roleId: ['role-excluido', 'role-auditoria'],
    });

    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        filters: { search: 'cam', roleId: ['role-auditoria'] },
      })
    );
    await waitFor(() =>
      expect(fetchUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'cam', roleId: 'role-auditoria' })
      )
    );
    expect(screen.getByLabelText('Cargos')).toHaveTextContent('Auditoria');
    expect(router.history.length).toBe(1);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('só com o cargo excluído, a URL fica sem filtro e a lista, sem cargo', async () => {
    vi.mocked(fetchRoleDetail).mockRejectedValue(notFound());
    const { router } = renderUsers({ roleId: ['role-excluido'] });

    await waitFor(() => expect(router.state.location.search).toEqual({}));
    await waitFor(() =>
      expect(vi.mocked(fetchUsers).mock.lastCall?.[0].roleId).toBeUndefined()
    );
    expect(screen.getByLabelText('Cargos')).toHaveTextContent('Todos');
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe('UsersPage — permissões', () => {
  it('com as permissões, mostra "Novo usuário" como link e as ações da linha', async () => {
    const user = userEvent.setup();
    renderUsers();

    expect(
      await screen.findByRole('link', { name: 'Novo usuário' })
    ).toHaveAttribute('href', '/users/create');
    await screen.findByText('Camila Oliveira');
    await user.click(
      within(rowOf('Camila Oliveira')).getByRole('button', {
        name: 'Abrir menu',
      })
    );
    expect(
      await screen.findByRole('menuitem', { name: 'Bloquear' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Excluir' })
    ).toBeInTheDocument();
  });

  it('só com a leitura, esconde criar, bloquear, excluir e o filtro de cargos', async () => {
    const user = userEvent.setup();
    signIn(['backoffice.users.read']);
    renderUsers({ roleId: ['role-financeiro'], search: 'cam' });

    await screen.findByText('Camila Oliveira');
    expect(
      screen.queryByRole('link', { name: 'Novo usuário' })
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Cargos')).not.toBeInTheDocument();
    expect(searchRoleOptions).not.toHaveBeenCalled();
    expect(fetchRoleDetail).not.toHaveBeenCalled();
    // O `roleId` que ficou na URL não filtra sem o filtro na tela.
    const params = vi.mocked(fetchUsers).mock.lastCall?.[0];
    expect(params?.roleId).toBeUndefined();
    expect(params?.search).toBe('cam');

    await user.click(
      within(rowOf('Camila Oliveira')).getByRole('button', {
        name: 'Abrir menu',
      })
    );
    expect(
      await screen.findByRole('menuitem', { name: 'Copiar e-mail' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Bloquear' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Excluir' })
    ).not.toBeInTheDocument();
  });
});

describe('UsersPage — ações da linha', () => {
  it('bloqueia depois de confirmar e atualiza só a linha', async () => {
    const user = userEvent.setup();
    vi.mocked(setUserActive).mockResolvedValue({
      message: 'Usuário atualizado.',
      user: { ...CAMILA, isActive: false },
    });
    renderUsers();

    await screen.findByText('Camila Oliveira');
    await chooseRowAction(user, 'Camila Oliveira', 'Bloquear');
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('Bloquear usuário?')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Bloquear' }));

    await waitFor(() =>
      expect(setUserActive).toHaveBeenCalledWith('u-camila', false)
    );
    await waitFor(() =>
      expect(
        within(rowOf('Camila Oliveira')).getByText('Bloqueado')
      ).toBeInTheDocument()
    );
    // Sem rebuscar a lista, e o toast é o do servidor (não um da tela).
    expect(fetchUsers).toHaveBeenCalledTimes(1);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('desbloqueia o bloqueado', async () => {
    const user = userEvent.setup();
    vi.mocked(setUserActive).mockResolvedValue({
      message: 'Usuário atualizado.',
      user: { ...BRUNO, isActive: true },
    });
    renderUsers();

    await screen.findByText('Bruno Lima');
    await chooseRowAction(user, 'Bruno Lima', 'Desbloquear');
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Desbloquear',
      })
    );

    await waitFor(() =>
      expect(setUserActive).toHaveBeenCalledWith('u-bruno', true)
    );
  });

  // A regra (último administrador) é do servidor: o toast é o do interceptor,
  // e a tela não soma outro. O dialog fica aberto.
  it('na recusa do servidor, mantém o dialog aberto sem toast próprio', async () => {
    const user = userEvent.setup();
    vi.mocked(setUserActive).mockRejectedValue(
      badRequest(
        'Não é possível bloquear o último administrador ativo da empresa.'
      )
    );
    renderUsers();

    await screen.findByText('Camila Oliveira');
    await chooseRowAction(user, 'Camila Oliveira', 'Bloquear');
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Bloquear' }));

    await waitFor(() => expect(setUserActive).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(
        within(dialog).getByRole('button', { name: 'Bloquear' })
      ).toBeEnabled()
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
    expect(
      within(rowOf('Camila Oliveira')).getByText('Ativo')
    ).toBeInTheDocument();
  });

  it('exclui depois de confirmar e relê a listagem', async () => {
    const user = userEvent.setup();
    vi.mocked(deleteUser).mockResolvedValue(undefined);
    renderUsers();

    await screen.findByText('Bruno Lima');
    vi.mocked(fetchUsers).mockResolvedValue({ users: [CAMILA], count: 1 });
    await chooseRowAction(user, 'Bruno Lima', 'Excluir');
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('Excluir usuário?')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(deleteUser).toHaveBeenCalledWith('u-bruno'));
    await waitFor(() =>
      expect(screen.queryByText('Bruno Lima')).not.toBeInTheDocument()
    );
    expect(fetchUsers).toHaveBeenCalledTimes(2);
  });
});
