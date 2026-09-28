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
  return useForm<FormValues<TSchema>, TContext, FormOutput<TSchema>>({
    ...props,
    mode,
    reValidateMode,
    // Os genéricos explícitos forçam a sobrecarga do Zod 4 (que devolve
    // `z.input`/`z.output` do schema); sem eles, o `ZodObject` genérico casa
    // com a sobrecarga do Zod 3 e os tipos degradam para `Record<string, unknown>`.
    resolver: zodResolver<FieldValues, TContext, unknown, TSchema>(schema),
  });
}
