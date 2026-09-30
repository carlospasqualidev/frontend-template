import { fileURLToPath } from 'node:url';

/*
 * Sessões abertas UMA vez pelo `e2e/globalSetup.ts` e reaproveitadas pelos
 * specs pelo `storageState` do Playwright (`test.use({ storageState })`, ou
 * `browser.newContext({ storageState })` numa segunda página), sem gastar o
 * limite de login do server. Os arquivos guardam o cookie HTTP-only da sessão,
 * ficam em `playwright/.auth/` (fora do git, no `.gitignore`) e são regravados
 * a cada execução.
 */
function authFile(name: string): string {
  return fileURLToPath(
    new URL(`../../playwright/.auth/${name}.json`, import.meta.url)
  );
}

/** O admin do seed: todas as permissões. Também a do preparo por API. */
export const ADMIN_STORAGE_STATE = authFile('admin');

/**
 * O gestor: uma pessoa criada pelo `globalSetup`, sem cargo, e excluída no
 * fim da suíte. Cada spec que entra com ela dá, no `beforeAll`, o cargo com as
 * permissões de que precisa (as permissões são relidas do banco a cada
 * requisição) e o tira no `afterAll`. Os dados dela: `readManager()`.
 */
export const MANAGER_STORAGE_STATE = authFile('manager');
