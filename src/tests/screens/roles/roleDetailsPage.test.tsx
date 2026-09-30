import { AxiosError, AxiosHeaders } from 'axios';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@/hooks/useSessionStore';
import { RoleDetailsPage } from '@/screens/roles/details';
import { axiosApi } from '@/services/api/api';
import { roleKeys } from '@/services/roles/queryKeys';
import {
  fetchPermissionCatalog,
  fetchRoleDetail,
} from '@/services/roles/roleDetailApi';
import { copyRole, deleteRole, updateRole } from '@/services/roles/roleFormApi';
import { fetchAllRoleUsers, setRoleUsers } from '@/services/roles/roleUsersApi';
import { type Role } from '@/services/roles/types';
import { sessionService } from '@/services/session/sessionService';
import { fetchUser } from '@/services/users/userDetailApi';
import { fetchUsers } from '@/services/users/userListApi';
import { makeCompanyUser } from '@/tests/factories/companyUser';
import {
  makeRole,
  makeRoleMember,
  PERMISSION_CATALOG,
} from '@/tests/factories/role';
import { respondWith } from '@/tests/helpers/axiosAdapter';
import {
  makeTestQueryClient,
  renderRoutes,
} from '@/tests/helpers/renderRoutes';
import type { IUser } from '@/types/user/types';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

vi.mock('@/services/roles/roleDetailApi', () => ({
  fetchRoleDetail: vi.fn(),
  fetchPermissionCatalog: vi.fn(),
}));

// Mocka só o transporte; a leitura dos `issues` é a real.
vi.mock('@/services/roles/roleFormApi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/roles/roleFormApi')>();
  return {
    ...actual,
    updateRole: vi.fn(),
    copyRole: vi.fn(),
    deleteRole: vi.fn(),
  };
});

vi.mock('@/services/roles/roleUsersApi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/roles/roleUsersApi')>();
  return { ...actual, fetchAllRoleUsers: vi.fn(), setRoleUsers: vi.fn() };
});

vi.mock('@/services/users/userListApi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/users/userListApi')>();
  return { ...actual, fetchUsers: vi.fn() };
});

vi.mock('@/services/users/userDetailApi', () => ({ fetchUser: vi.fn() }));

// Quem edita tem usuários, cargos e configurações; não tem a auditoria.
const ALL_PERMISSIONS = [
  'backoffice.users.read',
  'backoffice.users.update',
  'backoffice.roles.read',
  'backoffice.roles.create',
  'backoffice.roles.update',
  'backoffice.roles.delete',
  'backoffice.systemConfigs.read',
  'backoffice.systemConfigs.update',
];

function signIn(permissions: string[]): IUser {
  const user: IUser = {
    id: 'u_admin',
    name: 'Maria Silva',
    email: 'maria@example.com',
    image: null,
    permissions,
    idleTimeoutMinutes: 20,
  };
  useSessionStore.setState({ user });
  return user;
}

const CAMILA = makeRoleMember({
  id: 'u-camila',
  name: 'Camila Oliveira',
  email: 'camila@example.com',
});
const BRUNO = makeRoleMember({
  id: 'u-bruno',
  name: 'Bruno Lima',
  email: 'bruno@example.com',
  isActive: false,
});
const DANIELA = makeCompanyUser({
  id: 'u-daniela',
  name: 'Daniela Rocha',
  email: 'daniela@example.com',
});

// O cargo tem a trilha de auditoria, que quem edita não tem.
const SUPORTE = makeRole({
  id: 'role-suporte',
  name: 'Suporte',
  description: 'Atendimento',
  usersCount: 2,
  permissions: [
    { id: 'p-audit-read', name: 'backoffice.audit.read' },
    { id: 'p-users-read', name: 'backoffice.users.read' },
  ],
});

