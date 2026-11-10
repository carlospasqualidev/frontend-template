import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FilePickerButton } from '@/components/global/filePickerButton/filePickerButton';

function makeFile(name: string): File {
  return new File(['conteudo'], name, { type: 'application/pdf' });
}

function getInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector<HTMLInputElement>('input[type="file"]')!;
}

describe('FilePickerButton (global)', () => {
  it('renderiza só o ícone com nome acessível e input oculto fora da tabulação', () => {
    const { container } = render(
      <FilePickerButton label="Anexar documento" onFiles={() => undefined} />
    );

    expect(
      screen.getByRole('button', { name: 'Anexar documento' })
    ).toBeInTheDocument();
    const input = getInput(container);
    expect(input.multiple).toBe(true);
    expect(input).toHaveClass('sr-only');
    expect(input).toHaveAttribute('aria-hidden', 'true');
    expect(input).toHaveAttribute('tabindex', '-1');
  });

  it('abre o seletor do sistema ao clicar, sem modal', async () => {
    const { container } = render(
      <FilePickerButton label="Anexar documento" onFiles={() => undefined} />
    );
    const clickSpy = vi.spyOn(getInput(container), 'click');

    await userEvent.click(
      screen.getByRole('button', { name: 'Anexar documento' })
    );

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('entrega todos os arquivos escolhidos e repassa accept', async () => {
    const handleFiles = vi.fn();
    const { container } = render(
      <FilePickerButton
        label="Anexar documento"
        onFiles={handleFiles}
        accept=".pdf"
      />
    );
    const input = getInput(container);
    expect(input).toHaveAttribute('accept', '.pdf');

    await userEvent.upload(input, [makeFile('a.pdf'), makeFile('b.pdf')]);

    expect(handleFiles).toHaveBeenCalledTimes(1);
    expect(
      (handleFiles.mock.calls[0][0] as File[]).map((file) => file.name)
    ).toEqual(['a.pdf', 'b.pdf']);
  });

  it('não chama onFiles quando nada é escolhido', async () => {
    const handleFiles = vi.fn();
    const { container } = render(
      <FilePickerButton label="Anexar documento" onFiles={handleFiles} />
    );

    const input = getInput(container);
    // Diálogo cancelado: o `change` chega com a lista vazia.
    fireEvent.change(input, { target: { files: [] } });

    expect(handleFiles).not.toHaveBeenCalled();
  });

  it('dispara onFiles de novo ao escolher o mesmo arquivo duas vezes seguidas', async () => {
    const handleFiles = vi.fn();
    const { container } = render(
      <FilePickerButton label="Anexar documento" onFiles={handleFiles} />
    );
    const input = getInput(container);
    const file = makeFile('a.pdf');

    await userEvent.upload(input, file);
    expect(input.value).toBe('');
    await userEvent.upload(input, file);

    expect(handleFiles).toHaveBeenCalledTimes(2);
  });

  it('desabilitado: botão focável com aria-disabled, não abre o seletor e mostra o motivo no foco', async () => {
    const { container } = render(
      <FilePickerButton
        label="Anexar documento"
        onFiles={() => undefined}
        disabled
        disabledReason="Enviando os arquivos escolhidos"
      />
    );
    const clickSpy = vi.spyOn(getInput(container), 'click');
    const button = screen.getByRole('button', {
      name: 'Anexar documento: Enviando os arquivos escolhidos',
    });
    expect(button).toHaveAttribute('aria-disabled', 'true');

    await userEvent.tab();
    expect(button).toHaveFocus();
    expect(
      await screen.findByRole('tooltip', {
        name: 'Enviando os arquivos escolhidos',
      })
    ).toBeInTheDocument();

    await userEvent.click(button);
    expect(clickSpy).not.toHaveBeenCalled();
    expect(getInput(container)).toHaveAttribute('tabindex', '-1');
  });
});
