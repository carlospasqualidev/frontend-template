import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AttachmentRow } from '@/components/global/attachmentRow/attachmentRow';

const revokeObjectURL = vi.fn();

afterEach(() => {
  vi.clearAllMocks();
});

function setup(
  props: Partial<React.ComponentProps<typeof AttachmentRow>> = {}
) {
  URL.revokeObjectURL = revokeObjectURL;
  const onDownload = vi.fn().mockResolvedValue(undefined);
  render(
    <AttachmentRow name="Contrato.pdf" onDownload={onDownload} {...props} />
  );
  return { onDownload };
}

/** O iframe do visualizador: o título do arquivo também está na linha e no cabeçalho. */
async function findFrame(): Promise<HTMLIFrameElement> {
  return waitFor(() => {
    const frame = document.querySelector('iframe');
    expect(frame).not.toBeNull();
    return frame as HTMLIFrameElement;
  });
}

describe('AttachmentRow: baixar', () => {
  it('chama onDownload pelo botão "Baixar <nome>"', async () => {
    const { onDownload } = setup();

    await userEvent.click(
      screen.getByRole('button', { name: 'Baixar Contrato.pdf' })
    );

    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('falha no download não gera rejeição solta', async () => {
    const onDownload = vi.fn().mockRejectedValue(new Error('falhou'));
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    setup({ onDownload });

    await userEvent.click(
      screen.getByRole('button', { name: 'Baixar Contrato.pdf' })
    );
    await waitFor(() => expect(onDownload).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));

    process.off('unhandledRejection', unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });

  it('hideDownload esconde o botão', () => {
    setup({ hideDownload: true });

    expect(
      screen.queryByRole('button', { name: /Baixar/ })
    ).not.toBeInTheDocument();
  });

  it('disabled: aria-disabled, motivo no nome e clique sem efeito', async () => {
    const { onDownload } = setup({
      disabled: true,
      disabledReason: 'Sem permissão',
    });
    const button = screen.getByRole('button', {
      name: 'Baixar Contrato.pdf: Sem permissão',
    });

    await userEvent.click(button);

    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(onDownload).not.toHaveBeenCalled();
  });
});

describe('AttachmentRow: renomear', () => {
  it('Enter grava o nome com a extensão fixa', async () => {
    const onRename = vi.fn().mockResolvedValue(undefined);
    setup({ onRename });

    await userEvent.click(
      screen.getByRole('button', { name: 'Renomear Contrato.pdf' })
    );
    const input = screen.getByRole('textbox', {
      name: 'Novo nome de Contrato.pdf',
    });
    expect(screen.getByText('.pdf')).toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, 'Novo{Enter}');

    expect(onRename).toHaveBeenCalledWith('Novo.pdf');
  });

  it('Esc desiste; vazio e igual ao atual não chamam onRename', async () => {
    const onRename = vi.fn().mockResolvedValue(undefined);
    setup({ onRename });
    const open = () =>
      userEvent.click(
        screen.getByRole('button', { name: 'Renomear Contrato.pdf' })
      );

    await open();
    await userEvent.type(screen.getByRole('textbox'), 'X{Escape}');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    await open();
    await userEvent.type(screen.getByRole('textbox'), '{Enter}');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    await open();
    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), '   {Enter}');
    expect(onRename).not.toHaveBeenCalled();
  });

  it('Enter não envia formulário externo', async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <AttachmentRow
          name="Contrato.pdf"
          onDownload={vi.fn()}
          onRename={vi.fn().mockResolvedValue(undefined)}
        />
      </form>
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Renomear Contrato.pdf' })
    );
    await userEvent.type(screen.getByRole('textbox'), ' B{Enter}');

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('só a extensão digitada não grava', async () => {
    const onRename = vi.fn().mockResolvedValue(undefined);
    setup({ onRename });

    await userEvent.click(
      screen.getByRole('button', { name: 'Renomear Contrato.pdf' })
    );
    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), '.pdf{Enter}');

    expect(onRename).not.toHaveBeenCalled();
  });

  it('se onRename rejeita, o campo continua aberto com o texto', async () => {
    const onRename = vi.fn().mockRejectedValue(new Error('falhou'));
    setup({ onRename });

    await userEvent.click(
      screen.getByRole('button', { name: 'Renomear Contrato.pdf' })
    );
    await userEvent.type(screen.getByRole('textbox'), ' B{Enter}');

    await waitFor(() =>
      expect(onRename).toHaveBeenCalledWith('Contrato B.pdf')
    );
    expect(screen.getByRole('textbox')).toHaveValue('Contrato B');
  });

  it('sem onRename não há lápis', () => {
    setup();

    expect(
      screen.queryByRole('button', { name: /Renomear/ })
    ).not.toBeInTheDocument();
  });
});