const ADMIN = makeRole({
  id: 'role-suporte',
  name: 'Administrador',
  description: 'Acesso total a todas as permissões da empresa.',
  isSystem: true,
  usersCount: 1,
  permissions: PERMISSION_CATALOG.modules
    .flatMap((module) => module.groups)
    .flatMap((group) => group.permissions)
    .map(({ id, name }) => ({ id, name })),
});

let queryClient: ReturnType<typeof makeTestQueryClient>;
const defaultAdapter = axiosApi.defaults.adapter;

function renderDetail(search = '') {
  return renderRoutes({
    queryClient,
    initialUrl: `/roles/role-suporte${search}`,
    routes: [
      { path: '/roles', component: () => <p>Lista de cargos</p> },
      {
        path: '/roles/$roleId',
        component: RoleDetailsPage,
        validateSearch: (value) => ({ tab: value.tab }),
      },
    ],
  });
}

function axiosFailure(status: number, message: string): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(
    'Falha',
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    {
      data: { message },
      status,
      statusText: '',
      headers: {},
      config,
    }
  );
}

function saved(role: Role) {
  return { message: 'Cargo atualizado.', role };
}

beforeEach(() => {
  queryClient = makeTestQueryClient();
  signIn(ALL_PERMISSIONS);
  vi.mocked(fetchRoleDetail).mockReset().mockResolvedValue(SUPORTE);
  vi.mocked(fetchPermissionCatalog)
    .mockReset()
    .mockResolvedValue(PERMISSION_CATALOG);
  vi.mocked(fetchAllRoleUsers)
    .mockReset()
    .mockResolvedValue({ users: [CAMILA, BRUNO], count: 2 });
  vi.mocked(fetchUsers)
    .mockReset()
    .mockImplementation(async ({ search }) => ({
      users: search ? [DANIELA] : [],
      count: search ? 1 : 0,
    }));
  vi.mocked(fetchUser).mockReset();
  vi.mocked(updateRole).mockReset();
  vi.mocked(setRoleUsers).mockReset();
  vi.mocked(copyRole).mockReset();
  vi.mocked(deleteRole).mockReset();
});

afterEach(() => {
  queryClient.clear();
  useSessionStore.setState({ user: null });
});

