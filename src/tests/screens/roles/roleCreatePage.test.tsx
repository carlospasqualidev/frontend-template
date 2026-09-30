import { AxiosError, AxiosHeaders } from 'axios';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@/hooks/useSessionStore';
import { RoleCreatePage } from '@/screens/roles/create';
import { roleKeys } from '@/services/roles/queryKeys';
import { fetchPermissionCatalog } from '@/services/roles/roleDetailApi';
import { createRole } from '@/services/roles/roleFormApi';
import { makeRole, PERMISSION_CATALOG } from '@/tests/factories/role';
import {
  makeTestQueryClient,
  renderRoutes,
} from '@/tests/helpers/renderRoutes';
import type { IUser } from '@/types/user/types';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

vi.mock('@/services/roles/roleDetailApi', () => ({
  fetchPermissionCatalog: vi.fn(),
}));

// Mocka só o transporte da criação; a leitura dos `issues` é a real.
vi.mock('@/services/roles/roleFormApi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/roles/roleFormApi')>();
  return { ...actual, createRole: vi.fn() };
});

// Quem cria tem usuários e cargos, mas não a trilha de auditoria.
const AUTHOR_PERMISSIONS = [
  'backoffice.users.read',
  'backoffice.users.create',
  'backoffice.users.update',
  'backoffice.roles.read',
  'backoffice.roles.create',
  'backoffice.systemConfigs.read',
  'backoffice.systemConfigs.update',
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

let queryClient: ReturnType<typeof makeTestQueryClient>;

function renderCreate() {
  return renderRoutes({
    queryClient,
    initialUrl: '/roles/create',
    routes: [
      { path: '/roles', component: () => <p>Lista de cargos</p> },
      { path: '/roles/create', component: RoleCreatePage },
      {
        path: '/roles/$roleId',
        component: () => <p>Detalhe do cargo</p>,
        validateSearch: (search) => ({ tab: search.tab }),
      },
    ],
  });
}

function badRequest(data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(
    'Bad Request',
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    { data, status: 400, statusText: '', headers: {}, config }
  );
}

beforeEach(() => {
  queryClient = makeTestQueryClient();
  signIn(AUTHOR_PERMISSIONS);
  vi.mocked(fetchPermissionCatalog)
    .mockReset()
    .mockResolvedValue(PERMISSION_CATALOG);
  vi.mocked(createRole).mockReset();
  vi.mocked(toast.error).mockClear();
});

afterEach(() => {
  queryClient.clear();
  useSessionStore.setState({ user: null });
});

describe('RoleCreatePage — árvore de permissões', () => {
  it('mostra módulo, grupos e ações com os rótulos do servidor', async () => {
    renderCreate();

    expect(await screen.findByText('Backoffice')).toBeInTheDocument();
    for (const group of ['Usuários', 'Auditoria', 'Configurações']) {
      expect(screen.getByRole('group', { name: group })).toBeInTheDocument();
    }
    expect(
      screen.getByRole('checkbox', { name: 'Editar usuário' })
    ).not.toBeChecked();
    expect(screen.getByText('0 de 6')).toBeInTheDocument();
  });

  // Espelha a expansão do servidor: escrita inclui o `read` do grupo.
  it('marcar uma escrita marca e trava o read do grupo', async () => {
    const user = userEvent.setup();
    renderCreate();

    const read = await screen.findByRole('checkbox', {
      name: 'Visualizar usuários',
    });
    await user.click(screen.getByRole('checkbox', { name: 'Editar usuário' }));

    expect(read).toBeChecked();
    expect(read).toBeDisabled();
    expect(
      screen.getByText('Incluída pelas outras ações do grupo.')
    ).toBeInTheDocument();
    expect(screen.getByText('2 de 6')).toBeInTheDocument();

    // Sem escrita marcada, o read destrava e continua marcado.
    await user.click(screen.getByRole('checkbox', { name: 'Editar usuário' }));
    expect(read).toBeChecked();
    expect(read).toBeEnabled();
  });

  it('a permissão que quem cria não tem aparece desabilitada, com a explicação', async () => {
    renderCreate();

    const audit = await screen.findByRole('checkbox', {
      name: 'Visualizar trilha de auditoria',
    });
    expect(audit).toBeDisabled();
    expect(
      screen.getByText('Você não tem esta permissão.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Criar usuário' })
    ).toBeEnabled();
  });

  it('o catálogo que não carrega oferece tentar de novo', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchPermissionCatalog)
      .mockRejectedValueOnce(new Error('rede'))
      .mockResolvedValue(PERMISSION_CATALOG);
    renderCreate();

    await user.click(
      await screen.findByRole('button', { name: 'Tentar novamente' })
    );
    expect(await screen.findByText('Backoffice')).toBeInTheDocument();
  });
});

