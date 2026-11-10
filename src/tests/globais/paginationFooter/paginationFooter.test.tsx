import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  PaginationFooter,
  type IPaginationFooterProps,
} from '@/components/global/paginationFooter/paginationFooter';

function renderComponent(props: Partial<IPaginationFooterProps> = {}) {
  const onPageChange = vi.fn();
  const onPageSizeChange = vi.fn();
  render(
    <PaginationFooter
      pageIndex={1}
      pageSize={25}
      hasNextPage
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      {...props}
    />
  );
  return { onPageChange, onPageSizeChange };
}

describe('PaginationFooter', () => {
  it('no meio: Anterior e Próxima levam à página vizinha (base 0)', async () => {
    const { onPageChange } = renderComponent();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Anterior' }));
    await user.click(screen.getByRole('button', { name: 'Próxima' }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 0);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 2);
  });

  it('nas pontas: primeira página desabilita Anterior, sem próxima desabilita Próxima', () => {
    const { unmount } = render(
      <PaginationFooter
        pageIndex={0}
        pageSize={25}
        hasNextPage
        onPageChange={() => undefined}
      />
    );
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeEnabled();
    unmount();

    renderComponent({ hasNextPage: false });
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();
  });

  it('carregando: botões e seletor ficam desabilitados', () => {
    renderComponent({ isLoading: true });

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();
    expect(
      screen.getByRole('combobox', { name: 'Itens por página' })
    ).toBeDisabled();
  });

  it('com seletor: mostra o tamanho atual rotulado "Itens por página"', () => {
    renderComponent({ pageSize: 50 });

    expect(screen.getByText('Itens por página')).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Itens por página' })
    ).toHaveTextContent('50');
  });

  it('sem onPageSizeChange: não mostra o seletor', () => {
    renderComponent({ onPageSizeChange: undefined });

    expect(screen.queryByText('Itens por página')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('pageSize fora das opções: sem seletor, e os botões seguem', async () => {
    const { onPageChange } = renderComponent({ pageSize: 30 });
    const user = userEvent.setup();

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('trocar o tamanho avisa o novo valor', async () => {
    const { onPageSizeChange } = renderComponent();
    const user = userEvent.setup();

    await user.click(
      screen.getByRole('combobox', { name: 'Itens por página' })
    );
    await user.click(await screen.findByRole('option', { name: '100' }));

    expect(onPageSizeChange).toHaveBeenCalledWith(100);
  });

  it('mostra o resumo entre o seletor e os botões, só quando recebe', () => {
    const { unmount } = render(
      <PaginationFooter
        pageIndex={0}
        pageSize={25}
        hasNextPage
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
        summary="42 registros"
      />
    );
    const summary = screen.getByText('42 registros');
    const select = screen.getByRole('combobox', { name: 'Itens por página' });
    const next = screen.getByRole('button', { name: 'Próxima' });
    expect(
      select.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      summary.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    unmount();

    renderComponent();
    expect(screen.queryByText('42 registros')).not.toBeInTheDocument();
  });
});