describe('RoleDetailsPage — leitura', () => {
  it('abre o cargo já editável, com o resumo e as ações do topo', async () => {
    renderDetail();

    expect(await screen.findByLabelText('Nome')).toHaveValue('Suporte');
    expect(screen.getByLabelText('Descrição')).toHaveValue('Atendimento');
    expect(screen.getByText('2 usuários')).toBeInTheDocument();
    expect(screen.getByText('role-suporte')).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Visão geral',
      'Usuários',
    ]);

    expect(
      await screen.findByRole('checkbox', { name: 'Visualizar usuários' })
    ).toBeChecked();
    // Sem mudança: copiar e excluir, sem salvar.
    expect(
      screen.getByRole('button', { name: 'Copiar cargo' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Excluir cargo' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Salvar alterações' })
    ).not.toBeInTheDocument();
    expect(fetchAllRoleUsers).toHaveBeenCalledWith('role-suporte');
  });

  // O servidor deixa manter ou retirar o que o cargo já tem; acrescentar o
  // que quem edita não tem, não.
  it('a permissão que quem edita não tem fica liberada só se o cargo já a tem', async () => {
    renderDetail();

    expect(
      await screen.findByRole('checkbox', {
        name: 'Visualizar trilha de auditoria',
      })
    ).toBeEnabled();
    // "Criar usuário": nem quem edita nem o cargo tem.
    expect(
      screen.getByRole('checkbox', { name: 'Criar usuário' })
    ).toBeDisabled();
    expect(screen.getAllByText('Você não tem esta permissão.')).toHaveLength(1);
  });

  // A explicação de cada trava é a descrição acessível do checkbox: o leitor
  // de tela a lê junto do nome, não só quem vê a tela.
  it('a explicação de cada trava é a descrição acessível do item', async () => {
    const user = userEvent.setup();
    renderDetail();

    expect(
      await screen.findByRole('checkbox', {
        name: 'Criar usuário',
        description: 'Você não tem esta permissão.',
      })
    ).toBeDisabled();
    expect(
      screen.getByRole('checkbox', { name: 'Visualizar configurações' })
    ).not.toHaveAttribute('aria-describedby');

    await user.click(
      screen.getByRole('checkbox', { name: 'Editar configurações' })
    );

    expect(
      screen.getByRole('checkbox', {
        name: 'Visualizar configurações',
        description: 'Incluída pelas outras ações do grupo.',
      })
    ).toBeDisabled();
  });

  it('mostra "não encontrado" no 404, com o link de volta', async () => {
    vi.mocked(fetchRoleDetail).mockRejectedValue(
      axiosFailure(404, 'Cargo não existe na base de dados.')
    );
    vi.mocked(fetchAllRoleUsers).mockRejectedValue(
      axiosFailure(404, 'Cargo não existe na base de dados.')
    );
    renderDetail();

    expect(await screen.findByText('Cargo não encontrado')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Voltar para a lista' })
    ).toHaveAttribute('href', '/roles');
  });

  it('a falha que não é 404 oferece tentar de novo', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchRoleDetail)
      .mockRejectedValueOnce(axiosFailure(503, 'Fora do ar.'))
      .mockResolvedValue(SUPORTE);
    renderDetail();

    await user.click(
      await screen.findByRole('button', { name: 'Tentar novamente' })
    );
    expect(await screen.findByLabelText('Nome')).toHaveValue('Suporte');
  });

  it('sem a leitura de usuários: sem a aba "Usuários" e sem lê-los', async () => {
    signIn(['backoffice.roles.read', 'backoffice.roles.update']);
    renderDetail();

    await screen.findByLabelText('Nome');
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Visão geral',
    ]);
    expect(fetchAllRoleUsers).not.toHaveBeenCalled();
  });

  it('sem a permissão de editar, o cargo só aparece', async () => {
    signIn(['backoffice.roles.read', 'backoffice.users.read']);
    renderDetail();

    expect(await screen.findByLabelText('Nome')).toHaveAttribute('readonly');
    expect(
      await screen.findByRole('checkbox', { name: 'Visualizar usuários' })
    ).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Excluir cargo' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Copiar cargo' })
    ).not.toBeInTheDocument();
  });

  it('o Administrador só aparece: sem ações, tudo em leitura', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchRoleDetail).mockResolvedValue(ADMIN);
    vi.mocked(fetchAllRoleUsers).mockResolvedValue({
      users: [CAMILA],
      count: 1,
    });
    renderDetail();

    expect(await screen.findByText('Cargo do sistema')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toHaveAttribute('readonly');
    for (const checkbox of await screen.findAllByRole('checkbox')) {
      expect(checkbox).toBeChecked();
      expect(checkbox).toBeDisabled();
    }
    expect(
      screen.queryByRole('button', { name: 'Excluir cargo' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Copiar cargo' })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Usuários' }));
    expect(
      await screen.findByText(
        'Os usuários do Administrador mudam pelos cargos de cada usuário, na tela de usuários.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Camila Oliveira')).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Usuários do cargo')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Retirar/ })
    ).not.toBeInTheDocument();
  });
});

