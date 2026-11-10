import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  ActionMenu,
  type IActionMenuItem,
} from '@/components/global/actionMenu/actionMenu';

function open(): Promise<void> {
  return userEvent.click(screen.getByRole('button', { name: /Outras opções/ }));
}

describe('ActionMenu (global)', () => {
  it('não renderiza nada com items vazio', () => {
    const { container } = render(
      <ActionMenu label="Outras opções" items={[]} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('item comum chama onSelect e fecha o menu', async () => {
    const onSelect = vi.fn();
    render(
      <ActionMenu
        label="Outras opções"
        items={[{ key: 'a', label: 'Exportar', onSelect }]}
      />
    );

    await open();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Exportar' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('item desabilitado com motivo mostra a segunda linha e o nome "rótulo: motivo"', async () => {
    render(
      <ActionMenu
        label="Outras opções"
        items={[
          {
            key: 'a',
            label: 'Excluir',
            disabled: true,
            disabledReason: 'Selecione um registro',
            onSelect: vi.fn(),
          },
        ]}
      />
    );

    await open();

    const item = screen.getByRole('menuitem', {
      name: 'Excluir: Selecione um registro',
    });
    expect(item).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Selecione um registro')).toBeInTheDocument();
  });

  it('item desabilitado sem motivo tem só o rótulo no nome e nenhuma segunda linha', async () => {
    render(
      <ActionMenu
        label="Outras opções"
        items={[
          { key: 'a', label: 'Excluir', disabled: true, onSelect: vi.fn() },
        ]}
      />
    );

    await open();

    expect(
      screen.getByRole('menuitem', { name: 'Excluir' })
    ).toBeInTheDocument();
    expect(screen.getAllByText('Excluir')).toHaveLength(1);
  });

  it('item com checked é caixa marcável e não fecha o menu', async () => {
    const onSelect = vi.fn();
    render(
      <ActionMenu
        label="Outras opções"
        items={[
          { key: 'a', label: 'Atualizar sozinho', checked: true, onSelect },
        ]}
      />
    );

    await open();
    const checkbox = screen.getByRole('menuitemcheckbox', {
      name: 'Atualizar sozinho',
    });
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(checkbox);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('fechar por escolha não devolve o foco ao botão: o campo aberto mantém o foco', async () => {
    function Harness() {
      const [showField, setShowField] = React.useState(false);
      const fieldRef = React.useRef<HTMLInputElement>(null);
      React.useEffect(() => {
        if (!showField) return;
        const timer = setTimeout(() => fieldRef.current?.focus(), 50);
        return () => clearTimeout(timer);
      }, [showField]);
      const items: IActionMenuItem[] = [
        { key: 'a', label: 'Editar', onSelect: () => setShowField(true) },
      ];
      return (
        <>
          <ActionMenu label="Outras opções" items={items} />
          {showField && <input aria-label="Campo" ref={fieldRef} />}
        </>
      );
    }
    render(<Harness />);

    await open();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Editar' }));

    const field = await screen.findByLabelText('Campo');
    const trigger = screen.getByRole('button', { name: /Outras opções/ });
    await vi.waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(trigger).not.toHaveFocus();

    await vi.waitFor(() => expect(field).toHaveFocus());
    expect(trigger).not.toHaveFocus();
  });

  it('fechar por Esc devolve o foco ao botão', async () => {
    render(
      <ActionMenu
        label="Outras opções"
        items={[{ key: 'a', label: 'Exportar', onSelect: vi.fn() }]}
      />
    );

    await open();
    await userEvent.keyboard('{Escape}');

    const trigger = screen.getByRole('button', { name: /Outras opções/ });
    await vi.waitFor(() => expect(trigger).toHaveFocus());
  });

  it('fechar por clique fora devolve o foco ao botão', async () => {
    render(
      <>
        <button type="button">Fora</button>
        <ActionMenu
          label="Outras opções"
          items={[{ key: 'a', label: 'Exportar', onSelect: vi.fn() }]}
        />
      </>
    );

    await open();
    fireEvent.pointerDown(document.body);

    const trigger = screen.getByRole('button', { name: /Outras opções/ });
    await vi.waitFor(() => expect(trigger).toHaveFocus());
  });
});
