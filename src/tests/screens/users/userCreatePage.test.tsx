import { AxiosError, AxiosHeaders } from 'axios';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UserCreatePage } from '@/screens/users/create';
import { createUser } from '@/services/users/userFormApi';
import { makeCompanyUser } from '@/tests/factories/companyUser';
import {
  makeTestQueryClient,
  renderRoutes,
} from '@/tests/helpers/renderRoutes';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

// Mocka só o transporte da criação; a leitura dos `issues` é a real.
vi.mock('@/services/users/userFormApi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/users/userFormApi')>();
  return { ...actual, createUser: vi.fn() };
});

let queryClient: ReturnType<typeof makeTestQueryClient>;

function renderCreate() {
  return renderRoutes({
    queryClient,
    initialUrl: '/users/create',
    routes: [
      { path: '/users', component: () => <p>Lista de usuários</p> },
      { path: '/users/create', component: UserCreatePage },
      {
        path: '/users/$userId',
        component: () => <p>Detalhe do usuário</p>,
        validateSearch: (search) => ({ tab: search.tab }),
      },
    ],
  });
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText('Nome'), 'Bruno Lima');
  await user.type(screen.getByLabelText('E-mail'), 'bruno@example.com');
  await user.type(screen.getByLabelText('Senha'), 'senha-segura');
  await user.type(
    screen.getByLabelText('Confirmação da senha'),
    'senha-segura'
  );
}

function badRequest(data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(
    'Bad Request',
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    {
      data,
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config,
    }
  );
}

beforeEach(() => {
  queryClient = makeTestQueryClient();
  vi.mocked(createUser).mockReset();
  vi.mocked(toast.error).mockClear();
});

afterEach(() => {
  queryClient.clear();
});

