import { useEffect, useRef, useState } from 'react';
import { FileQuestion } from 'lucide-react';

import { AttachmentActionButton } from './attachmentActionButton';
import { previewKind } from './previewKind';

import { Button } from '@/components/global/button/button';
import { Modal } from '@/components/global/modal/modal';
import { downloadAction } from '@/components/global/rowActions/actions';
import { SkeletonText } from '@/components/global/skeleton/skeleton';
import { Typography } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import type { PreviewBlobKind } from '@/services/api/download';

// Só o ícone e o rótulo do catálogo interessam; o clique é do botão.
const noop = (): void => undefined;

interface IAttachmentPreview {
  name: string;
  /**
   * Devolve o endereço (`blob:`) do arquivo para o tipo pedido. Chamada só ao
   * abrir; o `blob:` é revogado ao fechar. Não precisa ser estável: fica em ref.
   */
  getPreviewUrl: (kind: PreviewBlobKind) => Promise<string>;
  /** Baixa o arquivo; não deve rejeitar (a linha já trata a falha). */
  onDownload: () => void | Promise<void>;
  onClose: () => void;
}

/**
 * Visualizador de anexo: imagem em `<img>`, PDF e texto em `<iframe>`. Formato
 * desconhecido ou falha ao buscar mostram "Visualização não disponível" com o
 * botão de baixar. Monte-o só enquanto aberto: o endereço é pedido ao montar e
 * revogado ao desmontar (resposta que chega depois é descartada e revogada).
 */
export function AttachmentPreview({
  name,
  getPreviewUrl,
  onDownload,
  onClose,
}: IAttachmentPreview) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const kind = previewKind(name);
  const getPreviewUrlRef = useRef(getPreviewUrl);

  useEffect(() => {
    getPreviewUrlRef.current = getPreviewUrl;
  });

  useEffect(() => {
    if (kind === 'none') return;

    let active = true;
    let objectUrl: string | null = null;

    getPreviewUrlRef
      .current(kind)
      .then((address) => {
        if (active) {
          objectUrl = address;
          setUrl(address);
        } else {
          URL.revokeObjectURL(address);
        }
      })
      .catch(() => {
        // O aviso é do interceptor da API; aqui só muda o que o modal mostra.
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [kind]);

  const download = downloadAction(noop, {
    label: `Baixar ${name}`,
  });

  return (
    <Modal
      open
      setOpen={(isOpen) => !isOpen && onClose()}
      size="xl"
      title={name}
      headerAction={
        <AttachmentActionButton
          label={download.label}
          icon={download.icon}
          onSelect={() => void onDownload()}
        />
      }
    >
      {kind === 'none' || failed ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileQuestion aria-hidden="true" className="size-6" />
          </span>
          <Typography as="p" variant="small">
            Visualização não disponível
          </Typography>
          <Button variant="outline" onClick={() => void onDownload()}>
            Baixar arquivo
          </Button>
        </div>
      ) : url === null ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonText key={index} className="w-full" />
          ))}
        </div>
      ) : kind === 'image' ? (
        <img
          src={url}
          alt={name}
          className="mx-auto max-h-[70vh] w-auto rounded-md object-contain"
        />
      ) : (
        // `iframe` e não `object`: o Chrome esconde o visualizador de PDF dentro
        // de `object`. Texto vai com `sandbox=""` e tema claro fixo, também com o
        // sistema escuro: fundo e cor claros no próprio iframe, além do
        // `color-scheme` (o
        // visualizador segue o `color-scheme` e sairia branco sobre branco).
        // PDF fica sem `sandbox`: o visualizador do Chrome não abre sandboxed.
        <iframe
          src={url}
          title={name}
          sandbox={kind === 'text' ? '' : undefined}
          className={cn(
            'h-[70vh] w-full rounded-md border',
            kind === 'text' &&
              'bg-white text-black [color-scheme:light] dark:bg-white dark:text-black dark:[color-scheme:light]'
          )}
        />
      )}
    </Modal>
  );
}
