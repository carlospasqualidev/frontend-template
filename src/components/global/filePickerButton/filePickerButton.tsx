import { useRef } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/global/button/button';

interface IFilePickerButton {
  /** Rótulo em pt-BR: vira o tooltip e o nome acessível do botão. */
  label: string;
  /** Recebe TODOS os arquivos escolhidos (nunca vazio). Quem consome é dono do upload. */
  onFiles: (files: File[]) => void;
  /** Filtro de extensões/MIME, ex.: `".pdf,.png"` (igual ao input nativo). */
  accept?: string;
  disabled?: boolean;
  /** Motivo exibido em tooltip enquanto `disabled` (ex.: upload em andamento). */
  disabledReason?: string;
  className?: string;
}

/**
 * Botão "+" que abre o seletor de arquivos do sistema direto, com vários
 * arquivos de uma vez e sem modal: escolher o arquivo já é a confirmação. Não
 * sobe nada nem conhece API: a tela recebe os `File[]` e é dona do upload.
 * Não aceita arrastar-e-soltar (para isso, use o `FileDropzone`).
 */
export function FilePickerButton({
  label,
  onFiles,
  accept,
  disabled,
  disabledReason,
  className,
}: IFilePickerButton) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(input: HTMLInputElement) {
    const files = Array.from(input.files ?? []);
    // Zera o campo: sem isto, escolher O MESMO arquivo de novo não dispara `change`.
    input.value = '';
    if (files.length > 0) onFiles(files);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(event) => handleChange(event.target)}
      />

      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        tooltip={label}
        disabled={disabled}
        disabledReason={disabledReason ?? ''}
        className={className}
        onClick={() => inputRef.current?.click()}
      >
        <Plus />
      </Button>
    </>
  );
}
