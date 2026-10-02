/*
 * Trava de host dos E2E, sem dependência do Playwright: o Vitest a testa em
 * `src/tests/e2e/apiHost/apiHost.test.ts`, e o `globalSetup` a chama (pelo
 * `assertLocalServerApiUrl` de `serverApi.ts`) antes de qualquer requisição.
 */

/** Hosts em que os E2E podem criar e excluir dado: só a máquina local. */
const LOCAL_API_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

const WEB_PROTOCOLS = new Set(['http:', 'https:']);

/** A URL lida, ou `undefined` quando não é uma URL http(s) com host. */
function parseApiUrl(apiUrl: string): URL | undefined {
  try {
    const url = new URL(apiUrl);
    return WEB_PROTOCOLS.has(url.protocol) && url.hostname !== ''
      ? url
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Recusa a URL de API cujo host não seja `localhost`, `127.0.0.1` ou `::1`
 * (entre colchetes, como a URL exige). Sem flag de escape. A mensagem mostra
 * só protocolo, host e porta: usuário e senha de uma URL nunca vão para o log.
 */
export function assertLocalApiUrl(apiUrl: string): void {
  const url = parseApiUrl(apiUrl);

  if (url !== undefined && LOCAL_API_HOSTS.has(url.hostname)) {
    return;
  }

  const reason =
    url === undefined
      ? 'não é uma URL http(s) válida com host'
      : `aponta para ${url.protocol}//${url.host}`;

  throw new Error(
    `Os E2E só rodam contra um server local: a VITE_API_URL ${reason}, e a suíte cria e exclui dado pela API. Use um host local (localhost, 127.0.0.1 ou [::1]), como o padrão http://localhost:8080/api. Nenhuma requisição foi feita.`
  );
}
