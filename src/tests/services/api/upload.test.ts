import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { axiosApi } from '@/services/api/api';
import { uploadFile } from '@/services/api/upload';
import { respondWith } from '@/tests/helpers/axiosAdapter';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const defaultAdapter = axiosApi.defaults.adapter;

afterEach(() => {
  axiosApi.defaults.adapter = defaultAdapter;
  vi.clearAllMocks();
});

// Transporte sem rede: o adapter do `axiosApi` responde e guarda o pedido.
function answerWith(status: number, data: unknown) {
  const adapter = vi.fn(respondWith(status, data));
  axiosApi.defaults.adapter = adapter;
  return adapter;
}

function requestOf(adapter: ReturnType<typeof answerWith>) {
  const config = adapter.mock.lastCall?.[0];
  if (!config) throw new Error('Nenhuma chamada ao servidor.');
  return config;
}

// Resposta do servidor (`POST /client/upload/file`, 201).
function makeUploadResponse(overrides: Record<string, unknown> = {}) {
  return {
    Location: 'https://cdn.example.com/foto.png',
    key: 'uploads/foto.png',
    fileName: 'foto.png',
    originalName: 'foto.png',
    mimeType: 'image/png',
    size: 8,
    ...overrides,
  };
}

function file(name = 'foto.png') {
  return new File(['conteudo'], name, { type: 'image/png' });
}

describe('uploadFile', () => {
  // A rota do server é `/api/client/upload/file`: a base (`VITE_API_URL`) já
  // termina em `/api`.
  it('envia o arquivo como multipart no campo `file` para /client/upload/file e devolve a URL pública', async () => {
    const adapter = answerWith(201, makeUploadResponse());

    await expect(uploadFile(file())).resolves.toBe(
      'https://cdn.example.com/foto.png'
    );

    const request = requestOf(adapter);
    expect(request).toMatchObject({
      method: 'post',
      baseURL: 'http://localhost:8080/api',
      url: '/client/upload/file',
    });
    expect(request.data).toBeInstanceOf(FormData);
    expect((request.data as FormData).get('file')).toBeInstanceOf(File);
  });

  // A rota é configurável para o projeto que prefixa as rotas de outro jeito —
  // sem isso, cada tela teria que conhecer o caminho do upload.
  it('aceita uma rota alternativa', async () => {
    const adapter = answerWith(201, makeUploadResponse());

    await uploadFile(file(), '/backoffice/upload/file');

    expect(requestOf(adapter).url).toBe('/backoffice/upload/file');
  });

  // Resposta fora do contrato falha AQUI (Zod), não numa tela que exibiria
  // `undefined` como src da imagem.
  it('rejeita quando a resposta não traz `Location`', async () => {
    answerWith(201, { url: 'https://cdn.example.com/foto.png' });

    await expect(uploadFile(file())).rejects.toThrow();
  });

  it('rejeita quando `Location` não é uma URL', async () => {
    answerWith(201, makeUploadResponse({ Location: 'nao-e-url' }));

    await expect(uploadFile(file())).rejects.toThrow();
  });

  it('propaga a falha da API, com o toast do servidor', async () => {
    answerWith(413, { message: 'Arquivo acima do tamanho permitido.' });

    await expect(uploadFile(file())).rejects.toMatchObject({
      response: { status: 413 },
    });
    expect(toast.error).toHaveBeenCalledWith(
      'Arquivo acima do tamanho permitido.',
      { id: 'errorToastId' }
    );
  });
});
