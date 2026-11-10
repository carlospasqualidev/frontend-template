/**
 * O que parece extensão no fim do nome: ponto + até 8 letras ou dígitos.
 *
 * O limite existe para "Contrato 3.1 assinado" não virar nome "Contrato 3" com
 * extensão ".1 assinado". Extensão de verdade é curta e sem espaço; o resto é nome.
 */
const FILE_EXTENSION = /\.[a-z0-9]{1,8}$/i;

/**
 * Separa o nome da extensão. A extensão descreve os bytes, que não mudam ao
 * renomear, por isso fica fora do que se edita. Ponto no começo não é extensão
 * (".gitignore" é o nome inteiro) e nome sem ponto volta com extensão vazia.
 */
export function splitFileName(name: string): {
  stem: string;
  extension: string;
} {
  const found = FILE_EXTENSION.exec(name);

  if (!found || found.index === 0) return { stem: name, extension: '' };

  return { stem: name.slice(0, found.index), extension: found[0] };
}

/**
 * O nome digitado com a extensão de volta. Não duplica quando quem digitou já a
 * trouxe ("Contrato.pdf" não vira "Contrato.pdf.pdf"); a comparação ignora
 * maiúscula, pois ".PDF" e ".pdf" são o mesmo formato.
 */
export function joinFileName(stem: string, extension: string): string {
  const trimmed = stem.trim();

  if (!extension) return trimmed;

  const hasExtension = trimmed.toLowerCase().endsWith(extension.toLowerCase());
  const base = hasExtension ? trimmed.slice(0, -extension.length) : trimmed;

  // Só a extensão digitada (".pdf") não é nome: devolve vazio.
  if (!base.trim()) return '';

  return hasExtension ? trimmed : `${trimmed}${extension}`;
}
