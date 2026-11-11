import { describe, expect, it } from 'vitest';

import { isValidPhone, formatPhone, normalizePhone } from '@/lib/masks/phone';

/**
 * O prefixo sai antes do corte. É a mesma função na exibição e na gravação:
 * se uma limpasse o `+55` e a outra não, o campo mostraria um número e o
 * servidor receberia outro.
 */
describe('normalizePhone', () => {
  it('tira o código do país do formato internacional', () => {
    expect(normalizePhone('+55 48 99999-9999')).toBe('48999999999');
    expect(normalizePhone('+55 (48) 3333-4444')).toBe('4833334444');
    expect(normalizePhone('5548999999999')).toBe('48999999999');
  });

  it('tira o zero de discagem e a operadora', () => {
    expect(normalizePhone('0 48 99999-9999')).toBe('48999999999');
    expect(normalizePhone('0 21 48 99999-9999')).toBe('48999999999');
    expect(normalizePhone('0 21 48 3333-4444')).toBe('4833334444');
    expect(normalizePhone('+55 0 48 99999-9999')).toBe('48999999999');
  });

  it('com onze dígitos ou menos não remove nada: 55 também é DDD', () => {
    // Santa Maria (RS) tem DDD 55 — tirar o "55" aqui apagaria o DDD.
    expect(normalizePhone('55 99999-9999')).toBe('55999999999');
    expect(normalizePhone('(55) 3333-4444')).toBe('5533334444');
    expect(normalizePhone('4899')).toBe('4899');
    expect(normalizePhone('')).toBe('');
  });

  it('sem prefixo reconhecível, descarta o que passa de onze do fim', () => {
    expect(normalizePhone('489999988889999')).toBe('48999998888');
  });

  it('o DDD 55 também sai certo no formato internacional', () => {
    expect(normalizePhone('+55 55 99999-9999')).toBe('55999999999');
  });
});

describe('formatPhone com prefixo', () => {
  it('mostra o número sem o código do país', () => {
    expect(formatPhone('+55 48 99999-9999')).toBe('(48) 99999-9999');
    expect(formatPhone('+55 (48) 3333-4444')).toBe('(48) 3333-4444');
  });
});

describe('isValidPhone', () => {
  it('aceita fixo e celular com DDD', () => {
    expect(isValidPhone('4833334444')).toBe(true);
    expect(isValidPhone('48999999999')).toBe(true);
    expect(isValidPhone('(48) 99999-9999')).toBe(true);
  });

  it('recusa o incompleto e o que passa de onze', () => {
    expect(isValidPhone('')).toBe(false);
    expect(isValidPhone('999999999')).toBe(false);
    expect(isValidPhone('489999999999')).toBe(false);
  });
});
