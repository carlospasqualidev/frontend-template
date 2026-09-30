import { Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Check, X } from 'lucide-react';
import type { Control, UseFormRegister } from 'react-hook-form';

import { Button } from '@/components/global/button/button';
import { Card } from '@/components/global/card/card';
import { Empty } from '@/components/global/empty/empty';
import { InputField } from '@/components/global/form/inputField';
import { TextArea } from '@/components/global/form/textArea';
import { PageActions } from '@/components/global/layout/pageActions';
import { Switch } from '@/components/ui/switch';
import { Typography } from '@/components/ui/typography';
import { useZodForm } from '@/lib/forms/useZodForm';
import { SettingsSkeleton } from '@/screens/settings/settingsSkeleton';
import { systemConfigKeys } from '@/screens/settings/utils/queryKeys';
import {
  fetchSystemConfigs,
  systemConfigModuleLabel,
  updateSystemConfigs,
  type SystemConfig,
  type SystemConfigsResponse,
} from '@/services/systemConfigs/systemConfigsApi';

const FORM_ID = 'settings-form';

const settingsFormSchema = z.object({ values: z.array(z.string()) });
type SettingsFormValues = z.infer<typeof settingsFormSchema>;

// Um item mantém o índice original no array plano do formulário (a ordem do
// backend define o índice de cada `value`).
interface ConfigItem {
  config: SystemConfig;
  index: number;
}

// Ordem de exibição dos módulos (Geral primeiro). `switch` — sem indexar objeto
// por variável.
function moduleRank(module: string): number {
  switch (module) {
    case 'GENERAL':
      return 0;
    case 'SECURITY':
      return 1;
    case 'NOTIFICATIONS':
      return 2;
    case 'INTEGRATIONS':
      return 3;
    default:
      return 4;
  }
}

// Descrição pt-BR do grupo de configurações (switch — sem indexar objeto por
// variável).
function moduleDescription(module: string): string {
  switch (module) {
    case 'SECURITY':
      return 'Autenticação, sessão, política de acesso e retenção da auditoria.';
    case 'NOTIFICATIONS':
      return 'Como e quando o sistema avisa os usuários.';
    case 'INTEGRATIONS':
      return 'Conexões com serviços externos.';
    case 'GENERAL':
    default:
      return 'Identidade e comportamento padrão da aplicação.';
  }
}

// Agrupa as configurações por módulo preservando o índice plano de cada uma,
// e ordena os grupos pela ordem de exibição dos módulos.
function groupByModule(configs: SystemConfig[]): { module: string; items: ConfigItem[] }[] {
  const groups = new Map<string, ConfigItem[]>();
  configs.forEach((config, index) => {
    const items = groups.get(config.module) ?? [];
    items.push({ config, index });
    groups.set(config.module, items);
  });
  return [...groups.entries()]
    .map(([module, items]) => ({ module, items }))
    .sort((a, b) => moduleRank(a.module) - moduleRank(b.module));
}

export function SettingsPage() {
  const { data, isPending } = useQuery({
    queryKey: systemConfigKeys.list,
    queryFn: fetchSystemConfigs,
    staleTime: 30_000,
  });

  if (isPending) {
    return <SettingsSkeleton />;
  }

  if (!data || data.systemConfigs.length === 0) {
    return (
      <Empty
        title="Nenhuma configuração disponível"
        description="Não há parâmetros de sistema para exibir."
      />
    );
  }

  return <SettingsForm configs={data.systemConfigs} />;
}

function SettingsForm({ configs }: { configs: SystemConfig[] }) {
  const queryClient = useQueryClient();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useZodForm({
    schema: settingsFormSchema,
    defaultValues: { values: configs.map((config) => config.value) },
  });

  // Uma gravação só, com todas as configurações alteradas (lote atômico no
  // backend). O toast de sucesso vem do `message` da resposta — sem toast aqui.
  const mutation = useMutation({
    mutationFn: (formValues: SettingsFormValues) => {
      const changed = configs
        .map((config, index) => ({ config, value: formValues.values.at(index) ?? config.value }))
        .filter(({ config, value }) => value !== config.value)
        .map(({ config, value }) => ({ key: config.key, value }));
      return updateSystemConfigs(changed);
    },
    onSuccess: ({ systemConfigs }) => {
      // A resposta já traz a lista completa (com o valor normalizado pelo
      // backend): popula o cache e volta o form a pristine com esses valores.
      queryClient.setQueryData<SystemConfigsResponse>(systemConfigKeys.list, { systemConfigs });
      reset({ values: systemConfigs.map((config) => config.value) });
    },
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <>
      {isDirty && (
        <PageActions>
          <Button key="discard-action" variant="outline" type="button" aria-label="Descartar" onClick={() => reset()}>
            <X />
            <span className="hidden sm:inline">Descartar</span>
          </Button>
          <Button
            key="submit-action"
            type="submit"
            form={FORM_ID}
            loading={mutation.isPending}
            aria-label="Salvar alterações"
          >
            <Check />
            <span className="hidden sm:inline">Salvar alterações</span>
          </Button>
        </PageActions>
      )}

      <form id={FORM_ID} onSubmit={onSubmit} className="space-y-4" noValidate>
        {groupByModule(configs).map(({ module, items }) => (
          <Card key={module} title={systemConfigModuleLabel(module)} description={moduleDescription(module)}>
            <div>
              {items.map(({ config, index }) => (
                <ConfigField
                  key={config.key}
                  config={config}
                  index={index}
                  control={control}
                  register={register}
                />
              ))}
            </div>
          </Card>
        ))}
      </form>
    </>
  );
}

function ConfigField({
  config,
  index,
  control,
  register,
}: {
  config: SystemConfig;
  index: number;
  control: Control<SettingsFormValues>;
  register: UseFormRegister<SettingsFormValues>;
}) {
  const fieldId = `system-config-${config.key}`;
  const fieldName = `values.${index}` as const;

  if (config.valueType === 'boolean') {
    return (
      <div className="flex items-center justify-between gap-4 border-b py-4 last:border-b-0">
        <div className="space-y-1">
          <label htmlFor={fieldId} className="text-sm font-medium">
            {config.label}
          </label>
          {config.description && <Typography variant="muted">{config.description}</Typography>}
        </div>
        <Controller
          control={control}
          name={fieldName}
          render={({ field }) => (
            <Switch
              id={fieldId}
              checked={field.value === 'true'}
              onCheckedChange={(checked) => field.onChange(checked ? 'true' : 'false')}
            />
          )}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2 border-b py-4 last:border-b-0">
      {config.valueType === 'json' ? (
        <TextArea
          id={fieldId}
          label={config.label}
          description={config.description}
          rows={4}
          {...register(fieldName)}
        />
      ) : (
        <InputField
          id={fieldId}
          label={config.label}
          description={config.description}
          type={config.valueType === 'int' || config.valueType === 'float' ? 'number' : 'text'}
          {...register(fieldName)}
        />
      )}
    </div>
  );
}
