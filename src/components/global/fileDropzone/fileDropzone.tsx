import { useId, useRef, useState, type DragEvent } from 'react';
import { FileSpreadsheet, Upload, X } from 'lucide-react';

import { Button } from '@/components/global/button/button';
import { Typography } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

interface IFileDropzoneBase {
  /** Filtro de extensões/MIME, ex.: `".xlsx,.csv"` (igual ao input nativo). */
  accept?: string;
  /** Texto auxiliar abaixo do título (ex.: formatos aceitos). */
  hint?: string;
  disabled?: boolean;
  /** `id` do input escondido — associe uma `FieldLabel htmlFor` a ele. */
  id?: string;
}

interface ISingleFileDropzone extends IFileDropzoneBase {
  /** Arquivo selecionado (controlado). `null` = nenhum. */
  file: File | null;
  /** Disparado ao escolher, arrastar-e-soltar ou remover (`null`). */
  onFileChange: (file: File | null) => void;
  multiple?: never;
  onFilesChange?: never;
}

interface IMultipleFileDropzone extends IFileDropzoneBase {
  /** Permite escolher/soltar vários arquivos de uma vez. */
  multiple: true;
  /**
   * Disparado com TODOS os arquivos escolhidos (nunca vazio). Quem consome é
   * dono da lista/prévia — o dropzone não guarda seleção neste modo.
   */
  onFilesChange: (files: File[]) => void;
  file?: never;
  onFileChange?: never;
}

type IFileDropzone = ISingleFileDropzone | IMultipleFileDropzone;

function isMultiple(props: IFileDropzone): props is IMultipleFileDropzone {
  return 'multiple' in props;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/** Extensão (com ponto, minúscula) do nome do arquivo, ou `''` se não houver. */
function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

/** O arquivo casa com o filtro `accept` (extensões `.xlsx` e/ou MIME `type/*`)? */
function matchesAccept(file: File, accept?: string): boolean {
  const patterns = (accept ?? '')
    .split(',')
    .map((pattern) => pattern.trim().toLowerCase())
    .filter(Boolean);
  if (patterns.length === 0) return true;

  const extension = fileExtension(file.name);
  const mime = file.type.toLowerCase();
  return patterns.some((pattern) => {
    if (pattern.startsWith('.')) return extension === pattern;
    if (pattern.endsWith('/*')) return mime.startsWith(pattern.slice(0, -1));
    return mime === pattern;
  });
}

/**
 * Área de upload com arrastar-e-soltar e seleção por clique/teclado.
 *
 * - **Um arquivo** (`file` + `onFileChange`): mostra a prévia do escolhido
 *   (nome + tamanho + remover).
 * - **Vários** (`multiple` + `onFilesChange`): entrega todos os arquivos de uma
 *   vez e segue mostrando a área de soltar — a prévia é responsabilidade de quem
 *   consome (ex.: a galeria do `ImageUploadField`).
 */
export function FileDropzone(props: IFileDropzone) {
  const { accept, hint, disabled, id } = props;
  const multiple = isMultiple(props);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const selectedFile = isMultiple(props) ? null : props.file;

  function openPicker() {
    if (!disabled) inputRef.current?.click();
  }

  function clearInput() {
    if (inputRef.current) inputRef.current.value = '';
  }

  function clearSelection() {
    if (isMultiple(props)) return;
    props.onFileChange(null);
    clearInput();
  }

  function handleInputChange(files: FileList | null) {
    const selected = Array.from(files ?? []);
    if (isMultiple(props)) {
      if (selected.length > 0) props.onFilesChange(selected);
      // Sem seleção guardada: limpar deixa reescolher as MESMAS fotos depois.
      clearInput();
      return;
    }
    props.onFileChange(selected.at(0) ?? null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dropped = Array.from(event.dataTransfer.files ?? []).filter((item) =>
      matchesAccept(item, accept)
    );
    if (dropped.length === 0) return;
    if (isMultiple(props)) {
      props.onFilesChange(dropped);
      return;
    }
    props.onFileChange(dropped.at(0)!);
  }

  return (
    <div>
      {/* Sibling do alvo clicável: o click programático não recai no dropzone. */}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => handleInputChange(event.target.files)}
      />

      {selectedFile ? (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
          <FileSpreadsheet className="size-8 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <Typography as="p" variant="small" className="truncate font-medium">
              {selectedFile.name}
            </Typography>
            <Typography as="p" variant="muted">
              {formatFileSize(selectedFile.size)}
            </Typography>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            tooltip="Remover arquivo"
            disabled={disabled}
            onClick={clearSelection}
          >
            <X />
          </Button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          aria-label={multiple ? 'Selecionar arquivos' : 'Selecionar arquivo'}
          onClick={openPicker}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openPicker();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
            disabled
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-pointer hover:border-ring hover:bg-muted/40',
            dragging && !disabled && 'border-ring bg-muted/60'
          )}
        >
          <Upload className="size-6 text-muted-foreground" />
          <Typography as="p" variant="small" className="font-medium">
            {multiple
              ? 'Arraste os arquivos aqui ou clique para selecionar'
              : 'Arraste o arquivo aqui ou clique para selecionar'}
          </Typography>
          {hint && (
            <Typography as="p" variant="muted">
              {hint}
            </Typography>
          )}
        </div>
      )}
    </div>
  );
}
