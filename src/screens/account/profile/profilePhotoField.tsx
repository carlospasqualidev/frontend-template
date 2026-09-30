import { type Dispatch, type SetStateAction } from 'react';
import { useController, type Control } from 'react-hook-form';

import {
  ImageUploadField,
  type UploadedImage,
} from '@/components/global/imageUploadField/imageUploadField';
import { FieldError } from '@/components/ui/field';
import { resolveFieldErrors } from '@/lib/forms/errors';
import { type ProfileFormValues } from '@/screens/account/profile/profileForm';

const PHOTO_NAME = 'Sua foto';

/**
 * Foto do perfil: o `ImageUploadField` global (upload em
 * `POST /client/upload/file`) com uma foto só. O campo guarda a URL devolvida
 * (`Location`); a nova substitui a anterior e remover grava `null`. A URL só
 * vai ao servidor no "Salvar alterações".
 */
export function ProfilePhotoField({
  control,
}: {
  control: Control<ProfileFormValues>;
}) {
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
        hint="PNG ou JPG. A foto nova substitui a anterior."
      />
      <FieldError errors={resolveFieldErrors(error)} />
    </div>
  );
}
