import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ConfirmDialog } from '@/components/global/confirmDialog/confirmDialog';

async function openDialog(destructive: boolean): Promise<HTMLElement> {
  render(
    <ConfirmDialog
      title="Excluir registro?"
      description="Esta ação não pode ser desfeita."
      confirmLabel="Excluir"
      destructive={destructive}
      trigger={<button type="button">Abrir</button>}
      onConfirm={() => undefined}
    />
  );
  await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));
  return screen.getByRole('alertdialog');
}

describe('ConfirmDialog (global) — severidade', () => {
  it('destrutivo: filete e chip de ícone vermelhos', async () => {
    const dialog = await openDialog(true);

    expect(dialog).toHaveClass('border-l-4', 'border-l-destructive');
    const icon = dialog.querySelector('[data-slot="confirm-dialog-icon"]');
    expect(icon).toHaveClass('bg-destructive/10', 'text-destructive');
  });

  it('não destrutivo: filete e chip de ícone âmbar', async () => {
    const dialog = await openDialog(false);

    expect(dialog).toHaveClass('border-l-4', 'border-l-warning');
    expect(dialog).not.toHaveClass('border-l-destructive');
    const icon = dialog.querySelector('[data-slot="confirm-dialog-icon"]');
    expect(icon).toHaveClass('bg-warning/10', 'text-warning');
  });

  it('o ícone é decorativo e a severidade não depende da cor: nome e descrição do dialog vêm do texto', async () => {
    const dialog = await openDialog(true);

    const icon = dialog.querySelector('[data-slot="confirm-dialog-icon"]');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(dialog).toHaveAccessibleName('Excluir registro?');
    expect(dialog).toHaveAccessibleDescription(
      'Esta ação não pode ser desfeita.'
    );
  });

  it('não regride: destrutivo abre com o foco em Cancelar, não em Excluir', async () => {
    await openDialog(true);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
    );
    expect(screen.getByRole('button', { name: 'Excluir' })).not.toHaveFocus();
  });
});
