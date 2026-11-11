import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { AsyncCombobox } from '@/components/global/form/asyncCombobox';
import { Combobox } from '@/components/global/form/combobox';
import { DateTimeField } from '@/components/global/form/dateTimeField';
import { DecimalField } from '@/components/global/form/decimalField';
import { InputField } from '@/components/global/form/inputField';
import { MultiSelect } from '@/components/global/form/multiSelect';
import { Select } from '@/components/global/form/select';
import { TextArea } from '@/components/global/form/textArea';

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

function DecimalHarness({ id }: { id?: string }) {
  const { control } = useForm<{ value?: number }>();
  return (
    <DecimalField
      id={id}
      name="value"
      control={control}
      label="Campo"
      srOnlyLabel
    />
  );
}

const fields: Array<{
  name: string;
  render: (id?: string) => React.ReactElement;
}> = [
  {
    name: 'InputField',
    render: (id) => <InputField id={id} label="Campo" srOnlyLabel />,
  },
  {
    name: 'TextArea',
    render: (id) => <TextArea id={id} label="Campo" srOnlyLabel />,
  },
  {
    name: 'DateTimeField',
    render: (id) => <DateTimeField id={id} label="Campo" srOnlyLabel />,
  },
  {
    name: 'DecimalField',
    render: (id) => <DecimalHarness id={id} />,
  },
  {
    name: 'Select',
    render: (id) => (
      <Select id={id} label="Campo" srOnlyLabel options={OPTIONS} />
    ),
  },
  {
    name: 'Combobox',
    render: (id) => (
      <Combobox
        id={id}
        label="Campo"
        srOnlyLabel
        options={OPTIONS}
        value=""
        onValueChange={vi.fn()}
      />
    ),
  },
  {
    name: 'MultiSelect',
    render: (id) => (
      <MultiSelect id={id} label="Campo" srOnlyLabel options={OPTIONS} />
    ),
  },
  {
    name: 'AsyncCombobox',
    render: (id) => (
      <AsyncCombobox
        id={id}
        label="Campo"
        srOnlyLabel
        value=""
        onValueChange={vi.fn()}
        onSearch={vi.fn().mockResolvedValue([])}
      />
    ),
  },
];

describe('campos globais: rótulo sr-only ligado sem `id`', () => {
  it.each(fields)(
    '$name deriva o id e liga o rótulo oculto ao controle',
    ({ render: renderField }) => {
      render(renderField());

      const control = screen.getByLabelText('Campo');
      expect(screen.getByText('Campo')).toHaveClass('sr-only');
      expect(control).toHaveAttribute('id');
      expect(screen.getByText('Campo')).toHaveAttribute(
        'for',
        control.getAttribute('id')
      );
    }
  );

  it.each(fields)(
    '$name mantém o `id` do chamador, que vence o derivado',
    ({ render: renderField }) => {
      render(renderField('meu-id'));

      expect(screen.getByLabelText('Campo')).toHaveAttribute('id', 'meu-id');
    }
  );
});
