import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchSystemConfigs,
  findMockSystemConfig,
  systemConfigModuleLabel,
  updateSystemConfigs,
  type SystemConfigUpdateItem,
} from '@/services/systemConfigs/systemConfigsApi';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Texto do servidor para a regra entre os prazos de retenção da auditoria.
const RETENTION_ORDER_MESSAGE =
  'Prazo para apagar a auditoria (meses): Informe um valor maior que o prazo para anonimizar.';

describe('systemConfigModuleLabel', () => {
  it('traduz cada módulo conhecido para o rótulo pt-BR', () => {
    expect(systemConfigModuleLabel('GENERAL')).toBe('Geral');
    expect(systemConfigModuleLabel('SECURITY')).toBe('Segurança');
    expect(systemConfigModuleLabel('NOTIFICATIONS')).toBe('Notificações');
  });

  it('cai em "Geral" para módulo desconhecido', () => {
    expect(systemConfigModuleLabel('WHATEVER')).toBe('Geral');
  });
});

describe('fetchSystemConfigs', () => {
  // Contrato do backend: `{ systemConfigs }`, item identificado pela `key`.
  it('devolve `{ systemConfigs }` com itens identificados pela `key`', async () => {
    const { systemConfigs } = await fetchSystemConfigs();

    expect(systemConfigs.length).toBeGreaterThan(0);
    expect(systemConfigs[0]).toEqual({
      key: expect.any(String),
      module: expect.any(String),
      label: expect.any(String),
      description: expect.any(String),
      valueType: expect.any(String),
      value: expect.any(String),
    });
    expect(systemConfigs[0]).not.toHaveProperty('id');
  });

  // Espelho do catálogo do servidor (`systemConfig.catalog.ts`): só as chaves
  // dele, na ordem dele, com textos e padrões literais.
  it('devolve exatamente o catálogo do servidor, na ordem, com os padrões', async () => {
    const { systemConfigs } = await fetchSystemConfigs();

    expect(systemConfigs).toEqual([
      {
        key: 'app.name',
        module: 'GENERAL',
        label: 'Nome da aplicação',
        description:
          'Nome exibido na interface e nas comunicações enviadas aos usuários.',
        valueType: 'string',
        value: 'Meu Produto',
      },
      {
        key: 'app.supportEmail',
        module: 'GENERAL',
        label: 'E-mail de suporte',
        description: 'Endereço que os usuários veem para pedir ajuda.',
        valueType: 'string',
        value: 'suporte@example.com',
      },
      {
        key: 'security.idleTimeoutMinutes',
        module: 'SECURITY',
        label: 'Tempo de inatividade até o logout (min)',
        description:
          'Minutos sem atividade até a sessão ser encerrada no navegador. Vale para os usuários sem um tempo próprio no cadastro.',
        valueType: 'int',
        value: '20',
      },
      {
        key: 'audit.anonymizeAfterMonths',
        module: 'SECURITY',
        label: 'Prazo para anonimizar a auditoria (meses)',
        description:
          'Meses até cada evento da auditoria perder o autor, o IP, o navegador e os dados pessoais registrados. O que foi feito continua no histórico.',
        valueType: 'int',
        value: '12',
      },
      {
        key: 'audit.deleteAfterMonths',
        module: 'SECURITY',
        label: 'Prazo para apagar a auditoria (meses)',
        description:
          'Meses até cada evento da auditoria ser apagado de vez. Precisa ser maior que o prazo para anonimizar.',
        valueType: 'int',
        value: '60',
      },
      {
        key: 'notifications.email',
        module: 'NOTIFICATIONS',
        label: 'Notificações por e-mail',
        description: 'Envia por e-mail os avisos do sistema.',
        valueType: 'boolean',
        value: 'true',
      },
    ]);
  });
});

// Lido pelo mock da auditoria para a frase e o tipo do `value`.
describe('findMockSystemConfig', () => {
  it('devolve o rótulo e o tipo da chave', () => {
    expect(findMockSystemConfig('notifications.email')).toEqual({
      label: 'Notificações por e-mail',
      valueType: 'boolean',
    });
    expect(findMockSystemConfig('audit.deleteAfterMonths')).toEqual({
      label: 'Prazo para apagar a auditoria (meses)',
      valueType: 'int',
    });
  });

  it('devolve undefined para chave fora do mock', () => {
    expect(findMockSystemConfig('app.inexistente')).toBeUndefined();
  });
});

