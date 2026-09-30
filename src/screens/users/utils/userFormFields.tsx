import { type Control } from 'react-hook-form';

import { Card } from '@/components/global/card/card';
import { InputField } from '@/components/global/form/inputField';
import { NumberField } from '@/components/global/form/numberField';
import { type UserFormValues } from '@/screens/users/utils/userForm';
import { UserImageField } from '@/screens/users/utils/userImageField';

interface UserFormFieldsProps {
  control: Control<UserFormValues>;
  /** Na criação o e-mail é editável e há senha; no detalhe, o e-mail só aparece. */
  mode: 'create' | 'edit';
  /** Sem a permissão de editar: campos de texto `readOnly` (copiáveis), sem upload. */
  readOnly?: boolean;
}

/**
 * Campos do cadastro do usuário, os mesmos na criação e no detalhe (Detalhe =
 * Edição). Os cargos ficam fora: são a aba "Cargos" do detalhe.
 */
export function UserFormFields({
  control,
  mode,
  readOnly = false,
}: UserFormFieldsProps) {
  const isCreate = mode === 'create';

  return (
    <>
      <Card
        title="Identificação"
        description="Nome, e-mail de acesso e contato."
      >
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <InputField
            control={control}
            name="name"
            id="user-name"
            label="Nome"
            placeholder="Nome completo"
            autoComplete="off"
            readOnly={readOnly}
          />
          <InputField
            control={control}
            name="email"
            id="user-email"
            label="E-mail"
            type="email"
            placeholder="pessoa@empresa.com"
            autoComplete="off"
            readOnly={!isCreate || readOnly}
            description={
              isCreate ? undefined : 'O e-mail de acesso não muda por aqui.'
            }
          />
          <InputField
            control={control}
            name="phone"
            id="user-phone"
            label="Telefone"
            placeholder="(00) 00000-0000"
            inputMode="tel"
            autoComplete="off"
            readOnly={readOnly}
          />
        </div>
      </Card>

      <Card
        title="Acesso"
        description={
          isCreate
            ? 'Senha do primeiro acesso e tempo até o logout por inatividade.'
            : 'Tempo até o logout por inatividade.'
        }
      >
        <div className="grid items-start gap-4 sm:grid-cols-2">
          {isCreate && (
            <>
              <InputField
                control={control}
                name="password"
                id="user-password"
                label="Senha"
                type="password"
                placeholder="Mínimo de 8 caracteres"
                autoComplete="new-password"
              />
              <InputField
                control={control}
                name="confirmPassword"
                id="user-confirm-password"
                label="Confirmação da senha"
                type="password"
                placeholder="Repita a senha"
                autoComplete="new-password"
              />
            </>
          )}
          <NumberField
            control={control}
            name="idleTimeoutMinutes"
            id="user-idle-timeout"
            label="Tempo de inatividade (min)"
            placeholder="Padrão da empresa"
            maxDecimals={0}
            readOnly={readOnly}
          />
        </div>
      </Card>

      <Card title="Foto" description="Aparece ao lado do nome no sistema.">
        <UserImageField control={control} readOnly={readOnly} />
      </Card>
    </>
  );
}
