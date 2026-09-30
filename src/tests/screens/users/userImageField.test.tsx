import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { useZodForm } from '@/lib/forms/useZodForm';
import {
  editUserFormSchema,
  EMPTY_USER_FORM_VALUES,
  type UserFormValues,
} from '@/screens/users/utils/userForm';
import { UserImageField } from '@/screens/users/utils/userImageField';
import { uploadFile } from '@/services/api/upload';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

vi.mock('@/services/api/upload', () => ({
  uploadFile: vi.fn(
    async (file: File) => `https://bucket.example.com/uploads/${file.name}`
  ),
}));

// O valor do campo aparece num `output` para o teste ler o que vai ao servidor.
function Harness({
  image = null,
  readOnly,
}: {
  image?: string | null;
  readOnly?: boolean;
}) {
  const { control, watch } = useZodForm({
    schema: editUserFormSchema,
    defaultValues: {
      ...EMPTY_USER_FORM_VALUES,
      image,
    } satisfies UserFormValues,
  });
  return (
    <>
      <UserImageField control={control} readOnly={readOnly} />
      <output aria-label="Valor da foto">{watch('image') ?? 'sem foto'}</output>
    </>
  );
}

function fileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('Campo de arquivo ausente.');
  return input;
}

describe('UserImageField', () => {
  it('sobe a foto e guarda a URL devolvida pelo upload', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);

    await user.upload(
      fileInput(container),
      new File(['x'], 'foto.png', { type: 'image/png' })
    );

    await waitFor(() =>
      expect(screen.getByLabelText('Valor da foto')).toHaveTextContent(
        'https://bucket.example.com/uploads/foto.png'
      )
    );
    expect(uploadFile).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('img', { name: 'Foto do usuário' })
    ).toBeInTheDocument();
  });

  it('a foto nova substitui a anterior', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Harness image="https://bucket.example.com/uploads/antiga.png" />
    );

    await user.upload(
      fileInput(container),
      new File(['x'], 'nova.png', { type: 'image/png' })
    );

    await waitFor(() =>
      expect(screen.getByLabelText('Valor da foto')).toHaveTextContent(
        'https://bucket.example.com/uploads/nova.png'
      )
    );
    expect(
      screen.getAllByRole('img', { name: 'Foto do usuário' })
    ).toHaveLength(1);
  });

  it('remover grava null', async () => {
    const user = userEvent.setup();
    render(<Harness image="https://bucket.example.com/uploads/antiga.png" />);

    await user.click(
      screen.getByRole('button', { name: 'Remover imagem Foto do usuário' })
    );

    expect(screen.getByLabelText('Valor da foto')).toHaveTextContent(
      'sem foto'
    );
  });

  it('em leitura, mostra a foto sem subir nem remover', () => {
    const { container } = render(
      <Harness image="https://bucket.example.com/uploads/antiga.png" readOnly />
    );

    expect(
      screen.getByRole('img', { name: 'Foto do usuário' })
    ).toBeInTheDocument();
    expect(container.querySelector('input[type="file"]')).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Remover imagem Foto do usuário' })
    ).not.toBeInTheDocument();
  });
});
