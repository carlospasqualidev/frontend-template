import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { request, type APIRequestContext } from '@playwright/test';

import { SERVER_API_URL } from './serverApi';

/*
 * O Vite dos E2E: porta própria (4173 por padrão, que está no `CORS_ORIGINS`
 * padrão do server e não disputa a 5173 do `npm run dev`). Outra porta:
 * `E2E_PORT=<porta>` aqui e a origem `http://localhost:<porta>` no
 * `CORS_ORIGINS` do server.
 */
export const FRONTEND_PORT = Number(process.env.E2E_PORT ?? 4173);
export const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;

const ENV_MODULE_PATH = '/src/lib/env.ts';

const JAVASCRIPT_CONTENT_TYPE = /^(?:text|application)\/javascript\b/i;

// `import.meta.env` do módulo, como o Vite de desenvolvimento o injeta.
const SERVED_API_URL = /"VITE_API_URL":\s*"([^"]*)"/;

function occupiedPortError(detail: string): Error {
  return new Error(
    `A porta ${FRONTEND_PORT} dos E2E serve ${detail}. Pare o que está nela ou rode com E2E_PORT=<porta livre> (e a origem no CORS_ORIGINS do server).`
  );
}

/*
 * O `index.html` desta pasta pelo `/@fs/` do Vite, que entrega o arquivo cru e
 * só de dentro da raiz do próprio projeto (o Vite de outro projeto responde
 * 403). Servidor com fallback de SPA (o `vite preview`, que usa a mesma 4173,
 * ou outro app) responde 200 com o index dele: por isso o conteúdo precisa ser
 * o do arquivo, não basta o status.
 */
async function assertServesOwnIndex(
  context: APIRequestContext,
  projectRoot: string
): Promise<void> {
  const rootPath = projectRoot.replace(/\\/g, '/');
  const ownIndexPath = `${rootPath.startsWith('/') ? '/@fs' : '/@fs/'}${rootPath}/index.html`;
  const ownIndex = await context.get(ownIndexPath);

  if (!ownIndex.ok()) {
    throw occupiedPortError(
      `outro app, não o servidor de desenvolvimento deste frontend (${projectRoot}; GET ${ownIndexPath} respondeu ${ownIndex.status()})`
    );
  }

  const localIndex = await readFile(
    path.join(projectRoot, 'index.html'),
    'utf8'
  );

  if ((await ownIndex.text()) !== localIndex) {
    throw occupiedPortError(
      `outro app, não o servidor de desenvolvimento deste frontend (${projectRoot}; GET ${ownIndexPath} respondeu ${ownIndex.status()}, mas não com o index.html desta pasta: servidor com fallback de SPA, como o vite preview)`
    );
  }
}

/*
 * A `VITE_API_URL` que o Vite de desenvolvimento injeta no módulo de ambiente.
 * O `vite preview` e servidores estáticos não transformam `.ts`: respondem
 * HTML (fallback de SPA), o fonte cru ou 404, e nenhum traz o valor.
 */
async function readServedApiUrl(context: APIRequestContext): Promise<string> {
  const envModule = await context.get(ENV_MODULE_PATH);
  const contentType = envModule.headers()['content-type'] ?? '';
  const servedApiUrl = SERVED_API_URL.exec(await envModule.text())?.at(1);

  if (
    !envModule.ok() ||
    !JAVASCRIPT_CONTENT_TYPE.test(contentType) ||
    servedApiUrl === undefined
  ) {
    throw occupiedPortError(
      `algo que não é o servidor de desenvolvimento do Vite deste frontend (GET ${ENV_MODULE_PATH} respondeu ${envModule.status()}, ${contentType || 'sem content-type'}, ${servedApiUrl === undefined ? 'sem' : 'com'} VITE_API_URL; o vite preview e servidores estáticos não servem o módulo transformado)`
    );
  }

  return servedApiUrl;
}

/**
 * Confere, antes dos specs, que a porta dos E2E serve o Vite de
 * desenvolvimento DESTE frontend apontando para a API do preparo. O
 * `webServer` reaproveita o que já estiver de pé na porta; sem esta
 * conferência, os specs rodariam contra outro app (outro projeto na mesma
 * porta, até com o mesmo `<title>`, ou o `vite preview` deste) e falhariam por
 * motivo falso.
 */
export async function assertServesThisFrontend(
  projectRoot: string
): Promise<void> {
  const context = await request.newContext({ baseURL: FRONTEND_URL });

  try {
    await assertServesOwnIndex(context, projectRoot);
    const servedApiUrl = await readServedApiUrl(context);

    if (servedApiUrl !== SERVER_API_URL) {
      throw occupiedPortError(
        `este frontend, mas apontando para ${servedApiUrl}, e o preparo dos specs usa ${SERVER_API_URL} (VITE_API_URL)`
      );
    }
  } finally {
    await context.dispose();
  }
}
