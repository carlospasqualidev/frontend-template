import { describe, it, expect } from 'vitest';

import { formatCep } from '@/lib/masks/cep';

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
