import { FieldError as FieldErrorPrimitive } from '@/components/ui/field';
import { type FormFieldErrors, resolveFieldErrors } from '@/lib/forms/errors';

interface IFieldError {
  /** Para o `aria-describedby` de quem a mensagem descreve. */
  id?: string;
  /** O erro do campo (`fieldState.error`), uma lista deles, ou nada. */
  errors?: FormFieldErrors;
  className?: string;
}

/**
 * A mensagem de erro de um campo que não é um field global — um grupo de
 * caixas, uma grade de escolhas — no mesmo visual dos fields.
 *
 * Os fields globais (`InputField`, `Checkbox`, …) já trazem a sua; esta é para
 * quando o controle é montado na tela e o erro vem do schema pelo
 * `useController`. Sem erro, não renderiza nada; com erro, entra abaixo do
 * controle com `role="alert"` e cresce para baixo.
 */
export function FieldError({ errors, ...props }: IFieldError) {
  return <FieldErrorPrimitive errors={resolveFieldErrors(errors)} {...props} />;
}
