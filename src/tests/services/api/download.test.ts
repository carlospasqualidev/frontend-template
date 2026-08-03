import { describe, expect, it } from 'vitest';

import { parseFileName } from '@/services/api/download';

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
