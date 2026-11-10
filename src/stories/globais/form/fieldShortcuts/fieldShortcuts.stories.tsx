import { useForm } from 'react-hook-form';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Card } from '@/components/global/card/card';
import { DateField } from '@/components/global/form/dateField';
import { FieldShortcuts } from '@/components/global/form/fieldShortcuts';
import { NumberField } from '@/components/global/form/numberField';
import { businessDatePlusDays } from '@/lib/dateTime/businessDate';

const meta = {
  title: 'Formulário/FieldShortcuts',
  component: FieldShortcuts,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Rótulo, fileira de botões de atalho e o campo (filho, com `label=""` e o mesmo `id` do `htmlFor`). Não guarda estado nem conhece o formulário: o `onSelect` de cada atalho é da tela, que grava com `setValue(..., { shouldDirty: true, shouldValidate: formState.isSubmitted })`. Atalho indisponível usa `disabled` + `disabledReason` (tooltip no hover e no foco). O atalho de data usa o dia do negócio (`businessDatePlusDays`), não o do aparelho.',
      },
    },
  },
  args: { label: '', htmlFor: '', shortcuts: [], children: null },
} satisfies Meta<typeof FieldShortcuts>;

export default meta;
type Story = StoryObj<typeof meta>;

const DATE_DAYS = [1, 3, 7, 30];
const PERCENTS = [5, 10, 20, 50];
const BASE_VALUE = 1000;

function DemoForm() {
  const { control, setValue, watch, formState } = useForm<{
    returnDate: string;
    base: number | undefined;
    amount: number | undefined;
  }>({
    defaultValues: { returnDate: '', base: BASE_VALUE, amount: undefined },
  });
  const base = watch('base');
  const options = {
    shouldDirty: true,
    shouldValidate: formState.isSubmitted,
  };

  return (
    <Card title="Atalhos de campo" className="max-w-md">
      <div className="flex flex-col gap-6">
        <FieldShortcuts
          label="Data do retorno"
          htmlFor="demo-return-date"
          shortcuts={DATE_DAYS.map((days) => ({
            label: days === 1 ? '1 dia' : `${days} dias`,
            onSelect: () =>
              setValue('returnDate', businessDatePlusDays(days), options),
          }))}
        >
          <DateField
            control={control}
            name="returnDate"
            id="demo-return-date"
            label=""
          />
        </FieldShortcuts>

        <NumberField
          control={control}
          name="base"
          id="demo-base"
          label="Valor base"
          placeholder="0,00"
          prefix="R$ "
        />

        <FieldShortcuts
          label="Valor parcial"
          htmlFor="demo-amount"
          shortcuts={PERCENTS.map((percent) => ({
            label: `${percent}%`,
            disabled: !base,
            disabledReason: 'Informe o valor base.',
            onSelect: () =>
              setValue(
                'amount',
                Math.round((((base ?? 0) * percent) / 100) * 100) / 100,
                options
              ),
          }))}
        >
          <NumberField
            control={control}
            name="amount"
            id="demo-amount"
            label=""
            placeholder="0,00"
            prefix="R$ "
          />
        </FieldShortcuts>
      </div>
    </Card>
  );
}

export const Vitrine: Story = {
  render: () => <DemoForm />,
};