describe('UserCreatePage — formulário', () => {
  it('só mostra "Criar usuário" depois de preencher algo', async () => {
    const user = userEvent.setup();
    renderCreate();

    await screen.findByLabelText('Nome');
    expect(
      screen.queryByRole('button', { name: 'Criar usuário' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Cancelar' })
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText('Nome'), 'B');
    expect(
      await screen.findByRole('button', { name: 'Criar usuário' })
    ).toBeInTheDocument();
  });

  // As regras de formato são as do servidor, com as mesmas mensagens.
  it('recusa antes de enviar o que o servidor recusaria', async () => {
    const user = userEvent.setup();
    renderCreate();

    await user.type(await screen.findByLabelText('Nome'), 'B');
    await user.type(screen.getByLabelText('E-mail'), 'bruno');
    await user.type(screen.getByLabelText('Telefone'), '123');
    await user.type(screen.getByLabelText('Senha'), 'curta');
    await user.type(screen.getByLabelText('Confirmação da senha'), 'outra');
    await user.click(screen.getByRole('button', { name: 'Criar usuário' }));

    expect(
      await screen.findByText('O nome precisa ter pelo menos 2 caracteres.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('O e-mail deve possuir o formato email@example.com.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'O telefone deve possuir o formato (00) 0000-0000 ou (00) 90000-0000.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('A senha precisa ter pelo menos 8 caracteres.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('As senhas precisam ser iguais.')
    ).toBeInTheDocument();
    expect(createUser).not.toHaveBeenCalled();
  });

  it('recusa tempo de inatividade fora de 1 a 480 minutos', async () => {
    const user = userEvent.setup();
    renderCreate();

    await fillValidForm(user);
    await user.type(screen.getByLabelText('Tempo de inatividade (min)'), '481');
    await user.click(screen.getByRole('button', { name: 'Criar usuário' }));

    expect(
      await screen.findByText(
        'Informe um tempo de inatividade inteiro de 1 a 480 minutos.'
      )
    ).toBeInTheDocument();
    expect(createUser).not.toHaveBeenCalled();
  });
});

describe('UserCreatePage — gravação', () => {
  it('cria e abre o detalhe do usuário novo na aba "Cargos"', async () => {
    const user = userEvent.setup();
    const created = makeCompanyUser({
      id: 'u-novo',
      name: 'Bruno Lima',
      roles: [],
    });
    vi.mocked(createUser).mockResolvedValue({
      message: 'Usuário criado.',
      user: created,
    });
    const { router } = renderCreate();

    await fillValidForm(user);
    await user.type(screen.getByLabelText('Telefone'), '(48) 99999-9999');
    await user.type(screen.getByLabelText('Tempo de inatividade (min)'), '30');
    await user.click(screen.getByRole('button', { name: 'Criar usuário' }));

    await waitFor(() => expect(createUser).toHaveBeenCalledTimes(1));
    expect(vi.mocked(createUser).mock.lastCall?.[0]).toEqual({
      name: 'Bruno Lima',
      email: 'bruno@example.com',
      password: 'senha-segura',
      confirmPassword: 'senha-segura',
      phone: '(48) 99999-9999',
      image: null,
      idleTimeoutMinutes: 30,
    });
    // Criado, o digitado está gravado: abrir o detalhe não pergunta.
    expect(await screen.findByText('Detalhe do usuário')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/users/u-novo');
    expect(router.state.location.search).toEqual({ tab: 'roles' });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  // Vazio é "sem telefone" e "herda o tempo da empresa": `null` no corpo.
  it('manda telefone e tempo vazios como null', async () => {
    const user = userEvent.setup();
    vi.mocked(createUser).mockResolvedValue({
      message: 'Usuário criado.',
      user: makeCompanyUser({ id: 'u-novo' }),
    });
    renderCreate();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Criar usuário' }));

    await waitFor(() => expect(createUser).toHaveBeenCalledTimes(1));
    expect(vi.mocked(createUser).mock.lastCall?.[0]).toMatchObject({
      phone: null,
      idleTimeoutMinutes: null,
    });
  });

  it('marca o campo que o servidor recusou, sem toast', async () => {
    const user = userEvent.setup();
    const message = 'A imagem deve ser uma URL https válida.';
    vi.mocked(createUser).mockRejectedValue(
      badRequest({
        message: `image: ${message}`,
        issues: [{ path: 'image', message }],
      })
    );
    renderCreate();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Criar usuário' }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('sem campo a marcar, mostra o `message` do servidor no toast', async () => {
    const user = userEvent.setup();
    const message = 'Chave inválida: "bio"';
    vi.mocked(createUser).mockRejectedValue(
      badRequest({ message, issues: [{ path: '', message }] })
    );
    renderCreate();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Criar usuário' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(message, { id: 'errorToastId' })
    );
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it('"Cancelar" volta para a lista', async () => {
    const user = userEvent.setup();
    const { router } = renderCreate();

    await user.click(await screen.findByRole('button', { name: 'Cancelar' }));

    expect(await screen.findByText('Lista de usuários')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/users');
  });

  // "Cancelar" é o descartar da criação: volta sem perguntar.
  it('"Cancelar" com algo preenchido volta para a lista sem perguntar', async () => {
    const user = userEvent.setup();
    const { router } = renderCreate();

    await user.type(await screen.findByLabelText('Nome'), 'Bruno');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(await screen.findByText('Lista de usuários')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/users');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});

// Sair da tela por outro caminho (o menu, o voltar do navegador) com o
// formulário preenchido pergunta antes, pelo guard global.
describe('UserCreatePage — edição não salva', () => {
  it('com algo preenchido, sair pergunta; "Continuar editando" fica com o digitado', async () => {
    const user = userEvent.setup();
    const { router } = renderCreate();

    await user.type(await screen.findByLabelText('Nome'), 'Bruno');
    await act(async () => {
      void router.navigate({ to: '/users' });
    });

    const dialog = await screen.findByRole('alertdialog', {
      name: 'Descartar as alterações?',
    });
    await user.click(
      within(dialog).getByRole('button', { name: 'Continuar editando' })
    );

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    );
    expect(router.state.location.pathname).toBe('/users/create');
    expect(screen.getByLabelText('Nome')).toHaveValue('Bruno');
  });

  it('"Descartar alterações" sai sem criar', async () => {
    const user = userEvent.setup();
    const { router } = renderCreate();

    await user.type(await screen.findByLabelText('Nome'), 'Bruno');
    await act(async () => {
      void router.navigate({ to: '/users' });
    });
    const dialog = await screen.findByRole('alertdialog');
    await user.click(
      within(dialog).getByRole('button', { name: 'Descartar alterações' })
    );

    expect(await screen.findByText('Lista de usuários')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/users');
    expect(createUser).not.toHaveBeenCalled();
  });

  it('sem nada preenchido, sai sem perguntar', async () => {
    const { router } = renderCreate();

    await screen.findByLabelText('Nome');
    await act(async () => {
      void router.navigate({ to: '/users' });
    });

    expect(await screen.findByText('Lista de usuários')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
