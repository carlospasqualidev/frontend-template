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
 * cabeçalho na cor da marca. Componha com `FormTableHeader` + `TableBody`/`TableRow`/
 * `TableCell` (reexportados aqui).
 *
 * Não confundir com o `DataTable` global (listagem paginada/filtrável server-side):
 * a `FormTable` é só o "chrome" visual de uma tabela dentro de um formulário.
 */
export function FormTable({ children, className }: IFormTable) {
  return (
    <div className={cn('overflow-hidden rounded-md border', className)}>
      <Table>{children}</Table>
    </div>
  );
}

interface IFormTableHeader {
  children: ReactNode;
}

/**
 * Cabeçalho da `FormTable`: linha na cor da marca (primária sólida) com labels
 * brancas. O estilo já vem embutido no `TableHeader` base (`components/ui/table.tsx`)
 * — aplicado a TODA tabela; a classe abaixo é redundante de propósito, para o
 * cabeçalho da FormTable continuar na marca mesmo se o padrão da base mudar. Passe
 * os `TableHead` como filhos.
 */
export function FormTableHeader({ children }: IFormTableHeader) {
  return (
    <TableHeader>
      <TableRow className="bg-primary/35 hover:bg-primary/35">
        {children}
      </TableRow>
    </TableHeader>
  );
}

export { TableBody, TableCell, TableHead, TableRow };