describe('RoleDetailsPage — edição do cargo', () => {
  it('grava o cargo inteiro com a expansão para leitura e volta a sem mudança', async () => {
    const user = userEvent.setup();
    const next = makeRole({
      ...SUPORTE,
      permissions: [
        ...SUPORTE.permissions,
        { id: 'p-configs-read', name: 'backoffice.systemConfigs.read' },
        { id: 'p-configs-update', name: 'backoffice.systemConfigs.update' },
      ],
    });
    vi.mocked(updateRole).mockResolvedValue(saved(next));
    renderDetail();

    await user.click(
      await screen.findByRole('checkbox', { name: 'Editar configurações' })
    );
    expect(
      screen.getByRole('checkbox', { name: 'Visualizar configurações' })
    ).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() =>
      expect(updateRole).toHaveBeenCalledWith('role-suporte', {
        name: 'Suporte',
        description: 'Atendimento',
        permissionIds: [
          'p-audit-read',
          'p-configs-read',
          'p-configs-update',
          'p-users-read',
        ],
      })
    );
    expect(
      await screen.findByRole('button', { name: 'Excluir cargo' })
    ).toBeInTheDocument();
    expect(queryClient.getQueryData(roleKeys.detail('role-suporte'))).toEqual(
      next
    );
    expect(setRoleUsers).not.toHaveBeenCalled();
  });

  it('"Descartar" volta ao cargo gravado', async () => {
    const user = userEvent.setup();
    renderDetail();

    const name = await screen.findByLabelText('Nome');
    await user.clear(name);
    await user.type(name, 'Outro nome');
    await user.click(screen.getByRole('button', { name: 'Descartar' }));

    expect(name).toHaveValue('Suporte');
    expect(
      screen.queryByRole('button', { name: 'Salvar alterações' })
    ).not.toBeInTheDocument();
  });

  it('o nome repetido (409) deixa a alteração pendente', async () => {
    const user = userEvent.setup();
    vi.mocked(updateRole).mockRejectedValue(
      axiosFailure(409, 'Já existe um cargo com este nome.')
    );
    renderDetail();

    const name = await screen.findByLabelText('Nome');
    await user.clear(name);
    await user.type(name, 'Financeiro');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(updateRole).toHaveBeenCalled());
    expect(name).toHaveValue('Financeiro');
    expect(
      screen.getByRole('button', { name: 'Salvar alterações' })
    ).toBeInTheDocument();
  });
});

