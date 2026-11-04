/** Opções do seletor "Itens por página" da `DataTable`. */
export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

/** Chave global no `localStorage`: a escolha vale para todas as listagens. */
export const PAGE_SIZE_STORAGE_KEY = 'dataTable:pageSize';

export function isPageSizeOption(value: unknown): value is PageSizeOption {
  return PAGE_SIZE_OPTIONS.some((option) => option === value);
}

/** Tamanho de página salvo neste navegador; `undefined` se ausente, inválido ou bloqueado. */
export function readStoredPageSize(): PageSizeOption | undefined {
  try {
    const raw = localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
    if (raw === null) return undefined;
    const parsed = Number(raw);
    return isPageSizeOption(parsed) ? parsed : undefined;
  } catch (error) {
    // Armazenamento bloqueado (modo privado): vale o padrão da tela.
    console.info('Não foi possível ler os itens por página da tabela.', error);
    return undefined;
  }
}

export function writeStoredPageSize(pageSize: number): void {
  if (!isPageSizeOption(pageSize)) return;
  try {
    localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(pageSize));
  } catch (error) {
    console.info(
      'Não foi possível salvar os itens por página da tabela.',
      error
    );
  }
}
