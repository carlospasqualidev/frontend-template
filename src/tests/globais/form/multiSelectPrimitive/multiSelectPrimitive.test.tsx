import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MultiSelect } from '@/components/global/form/multiSelectPrimitive';

const FRUITS = [
  { value: 'apple', label: 'Maçã' },
  { value: 'banana', label: 'Banana' },
  { value: 'orange', label: 'Laranja' },
];

describe('MultiSelect (primitive)', () => {
  it('exibe placeholder quando nada está selecionado', () => {
    render(<MultiSelect options={FRUITS} placeholder="Escolha frutas" />);

    expect(screen.getByText('Escolha frutas')).toBeInTheDocument();
  });

  it('marca opções e propaga onValueChange (uncontrolled)', async () => {
    const handleChange = vi.fn();
    render(
      <MultiSelect
        options={FRUITS}
        placeholder="Escolha"
        onValueChange={handleChange}
      />
    );

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('Maçã'));

    expect(handleChange).toHaveBeenLastCalledWith(['apple']);

    await userEvent.click(screen.getByText('Banana'));
    expect(handleChange).toHaveBeenLastCalledWith(['apple', 'banana']);
  });

  it('respeita value (controlled) e renderiza os rótulos no trigger', () => {
    render(
      <MultiSelect
        options={FRUITS}
        value={['apple', 'orange']}
        onValueChange={() => undefined}
      />
    );

    expect(screen.getByText('Maçã, Laranja')).toBeInTheDocument();
  });

  it('resume quando excede maxDisplay', () => {
    render(
      <MultiSelect
        options={FRUITS}
        value={['apple', 'banana', 'orange']}
        maxDisplay={2}
        onValueChange={() => undefined}
      />
    );

    expect(screen.getByText('3 selecionados')).toBeInTheDocument();
  });

  it('filtra opções quando searchable=true', async () => {
    render(
      <MultiSelect
        options={FRUITS}
        searchable
        searchPlaceholder="Buscar fruta..."
      />
    );

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.type(screen.getByPlaceholderText('Buscar fruta...'), 'maç');

    expect(screen.getByText('Maçã')).toBeInTheDocument();
    expect(screen.queryByText('Banana')).not.toBeInTheDocument();
    expect(screen.queryByText('Laranja')).not.toBeInTheDocument();
  });

  it('renderiza um hidden input por valor quando `name` é informado', () => {
    const { container } = render(
      <MultiSelect
        options={FRUITS}
        name="fruits"
        value={['apple', 'banana']}
        onValueChange={() => undefined}
      />
    );

    const hiddenInputs = container.querySelectorAll('input[type="hidden"]');
    expect(hiddenInputs).toHaveLength(2);
    expect(hiddenInputs[0]).toHaveAttribute('name', 'fruits');
    expect(hiddenInputs[0]).toHaveAttribute('value', 'apple');
    expect(hiddenInputs[1]).toHaveAttribute('value', 'banana');
  });

  it('clearable exibe um "X" no gatilho que limpa toda a seleção sem abrir a lista', async () => {
    const handleChange = vi.fn();
    render(
      <MultiSelect
        options={FRUITS}
        clearable
        value={['apple', 'banana']}
        onValueChange={handleChange}
      />
    );

    // Sem abrir o popover, o "X" do gatilho já limpa.
    await userEvent.click(
      screen.getByRole('button', { name: 'Limpar seleção' })
    );
    expect(handleChange).toHaveBeenCalledWith([]);
  });

  it('clearable não exibe o "X" quando nada está selecionado', () => {
    render(
      <MultiSelect
        options={FRUITS}
        clearable
        value={[]}
        onValueChange={() => undefined}
      />
    );
    expect(
      screen.queryByRole('button', { name: 'Limpar seleção' })
    ).not.toBeInTheDocument();
  });

  describe('busca no servidor (onSearchChange)', () => {
    // Controlado como numa tela: quem busca troca `options` pelo resultado.
    function ServerSearchHarness({
      onSearchChange,
      onValueChange,
    }: {
      onSearchChange: (search: string) => void;
      onValueChange: (value: string[]) => void;
    }) {
      const [value, setValue] = useState<string[]>([]);
      const [search, setSearch] = useState('');
      const results = FRUITS.filter((fruit) =>
        fruit.label.toLowerCase().startsWith(search.toLowerCase())
      );
      return (
        <MultiSelect
          options={search === 'nada' ? [] : results}
          value={value}
          onValueChange={(next) => {
            setValue(next);
            onValueChange(next);
          }}
          onSearchChange={(next) => {
            setSearch(next);
            onSearchChange(next);
          }}
          loading={search === 'nada'}
          searchPlaceholder="Buscar fruta..."
        />
      );
    }

    it('repassa o texto digitado e mostra as opções como vieram', async () => {
      const handleSearch = vi.fn();
      render(
        <MultiSelect
          options={FRUITS}
          onSearchChange={handleSearch}
          searchPlaceholder="Buscar fruta..."
        />
      );

      await userEvent.click(screen.getByRole('combobox'));
      await userEvent.type(
        screen.getByRole('textbox', { name: 'Buscar fruta...' }),
        'ma'
      );

      expect(handleSearch).toHaveBeenLastCalledWith('ma');
      // Sem filtro local: quem filtra é o servidor.
      expect(screen.getByText('Banana')).toBeInTheDocument();
    });

    it('mantém a opção marcada no gatilho e no topo quando sai do resultado', async () => {
      const handleChange = vi.fn();
      render(
        <ServerSearchHarness
          onSearchChange={() => undefined}
          onValueChange={handleChange}
        />
      );

      await userEvent.click(screen.getByRole('combobox'));
      await userEvent.click(screen.getByText('Banana'));
      await userEvent.type(
        screen.getByRole('textbox', { name: 'Buscar fruta...' }),
        'la'
      );

      // Com a lista aberta (modal), o gatilho sai da árvore acessível.
      expect(screen.getByRole('combobox', { hidden: true })).toHaveTextContent(
        'Banana'
      );
      expect(screen.getByRole('checkbox', { name: 'Banana' })).toBeChecked();
      expect(screen.getByText('Laranja')).toBeInTheDocument();

      // Desmarca pela opção guardada no topo da lista.
      await userEvent.click(screen.getByRole('checkbox', { name: 'Banana' }));
      expect(handleChange).toHaveBeenLastCalledWith([]);
    });

    it('avisa a busca em andamento e limpa o termo ao fechar', async () => {
      const handleSearch = vi.fn();
      render(
        <ServerSearchHarness
          onSearchChange={handleSearch}
          onValueChange={() => undefined}
        />
      );

      await userEvent.click(screen.getByRole('combobox'));
      await userEvent.type(
        screen.getByRole('textbox', { name: 'Buscar fruta...' }),
        'nada'
      );
      expect(screen.getByText('Buscando...')).toBeInTheDocument();

      await userEvent.keyboard('{Escape}');
      expect(handleSearch).toHaveBeenLastCalledWith('');
    });
  });

  describe('Selecionar tudo', () => {
    it('marca o que está à vista, ignora desabilitadas e não duplica marcadas', async () => {
      const handleChange = vi.fn();
      render(
        <MultiSelect
          options={[
            ...FRUITS,
            { value: 'pear', label: 'Pera', disabled: true },
          ]}
          defaultValue={['banana']}
          onValueChange={handleChange}
        />
      );

      await userEvent.click(screen.getByRole('combobox'));
      await userEvent.click(
        screen.getByRole('button', { name: 'Selecionar tudo' })
      );

      expect(handleChange).toHaveBeenLastCalledWith([
        'banana',
        'apple',
        'orange',
      ]);
    });

    it('marca só o resultado da busca local', async () => {
      const handleChange = vi.fn();
      render(
        <MultiSelect
          options={FRUITS}
          searchable
          onValueChange={handleChange}
          searchPlaceholder="Buscar fruta..."
        />
      );

      await userEvent.click(screen.getByRole('combobox'));
      await userEvent.type(
        screen.getByRole('textbox', { name: 'Buscar fruta...' }),
        'ban'
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Selecionar tudo' })
      );

      expect(handleChange).toHaveBeenLastCalledWith(['banana']);
    });

    it('some quando não há o que marcar', async () => {
      render(
        <MultiSelect
          options={FRUITS}
          value={['apple', 'banana', 'orange']}
          onValueChange={() => undefined}
        />
      );

      await userEvent.click(screen.getByRole('combobox'));

      expect(
        screen.queryByRole('button', { name: 'Selecionar tudo' })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /limpar sele/i })
      ).toBeInTheDocument();
    });

    it('no modo servidor mantém no gatilho o rótulo do que marcou e saiu do resultado', async () => {
      function Harness() {
        const [value, setValue] = useState<string[]>([]);
        const [search, setSearch] = useState('');
        return (
          <MultiSelect
            options={FRUITS.filter((fruit) =>
              fruit.label.toLowerCase().startsWith(search.toLowerCase())
            )}
            value={value}
            onValueChange={setValue}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar fruta..."
          />
        );
      }
      render(<Harness />);

      await userEvent.click(screen.getByRole('combobox'));
      await userEvent.click(
        screen.getByRole('button', { name: 'Selecionar tudo' })
      );
      await userEvent.type(
        screen.getByRole('textbox', { name: 'Buscar fruta...' }),
        'zzz'
      );

      expect(screen.getByRole('combobox', { hidden: true })).toHaveTextContent(
        'Maçã, Banana, Laranja'
      );
    });
  });

  describe('minChars (modo servidor)', () => {
    it('com termo curto e sem opções pede mais caracteres; a partir do mínimo mostra emptyText', async () => {
      render(
        <MultiSelect
          options={[]}
          onSearchChange={() => undefined}
          minChars={3}
          emptyText="Nada por aqui."
          searchPlaceholder="Buscar fruta..."
        />
      );

      await userEvent.click(screen.getByRole('combobox'));
      expect(
        screen.getByText('Digite ao menos 3 caracteres.')
      ).toBeInTheDocument();

      await userEvent.type(
        screen.getByRole('textbox', { name: 'Buscar fruta...' }),
        'ma'
      );
      expect(
        screen.getByText('Digite ao menos 3 caracteres.')
      ).toBeInTheDocument();

      await userEvent.type(
        screen.getByRole('textbox', { name: 'Buscar fruta...' }),
        'c'
      );
      expect(screen.getByText('Nada por aqui.')).toBeInTheDocument();
    });

    it('sem onSearchChange o minChars não age', async () => {
      render(<MultiSelect options={[]} minChars={3} emptyText="Nada." />);

      await userEvent.click(screen.getByRole('combobox'));

      expect(screen.getByText('Nada.')).toBeInTheDocument();
    });

    it('abaixo do mínimo some o resultado da busca anterior e o "Selecionar tudo", mas as marcadas ficam', async () => {
      function Harness() {
        const [options, setOptions] = useState<typeof FRUITS>([]);
        const [value, setValue] = useState<string[]>([]);
        return (
          <MultiSelect
            options={options}
            value={value}
            onValueChange={setValue}
            onSearchChange={(term) => {
              // A tela não consulta abaixo do mínimo: mantém o resultado antigo.
              if (term.length >= 3) setOptions(FRUITS);
            }}
            minChars={3}
            searchPlaceholder="Buscar fruta..."
          />
        );
      }
      render(<Harness />);
      const user = userEvent.setup();

      await user.click(screen.getByRole('combobox'));
      const input = screen.getByRole('textbox', { name: 'Buscar fruta...' });
      await user.type(input, 'abc');
      await user.click(screen.getByText('Banana'));
      expect(screen.getByText('Laranja')).toBeInTheDocument();

      await user.type(input, '{Backspace}');

      expect(screen.queryByText('Laranja')).not.toBeInTheDocument();
      expect(screen.queryByText('Maçã')).not.toBeInTheDocument();
      expect(screen.getAllByText('Banana').length).toBeGreaterThan(0);
      expect(
        screen.queryByRole('button', { name: 'Selecionar tudo' })
      ).not.toBeInTheDocument();

      await user.clear(input);
      await user.type(input, 'ab');
      expect(screen.queryByText('Laranja')).not.toBeInTheDocument();
    });

    it('abaixo do mínimo, sem marcadas, mostra a mensagem de digitar mais', async () => {
      function Harness() {
        const [options, setOptions] = useState<typeof FRUITS>([]);
        return (
          <MultiSelect
            options={options}
            onSearchChange={(term) => {
              if (term.length >= 3) setOptions(FRUITS);
            }}
            minChars={3}
            searchPlaceholder="Buscar fruta..."
          />
        );
      }
      render(<Harness />);
      const user = userEvent.setup();

      await user.click(screen.getByRole('combobox'));
      const input = screen.getByRole('textbox', { name: 'Buscar fruta...' });
      await user.type(input, 'abc');
      expect(screen.getByText('Laranja')).toBeInTheDocument();

      await user.type(input, '{Backspace}');

      expect(screen.queryByText('Laranja')).not.toBeInTheDocument();
      expect(screen.getByText('Digite ao menos 3 caracteres.')).toBeVisible();
      expect(
        screen.queryByRole('button', { name: 'Selecionar tudo' })
      ).not.toBeInTheDocument();
    });

    it('com opções na tela e busca em andamento mantém a lista e marca aria-busy', async () => {
      render(
        <MultiSelect
          options={FRUITS}
          onSearchChange={() => undefined}
          loading
        />
      );

      await userEvent.click(screen.getByRole('combobox'));

      expect(screen.getByText('Banana')).toBeInTheDocument();
      expect(screen.queryByText('Buscando...')).not.toBeInTheDocument();
      expect(screen.getByRole('group')).toHaveAttribute('aria-busy', 'true');
    });
  });

  it('permite limpar a seleção via botão "Limpar seleção"', async () => {
    const handleChange = vi.fn();
    render(
      <MultiSelect
        options={FRUITS}
        value={['apple']}
        onValueChange={handleChange}
      />
    );

    await userEvent.click(screen.getByRole('combobox'));

    const dialog = screen.getByRole('group');
    void within(dialog);
    await userEvent.click(screen.getByRole('button', { name: /limpar sele/i }));

    expect(handleChange).toHaveBeenCalledWith([]);
  });
});
