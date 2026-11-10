import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadEnv() {
  vi.resetModules();
  const { env } = await import('@/lib/env');
  return env;
}

describe('env — VITE_BUSINESS_TIME_ZONE', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('vazio vira o padrão America/Sao_Paulo', async () => {
    vi.stubEnv('VITE_BUSINESS_TIME_ZONE', '');

    expect((await loadEnv()).VITE_BUSINESS_TIME_ZONE).toBe('America/Sao_Paulo');
  });

  it('ausente vira o padrão America/Sao_Paulo', async () => {
    vi.stubEnv('VITE_BUSINESS_TIME_ZONE', undefined);

    expect((await loadEnv()).VITE_BUSINESS_TIME_ZONE).toBe('America/Sao_Paulo');
  });

  it('aceita outro fuso IANA', async () => {
    vi.stubEnv('VITE_BUSINESS_TIME_ZONE', 'Asia/Tokyo');

    expect((await loadEnv()).VITE_BUSINESS_TIME_ZONE).toBe('Asia/Tokyo');
  });

  it('fuso inválido derruba o boot', async () => {
    vi.stubEnv('VITE_BUSINESS_TIME_ZONE', 'Marte/Olympus');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(loadEnv()).rejects.toThrow('Variáveis de ambiente inválidas');
  });
});
