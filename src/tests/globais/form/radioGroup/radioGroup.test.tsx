import { useForm } from 'react-hook-form';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  RadioGroup,
  type IRadioGroupOption,
} from '@/components/global/form/radioGroup';

const options: IRadioGroupOption[] = [
  { value: 'email', label: 'E-mail', description: 'Receber por e-mail.' },
  { value: 'sms', label: 'SMS' },
];

describe('RadioGroup (global)', () => {
  it('nomeia o grupo pela legenda e cada opção pelo seu rótulo, sem `id`', async () => {
    const handleChange = vi.fn();
    render(
      <RadioGroup
        label="Canal"
        options={options}
        onValueChange={handleChange}
      />
    );

    expect(screen.getByRole('radiogroup', { name: 'Canal' })).toBeVisible();
    await userEvent.click(screen.getByText('SMS'));
    expect(handleChange).toHaveBeenCalledWith('sms');
    expect(screen.getByLabelText('SMS')).toBeChecked();
  });

  it('`id` informado vira o prefixo dos ids', () => {
    render(<RadioGroup id="channel" label="Canal" options={options} />);

    expect(screen.getByLabelText('SMS')).toHaveAttribute('id', 'channel-sms');
  });

  it('liga a descrição da opção por aria-describedby', () => {
    render(<RadioGroup label="Canal" options={options} />);

    expect(screen.getByLabelText('E-mail')).toHaveAccessibleDescription(
      'Receber por e-mail.'
    );
    expect(screen.getByLabelText('SMS')).not.toHaveAttribute(
      'aria-describedby'
    );
  });

  it('srOnlyLabel esconde a legenda do olho, e não do leitor de tela', () => {
    render(<RadioGroup label="Canal" options={options} srOnlyLabel />);

    expect(
      screen.getByRole('radiogroup', { name: 'Canal' })
    ).toBeInTheDocument();
    expect(screen.getByText('Canal')).toHaveClass('sr-only');
  });

  it('integra com react-hook-form, com defaultValue', async () => {
    function Harness() {
      const { control, watch } = useForm<{ channel: string }>();
      return (
        <>
          <RadioGroup
            control={control}
            name="channel"
            defaultValue="email"
            label="Canal"
            options={options}
          />
          <span data-testid="value">{watch('channel')}</span>
        </>
      );
    }

    render(<Harness />);

    expect(screen.getByLabelText('E-mail')).toBeChecked();
    await userEvent.click(screen.getByLabelText('SMS'));
    expect(screen.getByTestId('value')).toHaveTextContent('sms');
  });

  it('ArrowDown na opção marcada marca a próxima e atualiza o formulário', async () => {
    function Harness() {
      const { control, watch } = useForm<{ channel: string }>();
      return (
        <>
          <RadioGroup
            control={control}
            name="channel"
            defaultValue="email"
            label="Canal"
            options={options}
          />
          <span data-testid="value">{watch('channel')}</span>
        </>
      );
    }

    render(<Harness />);

    screen.getByLabelText('E-mail').focus();
    // A tecla fica pressionada até o foco chegar: o Radix só marca no foco por seta.
    await userEvent.keyboard('{ArrowDown>}');
    await waitFor(() => expect(screen.getByLabelText('SMS')).toBeChecked());
    await userEvent.keyboard('{/ArrowDown}');

    expect(screen.getByLabelText('SMS')).toHaveFocus();
    expect(screen.getByTestId('value')).toHaveTextContent('sms');
  });

  it('sem valor no formulário, nenhuma opção vem marcada', () => {
    function Harness() {
      const { control } = useForm<{ channel: string }>();
      return (
        <RadioGroup
          control={control}
          name="channel"
          label="Canal"
          options={options}
        />
      );
    }

    render(<Harness />);

    expect(screen.getByLabelText('E-mail')).not.toBeChecked();
    expect(screen.getByLabelText('SMS')).not.toBeChecked();
  });

  it('aplica `rules` e mostra o erro com aria-invalid', async () => {
    function Harness() {
      const { control, trigger } = useForm<{ channel: string }>({
        defaultValues: { channel: '' },
      });
      return (
        <>
          <RadioGroup
            control={control}
            name="channel"
            rules={{ required: 'Escolha um canal.' }}
            label="Canal"
            options={options}
          />
          <button type="button" onClick={() => void trigger()}>
            validar
          </button>
        </>
      );
    }

    render(<Harness />);

    await userEvent.click(screen.getByText('validar'));
    expect(await screen.findByText('Escolha um canal.')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('disabled bloqueia as opções', () => {
    render(<RadioGroup label="Canal" options={options} disabled />);

    expect(screen.getByLabelText('SMS')).toBeDisabled();
  });
});
