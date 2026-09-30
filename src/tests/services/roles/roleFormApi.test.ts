import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { axiosApi } from '@/services/api/api';
import {
  copyRole,
  createRole,
  deleteRole,
  findRoleFormIssues,
  updateRole,
} from '@/services/roles/roleFormApi';
import { respondWith } from '@/tests/helpers/axiosAdapter';
import { makeRole } from '@/tests/factories/role';

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

const BODY = {
  name: 'Suporte',
  description: null,
  permissionIds: ['p-users-read', 'p-users-update'],
};

describe('createRole', () => {
  it('cria em POST /client/roles, com o toast do servidor', async () => {
    const role = makeRole();
    const adapter = answerWith(201, { message: 'Cargo criado.', role });

    await expect(createRole(BODY)).resolves.toEqual({
      message: 'Cargo criado.',
      role,
    });
    expect(requestOf(adapter)).toMatchObject({
      method: 'post',
      url: '/client/roles',
    });
    expect(JSON.parse(String(requestOf(adapter).data))).toEqual(BODY);
    expect(toast.success).toHaveBeenCalledWith('Cargo criado.');
  });

  // O `message` do 400 abre com o caminho técnico: o formulário marca o campo.
  it('o 400 de validação volta sem toast, com os `issues`', async () => {
    answerWith(400, {
      message: 'name: O nome precisa ter pelo menos 2 caracteres.',
      issues: [
        {
          path: 'name',
          message: 'O nome precisa ter pelo menos 2 caracteres.',
        },
      ],
    });

    const error = await createRole(BODY).catch((reason: unknown) => reason);
    expect(toast.error).not.toHaveBeenCalled();
    expect(findRoleFormIssues(error)).toEqual([
      { field: 'name', message: 'O nome precisa ter pelo menos 2 caracteres.' },
    ]);
  });

  it.each([
    [409, 'Já existe um cargo com este nome.'],
    [403, 'Você não pode conceder permissões que não possui.'],
  ])('o %i mostra o toast do servidor', async (status, message) => {
    answerWith(status, { message });

    await expect(createRole(BODY)).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledWith(message, { id: 'errorToastId' });
  });
});

describe('updateRole', () => {
  it('substitui o cargo em PUT /client/roles/:roleId', async () => {
    const role = makeRole({ id: 'role-1' });
    const adapter = answerWith(200, { message: 'Cargo atualizado.', role });

    await updateRole('role-1', BODY);
    expect(requestOf(adapter)).toMatchObject({
      method: 'put',
      url: '/client/roles/role-1',
    });
    expect(JSON.parse(String(requestOf(adapter).data))).toEqual(BODY);
    expect(toast.success).toHaveBeenCalledWith('Cargo atualizado.');
  });

  it('o 400 de validação também volta sem toast', async () => {
    answerWith(400, {
      message: 'permissionIds: Selecione ao menos uma permissão para o cargo.',
      issues: [
        {
          path: 'permissionIds',
          message: 'Selecione ao menos uma permissão para o cargo.',
        },
      ],
    });

    await expect(updateRole('role-1', BODY)).rejects.toBeDefined();
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe('copyRole', () => {
  it('copia em POST /client/roles/:roleId/copy, sem corpo', async () => {
    const role = makeRole({ id: 'role-2', name: 'Suporte (cópia)' });
    const adapter = answerWith(201, { message: 'Cargo copiado.', role });

    await expect(copyRole('role-1')).resolves.toMatchObject({ role });
    expect(requestOf(adapter)).toMatchObject({
      method: 'post',
      url: '/client/roles/role-1/copy',
    });
    expect(toast.success).toHaveBeenCalledWith('Cargo copiado.');
  });
});

describe('deleteRole', () => {
  it('exclui em DELETE /client/roles/:roleId', async () => {
    const adapter = answerWith(200, { message: 'Cargo excluído.' });

    await deleteRole('role-1');
    expect(requestOf(adapter)).toMatchObject({
      method: 'delete',
      url: '/client/roles/role-1',
    });
    expect(toast.success).toHaveBeenCalledWith('Cargo excluído.');
  });

  it('a recusa do cargo com usuários vinculados é o toast do servidor', async () => {
    const message =
      'Este cargo está vinculado a 1 usuário. Desvincule-os antes de excluir.';
    answerWith(400, { message });

    await expect(deleteRole('role-1')).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledWith(message, { id: 'errorToastId' });
  });
});

describe('findRoleFormIssues', () => {
  it('traduz o `path` do contrato para o campo do formulário', async () => {
    answerWith(400, {
      message: 'Falha de validação.',
      issues: [
        { path: 'description', message: 'Descrição longa.' },
        { path: 'permissionIds.3', message: 'Id inválido.' },
        { path: 'outra', message: 'Ignorada.' },
      ],
    });

    const error = await createRole(BODY).catch((reason: unknown) => reason);
    expect(findRoleFormIssues(error)).toEqual([
      { field: 'description', message: 'Descrição longa.' },
      { field: 'permissionIds', message: 'Id inválido.' },
    ]);
  });

  it('erro que não é HTTP não aponta campo', () => {
    expect(findRoleFormIssues(new Error('bug'))).toEqual([]);
  });
});
