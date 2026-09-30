import { AxiosError, AxiosHeaders } from 'axios';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { axiosApi } from '@/services/api/api';
import {
  createUser,
  deleteUser,
  findUserFormIssues,
  setUserActive,
  updateUser,
  type CreateUserBody,
} from '@/services/users/userFormApi';
import { respondWith } from '@/tests/helpers/axiosAdapter';
import { makeCompanyUser } from '@/tests/factories/companyUser';

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

const CREATE_BODY: CreateUserBody = {
  name: 'Bruno Lima',
  email: 'bruno@example.com',
  password: 'senha-segura',
  confirmPassword: 'senha-segura',
  phone: null,
  image: null,
  idleTimeoutMinutes: null,
};

describe('createUser', () => {
  it('manda POST /client/users e o toast de sucesso é o `message` do servidor', async () => {
    const user = makeCompanyUser({ roles: [] });
    const adapter = answerWith(201, { message: 'Usuário criado.', user });

    await expect(createUser(CREATE_BODY)).resolves.toEqual({
      message: 'Usuário criado.',
      user,
    });
    expect(requestOf(adapter)).toMatchObject({
      method: 'post',
      url: '/client/users',
    });
    expect(JSON.parse(String(requestOf(adapter).data))).toEqual(CREATE_BODY);
    expect(toast.success).toHaveBeenCalledWith('Usuário criado.');
  });

  // O `message` do 400 abre com o caminho técnico: o formulário marca o campo.
  it('rejeita o 400 de validação sem toast', async () => {
    answerWith(400, {
      message: 'email: O e-mail deve possuir o formato email@example.com.',
      issues: [
        {
          path: 'email',
          message: 'O e-mail deve possuir o formato email@example.com.',
        },
      ],
    });

    await expect(createUser(CREATE_BODY)).rejects.toBeDefined();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('mantém o toast do 409 (e-mail já cadastrado)', async () => {
    answerWith(409, { message: 'E-mail já cadastrado.' });

    await expect(createUser(CREATE_BODY)).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledWith('E-mail já cadastrado.', {
      id: 'errorToastId',
    });
  });
});

describe('updateUser', () => {
  it('manda PATCH /client/users/:userId só com os campos pedidos', async () => {
    const user = makeCompanyUser({ phone: '48999999999' });
    const adapter = answerWith(200, { message: 'Usuário atualizado.', user });

    await updateUser(user.id, { phone: '48999999999' });

    expect(requestOf(adapter)).toMatchObject({
      method: 'patch',
      url: `/client/users/${user.id}`,
    });
    expect(JSON.parse(String(requestOf(adapter).data))).toEqual({
      phone: '48999999999',
    });
  });

  it('rejeita o 400 de validação sem toast', async () => {
    answerWith(400, {
      message: 'name: O nome precisa ter pelo menos 2 caracteres.',
      issues: [
        {
          path: 'name',
          message: 'O nome precisa ter pelo menos 2 caracteres.',
        },
      ],
    });

    await expect(updateUser('u-1', { name: 'A' })).rejects.toBeDefined();
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe('setUserActive', () => {
  it('bloqueia com PATCH só com `isActive`', async () => {
    const user = makeCompanyUser({ isActive: false });
    const adapter = answerWith(200, { message: 'Usuário atualizado.', user });

    await setUserActive(user.id, false);

    expect(JSON.parse(String(requestOf(adapter).data))).toEqual({
      isActive: false,
    });
  });

  // A regra é do servidor: a recusa é o toast dele.
  it('mostra no toast a recusa do último administrador', async () => {
    const message =
      'Não é possível bloquear o último administrador ativo da empresa.';
    answerWith(400, { message });

    await expect(setUserActive('u-1', false)).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledWith(message, { id: 'errorToastId' });
  });
});

describe('deleteUser', () => {
  it('manda DELETE /client/users/:userId', async () => {
    const adapter = answerWith(200, { message: 'Usuário excluído.' });

    await deleteUser('u-1');

    expect(requestOf(adapter)).toMatchObject({
      method: 'delete',
      url: '/client/users/u-1',
    });
    expect(toast.success).toHaveBeenCalledWith('Usuário excluído.');
  });

  it('mostra no toast a recusa de excluir o próprio usuário', async () => {
    answerWith(400, { message: 'Você não pode excluir o próprio usuário.' });

    await expect(deleteUser('u-1')).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledWith(
      'Você não pode excluir o próprio usuário.',
      { id: 'errorToastId' }
    );
  });
});

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

describe('findUserFormIssues', () => {
  it('devolve os `issues` que apontam um campo do formulário', () => {
    const error = badRequest({
      message:
        'phone: O telefone deve possuir o formato (00) 0000-0000 ou (00) 90000-0000.',
      issues: [
        {
          path: 'phone',
          message:
            'O telefone deve possuir o formato (00) 0000-0000 ou (00) 90000-0000.',
        },
        { path: '', message: 'Chave inválida: "bio"' },
      ],
    });

    expect(findUserFormIssues(error)).toEqual([
      {
        field: 'phone',
        message:
          'O telefone deve possuir o formato (00) 0000-0000 ou (00) 90000-0000.',
      },
    ]);
  });

  it('lista vazia sem `issues` e para falha que não é HTTP', () => {
    expect(
      findUserFormIssues(
        badRequest({
          message:
            'Não é possível bloquear o último administrador ativo da empresa.',
        })
      )
    ).toEqual([]);
    expect(findUserFormIssues(new Error('bug'))).toEqual([]);
  });
});
