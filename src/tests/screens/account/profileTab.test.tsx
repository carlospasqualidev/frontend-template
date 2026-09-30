import { AxiosError, AxiosHeaders } from 'axios';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@/hooks/useSessionStore';
import { AccountPage } from '@/screens/account';
import {
  fetchAccountProfile,
  updateAccountProfile,
  type AccountProfile,
} from '@/services/account/accountApi';
import { uploadFile } from '@/services/api/upload';
import { roleKeys } from '@/services/roles/queryKeys';
import { userKeys } from '@/services/users/queryKeys';
import {
  makeTestQueryClient,
  renderRoutes,
} from '@/tests/helpers/renderRoutes';
import type { IUser } from '@/types/user/types';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

// Mocka só o transporte; a leitura dos `issues` é a real.
vi.mock('@/services/account/accountApi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/account/accountApi')>();
  return {
    ...actual,
    fetchAccountProfile: vi.fn(),
    updateAccountProfile: vi.fn(),
  };
});

vi.mock('@/services/api/upload', () => ({ uploadFile: vi.fn() }));

const SESSION_USER: IUser = {
  id: '01a0f253-fc4e-745c-b069-dff39ba3116e',
  name: 'Camila Oliveira',
  email: 'camila@example.com',
  image: null,
  permissions: [],
  idleTimeoutMinutes: 20,
};

const PROFILE: AccountProfile = {
  name: 'Camila Oliveira',
  email: 'camila@example.com',
  phone: null,
  image: null,
  idleTimeoutMinutes: null,
};

let queryClient: ReturnType<typeof makeTestQueryClient>;

