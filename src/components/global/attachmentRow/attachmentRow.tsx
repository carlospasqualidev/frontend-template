import { useState, type ReactNode } from 'react';
import { Check, FileText, X } from 'lucide-react';

import { AttachmentActionButton } from './attachmentActionButton';
import { AttachmentPreview } from './attachmentPreview';
import { joinFileName, splitFileName } from './fileName';

import {
  downloadAction,
  editAction,
} from '@/components/global/rowActions/actions';
import { cn } from '@/lib/utils';
import type { PreviewBlobKind } from '@/services/api/download';

// Só o ícone e o rótulo do catálogo interessam; o clique é do botão.
const noop = (): void => undefined;

interface IAttachmentRow {
  /** Nome exibido, o da listagem (o do download vem do `Content-Disposition`). */
  name: string;
  /** Baixa o arquivo (a tela passa `downloadFile`). Falha é do interceptor da API. */
  onDownload: () => Promise<void>;
  /**
   * Endereço `blob:` do arquivo para o visualizador (ex.: `fetchFileObjectUrl`).
   * Sem ele, o nome é só texto.
   */
  getPreviewUrl?: (kind: PreviewBlobKind) => Promise<string>;
  /** Desabilita baixar, ver e renomear (ex.: sem permissão). */
  disabled?: boolean;
  /** Motivo mostrado no tooltip e no nome acessível enquanto `disabled`. */
  disabledReason?: string;
  /** Esconde o "Baixar" e o visualizador (ex.: arquivo ainda não gravado). */
  hideDownload?: boolean;
  /**
   * Grava o nome novo. Com ela a linha ganha o lápis e o nome vira um campo
   * com a extensão fixa ao lado. Se rejeitar, o campo continua aberto.
   */
  onRename?: (name: string) => Promise<void>;
  /** Ações extras da tela (ex.: excluir), depois do "Baixar". */
  actions?: ReactNode;
  className?: string;
}

/** Um anexo: ícone, nome (abre o visualizador) e ações em cartão. */
export function AttachmentRow({
  name,
  onDownload,
  getPreviewUrl,
  disabled,
  disabledReason,
  hideDownload,
  onRename,
  actions,
  className,
}: IAttachmentRow) {
  const [downloading, setDownloading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  /** `null` = não renomeando; string = o rascunho, só o nome sem a extensão. */
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { stem, extension } = splitFileName(name);
  const canPreview = Boolean(getPreviewUrl) && !hideDownload && !disabled;

  async function handleRename() {
    const newName = joinFileName(draft ?? '', extension);

    if (!onRename || !newName || newName === name) {
      setDraft(null);
      return;
    }

    setSaving(true);
    try {
      await onRename(newName);
      setDraft(null);
    } catch {
      // O aviso é do interceptor; o campo fica aberto com o texto digitado.
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      await onDownload();
    } catch {
      // O aviso é do interceptor da API; sem este catch a rejeição ficaria solta.
    } finally {
      setDownloading(false);
    }
  }

  const download = downloadAction(noop, {
    label: `Baixar ${name}`,
  });
  const edit = editAction(noop, { label: `Renomear ${name}` });

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-3 rounded-md border bg-muted/40 px-3 py-2',
        className
      )}
    >
      <FileText
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      />
      {draft !== null ? (
        <div className="flex min-w-0 flex-1 items-center rounded-md border border-input bg-transparent px-2 py-1 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <input
            autoFocus
            aria-label={`Novo nome de ${name}`}
            className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
            disabled={saving}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleRename();
              }
              if (event.key === 'Escape') setDraft(null);
            }}
          />
          {extension && (
            <span className="shrink-0 text-sm text-muted-foreground">
              {extension}
            </span>
          )}
        </div>
      ) : canPreview ? (
        <button
          type="button"
          className="min-w-0 flex-1 cursor-pointer truncate text-left text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:underline"
          title={name}
          onClick={() => setPreviewOpen(true)}
        >
          {name}
        </button>
      ) : (
        <span
          className="min-w-0 flex-1 truncate text-sm font-medium"
          title={name}
        >
          {name}
        </span>
      )}
      <div className="flex shrink-0 items-center gap-1">
        {onRename &&
          (draft === null ? (
            <AttachmentActionButton
              label={edit.label}
              icon={edit.icon}
              onSelect={() => setDraft(stem)}
              disabled={disabled}
              disabledReason={disabledReason}
            />
          ) : (
            <>
              <AttachmentActionButton
                label="Cancelar a renomeação"
                icon={<X />}
                onSelect={() => setDraft(null)}
                disabled={saving}
              />
              <AttachmentActionButton
                label="Salvar o nome"
                icon={<Check />}
                onSelect={() => void handleRename()}
                disabled={saving}
              />
            </>
          ))}
        {!hideDownload && (
          <AttachmentActionButton
            label={download.label}
            icon={download.icon}
            onSelect={() => void handleDownload()}
            disabled={disabled || downloading}
            disabledReason={disabled ? disabledReason : undefined}
          />
        )}
        {actions}
      </div>

      {previewOpen && getPreviewUrl && (
        <AttachmentPreview
          name={name}
          getPreviewUrl={getPreviewUrl}
          onDownload={handleDownload}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}
