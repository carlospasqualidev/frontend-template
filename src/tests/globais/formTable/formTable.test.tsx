import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  FormTable,
  FormTableHeader,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/global/formTable/formTable';

function renderTable() {
  return render(
    <FormTable>
      <FormTableHeader>
        <TableHead>Método</TableHead>
        <TableHead>Unidade</TableHead>
      </FormTableHeader>
      <TableBody>
        <TableRow>
          <TableCell>GC-MS/MS</TableCell>
          <TableCell>%</TableCell>
        </TableRow>
      </TableBody>
    </FormTable>
  );
}

describe('FormTable (global)', () => {
  it('renderiza cabeçalho e corpo compostos pelos filhos', () => {
    renderTable();
    expect(
      screen.getByRole('columnheader', { name: 'Método' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Unidade' })
    ).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'GC-MS/MS' })).toBeInTheDocument();
  });

  it('o cabeçalho herda o tom neutro do TableHeader base, sem cor própria na linha', () => {
    renderTable();
    const head = screen.getByRole('columnheader', { name: 'Método' });
    const headerRow = head.closest('tr');
    const thead = head.closest('thead');
    expect(thead).toHaveClass('[&_tr]:bg-muted');
    expect(thead).not.toHaveClass('[&_tr]:bg-primary/35');
    expect(headerRow?.className ?? '').not.toMatch(/(^|\s)bg-/);
    expect(head).toHaveClass('text-muted-foreground');
  });

  it('o container recorta os cantos arredondados (overflow-hidden)', () => {
    const { container } = renderTable();
    const wrapper = container.querySelector('div.rounded-md');
    expect(wrapper).toHaveClass('overflow-hidden', 'border');
  });

  it('encaminha className para o container', () => {
    const { container } = render(
      <FormTable className="mt-4">
        <TableBody>
          <TableRow>
            <TableCell>x</TableCell>
          </TableRow>
        </TableBody>
      </FormTable>
    );
    expect(container.querySelector('div.rounded-md')).toHaveClass('mt-4');
  });
});
