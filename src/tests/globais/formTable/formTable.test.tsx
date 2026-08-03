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

  it('a linha do cabeçalho usa a cor da marca', () => {
    renderTable();
    const headerRow = screen
      .getByRole('columnheader', { name: 'Método' })
      .closest('tr');
    expect(headerRow).toHaveClass('bg-primary/35');
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
