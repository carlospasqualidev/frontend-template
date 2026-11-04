import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AlertDialogFooter } from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';

const CENTERED = ['flex-wrap', 'justify-center', 'gap-2'];
const SOLO_BUTTON = '[&>button:only-of-type]:basis-full';
const TEXT_LINE = '[&>:not(button)]:basis-full';

describe.each([
  ['DialogFooter', DialogFooter, 'dialog-footer'],
  ['AlertDialogFooter', AlertDialogFooter, 'alert-dialog-footer'],
])('%s (ui)', (_name, Footer, slot) => {
  it('centraliza, quebra de linha e usa a regra do botão único', () => {
    render(
      <Footer>
        <button type="button">Cancelar</button>
        <button type="button">Confirmar</button>
      </Footer>
    );

    const footer = document.querySelector(`[data-slot="${slot}"]`);
    expect(footer).toHaveClass(...CENTERED, SOLO_BUTTON, TEXT_LINE);
    expect(footer).not.toHaveClass('flex-col-reverse');
  });

  it('mantém Cancelar antes de Confirmar na ordem do DOM', () => {
    render(
      <Footer>
        <button type="button">Cancelar</button>
        <button type="button">Confirmar</button>
      </Footer>
    );

    const names = screen.getAllByRole('button').map((b) => b.textContent);
    expect(names).toEqual(['Cancelar', 'Confirmar']);
  });
});

describe('DialogFooter (ui)', () => {
  it('com showCloseButton, renderiza Fechar antes do botão positivo no DOM', () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Título</DialogTitle>
          <DialogFooter showCloseButton>
            <button type="button">Salvar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    const names = screen.getAllByRole('button').map((b) => b.textContent);
    expect(names).toEqual(['Fechar', 'Salvar']);
  });

  it('mantém a faixa com fundo e a borda superior', () => {
    render(
      <DialogFooter>
        <button type="button">Salvar</button>
      </DialogFooter>
    );

    expect(document.querySelector('[data-slot="dialog-footer"]')).toHaveClass(
      '-mx-4',
      '-mb-4',
      'border-t',
      'bg-muted/50'
    );
  });
});

describe('AlertDialogFooter (ui)', () => {
  it('mantém a variante size=sm em duas colunas', () => {
    render(
      <AlertDialogFooter>
        <button type="button">Cancelar</button>
      </AlertDialogFooter>
    );

    expect(
      document.querySelector('[data-slot="alert-dialog-footer"]')
    ).toHaveClass(
      'group-data-[size=sm]/alert-dialog-content:grid',
      'group-data-[size=sm]/alert-dialog-content:grid-cols-2'
    );
  });
});
