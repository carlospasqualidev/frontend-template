import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FieldError } from '@/components/global/form/fieldError';

describe('FieldError', () => {
  it('sem erro, não renderiza nada', () => {
    const { container } = render(<FieldError errors={undefined} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('com o erro do campo, mostra a mensagem como alerta e leva o id', () => {
    render(
      <FieldError
        id="error-group"
        errors={{ message: 'Selecione ao menos uma opção.' }}
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Selecione ao menos uma opção.');
    expect(alert).toHaveAttribute('id', 'error-group');
  });

  it('mensagens repetidas aparecem uma vez; distintas viram lista', () => {
    render(
      <FieldError
        errors={[
          { message: 'Obrigatório.' },
          { message: 'Obrigatório.' },
          { message: 'Formato inválido.' },
        ]}
      />
    );

    expect(
      screen.getAllByRole('listitem').map((item) => item.textContent)
    ).toEqual(['Obrigatório.', 'Formato inválido.']);
  });
});
