import { AxiosError, AxiosHeaders } from 'axios';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@/hooks/useSessionStore';
import { UserDetailsPage } from '@/screens/users/details';
import { UNEXPECTED_USER_ERROR_MESSAGE } from '@/screens/users/utils/userMutations';
import { fetchEntityAuditLogs } from '@/services/audit/auditApi';
import { userKeys } from '@/services/users/queryKeys';
import {
  fetchUser,
  type UserDetailResponse,
} from '@/services/users/userDetailApi';
import {
  deleteUser,
  setUserActive,
  updateUser,
} from '@/services/users/userFormApi';
import {
  fetchPermissionCatalog,
  fetchRoleDetail,
  searchRoleOptions,
  setUserRoles,
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

vi.mock('@/services/users/userDetailApi', () => ({ fetchUser: vi.fn() }));

// Mocka só o transporte; a leitura dos `issues` é a real.
vi.mock('@/services/users/userFormApi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/users/userFormApi')>();
  return {
    ...actual,
    updateUser: vi.fn(),
    setUserActive: vi.fn(),
    deleteUser: vi.fn(),
  };
});

vi.mock('@/services/users/userRolesApi', () => ({
  searchRoleOptions: vi.fn(),
  fetchRoleDetail: vi.fn(),
  fetchPermissionCatalog: vi.fn(),
  setUserRoles: vi.fn(),
}));

vi.mock('@/services/audit/auditApi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/audit/auditApi')>();
  return { ...actual, fetchEntityAuditLogs: vi.fn() };
});

const ALL_PERMISSIONS = [
  'backoffice.users.read',
  'backoffice.users.update',
  'backoffice.users.delete',
  'backoffice.roles.read',
  'backoffice.audit.read',
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

const SUPORTE = { id: 'role-suporte', name: 'Suporte' };
const AUDITORIA = { id: 'role-auditoria', name: 'Auditoria' };
const FINANCEIRO = { id: 'role-financeiro', name: 'Financeiro' };

const CAMILA = makeCompanyUser({
  id: 'u-camila',
  name: 'Camila Oliveira',
  email: 'camila@example.com',
  phone: null,
  idleTimeoutMinutes: 30,
  roles: [SUPORTE],
});

const CATALOG = {
  modules: [
    {
      module: 'backoffice',
      moduleLabel: 'Backoffice',
      groups: [
        {
          groupLabel: 'Usuários',
          permissions: [
            {
              id: 'p-users-read',
              name: 'backoffice.users.read',
              action: 'read',
              label: 'Visualizar usuários',
            },
            {
              id: 'p-users-update',
              name: 'backoffice.users.update',
              action: 'update',
              label: 'Editar usuário',
            },
          ],
        },
        {
          groupLabel: 'Auditoria',
          permissions: [
            {
              id: 'p-audit-read',
              name: 'backoffice.audit.read',
              action: 'read',
              label: 'Visualizar trilha de auditoria',
            },
          ],
        },
      ],
    },
  ],
};

function roleDetail(id: string) {
  const isSupport = id === SUPORTE.id;
  return {
    id,
    name:
      [SUPORTE, AUDITORIA, FINANCEIRO].find((role) => role.id === id)?.name ??
      '',
    description: null,
    isSystem: false,
    permissions: isSupport
      ? [
          { id: 'p-users-read', name: 'backoffice.users.read' },
          { id: 'p-users-update', name: 'backoffice.users.update' },
        ]
      : [{ id: 'p-audit-read', name: 'backoffice.audit.read' }],
  };
}

let queryClient: ReturnType<typeof makeTestQueryClient>;

function renderDetail(search = '') {
  return renderRoutes({
    queryClient,
    initialUrl: `/users/u-camila${search}`,
    routes: [
      { path: '/users', component: () => <p>Lista de usuários</p> },
      {
        path: '/users/$userId',
        component: UserDetailsPage,
        validateSearch: (value) => ({ tab: value.tab }),
      },
    ],
  });
}

function axiosFailure(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(
    'Falha',
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    {
      data,
      status,
      statusText: '',
      headers: {},
      config,
    }
  );
}

beforeEach(() => {
  queryClient = makeTestQueryClient();
  signIn(ALL_PERMISSIONS);
  vi.mocked(fetchUser).mockReset().mockResolvedValue({ user: CAMILA });
  // Sem termo, a primeira página (sem o Financeiro); com termo, o que casa.
  vi.mocked(searchRoleOptions)
    .mockReset()
    .mockImplementation(async (search) =>
      (search === ''
        ? [AUDITORIA, SUPORTE]
        : [AUDITORIA, FINANCEIRO, SUPORTE].filter((role) =>
            role.name.toLowerCase().includes(search.toLowerCase())
          )
      ).map((role) => ({ ...role, description: null, isSystem: false }))
    );
  vi.mocked(fetchRoleDetail)
    .mockReset()
    .mockImplementation(async (id) => roleDetail(id));
  vi.mocked(fetchPermissionCatalog).mockReset().mockResolvedValue(CATALOG);
  vi.mocked(fetchEntityAuditLogs)
    .mockReset()
    .mockResolvedValue({ logs: [], count: 0 });
  vi.mocked(updateUser).mockReset();
  vi.mocked(setUserRoles).mockReset();
  vi.mocked(setUserActive).mockReset();
  vi.mocked(deleteUser).mockReset();
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
});

afterEach(() => {
  queryClient.clear();
  useSessionStore.setState({ user: null });
});

describe('UserDetailsPage — leitura', () => {
  it('abre o cadastro real, já editável, com a situação da conta', async () => {
    renderDetail();

    expect(await screen.findByLabelText('Nome')).toHaveValue('Camila Oliveira');
    expect(screen.getByLabelText('E-mail')).toHaveValue('camila@example.com');
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Tempo de inatividade (min)')).toHaveValue(
      '30'
    );
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('u-camila')).toBeInTheDocument();
    expect(fetchUser).toHaveBeenCalledWith('u-camila');

    const tabs = screen.getAllByRole('tab').map((tab) => tab.textContent);
    expect(tabs).toEqual(['Visão geral', 'Atividade', 'Cargos', 'Sessões']);
    // Sem mudança: só "Excluir" no topo.
    expect(
      screen.getByRole('button', { name: 'Excluir usuário' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Salvar alterações' })
    ).not.toBeInTheDocument();
  });

  it('mostra "não encontrado" no 404, com o link de volta', async () => {
    vi.mocked(fetchUser).mockRejectedValue(
      axiosFailure(404, { message: 'Usuário não existe na base de dados.' })
    );
    renderDetail();

    expect(
      await screen.findByText('Usuário não encontrado')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Voltar para a lista' })
    ).toHaveAttribute('href', '/users');
  });

  it('a aba "Atividade" lê a linha do tempo pelo id real', async () => {
    renderDetail('?tab=activity');

    await waitFor(() =>
      expect(fetchEntityAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ entity: 'User', entityId: 'u-camila' })
      )
    );
  });
});

