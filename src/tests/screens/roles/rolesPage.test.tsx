import { AxiosError, AxiosHeaders } from 'axios';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { validateDataTableSearch } from '@/components/global/dataTable/dataTableSearch';
import { useSessionStore } from '@/hooks/useSessionStore';
import { RolesPage } from '@/screens/roles/list';
import { roleKeys } from '@/services/roles/queryKeys';
import { copyRole, deleteRole } from '@/services/roles/roleFormApi';
import { fetchRoles } from '@/services/roles/roleListApi';
import { makeRole, makeRoleListItem } from '@/tests/factories/role';
import {
  makeTestQueryClient,
  renderRoutes,
} from '@/tests/helpers/renderRoutes';
import type { IUser } from '@/types/user/types';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

// Mocka só o transporte; a montagem dos parâmetros é a real.
vi.mock('@/services/roles/roleListApi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/roles/roleListApi')>();
  return { ...actual, fetchRoles: vi.fn() };
});

vi.mock('@/services/roles/roleFormApi', () => ({
  copyRole: vi.fn(),
  deleteRole: vi.fn(),
}));

const ALL_PERMISSIONS = [
  'backoffice.roles.read',
  'backoffice.roles.create',
  'backoffice.roles.update',
  'backoffice.roles.delete',
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

const ADMIN = makeRoleListItem({
  id: 'role-admin',
  name: 'Administrador',
  description: 'Acesso total a todas as permissões da empresa.',
  isSystem: true,
  permissionsCount: 11,
  usersCount: 1,
});

const SUPORTE = makeRoleListItem({
  id: 'role-suporte',
  name: 'Suporte',
  description: null,
  permissionsCount: 1,
  usersCount: 3,
});

let queryClient: ReturnType<typeof makeTestQueryClient>;

function renderList(url = '/roles') {
  return renderRoutes({
    queryClient,
    initialUrl: url,
    routes: [
      {
        path: '/roles',
        component: RolesPage,
        validateSearch: validateDataTableSearch,
      },
      { path: '/roles/create', component: () => <p>Novo cargo</p> },
      { path: '/roles/$roleId', component: () => <p>Detalhe do cargo</p> },
    ],
  });
}

// A linha clicável tem papel de link (abre o detalhe): acha pelo nome.
function rowOf(name: string): HTMLElement {
  const row = screen.getByText(name).closest('tr');
  if (!row) throw new Error(`Sem a linha de ${name}.`);
  return row;
}

async function chooseRowAction(name: string, action: string) {
  const user = userEvent.setup();
  await user.click(
    within(rowOf(name)).getByRole('button', { name: 'Abrir menu' })
  );
  await user.click(await screen.findByRole('menuitem', { name: action }));
}

function refused(status: number, message: string): AxiosError {
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

beforeEach(() => {
  queryClient = makeTestQueryClient();
  signIn(ALL_PERMISSIONS);
  vi.mocked(fetchRoles)
    .mockReset()
    .mockResolvedValue({ roles: [ADMIN, SUPORTE], count: 2 });
  vi.mocked(copyRole).mockReset();
  vi.mocked(deleteRole).mockReset();
});

afterEach(() => {
  queryClient.clear();
  useSessionStore.setState({ user: null });
});

describe('RolesPage — listagem', () => {
  it('lista os cargos do servidor com as contagens e o de sistema marcado', async () => {
    renderList();

    expect(await screen.findByText('Suporte')).toBeInTheDocument();
    const suporte = rowOf('Suporte');
    expect(suporte).toHaveTextContent('1 permissão');
    expect(suporte).toHaveTextContent('3 usuários');
    expect(suporte).toHaveTextContent('Sem descrição');

    const admin = rowOf('Administrador');
    expect(admin).toHaveTextContent('Sistema');
    expect(admin).toHaveTextContent('11 permissões');
    // O `Administrador` não é copiado nem excluído: sem menu.
    expect(
      within(admin).queryByRole('button', { name: 'Abrir menu' })
    ).not.toBeInTheDocument();

    expect(fetchRoles).toHaveBeenCalledWith({
      page: 0,
      pageSize: 25,
      search: undefined,
    });
    expect(screen.getByRole('link', { name: 'Novo cargo' })).toHaveAttribute(
      'href',
      '/roles/create'
    );
  });

  it('a busca da URL vai ao servidor', async () => {
    renderList(
      `/roles?filters=${encodeURIComponent(JSON.stringify({ search: 'sup' }))}`
    );

    await screen.findByText('Suporte');
    expect(fetchRoles).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'sup' })
    );
  });

  it('ordena por nome e por criação no servidor, pelo cabeçalho', async () => {
    const user = userEvent.setup();
    renderList();

    await screen.findByText('Suporte');
    await user.click(screen.getByRole('button', { name: 'Criado em' }));

    await waitFor(() =>
      expect(fetchRoles).toHaveBeenLastCalledWith(
        expect.objectContaining({ orderBy: 'createdAt', order: 'asc' })
      )
    );
  });

  it('a linha abre o detalhe', async () => {
    const user = userEvent.setup();
    const { router } = renderList();

    await user.click(await screen.findByText('Suporte'));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/roles/role-suporte')
    );
  });

  it('sem criar nem excluir: sem "Novo cargo" e sem a coluna do menu', async () => {
    signIn(['backoffice.roles.read']);
    renderList();

    await screen.findByText('Suporte');
    expect(
      screen.queryByRole('link', { name: 'Novo cargo' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Abrir menu' })
    ).not.toBeInTheDocument();
  });

  it('com só a de excluir, o menu tem só "Excluir"', async () => {
    const user = userEvent.setup();
    signIn(['backoffice.roles.read', 'backoffice.roles.delete']);
    renderList();

    await screen.findByText('Suporte');
    await user.click(
      within(rowOf('Suporte')).getByRole('button', { name: 'Abrir menu' })
    );
    expect(
      await screen.findByRole('menuitem', { name: 'Excluir' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Copiar' })
    ).not.toBeInTheDocument();
  });
});

describe('RolesPage — ações', () => {
  it('copia e abre a cópia', async () => {
    const copy = makeRole({ id: 'role-copia', name: 'Suporte (cópia)' });
    vi.mocked(copyRole).mockResolvedValue({
      message: 'Cargo copiado.',
      role: copy,
    });
    const { router } = renderList();

    await screen.findByText('Suporte');
    await chooseRowAction('Suporte', 'Copiar');

    expect(copyRole).toHaveBeenCalledWith('role-suporte');
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/roles/role-copia')
    );
    expect(queryClient.getQueryData(roleKeys.detail('role-copia'))).toEqual(
      copy
    );
  });

  it('exclui com confirmação e relê a lista', async () => {
    const user = userEvent.setup();
    vi.mocked(deleteRole).mockResolvedValue();
    renderList();

    await screen.findByText('Suporte');
    await chooseRowAction('Suporte', 'Excluir');
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('Excluir cargo?');
    await user.click(within(dialog).getByRole('button', { name: 'Excluir' }));

    await waitFor(() =>
      expect(deleteRole).toHaveBeenCalledWith('role-suporte')
    );
    await waitFor(() => expect(fetchRoles).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    );
  });

  // O cargo com usuários vinculados: a recusa é o toast do servidor (do
  // interceptor) e a confirmação fica aberta.
  it('a recusa da exclusão deixa a confirmação aberta', async () => {
    const user = userEvent.setup();
    vi.mocked(deleteRole).mockRejectedValue(
      refused(
        400,
        'Este cargo está vinculado a 3 usuários. Desvincule-os antes de excluir.'
      )
    );
    renderList();

    await screen.findByText('Suporte');
    await chooseRowAction('Suporte', 'Excluir');
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(deleteRole).toHaveBeenCalled());
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(fetchRoles).toHaveBeenCalledTimes(1);
  });
});
