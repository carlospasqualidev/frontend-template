import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FieldChanges } from '@/components/global/fieldChanges/fieldChanges';

describe('FieldChanges (global)', () => {
  it('mostra "rótulo: de → para" com o anterior riscado e o novo em destaque', () => {
    render(
      <FieldChanges
        changes={[
          { field: 'name', label: 'Nome', from: 'Maria', to: 'Maria Alves' },
        ]}
      />
    );

    expect(screen.getByRole('term')).toHaveTextContent('Nome:');
    expect(screen.getByRole('definition')).toHaveTextContent(
      'de Maria para Maria Alves'
    );

    const from = screen.getByText('Maria');
    expect(from.tagName).toBe('DEL');
    expect(from).toHaveClass('line-through');

    const to = screen.getByText('Maria Alves');
    expect(to.tagName).toBe('INS');
    expect(to).toHaveClass('font-medium');
  });

  it('mantém a ordem recebida, um par por campo', () => {
    render(
      <FieldChanges
        changes={[
          { field: 'name', label: 'Nome', from: 'Maria', to: 'Maria Alves' },
          { field: 'isActive', label: 'Ativo', from: 'Sim', to: 'Não' },
        ]}
      />
    );

    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual(
      ['Nome:', 'Ativo:']
    );
  });

  it('exibe [Vazio] e [omitido] como estão, em itálico e sem risco', () => {
    render(
      <FieldChanges
        changes={[
          {
            field: 'phone',
            label: 'Telefone',
            from: '[Vazio]',
            to: '48999999999',
          },
          {
            field: 'password',
            label: 'Senha',
            from: '[omitido]',
            to: '[omitido]',
          },
        ]}
      />
    );

    const empty = screen.getByText('[Vazio]');
    expect(empty).toHaveClass('italic');
    expect(empty).not.toHaveClass('line-through');

    const [redactedFrom, redactedTo] = screen.getAllByText('[omitido]');
    expect(redactedFrom).toHaveClass('italic');
    expect(redactedFrom).not.toHaveClass('line-through');
    expect(redactedTo).toHaveClass('italic');
    expect(redactedTo).not.toHaveClass('font-medium');
  });

  it('sem mudanças, mostra a mensagem padrão e nenhuma lista', () => {
    render(<FieldChanges changes={[]} />);

    expect(
      screen.getByText('Nenhum campo alterado neste evento.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('term')).not.toBeInTheDocument();
  });

  it('usa o emptyMessage informado', () => {
    render(<FieldChanges changes={[]} emptyMessage="Nada mudou." />);

    expect(screen.getByText('Nada mudou.')).toBeInTheDocument();
  });
});
