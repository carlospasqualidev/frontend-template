import { useState, type Dispatch, type SetStateAction } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/global/button/button';
import { FileDropzone } from '@/components/global/fileDropzone/fileDropzone';
import { Typography } from '@/components/ui/typography';
import { uploadFile } from '@/services/api/upload';

/** Forma mínima de uma imagem anexada (o backend pode devolver `id`). */
export interface UploadedImage {
  id?: string;
  name: string;
  url: string;
  type?: string;
}

interface ImageUploadFieldProps<T extends UploadedImage> {
  images: T[];
  /**
   * Setter de estado (updater funcional). Precisa ser funcional: quando duas seções
   * compartilham o mesmo array, dois uploads quase simultâneos partiriam do mesmo
   * `images` capturado e um sobrescreveria o outro.
   */
  onChange: Dispatch<SetStateAction<T[]>>;
  /**
   * Quando informado, a galeria mostra só as imagens deste `type` e novos uploads
   * são marcados com ele — para várias seções de foto na mesma tela dividirem um
   * único array. Omitido = galeria única (sem tipo).
   */
  type?: string;
  /** Rótulo da seção (ex.: "Foto do produto"). */
  label?: string;
  readOnly?: boolean;
  accept?: string;
  hint?: string;
}

/**
 * Upload + galeria de imagens (com prévia e remoção). Abstração única para
 * QUALQUER tela que anexa fotos — nunca duplique o par dropzone+galeria numa tela.
 * Sobe as fotos escolhidas em paralelo e anexa só as que subiram.
 */
export function ImageUploadField<T extends UploadedImage>({
  images,
  onChange,
  type,
  label,
  readOnly,
  accept = 'image/png,image/jpeg',
  hint = 'PNG ou JPG',
}: ImageUploadFieldProps<T>) {
  const [uploadingCount, setUploadingCount] = useState(0);
  const busy = uploadingCount > 0;

  const galleryImages = type
    ? images.filter((image) => image.type === type)
    : images;

  /** Sobe todas as fotos escolhidas de uma vez (em paralelo) e anexa as que subiram. */
  async function handleFilesChange(selected: File[]) {
    setUploadingCount(selected.length);
    try {
      const results = await Promise.allSettled(
        selected.map(async (item) => {
          const url = await uploadFile(item);
          return { name: item.name, url, ...(type ? { type } : {}) } as T;
        })
      );
      // Uma foto que falhou não impede as demais (o interceptor do api já avisou).
      const uploaded = results.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : []
      );
      if (uploaded.length === 0) return;

      // Updater funcional: parte do estado ATUAL, não do `images` capturado —
      // evita que um upload simultâneo de outra seção sobrescreva este.
      onChange((previous) => [...previous, ...uploaded]);
      toast.success(
        uploaded.length === 1
          ? 'Imagem adicionada.'
          : `${uploaded.length} imagens adicionadas.`
      );
    } finally {
      setUploadingCount(0);
    }
  }

  function remove(image: T) {
    onChange((previous) => previous.filter((current) => current !== image));
  }

  return (
    <div className="space-y-3">
      {label && (
        <Typography as="p" variant="small" className="font-medium">
          {label}
        </Typography>
      )}

      {galleryImages.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {galleryImages.map((image) => (
            <div key={image.id ?? image.url} className="relative">
              <a href={image.url} target="_blank" rel="noreferrer">
                <img
                  src={image.url}
                  alt={image.name}
                  className="size-24 rounded-md border object-cover"
                />
              </a>
              {!readOnly && (
                // Fundo neutro (variante `secondary`) fixo para o X ter contraste
                // sobre qualquer imagem; X preto (padrão do sistema). O hover mantém
                // o fundo e apenas realça a borda (ring). Flutua no canto da miniatura.
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-sm"
                  tooltip={`Remover imagem ${image.name}`}
                  className="absolute -top-2 -right-2 text-foreground shadow-sm ring-1 ring-border transition-shadow hover:bg-secondary hover:ring-foreground/50"
                  onClick={() => remove(image)}
                >
                  <X />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <>
          <FileDropzone
            multiple
            onFilesChange={handleFilesChange}
            accept={accept}
            disabled={busy}
            hint={hint}
          />
          {busy && (
            <Typography as="p" variant="muted">
              {uploadingCount === 1
                ? 'Enviando imagem...'
                : `Enviando ${uploadingCount} imagens...`}
            </Typography>
          )}
        </>
      )}
    </div>
  );
}
