import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DateField } from '@/components/global/form/dateField';
import { FieldShortcuts } from '@/components/global/form/fieldShortcuts';

describe('FieldShortcuts', () => {
  it('mostra rótulo, atalhos e campo nessa ordem, com um só rótulo ligado ao input', () => {
    render(
      <FieldShortcuts
        label="Data do retorno"
        htmlFor="return-date"
        shortcuts={[
          { label: '1 dia', onSelect: vi.fn() },
          { label: '7 dias', onSelect: vi.fn() },
        ]}
      >
        <DateField id="return-date" label="" />
      </FieldShortcuts>
    );

    const input = screen.getByLabelText('Data do retorno');
    expect(input).toHaveAttribute('id', 'return-date');
    expect(document.querySelectorAll('label')).toHaveLength(1);

    const label = screen.getByText('Data do retorno');
    const first = screen.getByRole('button', { name: '1 dia' });
    expect(
      label.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      first.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('clicar chama só o onSelect do atalho e não envia o formulário', async () => {
    const user = userEvent.setup();
    const onSelectOne = vi.fn();
    const onSelectSeven = vi.fn();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());

    render(
      <form onSubmit={onSubmit}>
        <FieldShortcuts
          label="Data"
          htmlFor="d"
          shortcuts={[
            { label: '1 dia', onSelect: onSelectOne },
            { label: '7 dias', onSelect: onSelectSeven },
          ]}
        >
          <DateField id="d" label="" />
        </FieldShortcuts>
      </form>
    );

    await user.click(screen.getByRole('button', { name: '7 dias' }));

    expect(onSelectSeven).toHaveBeenCalledTimes(1);
    expect(onSelectOne).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('atalho desabilitado é botão focável com aria-disabled, não dispara e mostra o motivo', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <FieldShortcuts
        label="Entrada"
        htmlFor="e"
        shortcuts={[
          {
            label: '10%',
            onSelect,
            disabled: true,
            disabledReason: 'Informe a base primeiro',
          },
        ]}
      >
        <input id="e" />
      </FieldShortcuts>
    );

    const button = screen.getByRole('button', {
      name: '10%: Informe a base primeiro',
    });
    expect(button).toHaveAttribute('aria-disabled', 'true');

    await user.tab();
    expect(button).toHaveFocus();
    expect(
      (await screen.findAllByText('Informe a base primeiro')).length
    ).toBeGreaterThan(0);

    fireEvent.click(button);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('disabled do grupo bloqueia todos e não mostra o motivo do atalho', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <FieldShortcuts
        label="Data"
        htmlFor="g"
        disabled
        shortcuts={[
          { label: '1 dia', onSelect, disabledReason: 'Motivo do atalho' },
          { label: '7 dias', onSelect },
        ]}
      >
        <input id="g" />
      </FieldShortcuts>
    );

    const buttons = screen.getAllByRole('button');
    for (const button of buttons) {
      expect(button).toHaveAttribute('aria-disabled', 'true');
      await user.click(button);
    }
    expect(onSelect).not.toHaveBeenCalled();

    await user.tab();
    await user.tab();
    expect(screen.queryByText('Motivo do atalho')).not.toBeInTheDocument();
  });

  it('disabled do grupo mostra o motivo do próprio grupo, quando informado', async () => {
    const user = userEvent.setup();

    render(
      <FieldShortcuts
        label="Data"
        htmlFor="g2"
        disabled
        disabledReason="Formulário em leitura"
        shortcuts={[{ label: '1 dia', onSelect: vi.fn() }]}
      >
        <input id="g2" />
      </FieldShortcuts>
    );

    await user.tab();
    expect(
      (await screen.findAllByText('Formulário em leitura')).length
    ).toBeGreaterThan(0);
  });
});
