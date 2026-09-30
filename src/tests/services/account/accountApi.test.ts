import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  changeAccountPassword,
  fetchAccountProfile,
  findPasswordFormIssues,
  findProfileFormIssues,
  updateAccountProfile,
} from '@/services/account/accountApi';
import { axiosApi } from '@/services/api/api';
import { respondWith } from '@/tests/helpers/axiosAdapter';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const defaultAdapter = axiosApi.defaults.adapter;

afterEach(() => {
  axiosApi.defaults.adapter = defaultAdapter;
  vi.clearAllMocks();
});

function answerWith(status: number, data: unknown) {
  const adapter = vi.fn(respondWith(status, data));
  axiosApi.defaults.adapter = adapter;
  return adapter;
}

function requestOf(adapter: ReturnType<typeof answerWith>) {
  const config = adapter.mock.lastCall?.[0];
  if (!config) throw new Error('Nenhuma chamada ao servidor.');
  return config;
}

async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('A chamada devia ter falhado.');
}

const PROFILE = {
  name: 'Camila Oliveira',
  email: 'camila@example.com',
  phone: '(48) 99999-0000',
  image: null,
  idleTimeoutMinutes: null,
};

const SESSION_USER = {
  id: '01a0f253-fc4e-745c-b069-dff39ba3116e',
  name: 'Camila Souza',
  email: 'camila@example.com',
  image: null,
  permissions: [],
  idleTimeoutMinutes: 20,
};

describe('fetchAccountProfile', () => {
  it('lê GET /client/users/me/profile, com o tempo próprio (null herda)', async () => {
    const adapter = answerWith(200, { profile: PROFILE });

    await expect(fetchAccountProfile()).resolves.toEqual(PROFILE);
    expect(requestOf(adapter)).toMatchObject({
      method: 'get',
      url: '/client/users/me/profile',
    });
  });

  it('recusa a resposta fora do contrato', async () => {
    answerWith(200, { profile: { ...PROFILE, idleTimeoutMinutes: '20' } });

    await expect(fetchAccountProfile()).rejects.toThrow();
  });
});

