import { useRef } from 'react';
import {
  useForm,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type FormSchema = z.ZodObject;

type FormValues<TSchema extends FormSchema> = z.input<TSchema> & FieldValues;
type FormOutput<TSchema extends FormSchema> = z.output<TSchema>;

type UseZodFormProps<TSchema extends FormSchema, TContext = unknown> = Omit<
  UseFormProps<FormValues<TSchema>, TContext, FormOutput<TSchema>>,
  'resolver'
> & {
  schema: TSchema;
};

export function useZodForm<TSchema extends FormSchema, TContext = unknown>({
  schema,
  mode = 'onBlur',
  reValidateMode = 'onChange',
  ...props
}: UseZodFormProps<TSchema, TContext>): UseFormReturn<
  FormValues<TSchema>,
  TContext,
  FormOutput<TSchema>
> {
  const form = useForm<FormValues<TSchema>, TContext, FormOutput<TSchema>>({
    ...props,
    mode,
    reValidateMode,
    // Os genéricos explícitos forçam a sobrecarga do Zod 4 (que devolve
    // `z.input`/`z.output` do schema); sem eles, o `ZodObject` genérico casa
    // com a sobrecarga do Zod 3 e os tipos degradam para `Record<string, unknown>`.
    resolver: zodResolver<FieldValues, TContext, unknown, TSchema>(schema),
  });
  const submitting = useRef(false);
  const { handleSubmit } = form;

  /**
   * Clique duplo grava uma vez só. O `handleSubmit` valida de forma assíncrona e o
   * `loading={m.isPending}` do botão só trava depois que o `mutate` roda e a tela
   * renderiza de novo; nessa janela um segundo clique disparava outro envio.
   *
   * A trava é uma ref (síncrona) e vale para todo formulário: ninguém precisa
   * travar o botão por conta própria. O envio ignorado ainda cancela o submit
   * nativo do `<form>`. Solta numa tarefa seguinte (`setTimeout` 0), e não no fim
   * do `handleSubmit`: o aviso do `mutate` à tela também sai num `setTimeout` 0,
   * agendado antes, então quando a trava solta o botão já está em `loading`.
   * Solta também quando a validação reprova ou o callback lança.
   */
  const guardedHandleSubmit: typeof handleSubmit =
    (onValid, onInvalid) => async (event) => {
      if (submitting.current) {
        event?.preventDefault?.();
        return;
      }
      submitting.current = true;
      try {
        await handleSubmit(onValid, onInvalid)(event);
      } finally {
        setTimeout(() => {
          submitting.current = false;
        }, 0);
      }
    };

  return { ...form, handleSubmit: guardedHandleSubmit };
}
