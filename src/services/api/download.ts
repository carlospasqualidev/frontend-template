import { type AxiosRequestConfig } from 'axios';

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
  const response = await axiosApi.get<Blob>(url, {
    ...config,
    responseType: 'blob',
  });

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