function renderAccount(search = '') {
  return renderRoutes({
    queryClient,
    initialUrl: `/account${search}`,
    routes: [
      {
        path: '/account',
        component: AccountPage,
        validateSearch: (value) => ({ tab: value.tab }),
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

function saveButton() {
  return screen.getByRole('button', { name: 'Salvar alterações' });
}

beforeEach(() => {
  queryClient = makeTestQueryClient();
  useSessionStore.setState({ user: SESSION_USER });
  vi.mocked(fetchAccountProfile).mockReset().mockResolvedValue(PROFILE);
  vi.mocked(updateAccountProfile).mockReset();
  vi.mocked(uploadFile).mockReset();
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
});

afterEach(() => {
  queryClient.clear();
  useSessionStore.setState({ user: null });
});

describe('Minha conta — Perfil: leitura', () => {
  it('pré-preenche pelo perfil gravado, com o e-mail só para leitura', async () => {
    vi.mocked(fetchAccountProfile).mockResolvedValue({
      ...PROFILE,
      phone: '(48) 99999-0000',
      idleTimeoutMinutes: 15,
    });
    renderAccount();

    expect(await screen.findByLabelText('Nome')).toHaveValue('Camila Oliveira');
    expect(screen.getByLabelText('E-mail')).toHaveValue('camila@example.com');
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Telefone')).toHaveValue('(48) 99999-0000');
    // O tempo PRÓPRIO do perfil, não o resolvido da sessão (20).
    expect(screen.getByLabelText('Tempo de inatividade (min)')).toHaveValue(
      '15'
    );
    // Sem mudança, nada no topo; o campo "Bio" saiu (o servidor não tem).
    expect(
      screen.queryByRole('button', { name: 'Salvar alterações' })
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Bio')).not.toBeInTheDocument();
  });

  it('tempo herdado da empresa (null) fica vazio', async () => {
    renderAccount();

    expect(
      await screen.findByLabelText('Tempo de inatividade (min)')
    ).toHaveValue('');
  });

  it('mostra o skeleton enquanto o perfil carrega', async () => {
    vi.mocked(fetchAccountProfile).mockReturnValue(new Promise(() => {}));
    const { router } = renderAccount();

    await waitFor(() => expect(router.state.status).toBe('idle'));
    expect(await screen.findByText('Identificação')).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument();
  });

  it('na falha da leitura, oferece tentar de novo', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchAccountProfile).mockRejectedValueOnce(new Error('rede'));
    renderAccount();

    await user.click(
      await screen.findByRole('button', { name: 'Tentar novamente' })
    );

    expect(await screen.findByLabelText('Nome')).toHaveValue('Camila Oliveira');
  });
});

describe('Minha conta — Perfil: salvar', () => {
  it('manda só os campos alterados e troca o usuário da sessão pelo da resposta', async () => {
    const user = userEvent.setup();
    vi.mocked(updateAccountProfile).mockResolvedValue({
      message: 'Perfil atualizado.',
      user: { ...SESSION_USER, name: 'Camila Souza' },
    });
    renderAccount();

    const name = await screen.findByLabelText('Nome');
    await user.clear(name);
    await user.type(name, '  Camila Souza ');
    await user.type(screen.getByLabelText('Telefone'), '(48) 98888-0000');
    await user.click(saveButton());

    await waitFor(() =>
      expect(updateAccountProfile).toHaveBeenCalledWith({
        name: 'Camila Souza',
        phone: '(48) 98888-0000',
      })
    );
    await waitFor(() =>
      expect(useSessionStore.getState().user?.name).toBe('Camila Souza')
    );
    // Gravado: o formulário parte do perfil novo e o "Salvar" some.
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Salvar alterações' })
      ).not.toBeInTheDocument()
    );
    expect(screen.getByLabelText('Nome')).toHaveValue('Camila Souza');
    // O toast é o do servidor (interceptor), não um da tela.
    expect(toast.success).not.toHaveBeenCalled();
  });

  // O próprio nome e a foto aparecem na aba "Usuários" dos cargos da pessoa.
  it('salvar relê os usuários da gestão e dos cargos', async () => {
    const user = userEvent.setup();
    vi.mocked(updateAccountProfile).mockResolvedValue({
      message: 'Perfil atualizado.',
      user: { ...SESSION_USER, name: 'Camila Souza' },
    });
    const members = roleKeys.members('r-auditoria');
    const users = userKeys.detail(SESSION_USER.id);
    queryClient.setQueryData(members, { users: [], count: 0 });
    queryClient.setQueryData(users, { user: null });
    renderAccount();

    const name = await screen.findByLabelText('Nome');
    await user.clear(name);
    await user.type(name, 'Camila Souza');
    await user.click(saveButton());

    await waitFor(() =>
      expect(queryClient.getQueryState(members)?.isInvalidated).toBe(true)
    );
    expect(queryClient.getQueryState(users)?.isInvalidated).toBe(true);
  });

  // O administrador pode ter gravado um tempo acima do limite da empresa: ele
  // não pode voltar ao servidor sem a pessoa mexer nele.
  it('não reenvia o tempo de inatividade que a pessoa não alterou', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchAccountProfile).mockResolvedValue({
      ...PROFILE,
      idleTimeoutMinutes: 240,
    });
    vi.mocked(updateAccountProfile).mockResolvedValue({
      message: 'Perfil atualizado.',
      user: { ...SESSION_USER, idleTimeoutMinutes: 240 },
    });
    renderAccount();

    await user.type(await screen.findByLabelText('Telefone'), '(48) 3333-4444');
    await user.click(saveButton());

    await waitFor(() =>
      expect(updateAccountProfile).toHaveBeenCalledWith({
        phone: '(48) 3333-4444',
      })
    );
  });

  it('esvaziar o tempo volta a herdar o da empresa (null)', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchAccountProfile).mockResolvedValue({
      ...PROFILE,
      idleTimeoutMinutes: 10,
    });
    vi.mocked(updateAccountProfile).mockResolvedValue({
      message: 'Perfil atualizado.',
      user: SESSION_USER,
    });
    renderAccount();

    await user.clear(
      await screen.findByLabelText('Tempo de inatividade (min)')
    );
    await user.click(saveButton());

    await waitFor(() =>
      expect(updateAccountProfile).toHaveBeenCalledWith({
        idleTimeoutMinutes: null,
      })
    );
  });

  it('"Descartar" volta ao perfil gravado', async () => {
    const user = userEvent.setup();
    renderAccount();

    const name = await screen.findByLabelText('Nome');
    await user.clear(name);
    await user.type(name, 'Outro nome');
    await user.click(screen.getByRole('button', { name: 'Descartar' }));

    expect(screen.getByLabelText('Nome')).toHaveValue('Camila Oliveira');
    expect(
      screen.queryByRole('button', { name: 'Salvar alterações' })
    ).not.toBeInTheDocument();
  });

  it('recusa antes de enviar o que o servidor recusaria', async () => {
    const user = userEvent.setup();
    renderAccount();

    await user.type(await screen.findByLabelText('Telefone'), '123');
    await user.click(saveButton());

    expect(
      await screen.findByText(
        'O telefone deve possuir o formato (00) 0000-0000 ou (00) 90000-0000.'
      )
    ).toBeInTheDocument();
    expect(updateAccountProfile).not.toHaveBeenCalled();
  });
});