// Um cargo de quem edita muda as permissões da própria sessão: depois de
// gravá-lo, `GET /client/users/me` é relido e o que a tela oferece segue as
// novas, sem recarregar. A falha dessa releitura não encerra a sessão nem soma
// um toast ao da gravação.
describe('RoleDetailsPage — permissões da própria sessão', () => {
  const MARIA = makeRoleMember({
    id: 'u_admin',
    name: 'Maria Silva',
    email: 'maria@example.com',
  });
  const RENAMED = makeRole({ ...SUPORTE, name: 'Suporte N1' });

  async function renameRole() {
    const user = userEvent.setup();
    const name = await screen.findByLabelText('Nome');
    await user.clear(name);
    await user.type(name, 'Suporte N1');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(updateRole).toHaveBeenCalled());
  }

  function sessionUser(): IUser | null {
    return useSessionStore.getState().user;
  }

  beforeEach(() => {
    vi.mocked(updateRole).mockResolvedValue(saved(RENAMED));
    vi.mocked(toast.error).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    axiosApi.defaults.adapter = defaultAdapter;
  });

  it('no cargo que a pessoa tem, relê a sessão e as ações seguem as permissões novas', async () => {
    vi.mocked(fetchAllRoleUsers).mockResolvedValue({
      users: [BRUNO, CAMILA, MARIA],
      count: 3,
    });
    const withoutCopyAndDelete = ALL_PERMISSIONS.filter(
      (permission) =>
        permission !== 'backoffice.roles.create' &&
        permission !== 'backoffice.roles.delete'
    );
    const refresh = vi.spyOn(sessionService, 'refresh').mockResolvedValue({
      user: { ...signIn(ALL_PERMISSIONS), permissions: withoutCopyAndDelete },
    });
    renderDetail();

    await renameRole();

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(sessionUser()?.permissions).toEqual(withoutCopyAndDelete)
    );
    expect(
      await screen.findByRole('checkbox', { name: 'Visualizar usuários' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Salvar alterações' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Copiar cargo' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Excluir cargo' })
    ).not.toBeInTheDocument();
  });

  it('no cargo que a pessoa não tem, a sessão não é relida', async () => {
    const refresh = vi.spyOn(sessionService, 'refresh');
    renderDetail();

    await renameRole();

    expect(
      await screen.findByRole('button', { name: 'Excluir cargo' })
    ).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  // Sem ler usuários, a tela não sabe se a pessoa tem o cargo.
  it('sem a lista de usuários do cargo, relê a sessão do mesmo jeito', async () => {
    const current = signIn(
      ALL_PERMISSIONS.filter(
        (permission) => permission !== 'backoffice.users.read'
      )
    );
    const refresh = vi
      .spyOn(sessionService, 'refresh')
      .mockResolvedValue({ user: current });
    renderDetail();

    await renameRole();

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(fetchAllRoleUsers).not.toHaveBeenCalled();
  });

  it('a falha da releitura mantém a sessão e a tela, sem toast', async () => {
    vi.mocked(fetchAllRoleUsers).mockResolvedValue({
      users: [BRUNO, CAMILA, MARIA],
      count: 3,
    });
    // Só a releitura passa pelo cliente real (o resto está mockado): 503 com o
    // `message` que o interceptor mostraria.
    axiosApi.defaults.adapter = respondWith(503, {
      message: 'Serviço indisponível.',
    });
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const signOut = vi.spyOn(sessionService, 'signOut');
    const before = sessionUser();
    const { router } = renderDetail();

    await renameRole();

    await waitFor(() =>
      expect(info).toHaveBeenCalledWith(
        'Não foi possível reler as permissões da sessão.',
        { status: 503 }
      )
    );
    expect(toast.error).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
    expect(sessionUser()).toBe(before);
    expect(router.state.location.pathname).toBe('/roles/role-suporte');
    expect(
      await screen.findByRole('button', { name: 'Excluir cargo' })
    ).toBeInTheDocument();
  });
});

describe('RoleDetailsPage — usuários do cargo', () => {
  it('lista quem tem o cargo, com e-mail e status', async () => {
    const user = userEvent.setup();
    renderDetail();

    // A aba do skeleton fica parada: espera o cargo carregar antes de trocar.
    await screen.findByLabelText('Nome');
    await user.click(screen.getByRole('tab', { name: 'Usuários' }));
    const rows = within(await screen.findByRole('table')).getAllByRole('row');
    // Cabeçalho + as duas pessoas, em ordem de nome.
    expect(rows.map((row) => row.textContent)).toEqual([
      'NomeE-mailStatusAções',
      expect.stringContaining('Bruno Lima'),
      expect.stringContaining('Camila Oliveira'),
    ]);
    expect(rows.at(1)).toHaveTextContent('Bloqueado');
  });

  it('vincula pela busca do servidor e grava o conjunto completo', async () => {
    const user = userEvent.setup();
    vi.mocked(setRoleUsers).mockResolvedValue({
      message: 'Usuários do cargo atualizados.',
      role: { ...SUPORTE, usersCount: 3 },
    });
    renderDetail('?tab=users');

    await user.click(await screen.findByLabelText('Usuários do cargo'));
    await user.type(screen.getByRole('textbox', { name: 'Buscar...' }), 'Dani');
    await waitFor(() =>
      expect(fetchUsers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Dani', pageSize: 20 })
      )
    );
    await user.click(
      await screen.findByRole('checkbox', { name: 'Daniela Rocha' })
    );
    await user.keyboard('{Escape}');

    expect(
      await screen.findByRole('cell', { name: /Daniela Rocha/ })
    ).toBeInTheDocument();
    expect(fetchUser).not.toHaveBeenCalled();

    vi.mocked(fetchAllRoleUsers).mockResolvedValue({
      users: [BRUNO, CAMILA, { ...DANIELA }],
      count: 3,
    });
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() =>
      expect(setRoleUsers).toHaveBeenCalledWith('role-suporte', [
        'u-bruno',
        'u-camila',
        'u-daniela',
      ])
    );
    expect(updateRole).not.toHaveBeenCalled();
    expect(
      await screen.findByRole('button', { name: 'Excluir cargo' })
    ).toBeInTheDocument();
    expect(fetchAllRoleUsers).toHaveBeenCalledTimes(2);
  });

  it('retira pelo "X" da linha', async () => {
    const user = userEvent.setup();
    vi.mocked(setRoleUsers).mockResolvedValue({
      message: 'Usuários do cargo atualizados.',
      role: { ...SUPORTE, usersCount: 1 },
    });
    renderDetail('?tab=users');

    await user.click(
      await screen.findByRole('button', { name: 'Retirar Bruno Lima do cargo' })
    );
    expect(screen.queryByText('Bruno Lima')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() =>
      expect(setRoleUsers).toHaveBeenCalledWith('role-suporte', ['u-camila'])
    );
  });

  // Duas rotas: o cargo primeiro, os usuários depois dele.
  it('grava o cargo e depois os usuários, cada um na sua rota', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    vi.mocked(updateRole).mockImplementation(async (_, body) => {
      calls.push('role');
      return saved({ ...SUPORTE, name: body.name });
    });
    vi.mocked(setRoleUsers).mockImplementation(async () => {
      calls.push('users');
      return {
        message: 'Usuários do cargo atualizados.',
        role: { ...SUPORTE, name: 'Suporte N1', usersCount: 1 },
      };
    });
    renderDetail();

    const name = await screen.findByLabelText('Nome');
    await user.clear(name);
    await user.type(name, 'Suporte N1');
    await user.click(screen.getByRole('tab', { name: 'Usuários' }));
    await user.click(
      await screen.findByRole('button', { name: 'Retirar Bruno Lima do cargo' })
    );
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(calls).toEqual(['role', 'users']));
  });

  // A recusa é o toast do servidor (do interceptor); a troca continua pendente.
  it('a recusa da troca de usuários deixa a troca pendente', async () => {
    const user = userEvent.setup();
    vi.mocked(setRoleUsers).mockRejectedValue(
      axiosFailure(403, 'Você não pode conceder permissões que não possui.')
    );
    renderDetail('?tab=users');

    await user.click(
      await screen.findByRole('button', { name: 'Retirar Bruno Lima do cargo' })
    );
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(setRoleUsers).toHaveBeenCalled());
    expect(
      screen.getByRole('button', { name: 'Salvar alterações' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Bruno Lima')).not.toBeInTheDocument();
  });

  it('sem `backoffice.users.update`, a lista só aparece', async () => {
    signIn([
      'backoffice.roles.read',
      'backoffice.roles.update',
      'backoffice.users.read',
    ]);
    renderDetail('?tab=users');

    expect(await screen.findByText('Camila Oliveira')).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Usuários do cargo')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Retirar/ })
    ).not.toBeInTheDocument();
  });
});

describe('RoleDetailsPage — copiar e excluir', () => {
  it('copia e abre a cópia', async () => {
    const user = userEvent.setup();
    const copy = makeRole({ id: 'role-copia', name: 'Suporte (cópia)' });
    vi.mocked(copyRole).mockResolvedValue({
      message: 'Cargo copiado.',
      role: copy,
    });
    const { router } = renderDetail();

    await user.click(
      await screen.findByRole('button', { name: 'Copiar cargo' })
    );

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/roles/role-copia')
    );
    expect(await screen.findByLabelText('Nome')).toHaveValue('Suporte (cópia)');
  });

  it('exclui com confirmação e volta para a lista', async () => {
    const user = userEvent.setup();
    vi.mocked(deleteRole).mockResolvedValue();
    const { router } = renderDetail();

    await user.click(
      await screen.findByRole('button', { name: 'Excluir cargo' })
    );
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('O cargo "Suporte" sai da lista.');
    await user.click(within(dialog).getByRole('button', { name: 'Excluir' }));

    await waitFor(() =>
      expect(deleteRole).toHaveBeenCalledWith('role-suporte')
    );
    await waitFor(() => expect(router.state.location.pathname).toBe('/roles'));
  });
});
