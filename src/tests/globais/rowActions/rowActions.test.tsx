import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  RowActions,
  type RowAction,
} from '@/components/global/rowActions/rowActions';

function action(overrides: Partial<RowAction> = {}): RowAction {
  return {
    key: 'edit',
    label: 'Editar pedido',
    icon: <span aria-hidden>✎</span>,
    onSelect: vi.fn(),
    ...overrides,
  };
}

describe('RowActions', () => {
  it('renderiza um botão por ação, com o rótulo como nome acessível', () => {
    render(
      <RowActions
        actions={[
          action(),
          action({ key: 'delete', label: 'Excluir', tone: 'destructive' }),
        ]}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Editar pedido' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument();
  });

  it('dispara onSelect ao clicar na ação', async () => {
    const onSelect = vi.fn();
    render(<RowActions actions={[action({ onSelect })]} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Editar pedido' })
    );

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('mantém a ação indisponível VISÍVEL e desabilitada (posição estável na linha)', async () => {
    const onSelect = vi.fn();
    render(
      <RowActions
        actions={[
          action({
            key: 'output',
            label: 'Autorizar',
            disabled: true,
            disabledReason: 'Autorizar — disponível após a inspeção',
            onSelect,
          }),
        ]}
      />
    );

    const button = screen.getByRole('button', { name: 'Autorizar' });
    expect(button).toBeDisabled();

    await userEvent.click(button);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('revela o tooltip da ação no hover (traz o próprio provider)', async () => {
    const user = userEvent.setup();
    render(
      <RowActions actions={[action({ label: 'Consultar alterações' })]} />
    );

    await user.hover(
      screen.getByRole('button', { name: 'Consultar alterações' })
    );

    // O Radix duplica o conteúdo (visível + anúncio para leitor de tela).
    expect(
      (await screen.findAllByText('Consultar alterações')).length
    ).toBeGreaterThan(0);
  });

  it('explica o motivo no tooltip quando a ação está indisponível', async () => {
    const user = userEvent.setup();
    render(
      <RowActions
        actions={[
          action({
            label: 'Apontar expedição',
            disabled: true,
            disabledReason:
              'Apontar expedição — disponível após liberar o item',
          }),
        ]}
      />
    );

    // O botão desabilitado não recebe eventos: o gatilho do tooltip é o wrapper.
    await user.hover(
      screen.getByRole('button', { name: 'Apontar expedição' }).parentElement!
    );

    expect(
      (
        await screen.findAllByText(
          'Apontar expedição — disponível após liberar o item'
        )
      ).length
    ).toBeGreaterThan(0);
  });

  it('não propaga o clique para a linha (a ação não abre o registro)', async () => {
    const onRowClick = vi.fn();
    render(
      <div onClick={onRowClick}>
        <RowActions actions={[action()]} />
      </div>
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Editar pedido' })
    );

    expect(onRowClick).not.toHaveBeenCalled();
  });

  // Ação que navega precisa ser um link de verdade: o operador abre a etapa em
  // outra aba com a bolinha do mouse sem perder a listagem filtrada.
  it('ação com href é um link (abre em nova aba pelo clique do meio)', () => {
    render(
      <RowActions
        actions={[
          action({
            key: 'vehicle',
            label: 'Inspecionar',
            href: '/orders/1/inspect',
          }),
        ]}
      />
    );

    const link = screen.getByRole('link', { name: 'Inspecionar' });
    expect(link).toHaveAttribute('href', '/orders/1/inspect');
  });

  it('clique normal no link navega pelo onSelect (SPA), sem recarregar a página', async () => {
    const onSelect = vi.fn();
    render(
      <RowActions actions={[action({ href: '/orders/1/invoice', onSelect })]} />
    );

    await userEvent.click(screen.getByRole('link', { name: 'Editar pedido' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('Ctrl+clique NÃO dispara o onSelect (deixa o navegador abrir em nova aba)', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <RowActions actions={[action({ href: '/orders/1/invoice', onSelect })]} />
    );

    // Mesma instância do `user` para o modificador valer no clique.
    await user.keyboard('{Control>}');
    await user.click(screen.getByRole('link', { name: 'Editar pedido' }));
    await user.keyboard('{/Control}');

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('ação sem href continua sendo botão (abre modal/confirmação)', () => {
    render(
      <RowActions actions={[action({ key: 'delete', label: 'Excluir' })]} />
    );

    expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('sem ações, reserva o espaço de um botão para a linha manter a altura', () => {
    const { container } = render(<RowActions actions={[]} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-hidden]')).toHaveClass('size-7');
  });
});
