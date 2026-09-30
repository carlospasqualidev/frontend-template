import { isAxiosError } from 'axios';
import { Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Check, X } from 'lucide-react';
import type { Control } from 'react-hook-form';
import { toast } from 'sonner';

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
import {
  groupByModule,
  moduleDescription,
  type ModuleGroup,
} from '@/screens/settings/utils/configModules';
import { systemConfigKeys } from '@/screens/settings/utils/queryKeys';
import { catchHandler, sendErrorMessage } from '@/services/api/errorHandlers';
import {
  fetchSystemConfigs,
  findSystemConfigIssues,
  systemConfigModuleLabel,
  updateSystemConfigs,
  type SystemConfig,
  type SystemConfigsResponse,
  type SystemConfigUpdateItem,
} from '@/services/systemConfigs/systemConfigsApi';

const FORM_ID = 'settings-form';

const UNEXPECTED_SAVE_ERROR_MESSAGE = 'Não foi possível salvar agora. Tente novamente em instantes.';

const settingsFormSchema = z.object({ values: z.array(z.string()) });
type SettingsFormValues = z.infer<typeof settingsFormSchema>;

// Um item mantém o índice original no array plano do formulário (a ordem do
// backend define o índice de cada `value`).
interface ConfigItem {
  config: SystemConfig;
  index: number;
}

// Agrupa as configurações por módulo preservando o índice plano de cada uma.
function groupConfigsByModule(configs: SystemConfig[]): ModuleGroup<ConfigItem>[] {
  return groupByModule(
    configs.map((config, index) => ({ config, index })),
    ({ config }) => config.module
  );
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

// Só os itens alterados, na ordem da tela: é o lote que vai ao servidor.
function changedItems(configs: SystemConfig[], formValues: SettingsFormValues): SystemConfigUpdateItem[] {
  return configs
    .map((config, index) => ({ config, value: formValues.values.at(index) ?? config.value }))
    .filter(({ config, value }) => value !== config.value)
    .map(({ config, value }) => ({ key: config.key, value }));
}

function SettingsForm({ configs }: { configs: SystemConfig[] }) {
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isDirty },
  } = useZodForm({
    schema: settingsFormSchema,
    defaultValues: { values: configs.map((config) => config.value) },
  });

  // A gravação pode ter acontecido sem a resposta chegar no contrato (200 com
  // `message`, recusado pelo `.parse`: o toast de sucesso já saiu). Relê as
  // configurações e, se a leitura vier, o formulário adota o que o servidor
  // tem. Se não vier, a alteração continua pendente.
  const reloadFromServer = async () => {
    await queryClient.invalidateQueries({ queryKey: systemConfigKeys.list });
    const state = queryClient.getQueryState<SystemConfigsResponse>(systemConfigKeys.list);
    if (state?.status === 'success' && state.data) {
      reset({ values: state.data.systemConfigs.map((config) => config.value) });
    }
  };

  // Uma gravação só, com todas as configurações alteradas (lote atômico no
  // backend). O toast de sucesso vem do `message` da resposta — sem toast aqui.
  const mutation = useMutation({
    mutationFn: (items: SystemConfigUpdateItem[]) => updateSystemConfigs(items),
    onSuccess: ({ systemConfigs }) => {
      // A resposta já traz a lista completa (com o valor normalizado pelo
      // backend): popula o cache e volta o form a pristine com esses valores.
      queryClient.setQueryData<SystemConfigsResponse>(systemConfigKeys.list, { systemConfigs });
      reset({ values: systemConfigs.map((config) => config.value) });
    },
    // O 400 volta sem toast (`updateSystemConfigs`): a recusa que aponta um
    // item do lote marca o campo dele; a que não aponta nenhum (a regra entre
    // os prazos conferida contra o valor gravado) vira o toast do interceptor.
    // As demais falhas HTTP já tiveram o toast. Falha que não é HTTP (resposta
    // fora do contrato recusada pelo `.parse`, ou bug) é inesperada: mensagem
    // genérica ao usuário, reporte, e a tela relê o que o servidor gravou.
    onError: (error, items) => {
      if (!isAxiosError(error)) {
        console.error('Falha inesperada na gravação das configurações.', error);
        void sendErrorMessage({ error });
        toast.error(UNEXPECTED_SAVE_ERROR_MESSAGE, { id: 'errorToastId' });
        void reloadFromServer();
        return;
      }

      if (error.response?.status !== 400) return;

      const issues = findSystemConfigIssues(error, items);
      if (issues.length === 0) {
        catchHandler({ response: error.response });
        return;
      }

      issues.forEach(({ key, message }) => {
        const index = configs.findIndex((config) => config.key === key);
        if (index !== -1) setError(`values.${index}`, { type: 'server', message });
      });
    },
  });

  const onSubmit = handleSubmit((formValues) => mutation.mutate(changedItems(configs, formValues)));

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
        {groupConfigsByModule(configs).map(({ module, items }) => (
          <Card key={module} title={systemConfigModuleLabel(module)} description={moduleDescription(module)}>
            <div>
              {items.map(({ config, index }) => (
                <ConfigField key={config.key} config={config} index={index} control={control} />
              ))}
            </div>
          </Card>
        ))}
      </form>
    </>
  );
}

// Campos controlados: o erro que o servidor apontou (`setError`) aparece sob o
// campo, e some quando o valor muda.
function ConfigField({
  config,
  index,
  control,
}: {
  config: SystemConfig;
  index: number;
  control: Control<SettingsFormValues>;
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
          control={control}
          name={fieldName}
        />
      ) : (
        <InputField
          id={fieldId}
          label={config.label}
          description={config.description}
          type={config.valueType === 'int' || config.valueType === 'float' ? 'number' : 'text'}
          control={control}
          name={fieldName}
        />
      )}
    </div>
  );
}
