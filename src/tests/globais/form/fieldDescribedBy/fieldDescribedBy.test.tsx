import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { AsyncCombobox } from '@/components/global/form/asyncCombobox';
import { Checkbox } from '@/components/global/form/checkbox';
import { Combobox } from '@/components/global/form/combobox';
import { DateField } from '@/components/global/form/dateField';
import { DateTimeField } from '@/components/global/form/dateTimeField';
import { DecimalField } from '@/components/global/form/decimalField';
import { InputField } from '@/components/global/form/inputField';
import { MaskedInputField } from '@/components/global/form/maskedInputField';
import { MultiSelect } from '@/components/global/form/multiSelect';
import { NumberField } from '@/components/global/form/numberField';
import { RadioGroup } from '@/components/global/form/radioGroup';
import { Select } from '@/components/global/form/select';
import { Switch } from '@/components/global/form/switch';
import { TextArea } from '@/components/global/form/textArea';

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

const ERROR = { message: 'Informe o campo' };
const HELP = 'Texto de ajuda';

interface IHarnessProps {
  description?: boolean;
  error?: boolean;
  describedBy?: string;
}

function DecimalHarness({ error, describedBy }: IHarnessProps) {
  const { control } = useForm<{ value?: number }>({
    errors: error ? { value: { type: 'required', ...ERROR } } : undefined,
  });
  return (
    <DecimalField
      name="value"
      control={control}
      label="Campo"
      aria-describedby={describedBy}
    />
  );
}

function MaskedHarness({ description, error, describedBy }: IHarnessProps) {
  const { control } = useForm<{ value: string }>({
    defaultValues: { value: '' },
    errors: error ? { value: { type: 'required', ...ERROR } } : undefined,
  });
  return (
    <MaskedInputField
      name="value"
      control={control}
      mask="cpf"
      label="Campo"
      description={description ? HELP : undefined}
      aria-describedby={describedBy}
    />
  );
}

function NumberHarness({ description, error, describedBy }: IHarnessProps) {
  const { control } = useForm<{ value?: number }>({
    errors: error ? { value: { type: 'required', ...ERROR } } : undefined,
  });
  return (
    <NumberField
      name="value"
      control={control}
      label="Campo"
      description={description ? HELP : undefined}
      aria-describedby={describedBy}
    />
  );
}

interface IFieldCase {
  name: string;
  /** Campo sem `description` (só o erro e o `aria-describedby` do chamador). */
  withoutDescription?: boolean;
  render: (props: IHarnessProps) => React.ReactElement;
}

const fields: IFieldCase[] = [
  {
    name: 'InputField',
    render: ({ description, error, describedBy }) => (
      <InputField
        label="Campo"
        description={description ? HELP : undefined}
        errors={error ? ERROR : undefined}
        aria-describedby={describedBy}
      />
    ),
  },
  {
    name: 'TextArea',
    render: ({ description, error, describedBy }) => (
      <TextArea
        label="Campo"
        description={description ? HELP : undefined}
        errors={error ? ERROR : undefined}
        aria-describedby={describedBy}
      />
    ),
  },
  {
    name: 'DateField',
    render: ({ description, error, describedBy }) => (
      <DateField
        label="Campo"
        description={description ? HELP : undefined}
        errors={error ? ERROR : undefined}
        aria-describedby={describedBy}
      />
    ),
  },
  {
    name: 'DateTimeField',
    render: ({ description, error, describedBy }) => (
      <DateTimeField
        label="Campo"
        description={description ? HELP : undefined}
        errors={error ? ERROR : undefined}
        aria-describedby={describedBy}
      />
    ),
  },
  {
    name: 'NumberField',
    render: (props) => <NumberHarness {...props} />,
  },
  {
    name: 'MaskedInputField',
    render: (props) => <MaskedHarness {...props} />,
  },
  {
    name: 'DecimalField',
    withoutDescription: true,
    render: (props) => <DecimalHarness {...props} />,
  },
  {
    name: 'Select',
    render: ({ description, error, describedBy }) => (
      <Select
        label="Campo"
        options={OPTIONS}
        description={description ? HELP : undefined}
        errors={error ? ERROR : undefined}
        aria-describedby={describedBy}
      />
    ),
  },
  {
    name: 'Select pesquisável',
    render: ({ description, error, describedBy }) => (
      <Select
        label="Campo"
        options={OPTIONS}
        searchable
        description={description ? HELP : undefined}
        errors={error ? ERROR : undefined}
        aria-describedby={describedBy}
      />
    ),
  },
  {
    name: 'Combobox',
    withoutDescription: true,
    render: ({ error, describedBy }) => (
      <Combobox
        label="Campo"
        options={OPTIONS}
        value=""
        onValueChange={vi.fn()}
        errors={error ? ERROR : undefined}
        aria-describedby={describedBy}
      />
    ),
  },
  {
    name: 'MultiSelect',
    render: ({ description, error, describedBy }) => (
      <MultiSelect
        label="Campo"
        options={OPTIONS}
        description={description ? HELP : undefined}
        errors={error ? ERROR : undefined}
        aria-describedby={describedBy}
      />
    ),
  },
  {
    name: 'AsyncCombobox',
    render: ({ description, error, describedBy }) => (
      <AsyncCombobox
        label="Campo"
        value=""
        onValueChange={vi.fn()}
        onSearch={vi.fn().mockResolvedValue([])}
        description={description ? HELP : undefined}
        errors={error ? ERROR : undefined}
        aria-describedby={describedBy}
      />
    ),
  },
  {
    name: 'Checkbox',
    render: ({ description, error, describedBy }) => (
      <Checkbox
        label="Campo"
        description={description ? HELP : undefined}
        errors={error ? ERROR : undefined}
        aria-describedby={describedBy}
      />
    ),
  },
  {
    name: 'Switch',
    render: ({ description, error, describedBy }) => (
      <Switch
        label="Campo"
        description={description ? HELP : undefined}
        errors={error ? ERROR : undefined}
        aria-describedby={describedBy}
      />
    ),
  },
];

