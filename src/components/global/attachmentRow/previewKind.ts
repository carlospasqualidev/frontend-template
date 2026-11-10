import type { PreviewBlobKind } from '@/services/api/download';

/** O que dá para mostrar dentro do sistema; `none` é o que só se baixa. */
export type PreviewKind = PreviewBlobKind | 'none';

const IMAGES = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.avif'];
const TEXTS = ['.txt', '.csv', '.log', '.md', '.json', '.xml'];

/**
 * Decide pelo fim do nome do arquivo: a listagem não traz tipo MIME e a
 * extensão não custa requisição. Texto é só o que o navegador lê como veio
 * (`.csv` aparece como texto, não como tabela).
 */
export function previewKind(name: string): PreviewKind {
  const lowerName = name.toLowerCase();

  if (IMAGES.some((extension) => lowerName.endsWith(extension))) return 'image';
  if (lowerName.endsWith('.pdf')) return 'pdf';
  if (TEXTS.some((extension) => lowerName.endsWith(extension))) return 'text';

  return 'none';
}
