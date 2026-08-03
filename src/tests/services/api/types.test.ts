import { describe, expect, it } from 'vitest';

import {
  extractResponseMessage,
  hasResponseMessage,
} from '@/services/api/types';

describe('hasResponseMessage', () => {
  it('aceita objeto com `message: string`', () => {
    expect(hasResponseMessage({ message: 'Falha.' })).toBe(true);
  });

  it('rejeita objeto sem `message`', () => {
    expect(hasResponseMessage({ status: 500 })).toBe(false);
  });

  it('rejeita `message` não-string', () => {
    expect(hasResponseMessage({ message: 42 })).toBe(false);
    expect(hasResponseMessage({ message: null })).toBe(false);
  });

  it('rejeita null e primitivos', () => {
    expect(hasResponseMessage(null)).toBe(false);
    expect(hasResponseMessage(undefined)).toBe(false);
    expect(hasResponseMessage('mensagem direta')).toBe(false);
  });
});

describe('extractResponseMessage', () => {
  it('extrai do formato plano `{ message }`', () => {
    expect(extractResponseMessage({ message: 'Falha.' })).toBe('Falha.');
  });

  // Backend que padroniza a resposta envelopa o erro numa chave. Sem cobrir esse
  // formato, TODA falha assim cairia no toast genérico ("Erro 400").
  it('extrai do formato envelopado em uma chave', () => {
    expect(
      extractResponseMessage({
        ServerMessage: { message: 'E-mail ou senha incorretos.' },
      })
    ).toBe('E-mail ou senha incorretos.');

    expect(
      extractResponseMessage({ error: { message: 'Registro em uso.' } })
    ).toBe('Registro em uso.');
  });

  it('prefere a mensagem do nível plano à do envelope', () => {
    expect(
      extractResponseMessage({
        message: 'Plano',
        error: { message: 'Envelopado' },
      })
    ).toBe('Plano');
  });

  it('retorna null quando não há mensagem reconhecível', () => {
    expect(extractResponseMessage({ status: 500 })).toBeNull();
    expect(extractResponseMessage({ ServerMessage: {} })).toBeNull();
    expect(extractResponseMessage(null)).toBeNull();
    expect(extractResponseMessage('texto solto')).toBeNull();
  });
});
