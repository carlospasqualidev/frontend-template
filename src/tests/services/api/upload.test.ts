import { beforeEach, describe, expect, it, vi } from 'vitest';

import { uploadFile } from '@/services/api/upload';

const post = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    post: (...args: unknown[]) => post(...args),
  },
}));

beforeEach(() => {
  post.mockReset();
});

function file(name = 'foto.png') {
  return new File(['conteudo'], name, { type: 'image/png' });
}

describe('uploadFile', () => {
  it('envia o arquivo como multipart no campo `file` e devolve a URL pública', async () => {
    post.mockResolvedValue({ Location: 'https://cdn.example.com/foto.png' });

    const url = await uploadFile(file());

    expect(url).toBe('https://cdn.example.com/foto.png');

    const [path, body] = post.mock.calls[0]!;
    expect(path).toBe('/upload/file');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('file')).toBeInstanceOf(File);
  });

  // A rota é configurável para o projeto que prefixa as rotas por módulo — sem
  // isso, cada tela teria que conhecer o caminho do upload.
  it('aceita uma rota alternativa', async () => {
    post.mockResolvedValue({ Location: 'https://cdn.example.com/x.png' });

    await uploadFile(file(), '/backoffice/upload/file');

    expect(post.mock.calls[0]![0]).toBe('/backoffice/upload/file');
  });

  // Resposta fora do contrato falha AQUI (Zod), não numa tela que exibiria
  // `undefined` como src da imagem.
  it('rejeita quando a resposta não traz `Location`', async () => {
    post.mockResolvedValue({ url: 'https://cdn.example.com/foto.png' });

    await expect(uploadFile(file())).rejects.toThrow();
  });

  it('rejeita quando `Location` não é uma URL', async () => {
    post.mockResolvedValue({ Location: 'nao-e-url' });

    await expect(uploadFile(file())).rejects.toThrow();
  });

  it('propaga a falha da API (o interceptor já avisou o usuário)', async () => {
    post.mockRejectedValue(new Error('413'));

    await expect(uploadFile(file())).rejects.toThrow('413');
  });
});