describe('updateAccountProfile', () => {
  it('manda PATCH /client/users/me só com o corpo pedido e devolve o usuário da sessão', async () => {
    const adapter = answerWith(200, {
      message: 'Perfil atualizado.',
      user: SESSION_USER,
    });

    await expect(
      updateAccountProfile({ name: 'Camila Souza' })
    ).resolves.toEqual({ message: 'Perfil atualizado.', user: SESSION_USER });
    expect(requestOf(adapter)).toMatchObject({
      method: 'patch',
      url: '/client/users/me',
    });
    expect(JSON.parse(String(requestOf(adapter).data))).toEqual({
      name: 'Camila Souza',
    });
    expect(toast.success).toHaveBeenCalledWith('Perfil atualizado.');
  });

  it('rejeita o 400 sem toast: o formulário marca o campo', async () => {
    answerWith(400, {
      message:
        'O tempo de inatividade pode ser de no máximo 20 minutos, o limite definido pela empresa.',
    });

    await expect(
      updateAccountProfile({ idleTimeoutMinutes: 30 })
    ).rejects.toBeDefined();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('mantém o toast das outras falhas', async () => {
    answerWith(403, { message: 'Conta bloqueada.' });

    await expect(updateAccountProfile({ name: 'Ana' })).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledWith('Conta bloqueada.', {
      id: 'errorToastId',
    });
  });
});

describe('changeAccountPassword', () => {
  const BODY = {
    currentPassword: 'senha-atual',
    password: 'senha-nova-1',
    confirmPassword: 'senha-nova-1',
  };

  it('manda PUT /client/users/me/password com os três campos', async () => {
    const adapter = answerWith(200, { message: 'Senha alterada.' });

    await changeAccountPassword(BODY);

    expect(requestOf(adapter)).toMatchObject({
      method: 'put',
      url: '/client/users/me/password',
    });
    expect(JSON.parse(String(requestOf(adapter).data))).toEqual(BODY);
    expect(toast.success).toHaveBeenCalledWith('Senha alterada.');
  });

  it('rejeita o 400 sem toast e mantém o toast do 409 e do 429', async () => {
    answerWith(400, { message: 'Senha atual incorreta.' });
    await expect(changeAccountPassword(BODY)).rejects.toBeDefined();
    expect(toast.error).not.toHaveBeenCalled();

    const conflict =
      'A senha foi alterada enquanto você fazia a troca. Tente novamente com a senha atual.';
    answerWith(409, { message: conflict });
    await expect(changeAccountPassword(BODY)).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledWith(conflict, { id: 'errorToastId' });

    const tooMany = 'Muitas tentativas. Aguarde um instante e tente novamente.';
    answerWith(429, { message: tooMany });
    await expect(changeAccountPassword(BODY)).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledWith(tooMany, { id: 'errorToastId' });
  });
});

describe('findProfileFormIssues', () => {
  it('traduz os `issues` para os campos do perfil, ignorando o que não é campo', async () => {
    answerWith(400, {
      message:
        'phone: O telefone deve possuir o formato (00) 0000-0000 ou (00) 90000-0000.',
      issues: [
        {
          path: 'phone',
          message:
            'O telefone deve possuir o formato (00) 0000-0000 ou (00) 90000-0000.',
        },
        { path: '', message: 'Chave inválida: "email"' },
      ],
    });
    const error = await rejectionOf(updateAccountProfile({ phone: '123' }));

    expect(findProfileFormIssues(error, { phone: '123' })).toEqual([
      {
        field: 'phone',
        message:
          'O telefone deve possuir o formato (00) 0000-0000 ou (00) 90000-0000.',
      },
    ]);
  });

  // O único 400 sem `issues` é o do limite da empresa, e só com o tempo enviado.
  it('sem `issues`, marca o tempo de inatividade quando ele foi enviado', async () => {
    const message =
      'O tempo de inatividade pode ser de no máximo 20 minutos, o limite definido pela empresa.';
    answerWith(400, { message });
    const error = await rejectionOf(
      updateAccountProfile({ idleTimeoutMinutes: 30 })
    );

    expect(findProfileFormIssues(error, { idleTimeoutMinutes: 30 })).toEqual([
      { field: 'idleTimeoutMinutes', message },
    ]);
    expect(findProfileFormIssues(error, { name: 'Ana' })).toEqual([]);
  });

  it('não marca nada quando o erro não é um 400', async () => {
    answerWith(503, { message: 'Serviço indisponível.' });
    const error = await rejectionOf(updateAccountProfile({ name: 'Ana' }));

    expect(findProfileFormIssues(error, { name: 'Ana' })).toEqual([]);
    expect(findProfileFormIssues(new Error('bug'), { name: 'Ana' })).toEqual(
      []
    );
  });
});

describe('findPasswordFormIssues', () => {
  const BODY = {
    currentPassword: 'x',
    password: 'curta',
    confirmPassword: 'curta',
  };

  it('traduz os `issues` para os campos da troca de senha', async () => {
    answerWith(400, {
      message: 'password: A senha precisa ter pelo menos 8 caracteres.',
      issues: [
        {
          path: 'password',
          message: 'A senha precisa ter pelo menos 8 caracteres.',
        },
      ],
    });
    const error = await rejectionOf(changeAccountPassword(BODY));

    expect(findPasswordFormIssues(error)).toEqual([
      {
        field: 'password',
        message: 'A senha precisa ter pelo menos 8 caracteres.',
      },
    ]);
  });

  it('sem `issues` (senha atual errada), marca a senha atual', async () => {
    answerWith(400, { message: 'Senha atual incorreta.' });
    const error = await rejectionOf(changeAccountPassword(BODY));

    expect(findPasswordFormIssues(error)).toEqual([
      { field: 'currentPassword', message: 'Senha atual incorreta.' },
    ]);
  });
});
