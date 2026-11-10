import { describe, expect, it } from 'vitest';

import {
  joinFileName,
  splitFileName,
} from '@/components/global/attachmentRow/fileName';
import { previewKind } from '@/components/global/attachmentRow/previewKind';

describe('splitFileName', () => {
  it('separa nome e extensão', () => {
    expect(splitFileName('Relatório.pdf')).toEqual({
      stem: 'Relatório',
      extension: '.pdf',
    });
  });

  it('".gitignore" é o nome inteiro', () => {
    expect(splitFileName('.gitignore')).toEqual({
      stem: '.gitignore',
      extension: '',
    });
  });

  it('ponto no meio com espaço não é extensão', () => {
    expect(splitFileName('Contrato 3.1 assinado')).toEqual({
      stem: 'Contrato 3.1 assinado',
      extension: '',
    });
  });

  it('nome sem ponto não tem extensão', () => {
    expect(splitFileName('Contrato')).toEqual({
      stem: 'Contrato',
      extension: '',
    });
  });
});

describe('joinFileName', () => {
  it('devolve a extensão ao nome digitado', () => {
    expect(joinFileName(' Novo ', '.pdf')).toBe('Novo.pdf');
  });

  it('não duplica a extensão, ignorando maiúscula', () => {
    expect(joinFileName('a.pdf', '.PDF')).toBe('a.pdf');
    expect(joinFileName('a.PDF', '.pdf')).toBe('a.PDF');
  });

  it('só a extensão digitada devolve vazio', () => {
    expect(joinFileName('.pdf', '.pdf')).toBe('');
    expect(joinFileName('  ', '.pdf')).toBe('');
  });

  it('sem extensão devolve só o nome', () => {
    expect(joinFileName('  Contrato ', '')).toBe('Contrato');
  });
});

describe('previewKind', () => {
  it.each(['a.png', 'a.JPG', 'a.jpeg', 'a.gif', 'a.webp', 'a.bmp', 'a.avif'])(
    '%s é imagem',
    (name) => expect(previewKind(name)).toBe('image')
  );

  it('PDF', () => expect(previewKind('a.PDF')).toBe('pdf'));

  it.each(['a.txt', 'a.csv', 'a.log', 'a.md', 'a.json', 'a.xml'])(
    '%s é texto',
    (name) => expect(previewKind(name)).toBe('text')
  );

  it.each(['a.docx', 'a.zip', 'semextensao'])('%s é none', (name) =>
    expect(previewKind(name)).toBe('none')
  );
});
