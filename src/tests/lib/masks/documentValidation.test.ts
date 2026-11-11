import { describe, expect, it } from 'vitest';

import { isValidCnpj, isValidCpf } from '@/lib/masks/documentValidation';

/** Comprimento, dígito verificador e dígitos repetidos (que a conta sozinha aprovaria). */

describe('isValidCpf', () => {
  it('aceita um CPF correto, com e sem pontuação', () => {
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpf('529.982.247-25')).toBe(true);
  });

  it('recusa o incompleto', () => {
    expect(isValidCpf('5299822')).toBe(false);
    expect(isValidCpf('')).toBe(false);
  });

  it('recusa o dígito verificador errado', () => {
    expect(isValidCpf('52998224726')).toBe(false);
  });

  /**
   * `111.111.111-11` e os outros dez passam no módulo 11 por coincidência
   * aritmética, e são a forma mais comum de documento inventado.
   */
  it('recusa os dígitos todos iguais, que a conta sozinha aprovaria', () => {
    expect(isValidCpf('11111111111')).toBe(false);
    expect(isValidCpf('00000000000')).toBe(false);
  });
});

describe('isValidCnpj', () => {
  it('aceita um CNPJ correto, com e sem pontuação', () => {
    expect(isValidCnpj('11222333000181')).toBe(true);
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
  });

  it('recusa o incompleto — foi assim que o defeito apareceu', () => {
    expect(isValidCnpj('11222')).toBe(false);
    expect(isValidCnpj('')).toBe(false);
  });

  it('recusa o dígito verificador errado', () => {
    expect(isValidCnpj('11222333000199')).toBe(false);
  });

  it('recusa os dígitos todos iguais', () => {
    expect(isValidCnpj('11111111111111')).toBe(false);
  });
});