describe('campos globais: descrição e erro ligados ao controle', () => {
  it.each(fields)(
    '$name anuncia a descrição e o erro',
    ({ render: renderField, withoutDescription }) => {
      render(renderField({ description: true, error: true }));

      expect(screen.getByLabelText('Campo')).toHaveAccessibleDescription(
        withoutDescription ? ERROR.message : `${HELP} ${ERROR.message}`
      );
    }
  );

  it.each(fields.filter((field) => !field.withoutDescription))(
    '$name anuncia só a descrição quando não há erro',
    ({ render: renderField }) => {
      render(renderField({ description: true }));

      expect(screen.getByLabelText('Campo')).toHaveAccessibleDescription(HELP);
    }
  );

  it.each(fields)(
    '$name não emite `aria-describedby` sem descrição, erro nem do chamador',
    ({ render: renderField }) => {
      render(renderField({}));

      expect(screen.getByLabelText('Campo')).not.toHaveAttribute(
        'aria-describedby'
      );
    }
  );

  it.each(fields)(
    '$name mescla o `aria-describedby` do chamador com o seu',
    ({ render: renderField }) => {
      render(
        <>
          <p id="extra-hint">Dica externa</p>
          {renderField({ error: true, describedBy: 'extra-hint' })}
        </>
      );

      expect(screen.getByLabelText('Campo')).toHaveAccessibleDescription(
        `${ERROR.message} Dica externa`
      );
    }
  );

  it('RadioGroup liga o erro do grupo ao radiogroup e mescla o do chamador', () => {
    render(
      <>
        <p id="extra-hint">Dica externa</p>
        <RadioGroup
          label="Grupo"
          options={OPTIONS}
          errors={ERROR}
          aria-describedby="extra-hint"
        />
      </>
    );

    expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription(
      `${ERROR.message} Dica externa`
    );
  });

  it('RadioGroup sem erro não emite `aria-describedby` no grupo', () => {
    render(<RadioGroup label="Grupo" options={OPTIONS} />);

    expect(screen.getByRole('radiogroup')).not.toHaveAttribute(
      'aria-describedby'
    );
  });

  it('o gatilho com `role=combobox` recebe a ligação no Combobox e no MultiSelect', () => {
    render(
      <>
        <Combobox
          id="cb"
          label="Combo"
          options={OPTIONS}
          value=""
          onValueChange={vi.fn()}
          errors={ERROR}
        />
        <MultiSelect
          id="ms"
          label="Multi"
          options={OPTIONS}
          description={HELP}
        />
      </>
    );

    expect(screen.getByRole('combobox', { name: 'Combo' })).toHaveAttribute(
      'aria-describedby',
      'cb-error'
    );
    expect(screen.getByRole('combobox', { name: 'Multi' })).toHaveAttribute(
      'aria-describedby',
      'ms-description'
    );
  });
});

describe('RadioGroup: ids das opções não colidem com os do grupo', () => {
  it('opção de valor "error" não toma o id do erro do grupo', () => {
    render(
      <RadioGroup
        id="g"
        label="Grupo"
        options={[
          { value: 'error', label: 'Erro', description: 'Detalhe' },
          { value: 'legend', label: 'Legenda' },
        ]}
        errors={ERROR}
      />
    );

    const ids = Array.from(document.querySelectorAll('[id]')).map(
      (element) => element.id
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription(
      ERROR.message
    );
    expect(
      screen.getByRole('radio', { name: 'Erro' })
    ).toHaveAccessibleDescription('Detalhe');
  });
});
