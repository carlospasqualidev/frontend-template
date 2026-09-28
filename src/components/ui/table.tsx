import * as React from 'react';

import { cn } from '@/lib/utils';

function Table({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<'table'> & { containerClassName?: string }) {
  return (
    <div
      data-slot="table-container"
      // overflow-y-hidden explícito: `overflow-x-auto` sozinho faz o navegador
      // computar `overflow-y: auto`, e a barra horizontal (tabela larga) passa a
      // desenhar uma barra vertical fantasma. Nenhuma tabela restringe a altura
      // deste container (cresce e a página rola), então esconder o Y não corta
      // conteúdo. Para scroll interno (altura limitada + cabeçalho sticky), passe
      // `containerClassName` (ex.: `max-h-96 overflow-y-auto`).
      className={cn('relative w-full overflow-x-auto overflow-y-hidden', containerClassName)}
    >
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      // Cabeçalho num tom claro da marca (`bg-primary/35`) com texto escuro em TODA
      // tabela do sistema. O seletor de descendente do hover tem especificidade
      // maior que o `hover:bg-muted/50` do `TableRow`, então não "pisca" no hover.
      // Idem para o `has-aria-expanded:bg-muted/50`: um menu aberto no cabeçalho
      // (colunas, ordenação) não pode apagar o tom da marca.
      className={cn(
        '[&_tr]:border-b [&_tr]:bg-primary/35 [&_tr]:hover:bg-primary/35 [&_tr]:has-aria-expanded:bg-primary/35',
        className
      )}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
        className
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'h-10 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'px-3 py-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
