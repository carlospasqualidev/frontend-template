import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchSystemConfigs,
  systemConfigModuleLabel,
  updateSystemConfigs,
  type SystemConfigUpdateItem,
} from '@/services/systemConfigs/systemConfigsApi';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('systemConfigModuleLabel', () => {
  it('traduz cada módulo conhecido para o rótulo pt-BR', () => {
    expect(systemConfigModuleLabel('GENERAL')).toBe('Geral');
    expect(systemConfigModuleLabel('SECURITY')).toBe('Segurança');
    expect(systemConfigModuleLabel('NOTIFICATIONS')).toBe('Notificações');
    expect(systemConfigModuleLabel('INTEGRATIONS')).toBe('Integrações');
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

  it('inclui o tempo de inatividade com a chave e o padrão do backend', async () => {
    const { systemConfigs } = await fetchSystemConfigs();

    expect(
      systemConfigs.find(
        (config) => config.key === 'security.idleTimeoutMinutes'
      )
    ).toMatchObject({ module: 'SECURITY', valueType: 'int', value: '20' });
    expect(
      systemConfigs.some((config) => config.key === 'security.sessionTimeout')
    ).toBe(false);
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
