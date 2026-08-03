import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  ImageUploadField,
  type UploadedImage,
} from '@/components/global/imageUploadField/imageUploadField';

vi.mock('@/services/api/upload', () => ({
  uploadFile: vi.fn(async (file: File) => `http://x/${file.name}`),
}));

function makeImage(name: string): File {
  return new File(['binário'], name, { type: 'image/png' });
}

const IMAGES: UploadedImage[] = [
  { id: '1', name: 'frente.png', url: 'http://x/frente.png', type: 'stamp' },
  {
    id: '2',
    name: 'produto.png',
    url: 'http://x/produto.png',
    type: 'product',
  },
];

describe('ImageUploadField (global)', () => {
  it('mostra o rótulo e as prévias (filtrando pelo type quando informado)', () => {
    render(
      <ImageUploadField
        label="Foto da frente"
        type="stamp"
        images={IMAGES}
        onChange={() => undefined}
      />
    );

    expect(screen.getByText('Foto da frente')).toBeInTheDocument();
    // Só a imagem do type "stamp" aparece.
    expect(screen.getByRole('img', { name: 'frente.png' })).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: 'produto.png' })
    ).not.toBeInTheDocument();
  });

  it('sem type, mostra todas as imagens (galeria única)', () => {
    render(<ImageUploadField images={IMAGES} onChange={() => undefined} />);
    expect(screen.getByRole('img', { name: 'frente.png' })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'produto.png' })
    ).toBeInTheDocument();
  });

  it('o "X" tem tooltip/aria-label e remove a imagem (updater funcional)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ImageUploadField type="stamp" images={IMAGES} onChange={onChange} />
    );

    await user.click(
      screen.getByRole('button', { name: 'Remover imagem frente.png' })
    );

    // onChange recebe um updater funcional; aplicá-lo ao estado atual remove a imagem.
    const updater = onChange.mock.calls[0]![0] as (
      prev: UploadedImage[]
    ) => UploadedImage[];
    expect(updater(IMAGES)).toEqual([IMAGES[1]]);
  });

  it('envia VÁRIAS fotos escolhidas de uma vez e anexa todas', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <ImageUploadField type="stamp" images={[]} onChange={onChange} />
    );

    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input.multiple).toBe(true);

    await user.upload(input, [
      makeImage('foto-1.png'),
      makeImage('foto-2.png'),
    ]);

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    const updater = onChange.mock.calls[0]![0] as (
      prev: UploadedImage[]
    ) => UploadedImage[];
    expect(updater([])).toEqual([
      { name: 'foto-1.png', url: 'http://x/foto-1.png', type: 'stamp' },
      { name: 'foto-2.png', url: 'http://x/foto-2.png', type: 'stamp' },
    ]);
  });

  it('readOnly esconde o remover e o dropzone', () => {
    render(
      <ImageUploadField
        label="Fotos"
        images={IMAGES}
        onChange={() => undefined}
        readOnly
      />
    );

    expect(
      screen.queryByRole('button', { name: /Remover imagem/ })
    ).not.toBeInTheDocument();
    // O FileDropzone (input de arquivo) não é renderizado em modo leitura.
    expect(screen.queryByText('PNG ou JPG')).not.toBeInTheDocument();
  });
});
