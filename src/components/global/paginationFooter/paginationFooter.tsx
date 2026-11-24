import * as React from 'react';

import {
  isPageSizeOption,
  PAGE_SIZE_OPTIONS,
} from '@/components/global/dataTable/pageSizeStorage';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface IPaginationFooterProps {
  /** Página atual, em base 0 (a mesma da URL). */
  pageIndex: number;
  pageSize: number;
  onPageChange: (pageIndex: number) => void;
  /**
   * Chamado ao escolher outro "Itens por página". Opt-in: sem ele, ou com
   * `pageSize` fora das opções (25, 50, 100), o seletor não aparece.
   */
  onPageSizeChange?: (pageSize: number) => void;
  /** Existe página depois da atual; quem chama decide (total do servidor ou página cheia). */
  hasNextPage: boolean;
  /** Desabilita o seletor, Anterior e Próxima enquanto a página carrega. */
  isLoading?: boolean;
  /** Texto opcional entre o seletor e os botões, como o total de registros. */
  summary?: React.ReactNode;
  className?: string;
}

/**
 * Rodapé de paginação da `DataTable` e de listas em cartões: "Itens por página"
 * à esquerda, resumo opcional e Anterior/Próxima à direita. Não conhece a fonte dos dados: a página
 * vive com quem chama, que também diz se há próxima.
 */
export function PaginationFooter({
  pageIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  hasNextPage,
  isLoading = false,
  summary,
  className,
}: IPaginationFooterProps) {
  const pageSizeLabelId = React.useId();

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-end gap-2 py-4',
        className
      )}
    >
      {onPageSizeChange && isPageSizeOption(pageSize) ? (
        <div className="mr-auto flex items-center gap-2">
          <span
            id={pageSizeLabelId}
            className="text-sm whitespace-nowrap text-muted-foreground"
          >
            Itens por página
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            disabled={isLoading}
          >
            <SelectTrigger size="sm" aria-labelledby={pageSizeLabelId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {summary ? (
        <span className="mr-2 text-sm text-muted-foreground">{summary}</span>
      ) : null}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={pageIndex === 0 || isLoading}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={isLoading || !hasNextPage}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
