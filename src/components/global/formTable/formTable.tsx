import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface IFormTable {
  children: ReactNode;
  className?: string;
}

/**
 * Tabela estilizada para seções de formulário/configuração — coleções editáveis
 * inline (ex.: a lista de itens de um cadastro, uma tabela de limites).
 * Padroniza o container com borda arredondada (recorta os cantos) e o
 * cabeçalho em `bg-muted`. Componha com `FormTableHeader` + `TableBody`/`TableRow`/
 * `TableCell` (reexportados aqui).
 *
 * Não confundir com o `DataTable` global (listagem paginada/filtrável server-side):
 * a `FormTable` é só o "chrome" visual de uma tabela dentro de um formulário.
 */
export function FormTable({ children, className }: IFormTable) {
  return (
    <div className={cn('overflow-hidden rounded-md border', className)}>
      <Table className="[&_td]:align-top">{children}</Table>
    </div>
  );
}

interface IFormTableHeader {
  children: ReactNode;
}

/**
 * Cabeçalho da `FormTable`. O estilo (`bg-muted`, rótulo em `text-muted-foreground`)
 * vem do `TableHeader` base (`components/ui/table.tsx`), igual ao de toda tabela.
 * Passe os `TableHead` como filhos.
 */
export function FormTableHeader({ children }: IFormTableHeader) {
  return (
    <TableHeader>
      <TableRow>{children}</TableRow>
    </TableHeader>
  );
}

export { TableBody, TableCell, TableHead, TableRow };
