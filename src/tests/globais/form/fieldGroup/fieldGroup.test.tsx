import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FieldGroup } from '@/components/global/form/fieldGroup';
import { InputField } from '@/components/global/form/inputField';

describe('FieldGroup', () => {
  it('agrupa os campos num `fieldset` com o título como legenda', () => {
    render(
      <FieldGroup title="Endereço">
        <InputField id="street" label="Rua" placeholder="Informe a rua" />
      </FieldGroup>
    );

    // `fieldset` + `legend` é o que dá ao leitor de tela o nome do grupo — por
    // isso a asserção é pelo grupo acessível, não pelo texto solto.
    expect(screen.getByRole('group', { name: 'Endereço' })).toBeInTheDocument();
    expect(screen.getByLabelText('Rua')).toBeInTheDocument();
  });

  it('exibe a descrição do grupo quando informada', () => {
    render(
      <FieldGroup
        title="Endereço"
        description="Usado para a entrega e para o documento fiscal."
      >
        <InputField id="street" label="Rua" placeholder="Informe a rua" />
      </FieldGroup>
    );

    expect(
      screen.getByText('Usado para a entrega e para o documento fiscal.')
    ).toBeInTheDocument();
  });

  it('sem título, não renderiza legenda (grupo puramente de layout)', () => {
    render(
      <FieldGroup>
        <InputField id="street" label="Rua" placeholder="Informe a rua" />
      </FieldGroup>
    );

    expect(screen.queryByRole('group', { name: /.+/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Rua')).toBeInTheDocument();
  });

  it('renderiza vários campos filhos na ordem declarada', () => {
    render(
      <FieldGroup title="Contato">
        <InputField id="email" label="E-mail" placeholder="seu@email.com" />
        <InputField id="phone" label="Telefone" placeholder="(00) 00000-0000" />
      </FieldGroup>
    );

    const labels = screen
      .getAllByText(/E-mail|Telefone/)
      .map((element) => element.textContent);

    expect(labels).toEqual(['E-mail', 'Telefone']);
  });
});
