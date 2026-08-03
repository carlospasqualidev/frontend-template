import { describe, expect, it } from 'vitest';

import {
  fetchSystemConfigs,
  systemConfigModuleLabel,
  updateSystemConfig,
} from '@/services/systemConfigs/systemConfigsApi';

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
  it('retorna as configurações validadas pelo schema', async () => {
    const configs = await fetchSystemConfigs();
    expect(configs.length).toBeGreaterThan(0);
    // O shape passou pelo `.parse` do Zod — os campos essenciais existem.
    expect(configs[0]).toMatchObject({
      id: expect.any(String),
      key: expect.any(String),
      label: expect.any(String),
      value: expect.any(String),
    });
  });
});

describe('updateSystemConfig', () => {
  it('persiste o novo valor em memória e reflete no próximo fetch', async () => {
    const before = await fetchSystemConfigs();
    const target = before.find((config) => config.id === 'cfg_app_name');
    if (!target) throw new Error('Fixture inválida: cfg_app_name ausente.');
    const original = target.value;

    try {
      await updateSystemConfig('cfg_app_name', 'Novo Nome');
      const after = await fetchSystemConfigs();
      expect(after.find((config) => config.id === 'cfg_app_name')?.value).toBe(
        'Novo Nome'
      );
    } finally {
      // Restaura o mock para não vazar estado entre testes.
      await updateSystemConfig('cfg_app_name', original);
    }
  });
});
