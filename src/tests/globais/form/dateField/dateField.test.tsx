import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DateField } from '@/components/global/form/dateField';
import { Modal } from '@/components/global/modal/modal';

/**
 * Espelha o uso real numa barra de filtros: o valor do campo é guardado pelo pai
 * (rascunho do filtro) e é ELE que vai para a query string ao buscar. Por isso o
 * campo só pode entregar data ISO (`aaaa-mm-dd`) ou vazio — nunca o texto pt-BR
 * ainda incompleto, que quebrava a listagem no backend.
 */
function ControlledHarness({
  onChange,
}: {
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = React.useState('');

  return (
    <>
      <DateField
        id="period"
        label="Data de fabricação (de)"
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange?.(next);
        }}
      />
      <label htmlFor="outside">Outro campo</label>
      <input id="outside" />
      <output>{`valor:${value}`}</output>
    </>
  );
}

describe('DateField (global) — valor entregue ao consumidor', () => {
  it('data completa vira ISO (aaaa-mm-dd)', async () => {
    const user = userEvent.setup();
    render(<ControlledHarness />);

    await user.type(
      screen.getByLabelText('Data de fabricação (de)'),
      '28072026'
    );

    expect(screen.getByText('valor:2026-07-28')).toBeInTheDocument();
  });

  it('data ainda incompleta NÃO vaza o texto digitado — o campo vale vazio', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<ControlledHarness onChange={handleChange} />);

    // Um dígito a menos no ano produz `28/07/026` — exatamente o que chegou na
    // query string em produção e derrubou a listagem.
    await user.type(
      screen.getByLabelText('Data de fabricação (de)'),
      '2807026'
    );

    expect(screen.getByText('valor:')).toBeInTheDocument();
    expect(handleChange).not.toHaveBeenCalledWith(expect.stringContaining('/'));
  });

  it('mantém o texto digitado no campo enquanto a data está incompleta', async () => {
    const user = userEvent.setup();
    render(<ControlledHarness />);

    const input = screen.getByLabelText<HTMLInputElement>(
      'Data de fabricação (de)'
    );
    await user.type(input, '2807026');

    expect(input.value).toBe('28/07/026');
  });

  it('apagar um dígito de uma data completa não apaga o resto do campo', async () => {
    const user = userEvent.setup();
    render(<ControlledHarness />);

    const input = screen.getByLabelText<HTMLInputElement>(
      'Data de fabricação (de)'
    );
    await user.type(input, '28072026');
    await user.type(input, '{backspace}');

    // O campo passa a valer vazio (data incompleta), mas o que está escrito
    // continua lá para o usuário corrigir o dígito.
    expect(input.value).toBe('28/07/202');
    expect(screen.getByText('valor:')).toBeInTheDocument();
  });

  it('ao sair do campo, data incompleta é descartada e o campo fica vazio', async () => {
    const user = userEvent.setup();
    render(<ControlledHarness />);

    const input = screen.getByLabelText<HTMLInputElement>(
      'Data de fabricação (de)'
    );
    await user.type(input, '2807026');
    await user.click(screen.getByLabelText('Outro campo'));

    expect(input.value).toBe('');
    expect(screen.getByText('valor:')).toBeInTheDocument();
  });

  it('ao sair do campo, data completa é preservada', async () => {
    const user = userEvent.setup();
    render(<ControlledHarness />);

    const input = screen.getByLabelText<HTMLInputElement>(
      'Data de fabricação (de)'
    );
    await user.type(input, '28072026');
    await user.click(screen.getByLabelText('Outro campo'));

    expect(input.value).toBe('28/07/2026');
    expect(screen.getByText('valor:2026-07-28')).toBeInTheDocument();
  });

  it('digitar as barras junto com os números não perde dígito', async () => {
    const user = userEvent.setup();
    render(<ControlledHarness />);

    const input = screen.getByLabelText<HTMLInputElement>(
      'Data de fabricação (de)'
    );
    await user.type(input, '28/07/2026');

    expect(input.value).toBe('28/07/2026');
    expect(screen.getByText('valor:2026-07-28')).toBeInTheDocument();
  });

  it('apagar atravessa a barra que a máscara inseriu', async () => {
    const user = userEvent.setup();
    render(<ControlledHarness />);

    const input = screen.getByLabelText<HTMLInputElement>(
      'Data de fabricação (de)'
    );
    await user.type(input, '2807');
    expect(input.value).toBe('28/07/');

    // Duas teclas: a primeira tira a barra do ano, a segunda o dígito do mês.
    await user.type(input, '{backspace}{backspace}');

    expect(input.value).toBe('28/0');
  });

  it('não dispara mudança ao passar o foco por um campo vazio', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<ControlledHarness onChange={handleChange} />);

    await user.click(screen.getByLabelText('Data de fabricação (de)'));
    await user.click(screen.getByLabelText('Outro campo'));

    expect(handleChange).not.toHaveBeenCalled();
  });
});

describe('DateField — camadas e portal dentro de Modal', () => {
  /**
   * Regressão do "o calendário abriu ATRÁS da modal". São duas garantias
   * independentes e este teste trava a que dá para observar no DOM:
   *
   * 1. Dentro de um `Modal` o popover NÃO portala (`InModalContext` →
   *    `PopoverContent`), então ele nasce DENTRO do dialog — é isso que faz a
   *    roda do mouse funcionar (o `react-remove-scroll` do Dialog só libera o
   *    wheel na própria subárvore).
   * 2. `--z-floating` > `--z-overlay` (ver `src/index.css`) mantém qualquer
   *    flutuante na frente do modal mesmo se ele portalar.
   *
   * O popover do Radix também tem `role="dialog"`, por isso identificamos o
   * modal pelo nome acessível (o título).
   */
  it('renderiza o calendário DENTRO do dialog do modal (não portala para o body)', async () => {
    const user = userEvent.setup();
    render(
      <Modal
        open
        setOpen={() => undefined}
        title="Editar lote"
        description="Descrição"
      >
        <DateField id="fabricacao" label="Data de fabricação" />
      </Modal>
    );

    const modal = screen.getByRole('dialog', { name: 'Editar lote' });
    await user.click(
      within(modal).getByRole('button', { name: 'Abrir calendário' })
    );

    expect(await within(modal).findByRole('grid')).toBeInTheDocument();
  });
});
