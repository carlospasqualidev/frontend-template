import { describe, it, expect } from 'vitest';

import { formatCpf, formatCnpj, formatCpfOrCnpj } from '@/lib/masks/document';

describe('formatCpf', () => {
  it('mascara 11 dígitos como CPF', () => {
    expect(formatCpf('12345678909')).toBe('123.456.789-09');
  });

  it('aplica máscara parcial quando incompleto', () => {
    expect(formatCpf('123456')).toBe('123.456');
  });

  it('ignora caracteres não numéricos e limita a 11 dígitos', () => {
    expect(formatCpf('123.456.789-09999')).toBe('123.456.789-09');
  });
});

describe('formatCnpj', () => {
  it('mascara 14 dígitos como CNPJ', () => {
    expect(formatCnpj('12345678000199')).toBe('12.345.678/0001-99');
  });

  it('aplica máscara parcial quando incompleto', () => {
    expect(formatCnpj('123456')).toBe('12.345.6');
  });
});

describe('formatCpfOrCnpj', () => {
  it('trata até 11 dígitos como CPF', () => {
    expect(formatCpfOrCnpj('12345678909')).toBe('123.456.789-09');
  });

  it('trata acima de 11 dígitos como CNPJ', () => {
    expect(formatCpfOrCnpj('12345678000199')).toBe('12.345.678/0001-99');
  });

  it('entrada vazia devolve vazio (campo não preenchido)', () => {
    expect(formatCpfOrCnpj('')).toBe('');
  });
});
