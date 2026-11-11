import { describe, it, expect } from 'vitest';

import { formatCep, isValidCep } from '@/lib/masks/cep';

describe('formatCep', () => {
  it('mascara 8 dígitos como CEP', () => {
    expect(formatCep('01001000')).toBe('01001-000');
  });

  it('aplica máscara parcial quando incompleto', () => {
    expect(formatCep('010010')).toBe('01001-0');
  });

  it('mantém só os 5 primeiros dígitos sem separador', () => {
    expect(formatCep('01001')).toBe('01001');
  });

  it('ignora não numéricos e limita a 8 dígitos', () => {
    expect(formatCep('01001-000999')).toBe('01001-000');
  });
});

describe('isValidCep', () => {
  it('aceita oito dígitos, com ou sem pontuação', () => {
    expect(isValidCep('01001000')).toBe(true);
    expect(isValidCep('01001-000')).toBe(true);
  });

  it('recusa o incompleto e o excedente', () => {
    expect(isValidCep('')).toBe(false);
    expect(isValidCep('01001')).toBe(false);
    expect(isValidCep('010010000')).toBe(false);
  });
});
