import { useForm } from 'react-hook-form';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Switch } from '@/components/global/form/switch';

describe('Switch (global)', () => {
  it('renderiza label e dispara onCheckedChange em modo uncontrolled', async () => {
    const handleChange = vi.fn();
    render(
      <Switch
        id="admin"
        label="Acesso administrativo"
        checked={false}
        onCheckedChange={handleChange}
      />
    );

    const label = screen.getByText('Acesso administrativo');
    expect(label).toBeInTheDocument();

    await userEvent.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('renderiza description quando fornecida', () => {
    render(
      <Switch
        id="admin"
        label="Notificações"
        description="Receber alertas por e-mail."
        checked={true}
        onCheckedChange={() => undefined}
      />
    );

    expect(screen.getByText('Receber alertas por e-mail.')).toBeInTheDocument();
  });

  it('integra com react-hook-form em modo controlled', async () => {
    function Harness() {
      const { control, watch } = useForm({
        defaultValues: { admin: false },
      });
      const admin = watch('admin');

      return (
        <>
          <Switch id="admin" name="admin" control={control} label="Admin" />
          <span data-testid="value">{String(admin)}</span>
        </>
      );
    }

    render(<Harness />);

    expect(screen.getByTestId('value')).toHaveTextContent('false');

    await userEvent.click(screen.getByRole('switch'));
    expect(screen.getByTestId('value')).toHaveTextContent('true');
  });
});