describe('RoleCreatePage — gravação', () => {
  it('cria com as permissões marcadas e abre o detalhe na aba "Usuários"', async () => {
    const user = userEvent.setup();
    const role = makeRole({ id: 'role-novo', name: 'Suporte' });
    vi.mocked(createRole).mockResolvedValue({ message: 'Cargo criado.', role });
    const { router } = renderCreate();

    await user.type(await screen.findByLabelText('Nome'), '  Suporte ');
    await user.type(screen.getByLabelText('Descrição'), 'Atende os clientes');
    await user.click(
      await screen.findByRole('checkbox', { name: 'Editar configurações' })
    );
    await user.click(screen.getByRole('button', { name: 'Criar cargo' }));

    await waitFor(() =>
      expect(createRole).toHaveBeenCalledWith({
        name: 'Suporte',
        description: 'Atende os clientes',
        permissionIds: ['p-configs-read', 'p-configs-update'],
      })
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/roles/role-novo')
    );
    expect(router.state.location.search).toEqual({ tab: 'users' });
    expect(queryClient.getQueryData(roleKeys.detail('role-novo'))).toEqual(
      role
    );
  });

  it('sem a leitura de usuários, abre o detalhe na aba padrão', async () => {
    const user = userEvent.setup();
    signIn(['backoffice.roles.read', 'backoffice.roles.create']);
    vi.mocked(fetchPermissionCatalog).mockResolvedValue({
      modules: [
        {
          module: 'backoffice',
          moduleLabel: 'Backoffice',
          groups: [
            {
              groupLabel: 'Cargos',
              permissions: [
                {
                  id: 'p-roles-read',
                  name: 'backoffice.roles.read',
                  action: 'read',
                  label: 'Visualizar cargos',
                },
              ],
            },
          ],
        },
      ],
    });
    vi.mocked(createRole).mockResolvedValue({
      message: 'Cargo criado.',
      role: makeRole({ id: 'role-novo' }),
    });
    const { router } = renderCreate();

    await user.type(await screen.findByLabelText('Nome'), 'Leitor');
    await user.click(
      await screen.findByRole('checkbox', { name: 'Visualizar cargos' })
    );
    await user.click(screen.getByRole('button', { name: 'Criar cargo' }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/roles/role-novo')
    );
    expect(router.state.location.search).toEqual({});
  });

  it('recusa antes de enviar: nome curto e nenhuma permissão', async () => {
    const user = userEvent.setup();
    renderCreate();

    await user.type(await screen.findByLabelText('Nome'), 'S');
    await user.click(screen.getByRole('button', { name: 'Criar cargo' }));

    expect(
      await screen.findByText('O nome precisa ter pelo menos 2 caracteres.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Selecione ao menos uma permissão para o cargo.')
    ).toBeInTheDocument();
    expect(createRole).not.toHaveBeenCalled();
  });

  it('o 400 com `issues` marca o campo, sem toast', async () => {
    const user = userEvent.setup();
    vi.mocked(createRole).mockRejectedValue(
      badRequest({
        message: 'name: O nome deve ter no máximo 120 caracteres.',
        issues: [
          {
            path: 'name',
            message: 'O nome deve ter no máximo 120 caracteres.',
          },
        ],
      })
    );
    renderCreate();

    await user.type(await screen.findByLabelText('Nome'), 'Suporte');
    await user.click(
      await screen.findByRole('checkbox', { name: 'Visualizar usuários' })
    );
    await user.click(screen.getByRole('button', { name: 'Criar cargo' }));

    expect(
      await screen.findByText('O nome deve ter no máximo 120 caracteres.')
    ).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('o 400 sem campo a marcar vira o toast do servidor, um só', async () => {
    const user = userEvent.setup();
    const message = 'Uma ou mais permissões informadas não existem.';
    vi.mocked(createRole).mockRejectedValue(badRequest({ message }));
    renderCreate();

    await user.type(await screen.findByLabelText('Nome'), 'Suporte');
    await user.click(
      await screen.findByRole('checkbox', { name: 'Visualizar usuários' })
    );
    await user.click(screen.getByRole('button', { name: 'Criar cargo' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(message, { id: 'errorToastId' })
    );
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it('"Cancelar" volta para a lista', async () => {
    const user = userEvent.setup();
    const { router } = renderCreate();

    await user.click(await screen.findByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/roles'));
  });
});
