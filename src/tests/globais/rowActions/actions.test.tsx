import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  blockAction,
  copyAction,
  deleteAction,
  downloadAction,
  editAction,
  retryAction,
  unblockAction,
} from '@/components/global/rowActions/actions';
import {
  RowActions,
  type RowAction,
} from '@/components/global/rowActions/rowActions';

const catalog = [
  { factory: editAction, key: 'edit', label: 'Editar', tone: 'info' },
  {
    factory: deleteAction,
    key: 'delete',
    label: 'Excluir',
    tone: 'destructive',
  },
  { factory: downloadAction, key: 'download', label: 'Baixar', tone: 'brand' },
  {
    factory: retryAction,
    key: 'retry',
    label: 'Tentar de novo',
    tone: 'neutral',
  },
  { factory: copyAction, key: 'copy', label: 'Copiar', tone: 'neutral' },
  { factory: blockAction, key: 'block', label: 'Bloquear', tone: 'warning' },
  {
    factory: unblockAction,
    key: 'unblock',
    label: 'Desbloquear',
    tone: 'success',
  },
] as const;

describe('catálogo de ações de linha', () => {
  it.each(catalog)(
    '$key: fixa key, rótulo e tom, e traz ícone',
    ({ factory, key, label, tone }) => {
      const action = factory(vi.fn());

      expect(action.key).toBe(key);
      expect(action.label).toBe(label);
      expect(action.tone).toBe(tone);
      expect(action.icon).toBeTruthy();
    }
  );

  it('overrides trocam rótulo, disabled, motivo e href, mas não a key nem o tom', () => {
    const action = editAction(vi.fn(), {
      label: 'Editar Maria',
      disabled: true,
      disabledReason: 'Sem permissão',
      href: '/users/1',
    });

    expect(action).toMatchObject({
      key: 'edit',
      tone: 'info',
      label: 'Editar Maria',
      disabled: true,
      disabledReason: 'Sem permissão',
      href: '/users/1',
    });
  });

  it('override com valor undefined não apaga o padrão da ação', () => {
    const action = editAction(vi.fn(), {
      label: undefined,
      disabled: undefined,
    });

    expect(action.label).toBe('Editar');
    expect(action.disabled).toBeUndefined();
    expect(action.tone).toBe('info');
  });

  it('dois copyAction na mesma linha mantêm a key e se distinguem pelo rótulo', () => {
    const first = copyAction(vi.fn(), { label: 'Copiar e-mail' });
    const second = copyAction(vi.fn(), { label: 'Copiar código' });

    expect(first.key).toBe(second.key);
    expect(first.label).not.toBe(second.label);
  });

  it('o clique chama o onSelect da tela', async () => {
    const onSelect = vi.fn();
    const actions: RowAction[] = [deleteAction(onSelect)];
    render(<RowActions actions={actions} />);

    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('o tom do catálogo chega ao botão', () => {
    render(<RowActions actions={[blockAction(vi.fn())]} />);

    expect(screen.getByRole('button', { name: 'Bloquear' })).toHaveClass(
      'bg-warning/10'
    );
  });
});