describe('AttachmentRow: visualizador', () => {
  it('sem getPreviewUrl, o nome é texto', () => {
    setup();

    expect(
      screen.queryByRole('button', { name: 'Contrato.pdf' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Contrato.pdf')).toBeInTheDocument();
  });

  it.each([{ disabled: true }, { hideDownload: true }])(
    'com %o o nome continua texto',
    (props) => {
      setup({ getPreviewUrl: vi.fn(), ...props });

      expect(
        screen.queryByRole('button', { name: 'Contrato.pdf' })
      ).not.toBeInTheDocument();
    }
  );

  it('PDF abre em iframe sem sandbox; o blob: é pedido só ao abrir e revogado ao fechar', async () => {
    const getPreviewUrl = vi.fn().mockResolvedValue('blob:pdf');
    setup({ getPreviewUrl });
    expect(getPreviewUrl).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Contrato.pdf' }));

    const frame = await findFrame();
    expect(getPreviewUrl).toHaveBeenCalledWith('pdf');
    expect(frame.tagName).toBe('IFRAME');
    expect(frame).not.toHaveAttribute('sandbox');

    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:pdf')
    );
  });

  it('texto leva sandbox vazio e fundo claro', async () => {
    setup({
      name: 'a.txt',
      getPreviewUrl: vi.fn().mockResolvedValue('blob:txt'),
    });

    await userEvent.click(screen.getByRole('button', { name: 'a.txt' }));

    const frame = await findFrame();
    expect(frame).toHaveAttribute('sandbox', '');
    expect(frame).toHaveClass('bg-white');
  });

  it('imagem abre em <img>', async () => {
    setup({
      name: 'a.png',
      getPreviewUrl: vi.fn().mockResolvedValue('blob:img'),
    });

    await userEvent.click(screen.getByRole('button', { name: 'a.png' }));

    expect(await screen.findByRole('img', { name: 'a.png' })).toHaveAttribute(
      'src',
      'blob:img'
    );
  });

  it('formato none não pede endereço e oferece "Baixar arquivo"', async () => {
    const getPreviewUrl = vi.fn();
    const { onDownload } = setup({ name: 'a.zip', getPreviewUrl });

    await userEvent.click(screen.getByRole('button', { name: 'a.zip' }));

    expect(screen.getByText('Visualização não disponível')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Baixar arquivo' })
    );
    expect(getPreviewUrl).not.toHaveBeenCalled();
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('falha ao buscar mostra "Visualização não disponível"', async () => {
    setup({ getPreviewUrl: vi.fn().mockRejectedValue(new Error('x')) });

    await userEvent.click(screen.getByRole('button', { name: 'Contrato.pdf' }));

    expect(
      await screen.findByText('Visualização não disponível')
    ).toBeInTheDocument();
  });

  it('resposta que chega depois de fechar é descartada e revogada', async () => {
    let resolve: (url: string) => void = () => undefined;
    const getPreviewUrl = vi.fn(
      () => new Promise<string>((done) => (resolve = done))
    );
    setup({ getPreviewUrl });

    await userEvent.click(screen.getByRole('button', { name: 'Contrato.pdf' }));
    await userEvent.keyboard('{Escape}');
    resolve('blob:late');

    await waitFor(() =>
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:late')
    );
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('"Baixar" no alto do modal chama onDownload', async () => {
    const { onDownload } = setup({
      getPreviewUrl: vi.fn().mockResolvedValue('blob:pdf'),
    });

    await userEvent.click(screen.getByRole('button', { name: 'Contrato.pdf' }));
    await findFrame();
    const header = screen
      .getByRole('dialog')
      .querySelector<HTMLElement>('[data-slot="dialog-header"]');
    const download = within(header!).getByRole('button', {
      name: 'Baixar Contrato.pdf',
    });
    await userEvent.click(download);

    expect(onDownload).toHaveBeenCalledTimes(1);
  });
});
