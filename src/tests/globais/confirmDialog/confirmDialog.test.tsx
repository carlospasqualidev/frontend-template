import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from '@/components/global/confirmDialog/confirmDialog';

describe('ConfirmDialog (global) — modo uncontrolled', () => {
  it('abre via trigger e renderiza title/description', async () => {
    render(
      <ConfirmDialog
        title="Excluir registro?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        trigger={<button type="button">Excluir</button>}
        onConfirm={() => undefined}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    expect(screen.getByText('Excluir registro?')).toBeInTheDocument();
    expect(
      screen.getByText('Esta ação não pode ser desfeita.')
    ).toBeInTheDocument();
  });

  it('dispara onConfirm e fecha o dialog após confirmar', async () => {
    const handleConfirm = vi.fn();
    render(
      <ConfirmDialog
        title="Excluir?"
        description="..."
        confirmLabel="Excluir"
        destructive
        trigger={<button type="button">Abrir</button>}
        onConfirm={handleConfirm}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    await userEvent.click(
      screen.getAllByRole('button', { name: 'Excluir' })[0]
    );

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByText('Excluir?')).not.toBeInTheDocument();
    });
  });

  // A rejeição é o sinal de "não deu certo" (quem rejeita já avisou o
  // usuário): o dialog continua aberto, o botão volta a responder e a
  // rejeição não escapa do clique (o Vitest falharia com ela solta).
  it('fica aberto quando onConfirm rejeita, sem rejeição solta', async () => {
    const handleConfirm = vi
      .fn()
      .mockRejectedValueOnce(new Error('recusado pelo servidor'))
      .mockResolvedValueOnce(undefined);
    render(
      <ConfirmDialog
        title="Excluir?"
        description="..."
        confirmLabel="Excluir"
        destructive
        trigger={<button type="button">Abrir</button>}
        onConfirm={handleConfirm}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(handleConfirm).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Excluir?')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Excluir' })).toBeEnabled()
    );

    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    await waitFor(() => {
      expect(screen.queryByText('Excluir?')).not.toBeInTheDocument();
    });
  });

  it('cancela sem disparar onConfirm', async () => {
    const handleConfirm = vi.fn();
    render(
      <ConfirmDialog
        title="Excluir?"
        description="..."
        trigger={<button type="button">Abrir</button>}
        onConfirm={handleConfirm}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(handleConfirm).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText('Excluir?')).not.toBeInTheDocument();
    });
  });
});

function DoubleConfirmationHarness() {
  const [showSecondStep, setShowSecondStep] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div>
      <ConfirmDialog
        title="Bloquear usuário?"
        description="A ação é irreversível."
        confirmLabel="Continuar"
        destructive
        trigger={<button type="button">Bloquear usuário</button>}
        onConfirm={() => setShowSecondStep(true)}
      />

      {showSecondStep && (
        <div>
          <input
            aria-label="Palavra de confirmação"
            placeholder="BLOQUEAR"
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
          />
          <button
            type="button"
            onClick={() => {
              if (confirmationText === 'BLOQUEAR') {
                setConfirmed(true);
              }
            }}
          >
            Confirmar bloqueio
          </button>
        </div>
      )}

      {confirmed && <p>Usuário bloqueado com sucesso.</p>}
    </div>
  );
}

describe('ConfirmDialog (global) — modo controlled', () => {
  function ControlledHarness({
    onConfirm,
  }: {
    onConfirm: () => void | Promise<void>;
  }) {
    const [open, setOpen] = useState(false);

    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Abrir via externo
        </button>
        <ConfirmDialog
          open={open}
          setOpen={setOpen}
          title="Excluir registro?"
          description="Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          destructive
          onConfirm={onConfirm}
        />
      </>
    );
  }

  it('abre via setOpen externo e dispara onConfirm', async () => {
    const handleConfirm = vi.fn();
    render(<ControlledHarness onConfirm={handleConfirm} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Abrir via externo' })
    );
    expect(screen.getByText('Excluir registro?')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByText('Excluir registro?')).not.toBeInTheDocument();
    });
  });
  it('executa confirmação dupla apenas após validar o texto exato', async () => {
    render(<DoubleConfirmationHarness />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Bloquear usuário' })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(
      screen.getByRole('textbox', { name: 'Palavra de confirmação' })
    ).toBeInTheDocument();

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Palavra de confirmação' }),
      'BLOQUEAR'
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Confirmar bloqueio' })
    );

    expect(
      screen.getByText('Usuário bloqueado com sucesso.')
    ).toBeInTheDocument();
  });
});
