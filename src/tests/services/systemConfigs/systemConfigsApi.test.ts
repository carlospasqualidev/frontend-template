import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { axiosApi } from '@/services/api/api';
import {
  fetchSystemConfigs,
  findSystemConfigIssues,
  systemConfigModuleLabel,
  updateSystemConfigs,
  type SystemConfig,
  type SystemConfigUpdateItem,
} from '@/services/systemConfigs/systemConfigsApi';
import {
  failWithNetworkError,
  respondWith,
} from '@/tests/helpers/axiosAdapter';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const defaultAdapter = axiosApi.defaults.adapter;

afterEach(() => {
  axiosApi.defaults.adapter = defaultAdapter;
  vi.clearAllMocks();
});

// Transporte sem rede: o adapter do `axiosApi` responde, e os interceptors e o
// `.parse` rodam como em produção. O adapter guarda o pedido para conferir
// caminho, corpo e o silêncio do toast.
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

function makeConfig(overrides: Partial<SystemConfig> = {}): SystemConfig {
  return {
    key: 'app.name',
    module: 'GENERAL',
    label: 'Nome da aplicação',
    description: 'Nome exibido na interface.',
    valueType: 'string',
    value: 'Meu Produto',
    ...overrides,
  };
}

const CONFIGS: SystemConfig[] = [
  makeConfig(),
  makeConfig({
    key: 'security.idleTimeoutMinutes',
    module: 'SECURITY',
    label: 'Tempo de inatividade até o logout (min)',
    valueType: 'int',
    value: '20',
  }),
];

const BATCH: SystemConfigUpdateItem[] = [
  { key: 'app.name', value: 'Produto' },
  { key: 'security.idleTimeoutMinutes', value: '999' },
];

/** O erro com que `updateSystemConfigs` rejeita a resposta dada. */
async function rejectionOf(status: number, data: unknown): Promise<unknown> {
  answerWith(status, data);
  return updateSystemConfigs(BATCH).then(
    () => {
      throw new Error('A gravação deveria ter sido recusada.');
    },
    (error: unknown) => error
  );
}

describe('systemConfigModuleLabel', () => {
  it('traduz cada módulo conhecido para o rótulo pt-BR', () => {
    expect(systemConfigModuleLabel('GENERAL')).toBe('Geral');
    expect(systemConfigModuleLabel('SECURITY')).toBe('Segurança');
    expect(systemConfigModuleLabel('NOTIFICATIONS')).toBe('Notificações');
  });

  it('cai em "Geral" para módulo desconhecido', () => {
    expect(systemConfigModuleLabel('OUTRO')).toBe('Geral');
  });
});

describe('fetchSystemConfigs', () => {
  it('lê `{ systemConfigs }` em GET /client/system-configs', async () => {
    const adapter = answerWith(200, { systemConfigs: CONFIGS });

    await expect(fetchSystemConfigs()).resolves.toEqual({
      systemConfigs: CONFIGS,
    });
    expect(requestOf(adapter)).toMatchObject({
      method: 'get',
      url: '/client/system-configs',
    });
  });

  it('recusa configuração com tipo fora do contrato', async () => {
    answerWith(200, {
      systemConfigs: [{ ...makeConfig(), valueType: 'date' }],
    });

    await expect(fetchSystemConfigs()).rejects.toThrow();
  });
});

describe('updateSystemConfigs', () => {
  it('grava o lote inteiro numa chamada PATCH e devolve a lista completa', async () => {
    const adapter = answerWith(200, {
      message: 'Configurações atualizadas.',
      systemConfigs: CONFIGS,
    });

    await expect(updateSystemConfigs(BATCH)).resolves.toEqual({
      message: 'Configurações atualizadas.',
      systemConfigs: CONFIGS,
    });
    expect(adapter).toHaveBeenCalledTimes(1);
    const request = requestOf(adapter);
    expect(request).toMatchObject({
      method: 'patch',
      url: '/client/system-configs',
    });
    expect(JSON.parse(String(request.data))).toEqual({ items: BATCH });
  });

  // O toast de sucesso é o `message` da resposta, pelo interceptor: um só.
  it('mostra o `message` da resposta como um único toast de sucesso', async () => {
    answerWith(200, {
      message: 'Configurações atualizadas.',
      systemConfigs: CONFIGS,
    });

    await updateSystemConfigs(BATCH);

    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith('Configurações atualizadas.');
  });

  // O 400 fica com a tela, que marca o campo ou mostra o `message`.
  it('rejeita o 400 sem toast', async () => {
    const error = await rejectionOf(400, {
      message:
        'Prazo para apagar a auditoria (meses): Informe um valor maior que o prazo para anonimizar.',
    });

    expect(error).toMatchObject({ response: { status: 400 } });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('mantém o toast do interceptor nas outras falhas', async () => {
    await rejectionOf(403, { message: 'Sem permissão.' });
    expect(toast.error).toHaveBeenCalledWith('Sem permissão.', {
      id: 'errorToastId',
    });

    axiosApi.defaults.adapter = failWithNetworkError();
    await expect(updateSystemConfigs(BATCH)).rejects.toMatchObject({
      code: 'ERR_NETWORK',
    });
    expect(toast.error).toHaveBeenLastCalledWith('Erro de comunicação', {
      id: 'errorToastId',
    });
  });
});

describe('findSystemConfigIssues', () => {
  // `items.<n>` é a posição no lote enviado: o item 1 do lote é a inatividade.
  it('traduz o item recusado do lote para a chave, com a mensagem do servidor', async () => {
    const error = await rejectionOf(400, {
      message:
        'items.1.value: Tempo de inatividade até o logout (min): Informe um valor de 1 a 480 minutos.',
      issues: [
        {
          path: 'items.1.value',
          message:
            'Tempo de inatividade até o logout (min): Informe um valor de 1 a 480 minutos.',
        },
      ],
    });

    expect(findSystemConfigIssues(error, BATCH)).toEqual([
      {
        key: 'security.idleTimeoutMinutes',
        message:
          'Tempo de inatividade até o logout (min): Informe um valor de 1 a 480 minutos.',
      },
    ]);
  });

  it('ignora recusa que não aponta item do lote', async () => {
    const error = await rejectionOf(400, {
      message: 'items: Informe ao menos uma configuração.',
      issues: [
        { path: 'items', message: 'Informe ao menos uma configuração.' },
      ],
    });

    expect(findSystemConfigIssues(error, BATCH)).toEqual([]);
  });

  it('ignora item fora do lote enviado', async () => {
    const error = await rejectionOf(400, {
      message: 'items.5.value: Valor inválido.',
      issues: [{ path: 'items.5.value', message: 'Valor inválido.' }],
    });

    expect(findSystemConfigIssues(error, BATCH)).toEqual([]);
  });

  it('não lê `issues` de outro status nem de erro que não é HTTP', async () => {
    const forbidden = await rejectionOf(403, {
      message: 'Sem permissão.',
      issues: [{ path: 'items.0.value', message: 'Sem permissão.' }],
    });

    expect(findSystemConfigIssues(forbidden, BATCH)).toEqual([]);
    expect(findSystemConfigIssues(new Error('bug'), BATCH)).toEqual([]);
  });
});