describe('updateSystemConfigs', () => {
  let originals: SystemConfigUpdateItem[] = [];

  beforeEach(async () => {
    const { systemConfigs } = await fetchSystemConfigs();
    originals = systemConfigs.map(({ key, value }) => ({ key, value }));
    vi.mocked(toast.success).mockClear();
  });

  // Restaura o mock para não vazar estado entre testes.
  afterEach(async () => {
    await updateSystemConfigs(originals);
  });

  it('grava o lote inteiro numa chamada e devolve a lista completa', async () => {
    const response = await updateSystemConfigs([
      { key: 'app.name', value: 'Novo Nome' },
      { key: 'security.idleTimeoutMinutes', value: '30' },
    ]);

    expect(response.message).toBe('Configurações atualizadas.');
    expect(response.systemConfigs).toHaveLength(originals.length);
    expect(
      response.systemConfigs.find((config) => config.key === 'app.name')?.value
    ).toBe('Novo Nome');
    expect(
      response.systemConfigs.find(
        (config) => config.key === 'security.idleTimeoutMinutes'
      )?.value
    ).toBe('30');
  });

  it('persiste só as chaves do lote, sem tocar nas demais', async () => {
    await updateSystemConfigs([{ key: 'app.name', value: 'Outro Nome' }]);
    const { systemConfigs } = await fetchSystemConfigs();

    const untouched = systemConfigs.filter(
      (config) => config.key !== 'app.name'
    );
    expect(untouched.map(({ key, value }) => ({ key, value }))).toEqual(
      originals.filter((item) => item.key !== 'app.name')
    );
    expect(
      systemConfigs.find((config) => config.key === 'app.name')?.value
    ).toBe('Outro Nome');
  });

  // O `message` vira o toast de sucesso pelo mesmo caminho do interceptor do
  // `api` — uma vez por lote, não uma por item.
  it('exibe o `message` da resposta como um único toast de sucesso', async () => {
    await updateSystemConfigs([
      { key: 'app.name', value: 'Nome A' },
      { key: 'notifications.email', value: 'false' },
    ]);

    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith('Configurações atualizadas.');
  });

  // Como o servidor: chave fora do catálogo recusa o lote INTEIRO com 400.
  it('recusa o lote com chave desconhecida sem gravar nada', async () => {
    vi.mocked(toast.error).mockClear();

    await expect(
      updateSystemConfigs([
        { key: 'app.name', value: 'Não grava' },
        { key: 'app.inexistente', value: 'x' },
      ])
    ).rejects.toMatchObject({
      response: {
        status: 400,
        data: {
          message: 'items.1.key: Configuração desconhecida.',
          issues: [
            { path: 'items.1.key', message: 'Configuração desconhecida.' },
          ],
        },
      },
    });

    expect(toast.error).toHaveBeenCalledWith(
      'items.1.key: Configuração desconhecida.',
      { id: 'errorToastId' }
    );
    expect(toast.success).not.toHaveBeenCalled();
    const { systemConfigs } = await fetchSystemConfigs();
    expect(systemConfigs.map(({ key, value }) => ({ key, value }))).toEqual(
      originals
    );
  });

  // Regra entre chaves da retenção, com as duas no lote: recusa de validação,
  // apontando o item do prazo para apagar, como o schema do servidor.
  it('recusa o lote em que o prazo para apagar não é maior que o para anonimizar, apontando o item', async () => {
    vi.mocked(toast.error).mockClear();

    await expect(
      updateSystemConfigs([
        { key: 'app.name', value: 'Não grava' },
        { key: 'audit.anonymizeAfterMonths', value: '24' },
        { key: 'audit.deleteAfterMonths', value: '24' },
      ])
    ).rejects.toMatchObject({
      response: {
        status: 400,
        data: {
          message: `items.2.value: ${RETENTION_ORDER_MESSAGE}`,
          issues: [{ path: 'items.2.value', message: RETENTION_ORDER_MESSAGE }],
        },
      },
    });

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.success).not.toHaveBeenCalled();
    const { systemConfigs } = await fetchSystemConfigs();
    expect(systemConfigs.map(({ key, value }) => ({ key, value }))).toEqual(
      originals
    );
  });

  // Com uma chave só no lote, o servidor confere contra o gravado e responde
  // só com `message`, sem `issues`.
  it('confere a regra contra o valor já gravado quando o lote traz só uma das chaves', async () => {
    vi.mocked(toast.error).mockClear();

    // Gravado: anonimizar em 12 meses, apagar em 60. Igual não vale.
    const onlyDelete: unknown = await updateSystemConfigs([
      { key: 'audit.deleteAfterMonths', value: '12' },
    ]).catch((error: unknown) => error);
    expect(onlyDelete).toMatchObject({
      response: { status: 400, data: { message: RETENTION_ORDER_MESSAGE } },
    });
    expect(onlyDelete).not.toHaveProperty('response.data.issues');
    expect(toast.error).toHaveBeenCalledWith(RETENTION_ORDER_MESSAGE, {
      id: 'errorToastId',
    });

    await expect(
      updateSystemConfigs([{ key: 'audit.anonymizeAfterMonths', value: '60' }])
    ).rejects.toMatchObject({
      response: { status: 400, data: { message: RETENTION_ORDER_MESSAGE } },
    });

    const response = await updateSystemConfigs([
      { key: 'audit.anonymizeAfterMonths', value: '59' },
    ]);
    expect(
      response.systemConfigs.find(
        (config) => config.key === 'audit.anonymizeAfterMonths'
      )?.value
    ).toBe('59');
  });

  it('aceita os dois prazos juntos quando a exclusão fica depois da anonimização', async () => {
    const response = await updateSystemConfigs([
      { key: 'audit.anonymizeAfterMonths', value: '90' },
      { key: 'audit.deleteAfterMonths', value: '120' },
    ]);

    expect(
      response.systemConfigs
        .filter((config) => config.key.startsWith('audit.'))
        .map(({ key, value }) => ({ key, value }))
    ).toEqual([
      { key: 'audit.anonymizeAfterMonths', value: '90' },
      { key: 'audit.deleteAfterMonths', value: '120' },
    ]);
  });

  it('recusa prazo de retenção fora da faixa, com o rótulo na mensagem', async () => {
    await expect(
      updateSystemConfigs([{ key: 'audit.anonymizeAfterMonths', value: '0' }])
    ).rejects.toMatchObject({
      response: {
        status: 400,
        data: {
          message:
            'items.0.value: Prazo para anonimizar a auditoria (meses): Informe um valor de 1 a 120 meses.',
          issues: [
            {
              path: 'items.0.value',
              message:
                'Prazo para anonimizar a auditoria (meses): Informe um valor de 1 a 120 meses.',
            },
          ],
        },
      },
    });

    await expect(
      updateSystemConfigs([{ key: 'audit.deleteAfterMonths', value: '241' }])
    ).rejects.toMatchObject({
      response: {
        data: {
          issues: [
            {
              path: 'items.0.value',
              message:
                'Prazo para apagar a auditoria (meses): Informe um valor de 2 a 240 meses.',
            },
          ],
        },
      },
    });
  });

  it('recusa prazo de retenção que não é inteiro', async () => {
    await expect(
      updateSystemConfigs([
        { key: 'audit.anonymizeAfterMonths', value: '12' },
        { key: 'audit.deleteAfterMonths', value: '24.5' },
      ])
    ).rejects.toMatchObject({
      response: {
        status: 400,
        data: {
          issues: [
            {
              path: 'items.1.value',
              message:
                'Prazo para apagar a auditoria (meses): Informe um número inteiro.',
            },
          ],
        },
      },
    });
  });

  // Regras de cada chave, com as mensagens do catálogo do servidor.
  it('recusa valor fora da regra da chave, com o rótulo na mensagem, sem gravar nada', async () => {
    await expect(
      updateSystemConfigs([
        { key: 'app.name', value: '   ' },
        { key: 'app.supportEmail', value: 'nao-e-email' },
        { key: 'security.idleTimeoutMinutes', value: '481' },
        { key: 'notifications.email', value: 'sim' },
      ])
    ).rejects.toMatchObject({
      response: {
        status: 400,
        data: {
          message: 'items.0.value: Nome da aplicação: Informe o nome.',
          issues: [
            {
              path: 'items.0.value',
              message: 'Nome da aplicação: Informe o nome.',
            },
            {
              path: 'items.1.value',
              message:
                'E-mail de suporte: O e-mail deve possuir o formato email@example.com.',
            },
            {
              path: 'items.2.value',
              message:
                'Tempo de inatividade até o logout (min): Informe um valor de 1 a 480 minutos.',
            },
            {
              path: 'items.3.value',
              message: 'Notificações por e-mail: Use true ou false.',
            },
          ],
        },
      },
    });

    const { systemConfigs } = await fetchSystemConfigs();
    expect(systemConfigs.map(({ key, value }) => ({ key, value }))).toEqual(
      originals
    );
  });

  // Como o servidor, grava e devolve o valor normalizado.
  it('grava o valor normalizado pelo tipo e pela regra da chave', async () => {
    const response = await updateSystemConfigs([
      { key: 'app.name', value: '  Produto  ' },
      { key: 'app.supportEmail', value: ' Ajuda@Example.COM ' },
      { key: 'security.idleTimeoutMinutes', value: '030' },
    ]);

    expect(
      response.systemConfigs
        .slice(0, 3)
        .map(({ key, value }) => ({ key, value }))
    ).toEqual([
      { key: 'app.name', value: 'Produto' },
      { key: 'app.supportEmail', value: 'ajuda@example.com' },
      { key: 'security.idleTimeoutMinutes', value: '30' },
    ]);
  });

  it('recusa o lote vazio', async () => {
    vi.mocked(toast.error).mockClear();

    await expect(updateSystemConfigs([])).rejects.toMatchObject({
      response: {
        status: 400,
        data: {
          message: 'items: Informe ao menos uma configuração.',
          issues: [
            { path: 'items', message: 'Informe ao menos uma configuração.' },
          ],
        },
      },
    });

    expect(toast.error).toHaveBeenCalledWith(
      'items: Informe ao menos uma configuração.',
      { id: 'errorToastId' }
    );
    expect(toast.success).not.toHaveBeenCalled();
  });
});