describe('UserDetailsPage — edição', () => {
  it('grava só o campo alterado e volta a pristine', async () => {
    const user = userEvent.setup();
    vi.mocked(updateUser).mockResolvedValue({
      message: 'Usuário atualizado.',
      user: { ...CAMILA, phone: '(48) 99999-9999' },
    });
    renderDetail();

    await user.type(
      await screen.findByLabelText('Telefone'),
      '(48) 99999-9999'
    );
    expect(
      screen.queryByRole('button', { name: 'Excluir usuário' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith('u-camila', {
        phone: '(48) 99999-9999',
      })
    );
    expect(setUserRoles).not.toHaveBeenCalled();
    expect(
      await screen.findByRole('button', { name: 'Excluir usuário' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Salvar alterações' })
    ).not.toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('esvaziar o tempo de inatividade volta a herdar o da empresa (null)', async () => {
    const user = userEvent.setup();
    vi.mocked(updateUser).mockResolvedValue({
      message: 'Usuário atualizado.',
      user: { ...CAMILA, idleTimeoutMinutes: null },
    });
    renderDetail();

    await user.clear(
      await screen.findByLabelText('Tempo de inatividade (min)')
    );
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith('u-camila', {
        idleTimeoutMinutes: null,
      })
    );
  });

  it('"Descartar" volta ao cadastro gravado', async () => {
    const user = userEvent.setup();
    renderDetail();

    const name = await screen.findByLabelText('Nome');
    await user.clear(name);
    await user.type(name, 'Outro Nome');
    await user.click(screen.getByRole('button', { name: 'Descartar' }));

    expect(name).toHaveValue('Camila Oliveira');
    expect(updateUser).not.toHaveBeenCalled();
  });

  // A resposta 200 fora do contrato (o `.parse` recusa) chega como falha que
  // não é HTTP, mas o servidor gravou. O formulário adota o usuário relido:
  // "Descartar" volta a ele, e o próximo "Salvar" não reenvia o nome antigo.
  it('na falha que não é HTTP, adota o usuário relido e deixa a troca de cargos pendente', async () => {
    const user = userEvent.setup();
    const saved = { ...CAMILA, name: 'Camila Souza' };
    vi.mocked(fetchUser)
      .mockResolvedValueOnce({ user: CAMILA })
      .mockResolvedValue({ user: saved });
    vi.mocked(updateUser)
      .mockRejectedValueOnce(new Error('Resposta fora do contrato.'))
      .mockResolvedValue({
        message: 'Usuário atualizado.',
        user: { ...saved, phone: '(48) 99999-9999' },
      });
    renderDetail();

    const name = await screen.findByLabelText('Nome');
    await user.clear(name);
    await user.type(name, 'Camila Souza');
    await user.click(screen.getByRole('tab', { name: 'Cargos' }));
    await user.click(await screen.findByLabelText('Cargos do usuário'));
    await user.click(
      await screen.findByRole('checkbox', { name: 'Auditoria' })
    );
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(fetchUser).toHaveBeenCalledTimes(2));
    expect(toast.error).toHaveBeenCalledWith(UNEXPECTED_USER_ERROR_MESSAGE, {
      id: 'errorToastId',
    });
    expect(setUserRoles).not.toHaveBeenCalled();

    // A troca de cargos não foi gravada: continua pendente. "Descartar"
    // desfaz só ela e volta ao cadastro relido.
    await user.click(await screen.findByRole('button', { name: 'Descartar' }));
    expect(screen.getByLabelText('Cargos do usuário')).not.toHaveTextContent(
      'Auditoria'
    );
    await user.click(screen.getByRole('tab', { name: 'Visão geral' }));
    expect(await screen.findByLabelText('Nome')).toHaveValue('Camila Souza');
    expect(
      screen.getByRole('button', { name: 'Excluir usuário' })
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText('Telefone'), '(48) 99999-9999');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(updateUser).toHaveBeenCalledTimes(2));
    expect(updateUser).toHaveBeenLastCalledWith('u-camila', {
      phone: '(48) 99999-9999',
    });
  });

  it('na falha que não é HTTP, se a releitura falhar, a alteração continua pendente', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchUser)
      .mockResolvedValueOnce({ user: CAMILA })
      .mockRejectedValue(axiosFailure(503, { message: 'Indisponível.' }));
    vi.mocked(updateUser).mockRejectedValue(
      new Error('Resposta fora do contrato.')
    );
    renderDetail();

    const name = await screen.findByLabelText('Nome');
    await user.clear(name);
    await user.type(name, 'Camila Souza');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() =>
      expect(
        queryClient.getQueryState(userKeys.detail('u-camila'))?.status
      ).toBe('error')
    );
    expect(
      screen.queryByText('Não foi possível carregar o usuário')
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toHaveValue('Camila Souza');
    await user.click(screen.getByRole('button', { name: 'Descartar' }));
    expect(screen.getByLabelText('Nome')).toHaveValue('Camila Oliveira');
  });

  // A releitura falha e o formulário fica com a edição; depois, o "Bloquear"
  // põe no cache o usuário com o nome que o servidor gravou. O formulário
  // passa a partir dele: "Descartar" volta a ele, e o próximo "Salvar" não
  // regrava o nome antigo.
  it('com a releitura em falha, o usuário do "Bloquear" vira o ponto de partida', async () => {
    const user = userEvent.setup();
    const saved = { ...CAMILA, name: 'Camila Souza' };
    vi.mocked(fetchUser)
      .mockResolvedValueOnce({ user: CAMILA })
      .mockRejectedValue(axiosFailure(503, { message: 'Indisponível.' }));
    vi.mocked(updateUser)
      .mockRejectedValueOnce(new Error('Resposta fora do contrato.'))
      .mockResolvedValue({
        message: 'Usuário atualizado.',
        user: { ...saved, isActive: false, phone: '(48) 99999-9999' },
      });
    vi.mocked(setUserActive).mockResolvedValue({
      message: 'Usuário atualizado.',
      user: { ...saved, isActive: false },
    });
    renderDetail();

    const name = await screen.findByLabelText('Nome');
    await user.clear(name);
    await user.type(name, 'Camila Souza');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() =>
      expect(
        queryClient.getQueryState(userKeys.detail('u-camila'))?.status
      ).toBe('error')
    );

    await user.click(screen.getByRole('button', { name: 'Bloquear' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Bloquear' }));
    expect(
      await screen.findByRole('button', { name: 'Desbloquear' })
    ).toBeInTheDocument();

    // O nome da tela já é o que o servidor tem: nada pendente.
    expect(
      await screen.findByRole('button', { name: 'Excluir usuário' })
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText('Telefone'), '(48) 3333-3333');
    await user.click(screen.getByRole('button', { name: 'Descartar' }));
    expect(screen.getByLabelText('Nome')).toHaveValue('Camila Souza');
    expect(screen.getByLabelText('Telefone')).toHaveValue('');

    await user.type(screen.getByLabelText('Telefone'), '(48) 99999-9999');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(updateUser).toHaveBeenCalledTimes(2));
    expect(updateUser).toHaveBeenLastCalledWith('u-camila', {
      phone: '(48) 99999-9999',
    });
  });

  // Enquanto a releitura corre, a pessoa continua editando. O relido traz o
  // nome gravado e os cargos que outro administrador deu: o formulário passa
  // a partir dele, o telefone digitado continua pendente e os cargos, que a
  // pessoa não mexeu, não viram troca.
  it('na falha que não é HTTP, o que é digitado durante a releitura continua pendente', async () => {
    const user = userEvent.setup();
    const reread = {
      ...CAMILA,
      name: 'Camila Souza',
      roles: [AUDITORIA, SUPORTE],
    };
    let finishReread: (response: UserDetailResponse) => void = () => {};
    vi.mocked(fetchUser)
      .mockResolvedValueOnce({ user: CAMILA })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishReread = resolve;
          })
      )
      .mockResolvedValue({ user: reread });
    vi.mocked(updateUser)
      .mockRejectedValueOnce(new Error('Resposta fora do contrato.'))
      .mockResolvedValue({
        message: 'Usuário atualizado.',
        user: { ...reread, phone: '(48) 99999-9999' },
      });
    renderDetail();

    const name = await screen.findByLabelText('Nome');
    await user.clear(name);
    await user.type(name, 'Camila Souza');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(fetchUser).toHaveBeenCalledTimes(2));

    await user.type(screen.getByLabelText('Telefone'), '(48) 99999-9999');
    await act(async () => finishReread({ user: reread }));

    await user.click(screen.getByRole('tab', { name: 'Cargos' }));
    expect(await screen.findByLabelText('Cargos do usuário')).toHaveTextContent(
      'Auditoria'
    );
    await user.click(screen.getByRole('tab', { name: 'Visão geral' }));
    expect(await screen.findByLabelText('Telefone')).toHaveValue(
      '(48) 99999-9999'
    );
    expect(screen.getByLabelText('Nome')).toHaveValue('Camila Souza');

    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(updateUser).toHaveBeenCalledTimes(2));
    expect(updateUser).toHaveBeenLastCalledWith('u-camila', {
      phone: '(48) 99999-9999',
    });
    expect(setUserRoles).not.toHaveBeenCalled();
  });

  it('marca o campo que o servidor recusou, sem toast', async () => {
    const user = userEvent.setup();
    const message = 'O nome deve ter no máximo 120 caracteres.';
    vi.mocked(updateUser).mockRejectedValue(
      axiosFailure(400, {
        message: `name: ${message}`,
        issues: [{ path: 'name', message }],
      })
    );
    renderDetail();

    await user.type(await screen.findByLabelText('Nome'), ' Souza');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe('UserDetailsPage — aba "Cargos"', () => {
  it('mostra os cargos e as permissões de cada um, com o rótulo do catálogo', async () => {
    renderDetail('?tab=roles');

    expect(await screen.findByLabelText('Cargos do usuário')).toHaveTextContent(
      'Suporte'
    );
    const permissions = (
      await screen.findByRole('heading', { name: 'Suporte' })
    ).closest('section');
    if (!permissions) throw new Error('Seção do cargo ausente.');
    expect(
      await within(permissions).findByText('Visualizar usuários')
    ).toBeInTheDocument();
    expect(within(permissions).getByText('Editar usuário')).toBeInTheDocument();
    expect(within(permissions).getByText('Usuários')).toBeInTheDocument();
  });

  it('troca os cargos pelo "Salvar alterações", sem mexer no cadastro', async () => {
    const user = userEvent.setup();
    vi.mocked(setUserRoles).mockResolvedValue({
      message: 'Cargos do usuário atualizados.',
      user: { ...CAMILA, roles: [AUDITORIA, SUPORTE] },
    });
    renderDetail('?tab=roles');

    await user.click(await screen.findByLabelText('Cargos do usuário'));
    await user.click(
      await screen.findByRole('checkbox', { name: 'Auditoria' })
    );
    await user.keyboard('{Escape}');

    // A prévia mostra as permissões do cargo novo antes de salvar.
    expect(
      await screen.findByText('Visualizar trilha de auditoria')
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() =>
      expect(setUserRoles).toHaveBeenCalledWith('u-camila', [
        'role-suporte',
        'role-auditoria',
      ])
    );
    expect(updateUser).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Salvar alterações' })
      ).not.toBeInTheDocument()
    );
  });

  // Empresa com mais cargos que uma página: o cargo que não veio na primeira
  // é achado pela busca do servidor, e continua marcado depois dela.
  it('acha o cargo pela busca no servidor e o grava com os outros', async () => {
    const user = userEvent.setup();
    vi.mocked(setUserRoles).mockResolvedValue({
      message: 'Cargos do usuário atualizados.',
      user: { ...CAMILA, roles: [FINANCEIRO, SUPORTE] },
    });
    renderDetail('?tab=roles');

    await user.click(await screen.findByLabelText('Cargos do usuário'));
    expect(
      await screen.findByRole('checkbox', { name: 'Auditoria' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('checkbox', { name: 'Financeiro' })
    ).not.toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Buscar...' }), 'fin');
    await user.click(
      await screen.findByRole('checkbox', { name: 'Financeiro' })
    );
    // Uma busca pelo termo inteiro, não uma por tecla.
    expect(searchRoleOptions).toHaveBeenCalledWith('fin');
    expect(searchRoleOptions).not.toHaveBeenCalledWith('f');
    await user.keyboard('{Escape}');

    expect(screen.getByLabelText('Cargos do usuário')).toHaveTextContent(
      /Suporte.*Financeiro|Financeiro.*Suporte/
    );
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() =>
      expect(setUserRoles).toHaveBeenCalledWith('u-camila', [
        'role-suporte',
        'role-financeiro',
      ])
    );
  });

  // Outro administrador trocou os cargos enquanto a pessoa editava só o
  // cadastro: a resposta traz os cargos novos, que não viram troca pendente
  // (o próximo "Salvar" não desfaz a mudança dele).
  it('os cargos que a pessoa não mexeu seguem os do servidor depois de salvar', async () => {
    const user = userEvent.setup();
    const saved = { ...CAMILA, name: 'Camila Souza', roles: [AUDITORIA] };
    vi.mocked(updateUser)
      .mockResolvedValueOnce({ message: 'Usuário atualizado.', user: saved })
      .mockResolvedValue({
        message: 'Usuário atualizado.',
        user: { ...saved, phone: '(48) 99999-9999' },
      });
    renderDetail();

    const name = await screen.findByLabelText('Nome');
    await user.clear(name);
    await user.type(name, 'Camila Souza');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(
      await screen.findByRole('button', { name: 'Excluir usuário' })
    ).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Cargos' }));
    const roles = await screen.findByLabelText('Cargos do usuário');
    expect(roles).toHaveTextContent('Auditoria');
    expect(roles).not.toHaveTextContent('Suporte');

    await user.click(screen.getByRole('tab', { name: 'Visão geral' }));
    await user.type(
      await screen.findByLabelText('Telefone'),
      '(48) 99999-9999'
    );
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(updateUser).toHaveBeenCalledTimes(2));
    expect(updateUser).toHaveBeenLastCalledWith('u-camila', {
      phone: '(48) 99999-9999',
    });
    expect(setUserRoles).not.toHaveBeenCalled();
  });

  // Anti-escalonamento: quem decide é o servidor. O cadastro já gravou; a
  // troca de cargos recusada continua pendente, com o toast do servidor (do
  // interceptor, não da tela).
  it('na recusa dos cargos, grava o cadastro e deixa a troca pendente', async () => {
    const user = userEvent.setup();
    vi.mocked(updateUser).mockResolvedValue({
      message: 'Usuário atualizado.',
      user: { ...CAMILA, name: 'Camila Souza' },
    });
    vi.mocked(setUserRoles).mockRejectedValue(
      axiosFailure(403, {
        message: 'Você não pode conceder permissões que não possui.',
      })
    );
    renderDetail();

    const name = await screen.findByLabelText('Nome');
    await user.clear(name);
    await user.type(name, 'Camila Souza');
    await user.click(screen.getByRole('tab', { name: 'Cargos' }));
    await user.click(await screen.findByLabelText('Cargos do usuário'));
    await user.click(
      await screen.findByRole('checkbox', { name: 'Auditoria' })
    );
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() =>
      expect(setUserRoles).toHaveBeenCalledWith('u-camila', [
        'role-suporte',
        'role-auditoria',
      ])
    );
    expect(updateUser).toHaveBeenCalledWith('u-camila', {
      name: 'Camila Souza',
    });
    expect(vi.mocked(updateUser).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(setUserRoles).mock.invocationCallOrder[0] ?? 0
    );
    expect(
      screen.getByRole('button', { name: 'Salvar alterações' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Cargos do usuário')).toHaveTextContent(
      'Auditoria'
    );
    expect(toast.error).not.toHaveBeenCalled();

    // "Descartar" desfaz só a troca de cargos: o nome já é o gravado.
    await user.click(screen.getByRole('button', { name: 'Descartar' }));
    expect(screen.getByLabelText('Cargos do usuário')).not.toHaveTextContent(
      'Auditoria'
    );
    await user.click(screen.getByRole('tab', { name: 'Visão geral' }));
    expect(await screen.findByLabelText('Nome')).toHaveValue('Camila Souza');
  });
});

describe('UserDetailsPage — permissões', () => {
  it('sem editar: campos em leitura, cargos travados e sem bloquear', async () => {
    signIn(['backoffice.users.read', 'backoffice.roles.read']);
    renderDetail();

    expect(await screen.findByLabelText('Nome')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Telefone')).toHaveAttribute('readonly');
    expect(
      screen.queryByRole('button', { name: 'Bloquear' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Excluir usuário' })
    ).not.toBeInTheDocument();
    // Sem a trilha, sem a aba "Atividade".
    expect(
      screen.queryByRole('tab', { name: 'Atividade' })
    ).not.toBeInTheDocument();
  });

  it('sem editar, o campo de cargos fica desabilitado', async () => {
    signIn(['backoffice.users.read', 'backoffice.roles.read']);
    renderDetail('?tab=roles');

    expect(await screen.findByLabelText('Cargos do usuário')).toBeDisabled();
  });

  it('sem ler cargos: só os nomes, sem opções nem permissões', async () => {
    signIn(['backoffice.users.read', 'backoffice.users.update']);
    renderDetail('?tab=roles');

    expect(await screen.findByText('Suporte')).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Cargos do usuário')
    ).not.toBeInTheDocument();
    expect(searchRoleOptions).not.toHaveBeenCalled();
    expect(fetchPermissionCatalog).not.toHaveBeenCalled();
  });
});

describe('UserDetailsPage — ações', () => {
  it('exclui depois de confirmar e volta para a lista', async () => {
    const user = userEvent.setup();
    vi.mocked(deleteUser).mockResolvedValue(undefined);
    const { router } = renderDetail();

    await user.click(
      await screen.findByRole('button', { name: 'Excluir usuário' })
    );
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(deleteUser).toHaveBeenCalledWith('u-camila'));
    expect(await screen.findByText('Lista de usuários')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/users');
  });

  it('bloqueia pelo card "Situação" e mostra o status novo', async () => {
    const user = userEvent.setup();
    vi.mocked(setUserActive).mockResolvedValue({
      message: 'Usuário atualizado.',
      user: { ...CAMILA, isActive: false },
    });
    renderDetail();

    await user.click(await screen.findByRole('button', { name: 'Bloquear' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Bloquear' }));

    await waitFor(() =>
      expect(setUserActive).toHaveBeenCalledWith('u-camila', false)
    );
    expect(await screen.findByText('Bloqueado')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Desbloquear' })
    ).toBeInTheDocument();
  });
});
