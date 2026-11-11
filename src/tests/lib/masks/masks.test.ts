import { describe, expect, it } from 'vitest';

import { formatCep } from '@/lib/masks/cep';
import { formatCnpj, formatCpf, formatCpfOrCnpj } from '@/lib/masks/document';
import { onlyDigits } from '@/lib/masks/onlyDigits';
import { formatPhone } from '@/lib/masks/phone';

/**
 * As máscaras precisam funcionar PARCIAIS: elas rodam a cada tecla, não só no
 * valor completo. Uma que só formatasse o documento inteiro deixaria o campo sem
 * pontuação até o último dígito — e aí já não é máscara, é formatação.
 */

describe('formatCpf', () => {
  it('pontua conforme se digita', () => {
    expect(formatCpf('529')).toBe('529');
    expect(formatCpf('5299')).toBe('529.9');
    expect(formatCpf('529982')).toBe('529.982');
    expect(formatCpf('5299822')).toBe('529.982.2');
    expect(formatCpf('52998224725')).toBe('529.982.247-25');
  });

  it('descarta o que passa de onze dígitos', () => {
    // Colar um documento com lixo no fim não pode produzir um campo mais longo
    // que um CPF.
    expect(formatCpf('529982247259999')).toBe('529.982.247-25');
  });

  it('limpa o que não é dígito antes de pontuar', () => {
    expect(formatCpf('529.982.247-25')).toBe('529.982.247-25');
    expect(formatCpf('abc529')).toBe('529');
  });
});

describe('formatCnpj', () => {
  it('pontua conforme se digita', () => {
    expect(formatCnpj('11')).toBe('11');
    expect(formatCnpj('112')).toBe('11.2');
    expect(formatCnpj('11222333')).toBe('11.222.333');
    expect(formatCnpj('112223330001')).toBe('11.222.333/0001');
    expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('sete dígitos soltos ficam pontuados', () => {
    expect(formatCnpj('4141124')).toBe('41.411.24');
  });
});

describe('formatCpfOrCnpj', () => {
  it('decide pela quantidade de dígitos', () => {
    expect(formatCpfOrCnpj('52998224725')).toBe('529.982.247-25');
    expect(formatCpfOrCnpj('11222333000181')).toBe('11.222.333/0001-81');
  });
});

describe('formatCep', () => {
  it('pontua conforme se digita', () => {
    expect(formatCep('8890')).toBe('8890');
    expect(formatCep('889001')).toBe('88900-1');
    expect(formatCep('88900100')).toBe('88900-100');
  });
});

describe('formatPhone', () => {
  it('fixo e celular têm o traço em posições DIFERENTES', () => {
    // A posição só se decide no nono dígito: fixo tem oito depois do DDD,
    // celular tem nove. Fixar o traço antes disso erra um dos dois.
    expect(formatPhone('4833334444')).toBe('(48) 3333-4444');
    expect(formatPhone('48999998888')).toBe('(48) 99999-8888');
  });

  it('pontua conforme se digita', () => {
    expect(formatPhone('4')).toBe('4');
    expect(formatPhone('48')).toBe('48');
    expect(formatPhone('489')).toBe('(48) 9');
    // Com quatro dígitos depois do DDD o traço ainda NÃO entra: não há o que
    // separar, e um traço no fim pareceria número faltando.
    expect(formatPhone('489999')).toBe('(48) 9999');
    expect(formatPhone('4899999')).toBe('(48) 9999-9');
  });

  it('descarta o que passa de onze dígitos', () => {
    expect(formatPhone('489999988889999')).toBe('(48) 99999-8888');
  });
});

describe('onlyDigits', () => {
  it('é o que vai para o servidor', () => {
    // O que vai para a API é só dígito, sem a pontuação da máscara.
    expect(onlyDigits('529.982.247-25')).toBe('52998224725');
    expect(onlyDigits('(48) 99999-8888')).toBe('48999998888');
    expect(onlyDigits('')).toBe('');
  });
});
