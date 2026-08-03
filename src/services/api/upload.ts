import { z } from 'zod';

import { api } from '@/services/api';

const uploadResponseSchema = z.object({
  Location: z.url(),
});

/**
 * Rota de upload do backend. Ajuste AQUI ao iniciar o projeto (ex.: quando as
 * rotas são prefixadas por módulo, `/backoffice/upload/file`) — assim nenhuma
 * tela precisa conhecer o caminho. O `api` já aponta para a base da API.
 */
const UPLOAD_PATH = '/upload/file';

/**
 * Sobe um arquivo para o storage e devolve a URL pública (`Location`). Usado
 * antes de persistir a entidade — o backend recebe apenas a URL como string.
 *
 * ```ts
 * const url = await uploadFile(file);
 * ```
 */
export async function uploadFile(
  file: File,
  path: string = UPLOAD_PATH
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const data = await api.post<unknown>(path, formData);
  return uploadResponseSchema.parse(data).Location;
}
