import type { FormFieldError } from '@/lib/forms/errors';

interface IFieldDescribedByInput {
  /** O id base do campo (o do controle). */
  id: string;
  hasDescription: boolean;
  errors: FormFieldError[];
  /** O `aria-describedby` que o chamador passou; segue no fim da lista. */
  ariaDescribedBy?: string;
}

interface IFieldDescribedBy {
  descriptionId: string;
  errorId: string;
  /** Ids presentes, separados por espaço; `undefined` quando não há nenhum. */
  describedBy: string | undefined;
}

/**
 * Liga a descrição e o erro de um campo ao controle por `aria-describedby`.
 * Os ids derivam do id base (`<id>-description`, `<id>-error`) e só entram na
 * lista quando o elemento existe, para o atributo nunca ficar vazio nem apontar
 * para o nada.
 */
export function fieldDescribedBy({
  id,
  hasDescription,
  errors,
  ariaDescribedBy,
}: IFieldDescribedByInput): IFieldDescribedBy {
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const hasError = errors.some((error) => error?.message);
  const describedBy =
    [
      hasDescription ? descriptionId : undefined,
      hasError ? errorId : undefined,
      ariaDescribedBy,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return { descriptionId, errorId, describedBy };
}
