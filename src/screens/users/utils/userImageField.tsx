import { type Dispatch, type SetStateAction } from 'react';
import { useController, type Control } from 'react-hook-form';

import {
  ImageUploadField,
  type UploadedImage,
} from '@/components/global/imageUploadField/imageUploadField';
import { FieldError } from '@/components/ui/field';
import { resolveFieldErrors } from '@/lib/forms/errors';
import { type UserFormValues } from '@/screens/users/utils/userForm';

const PHOTO_NAME = 'Foto do usuário';

interface UserImageFieldProps {
  control: Control<UserFormValues>;
  readOnly?: boolean;
}

/**
 * Foto do usuário: o `ImageUploadField` global (upload em
 * `POST /client/upload/file`) com uma foto só. O campo guarda a URL devolvida
 * (`Location`); a foto nova substitui a anterior e remover grava `null`. A URL
 * só vai ao servidor no "Salvar"/"Criar" do formulário.
 */
export function UserImageField({ control, readOnly }: UserImageFieldProps) {
  const {
    field,
    fieldState: { error },
  } = useController({ control, name: 'image' });

  const images: UploadedImage[] = field.value
    ? [{ name: PHOTO_NAME, url: field.value }]
    : [];

  const handleChange: Dispatch<SetStateAction<UploadedImage[]>> = (next) => {
    const resolved = typeof next === 'function' ? next(images) : next;
    field.onChange(resolved.at(-1)?.url ?? null);
  };

  return (
    <div className="space-y-2">
      <ImageUploadField
        images={images}
        onChange={handleChange}
        readOnly={readOnly}
        hint="PNG ou JPG. A foto nova substitui a anterior."
      />
      <FieldError errors={resolveFieldErrors(error)} />
    </div>
  );
}
