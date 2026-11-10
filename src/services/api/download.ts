import { type AxiosRequestConfig, type AxiosResponse } from 'axios';

import { axiosApi } from './api';

/**
 * Extrai o nome do arquivo do `Content-Disposition`. O backend manda os dois
 * formatos: `filename*` (RFC 5987, UTF-8 percent-encoded) para o nome com acento
 * e `filename` ASCII como reserva. Sem ler o header, o download salvaria o nome
 * chumbado no frontend e perderia o equipamento/lote/data que o servidor pôs nele.
 */
export function parseFileName(
  contentDisposition: string | undefined,
  fallback: string
): string {
  if (!contentDisposition) return fallback;

  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      // Header malformado: cai para o `filename` ASCII abaixo.
    }
  }

  const ascii = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return ascii ? ascii[1].trim() : fallback;
}

/** `GET` do arquivo como blob, pela instância crua para manter os headers. */
function getBlob(
  url: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<Blob>> {
  return axiosApi.get<Blob>(url, { ...config, responseType: 'blob' });
}

/**
 * Baixa um arquivo servido pela API e dispara o "salvar como" do navegador.
 *
 * Usa a instância axios crua porque o wrapper `api` devolve só o `data` — e aqui
 * o header `Content-Disposition` é parte da resposta que interessa.
 */
export async function downloadFile(
  url: string,
  fallbackFileName: string,
  config?: AxiosRequestConfig
): Promise<void> {
  const response = await getBlob(url, config);

  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = parseFileName(
    response.headers['content-disposition'] as string | undefined,
    fallbackFileName
  );
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

/** Tipos que o visualizador de anexos sabe mostrar. */
export type PreviewBlobKind = 'image' | 'pdf' | 'text';

const IMAGE_MIME_BY_EXTENSION = new Map([
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.bmp', 'image/bmp'],
  ['.avif', 'image/avif'],
]);

/** MIME neutro: o navegador não renderiza o conteúdo. */
const NEUTRAL_MIME = 'application/octet-stream';

function mimeTypeFor(kind: PreviewBlobKind, fileName: string): string {
  switch (kind) {
    case 'pdf':
      return 'application/pdf';
    case 'text':
      return 'text/plain';
    case 'image': {
      const extension = /\.[a-z0-9]+$/i.exec(fileName)?.[0].toLowerCase();
      return (
        (extension && IMAGE_MIME_BY_EXTENSION.get(extension)) || NEUTRAL_MIME
      );
    }
  }
}

/**
 * Busca o arquivo pela API (com a sessão) e devolve um `blob:` para o
 * visualizador. O MIME nunca é o do servidor: PDF e texto têm MIME fixo e a
 * imagem sai pelo da extensão do `fileName`, numa lista fechada (fora dela, MIME
 * neutro, que não se pré-visualiza). Quem chama revoga o endereço
 * (`URL.revokeObjectURL`) ao fechar.
 */
export async function fetchFileObjectUrl(
  url: string,
  kind: PreviewBlobKind,
  fileName: string
): Promise<string> {
  const { data } = await getBlob(url);

  return URL.createObjectURL(
    new Blob([data], { type: mimeTypeFor(kind, fileName) })
  );
}
