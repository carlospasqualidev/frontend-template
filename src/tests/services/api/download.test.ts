import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { axiosApi } from '@/services/api/api';
import { fetchFileObjectUrl, parseFileName } from '@/services/api/download';
import { respondWith } from '@/tests/helpers/axiosAdapter';

const FALLBACK = 'relatorio.pdf';

describe('parseFileName', () => {
  it('prefere o `filename*` em UTF-8, preservando o acento', () => {
    const header = `attachment; filename="Relatorio de custo do estoque - 29-07-2026.pdf"; filename*=UTF-8''${encodeURIComponent(
      'Relatório de custo do estoque - 29-07-2026.pdf'
    )}`;

    expect(parseFileName(header, FALLBACK)).toBe(
      'Relatório de custo do estoque - 29-07-2026.pdf'
    );
  });

  it('sem `filename*`, usa o `filename` ASCII', () => {
    const header =
      'attachment; filename="Relatorio de vendas - Filial 02 - 29-07-2026.xlsx"';

    expect(parseFileName(header, FALLBACK)).toBe(
      'Relatorio de vendas - Filial 02 - 29-07-2026.xlsx'
    );
  });

  it('aceita o `filename` sem as aspas', () => {
    expect(parseFileName('attachment; filename=recall.xlsx', FALLBACK)).toBe(
      'recall.xlsx'
    );
  });

  it('sem o header, cai no nome de reserva', () => {
    expect(parseFileName(undefined, FALLBACK)).toBe(FALLBACK);
    expect(parseFileName('attachment', FALLBACK)).toBe(FALLBACK);
  });

  it('`filename*` malformado não derruba o download: cai no ASCII', () => {
    const header =
      'attachment; filename="recall.pdf"; filename*=UTF-8\'\'%E0%A4%A';

    expect(parseFileName(header, FALLBACK)).toBe('recall.pdf');
  });
});

describe('fetchFileObjectUrl', () => {
  const defaultAdapter = axiosApi.defaults.adapter;
  const createObjectURL = vi.fn((blob: Blob) => `blob:fake/${blob.type}`);

  beforeEach(() => {
    URL.createObjectURL = createObjectURL;
  });

  afterEach(() => {
    axiosApi.defaults.adapter = defaultAdapter;
    createObjectURL.mockClear();
  });

  function answerWith(data: Blob) {
    const adapter = vi.fn(respondWith(200, data));
    axiosApi.defaults.adapter = adapter;
    return adapter;
  }

  function blobGiven(): Blob {
    return createObjectURL.mock.calls[0][0];
  }

  it('pede o arquivo como blob e devolve o endereço blob:', async () => {
    const adapter = answerWith(new Blob(['x'], { type: 'image/png' }));

    const address = await fetchFileObjectUrl('/files/1', 'image', 'a.png');

    expect(adapter.mock.lastCall?.[0].responseType).toBe('blob');
    expect(adapter.mock.lastCall?.[0].url).toBe('/files/1');
    expect(address).toBe('blob:fake/image/png');
  });

  it('PDF e texto saem com MIME fixo, nunca o da resposta', async () => {
    answerWith(new Blob(['<script>'], { type: 'text/html' }));

    await fetchFileObjectUrl('/files/1', 'pdf', 'a.pdf');
    expect(blobGiven().type).toBe('application/pdf');

    createObjectURL.mockClear();
    await fetchFileObjectUrl('/files/1', 'text', 'a.txt');
    expect(blobGiven().type).toBe('text/plain');
  });

  it('imagem sai pelo MIME da extensão, nunca pelo da resposta', async () => {
    answerWith(new Blob(['<svg/>'], { type: 'image/svg+xml' }));

    await fetchFileObjectUrl('/files/1', 'image', 'Foto.WEBP');

    expect(blobGiven().type).toBe('image/webp');
  });

  it('imagem com extensão fora da lista sai com MIME neutro', async () => {
    answerWith(new Blob(['<svg/>'], { type: 'text/html' }));

    await fetchFileObjectUrl('/files/1', 'image', 'desenho.svg');

    expect(blobGiven().type).toBe('application/octet-stream');
  });
});
