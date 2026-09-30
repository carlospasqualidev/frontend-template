import { z } from 'zod';

/*
 * Troca da própria senha (`PUT /client/users/me/password`). As regras e as
 * mensagens espelham as do servidor; conferir a senha atual é só dele (o 400
 * "Senha atual incorreta." marca o campo).
 */
export const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.'),
    password: z
      .string()
      .min(1, 'Informe a nova senha.')
      .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
      .max(72, 'A senha deve ter no máximo 72 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As senhas precisam ser iguais.',
    path: ['confirmPassword'],
  })
  .refine((values) => values.password !== values.currentPassword, {
    message: 'A nova senha precisa ser diferente da atual.',
    path: ['password'],
  });

export type PasswordFormValues = z.input<typeof passwordFormSchema>;

export const EMPTY_PASSWORD_FORM: PasswordFormValues = {
  currentPassword: '',
  password: '',
  confirmPassword: '',
};
