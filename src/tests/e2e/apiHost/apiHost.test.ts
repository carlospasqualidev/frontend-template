import { describe, expect, it } from 'vitest';

// Fora de `src/`, o alias `@/` não alcança: o helper dos E2E vem pelo caminho
// relativo. Ele não depende do Playwright, então roda aqui sem navegador.
import { assertLocalApiUrl } from '../../../../e2e/helpers/apiHost';

function readError(apiUrl: string): string {
  try {
    assertLocalApiUrl(apiUrl);
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error(`a URL ${apiUrl} foi aceita`);
}

describe('assertLocalApiUrl (trava de host dos E2E)', () => {
  it.each([
    'http://localhost:8080/api',
    'http://LOCALHOST:8080/api',
    'http://[::1]:8080/api',
    'http://127.0.0.1:8080/api',
    'https://localhost/api',
  ])('aceita o host local de %s', (apiUrl) => {
    expect(() => assertLocalApiUrl(apiUrl)).not.toThrow();
  });

  it.each([
    'http://localhost.evil.com/api',
    'http://localhost@evil.com/api',
    'http://127.0.0.1.nip.io/api',
    'https://api.homologacao.example.com/api',
  ])('recusa o host remoto de %s', (apiUrl) => {
    expect(readError(apiUrl)).toContain(
      'Os E2E só rodam contra um server local'
    );
  });

  it.each([
    'localhost:8080/api',
    '127.0.0.1:8080/api',
    'http://::1:8080/api',
    '',
    'ftp://localhost/api',
  ])('recusa %j, que não é uma URL http(s) com host', (apiUrl) => {
    expect(readError(apiUrl)).toContain(
      'não é uma URL http(s) válida com host'
    );
  });

  it('mostra só protocolo, host e porta, sem usuário, senha nem caminho', () => {
    const message = readError(
      'https://deploy:s3cr3t@api.evil.com:8443/api?token=abc'
    );

    expect(message).toContain('https://api.evil.com:8443');
    expect(message).not.toContain('deploy');
    expect(message).not.toContain('s3cr3t');
    expect(message).not.toContain('token=abc');
  });

  it('não ecoa a URL inválida, que pode trazer credencial', () => {
    const message = readError('deploy:s3cr3t@api.evil.com');

    expect(message).not.toContain('deploy');
    expect(message).not.toContain('s3cr3t');
  });
});
