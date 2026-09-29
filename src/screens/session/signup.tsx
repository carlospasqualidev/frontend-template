import { Link, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';

import { handleSessionSubmitError } from './handleSessionSubmitError';
import { SessionTemplate } from './sessionTemplate';

import { useSessionStore } from '@/hooks/useSessionStore';
import { useZodForm } from '@/lib/forms/useZodForm';
import { sessionService } from '@/services/session/sessionService';
import { Button } from '@/components/global/button/button';
import { InputField } from '@/components/global/form/inputField';
import { Card, CardContent } from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
} from '@/components/ui/field';
import { Typography } from '@/components/ui/typography';

// Limites do `POST /client/session/register` (`../server-template/docs/openapi.json`):
// nome de 2 a 120 caracteres, senha de 8 a 72.
const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Informe seu nome.')
      .min(2, 'O nome deve ter pelo menos 2 caracteres.')
      .max(120, 'O nome deve ter no máximo 120 caracteres.'),
    email: z.email('Informe um e-mail válido.').trim(),
    password: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres.')
      .max(72, 'A senha deve ter no máximo 72 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });

export function SignupScreen() {
  const navigate = useNavigate();
  const { setUser } = useSessionStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm({
    schema: signupSchema,
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    try {
      const { user } = await sessionService.signUp({ name, email, password });
      setUser(user);
      navigate({ to: '/', replace: true });
    } catch (error) {
      handleSessionSubmitError(error);
    }
  });

  return (
    <SessionTemplate>
      <div className="flex flex-col gap-6">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="relative hidden bg-muted md:block">
              <img
                src="/placeholder.svg"
                alt="Imagem"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              />
            </div>
            <form className="p-6 md:p-8" noValidate onSubmit={onSubmit}>
              <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                  <Typography as="h1" variant="h3">
                    Crie sua conta
                  </Typography>
                  <Typography variant="muted" className="text-balance">
                    Informe seus dados abaixo para criar sua conta
                  </Typography>
                </div>

                <InputField
                  id="name"
                  label="Nome"
                  type="text"
                  placeholder="Seu nome"
                  autoComplete="name"
                  errors={errors.name}
                  disabled={isSubmitting}
                  {...register('name')}
                />

                <InputField
                  id="email"
                  label="E-mail"
                  type="email"
                  placeholder="exemplo@email.com"
                  autoComplete="email"
                  errors={errors.email}
                  disabled={isSubmitting}
                  {...register('email')}
                />

                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    id="password"
                    label="Senha"
                    type="password"
                    autoComplete="new-password"
                    errors={errors.password}
                    disabled={isSubmitting}
                    {...register('password')}
                  />

                  <InputField
                    id="confirmPassword"
                    label="Confirmar senha"
                    type="password"
                    autoComplete="new-password"
                    errors={errors.confirmPassword}
                    disabled={isSubmitting}
                    {...register('confirmPassword')}
                  />
                </div>

                <FieldDescription>
                  A senha deve ter de 8 a 72 caracteres.
                </FieldDescription>

                <Field>
                  <Button type="submit" loading={isSubmitting}>
                    Criar conta
                  </Button>
                  <FieldError errors={[errors.root]} />
                </Field>

                <FieldDescription className="text-center">
                  Já tem uma conta? <Link to="/login">Entrar</Link>
                </FieldDescription>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </SessionTemplate>
  );
}
