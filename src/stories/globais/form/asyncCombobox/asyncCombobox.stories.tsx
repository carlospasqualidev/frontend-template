import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { AsyncCombobox } from '@/components/global/form/asyncCombobox';
import { Card } from '@/components/global/card/card';

// Vitrine render-only (sem `component`/`args`): a lista fictícia mora "no servidor".
const meta = {
  title: 'Formulário/AsyncCombobox',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Escolha **única** numa lista que mora no servidor: a busca dispara depois de `minChars` (padrão 3) e de 300 ms sem digitar, e o filtro local fica desligado. `onSearch` precisa ser estável (`useCallback`). Para um valor que chega de fora (URL), passe `selectedLabel`.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const PEOPLE = [
  'Ana Souza',
  'Ana Lima',
  'Bruno Dias',
  'Carla Mendes',
  'Daniel Rocha',
  'Elisa Prado',
  'Fábio Nunes',
].map((name) => ({
  value: name.toLowerCase().replace(/\s+/g, '-'),
  label: name,
}));

function Demo({ initial = '' }: { initial?: string }) {
  const [value, setValue] = React.useState(initial);

  const onSearch = React.useCallback(
    (term: string) =>
      new Promise<{ value: string; label: string }[]>((resolve) => {
        setTimeout(
          () =>
            resolve(
              PEOPLE.filter((person) =>
                person.label.toLowerCase().includes(term.toLowerCase())
              )
            ),
          400
        );
      }),
    []
  );

  return (
    <AsyncCombobox
      id="async-owner"
      label="Responsável"
      placeholder="Busque pelo nome"
      description="Digite ao menos 3 caracteres."
      value={value}
      onValueChange={setValue}
      onSearch={onSearch}
      selectedLabel={initial && value === initial ? 'Bruno Dias' : undefined}
      clearable
    />
  );
}

export const Vitrine: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Busca no servidor">
        <Demo />
      </Card>
      <Card title="Valor vindo de fora, com rótulo">
        <Demo initial="bruno-dias" />
      </Card>
    </div>
  ),
};