describe('Minha conta — Perfil: recusas do servidor', () => {
  it('o 400 com `issues` marca o campo, sem toast', async () => {
    const user = userEvent.setup();
    vi.mocked(updateAccountProfile).mockRejectedValue(
      badRequest({
        message: 'name: O nome precisa ter pelo menos 2 caracteres.',
        issues: [
          {
            path: 'name',
            message: 'O nome precisa ter pelo menos 2 caracteres.',
          },
        ],
      })
    );
    renderAccount();

    const name = await screen.findByLabelText('Nome');
    await user.clear(name);
    await user.type(name, 'Camila S.');
    await user.click(saveButton());

    expect(
      await screen.findByText('O nome precisa ter pelo menos 2 caracteres.')
    ).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  // O único 400 sem `issues`: o tempo acima do limite da empresa.
  it('o tempo acima do limite da empresa marca o campo com a mensagem do servidor', async () => {
    const user = userEvent.setup();
    const message =
      'O tempo de inatividade pode ser de no máximo 20 minutos, o limite definido pela empresa.';
    vi.mocked(updateAccountProfile).mockRejectedValue(badRequest({ message }));
    renderAccount();

    await user.type(
      await screen.findByLabelText('Tempo de inatividade (min)'),
      '30'
    );
    await user.click(saveButton());

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByLabelText('Tempo de inatividade (min)')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(toast.error).not.toHaveBeenCalled();
    // A alteração continua pendente.
    expect(saveButton()).toBeInTheDocument();
  });

  it('o 400 sem campo a marcar vira o toast do servidor', async () => {
    const user = userEvent.setup();
    vi.mocked(updateAccountProfile).mockRejectedValue(
      badRequest({ message: 'Chave inválida: "email"' })
    );
    renderAccount();

    await user.type(await screen.findByLabelText('Telefone'), '48999990000');
    await user.click(saveButton());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Chave inválida: "email"', {
        id: 'errorToastId',
      })
    );
  });

  it('a resposta fora do contrato relê o perfil e avisa sem detalhe técnico', async () => {
    const user = userEvent.setup();
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    vi.mocked(updateAccountProfile).mockRejectedValue(new Error('ZodError'));
    renderAccount();

    await user.type(await screen.findByLabelText('Telefone'), '48999990000');
    vi.mocked(fetchAccountProfile).mockResolvedValue({
      ...PROFILE,
      phone: '48999990000',
    });
    await user.click(saveButton());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Não foi possível concluir agora. Tente novamente em instantes.',
        { id: 'errorToastId' }
      )
    );
    expect(consoleError).toHaveBeenCalled();
    // Relido o que o servidor gravou, não sobra alteração pendente.
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Salvar alterações' })
      ).not.toBeInTheDocument()
    );
    expect(fetchAccountProfile).toHaveBeenCalledTimes(2);
    consoleError.mockRestore();
  });
});

describe('Minha conta — Perfil: foto', () => {
  function fileInput(): HTMLInputElement {
    const input =
      document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error('Campo de arquivo ausente.');
    return input;
  }

  it('sobe a foto e manda a URL no `image` ao salvar', async () => {
    const user = userEvent.setup();
    const url = 'https://bucket.example.com/uploads/foto.png';
    vi.mocked(uploadFile).mockResolvedValue(url);
    vi.mocked(updateAccountProfile).mockResolvedValue({
      message: 'Perfil atualizado.',
      user: { ...SESSION_USER, image: url },
    });
    renderAccount();

    await screen.findByLabelText('Nome');
    await user.upload(
      fileInput(),
      new File(['x'], 'foto.png', { type: 'image/png' })
    );
    await user.click(
      await screen.findByRole('button', { name: 'Salvar alterações' })
    );

    await waitFor(() =>
      expect(updateAccountProfile).toHaveBeenCalledWith({ image: url })
    );
    await waitFor(() =>
      expect(useSessionStore.getState().user?.image).toBe(url)
    );
  });

  it('remover a foto manda `image: null`', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchAccountProfile).mockResolvedValue({
      ...PROFILE,
      image: 'https://bucket.example.com/uploads/antiga.png',
    });
    vi.mocked(updateAccountProfile).mockResolvedValue({
      message: 'Perfil atualizado.',
      user: SESSION_USER,
    });
    renderAccount();

    await user.click(
      await screen.findByRole('button', { name: 'Remover imagem Sua foto' })
    );
    await user.click(saveButton());

    await waitFor(() =>
      expect(updateAccountProfile).toHaveBeenCalledWith({ image: null })
    );
  });

  // O servidor só grava foto `https:`; um upload que devolva outra coisa não
  // chega a ser enviado.
  it('recusa a URL de foto que não é https', async () => {
    const user = userEvent.setup();
    vi.mocked(uploadFile).mockResolvedValue(
      'http://bucket.example.com/uploads/foto.png'
    );
    renderAccount();

    await screen.findByLabelText('Nome');
    await user.upload(
      fileInput(),
      new File(['x'], 'foto.png', { type: 'image/png' })
    );
    await user.click(
      await screen.findByRole('button', { name: 'Salvar alterações' })
    );

    expect(
      await screen.findByText('A imagem deve ser uma URL https válida.')
    ).toBeInTheDocument();
    expect(updateAccountProfile).not.toHaveBeenCalled();
  });
});
