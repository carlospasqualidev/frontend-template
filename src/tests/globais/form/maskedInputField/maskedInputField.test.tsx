import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { MaskedInputField } from '@/components/global/form/maskedInputField';
import { Button } from '@/components/global/button/button';
import { useZodForm } from '@/lib/forms/useZodForm';
import type { MaskKind } from '@/components/global/form/maskedInputField';

const schema = z.object({ field: z.string() });

function Form({
  mask,
  onSubmit,
  initial = '',
}: {
  mask: MaskKind;
  onSubmit: (values: { field: string }) => void;
  initial?: string;
}) {
  const { control, handleSubmit } = useZodForm({
    schema,
    defaultValues: { field: initial },
  });

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <MaskedInputField
        control={control}
        name="field"
        id="field"
        label="Documento"
        mask={mask}
        placeholder="Informe"
      />
      <Button type="submit">Enviar</Button>
    </form>
  );
}

describe('MaskedInputField (global)', () => {
  it('mascara na digitação', async () => {
    const user = userEvent.setup();
    render(<Form mask="cnpj" onSubmit={vi.fn()} />);

    const field = screen.getByLabelText('Documento');
    await user.type(field, '11222333000181');

    expect(field).toHaveValue('11.222.333/0001-81');
  });

  it('sete dígitos digitados ficam pontuados em vez de crus', async () => {
    const user = userEvent.setup();
    render(<Form mask="cnpj" onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText('Documento'), '4141124');

    expect(screen.getByLabelText('Documento')).toHaveValue('41.411.24');
  });

  it('O QUE SAI é só dígito, e é isso que importa', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form mask="cpf" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Documento'), '52998224725');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    // O formulário guarda só dígitos, sem a pontuação da máscara.
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ field: '52998224725' }),
      expect.anything()
    );
  });

  it('valor que vem do servidor aparece mascarado', () => {
    // Ele chega cru; quem abre a edição precisa ler um documento, não um número.
    render(<Form mask="cpf" onSubmit={vi.fn()} initial="52998224725" />);

    expect(screen.getByLabelText('Documento')).toHaveValue('529.982.247-25');
  });

  it('digitar pontuação não a duplica', async () => {
    const user = userEvent.setup();
    render(<Form mask="cpf" onSubmit={vi.fn()} />);

    // Quem cola um documento já formatado não pode acabar com dois pontos.
    await user.type(screen.getByLabelText('Documento'), '529.982.247-25');

    expect(screen.getByLabelText('Documento')).toHaveValue('529.982.247-25');
  });

  it('`none` não mascara nada, para o campo que também serve a e-mail', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form mask="none" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Documento'), 'pessoa@empresa.com');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    /**
     * Sem isto, a máscara de telefone comeria o "@" e o ponto do domínio — o
     * mesmo campo serve para e-mail OU telefone, e mascarar o e-mail é pior que
     * não mascarar nada.
     */
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ field: 'pessoa@empresa.com' }),
      expect.anything()
    );
  });

  it('o rótulo alcança o campo', () => {
    render(<Form mask="cep" onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('Documento')).toBe(
      screen.getByPlaceholderText('Informe')
    );
  });

  it('com máscara o teclado do celular é numérico', () => {
    render(<Form mask="cnpj" onSubmit={vi.fn()} />);

    // Sem isto, digitar um CNPJ no telefone exige trocar de teclado.
    expect(screen.getByLabelText('Documento')).toHaveAttribute(
      'inputmode',
      'numeric'
    );
  });
});

/**
 * O que o campo mostra é o que o formulário guarda: nove dígitos digitados num
 * CEP aparecem como oito e saem como oito. Cada caso confere as duas pontas.
 */
describe('MaskedInputField — o que aparece é o que sai', () => {
  async function send(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
  }

  function sent(onSubmit: ReturnType<typeof vi.fn>): string {
    const [values] = onSubmit.mock.calls.at(-1) ?? [];
    return (values as { field: string }).field;
  }

  function fieldDigits(): string {
    const field = screen.getByLabelText('Documento');
    return (field as HTMLInputElement).value.replace(/\D/g, '');
  }

  it('CEP com nove dígitos digitados guarda os oito que aparecem', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form mask="cep" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Documento'), '000000000');
    await send(user);

    expect(screen.getByLabelText('Documento')).toHaveValue('00000-000');
    expect(sent(onSubmit)).toBe('00000000');
  });

  it('CNPJ com quinze dígitos digitados guarda os catorze que aparecem', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form mask="cnpj" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Documento'), '112223330001819');
    await send(user);

    expect(screen.getByLabelText('Documento')).toHaveValue(
      '11.222.333/0001-81'
    );
    expect(sent(onSubmit)).toBe('11222333000181');
  });

  it('valor colado maior que a máscara guarda o que aparece', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form mask="cpf" onSubmit={onSubmit} />);

    await user.click(screen.getByLabelText('Documento'));
    await user.paste('529.982.247-25999');
    await send(user);

    expect(screen.getByLabelText('Documento')).toHaveValue('529.982.247-25');
    expect(sent(onSubmit)).toBe('52998224725');
  });

  it('preenchimento automático do navegador (um único change) guarda o que aparece', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form mask="cep" onSubmit={onSubmit} />);

    /**
     * O autofill não digita nem cola: ele troca o valor do campo inteiro de uma
     * vez e dispara um único evento. O `userEvent` não tem esse gesto, e por
     * isso aqui é `fireEvent.change` — é exatamente o que o navegador faz.
     */
    fireEvent.change(screen.getByLabelText('Documento'), {
      target: { value: '88010-400123' },
    });
    await send(user);

    expect(screen.getByLabelText('Documento')).toHaveValue('88010-400');
    expect(sent(onSubmit)).toBe('88010400');
    expect(sent(onSubmit)).toBe(fieldDigits());
  });

  it('telefone preenchido como +55 48 99999-9999 perde o código do país, e não o fim do número', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form mask="phone" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Documento'), {
      target: { value: '+55 48 99999-9999' },
    });
    await send(user);

    expect(screen.getByLabelText('Documento')).toHaveValue('(48) 99999-9999');
    expect(sent(onSubmit)).toBe('48999999999');
  });

  it('telefone fixo preenchido como +55 (48) 3333-4444', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form mask="phone" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Documento'), {
      target: { value: '+55 (48) 3333-4444' },
    });
    await send(user);

    expect(screen.getByLabelText('Documento')).toHaveValue('(48) 3333-4444');
    expect(sent(onSubmit)).toBe('4833334444');
  });

  it('`digits` guarda só os algarismos, sem pontuar e sem cortar', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form mask="digits" onSubmit={onSubmit} />);

    // O traço digitado some: só algarismos.
    await user.type(screen.getByLabelText('Documento'), '1234567-8');
    await send(user);

    expect(screen.getByLabelText('Documento')).toHaveValue('12345678');
    expect(sent(onSubmit)).toBe('12345678');
    expect(screen.getByLabelText('Documento')).toHaveAttribute(
      'inputmode',
      'numeric'
    );
  });

  it('`digits` COLADO descarta letra e pontuação (inscrição estadual, RG)', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form mask="digits" onSubmit={onSubmit} />);

    // A pontuação colada não pode viajar.
    fireEvent.change(screen.getByLabelText('Documento'), {
      target: { value: 'MG-123.456.789.110' },
    });
    await send(user);

    expect(screen.getByLabelText('Documento')).toHaveValue('123456789110');
    expect(sent(onSubmit)).toBe('123456789110');
  });

  it('`digits` mostra igual o valor já gravado, ao abrir a edição', () => {
    render(<Form mask="digits" onSubmit={vi.fn()} initial="123456789110" />);

    expect(screen.getByLabelText('Documento')).toHaveValue('123456789110');
  });

  it('telefone COLADO com +55 perde o código do país', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form mask="phone" onSubmit={onSubmit} />);

    await user.click(screen.getByLabelText('Documento'));
    await user.paste('+55 (11) 91234-5678');
    await send(user);

    expect(screen.getByLabelText('Documento')).toHaveValue('(11) 91234-5678');
    expect(sent(onSubmit)).toBe('11912345678');
  });

  it.each([
    ['+5511912345678', '(11) 91234-5678', '11912345678'],
    ['011912345678', '(11) 91234-5678', '11912345678'],
  ])(
    'telefone inserido de uma vez por insertText (%s) é normalizado, não ignorado',
    async (inserted, shown, stored) => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<Form mask="phone" onSubmit={onSubmit} />);

      // Sugestão do teclado do celular/IME: um único `insertText` com o número inteiro.
      fireEvent.input(screen.getByLabelText('Documento'), {
        target: { value: inserted },
        inputType: 'insertText',
        data: inserted,
      });
      await send(user);

      expect(screen.getByLabelText('Documento')).toHaveValue(shown);
      expect(sent(onSubmit)).toBe(stored);
    }
  );

  it.each([
    // 13 dígitos por cima de 11, e 12 por cima de 11 (acréscimo líquido de 1 dígito).
    ['+55 48 99999-8888', '(48) 99999-8888', '48999998888'],
    ['+55 48 9999-8888', '(48) 9999-8888', '4899998888'],
  ])(
    'telefone completo, tudo selecionado, colar %s substitui o número',
    async (pasted, shown, stored) => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<Form mask="phone" onSubmit={onSubmit} initial="11912345678" />);

      const field = screen.getByLabelText<HTMLInputElement>('Documento');
      await user.click(field);
      field.setSelectionRange(0, field.value.length);
      await user.paste(pasted);
      await send(user);

      expect(field).toHaveValue(shown);
      expect(sent(onSubmit)).toBe(stored);
    }
  );

  it.each([
    ['cep', '01310100', '01310-100'],
    ['cpf', '52998224725', '529.982.247-25'],
  ] as const)(
    'composição IME dígito a dígito no %s: só formata no compositionend',
    async (mask, digits, formatted) => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<Form mask={mask} onSubmit={onSubmit} />);

      const field = screen.getByLabelText<HTMLInputElement>('Documento');
      fireEvent.compositionStart(field);
      for (let size = 1; size <= digits.length; size += 1) {
        const raw = digits.slice(0, size);
        fireEvent.input(field, {
          target: { value: raw },
          inputType: 'insertCompositionText',
          data: raw,
        });
        // Mascarar no meio da composição faz o IME reenviar o texto e duplicar dígito.
        expect(field).toHaveValue(raw);
      }
      fireEvent.compositionEnd(field);
      await send(user);

      expect(field).toHaveValue(formatted);
      expect(sent(onSubmit)).toBe(digits);
    }
  );

  it('blur no meio da composição encerra a composição: mascara e grava', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form mask="cep" onSubmit={onSubmit} />);

    const field = screen.getByLabelText<HTMLInputElement>('Documento');
    fireEvent.compositionStart(field);
    fireEvent.input(field, {
      target: { value: '013101' },
      inputType: 'insertCompositionText',
      data: '013101',
    });
    fireEvent.blur(field);
    await send(user);

    expect(field).toHaveValue('01310-1');
    expect(sent(onSubmit)).toBe('013101');
  });

  it('sem máscara a composição não atrasa o formulário', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form mask="none" onSubmit={onSubmit} />);

    const field = screen.getByLabelText<HTMLInputElement>('Documento');
    fireEvent.compositionStart(field);
    fireEvent.input(field, {
      target: { value: 'ação' },
      inputType: 'insertCompositionText',
      data: 'ação',
    });
    await send(user);

    expect(field).toHaveValue('ação');
    expect(sent(onSubmit)).toBe('ação');
  });

  it('telefone com DDD 55 completo ignora a tecla digitada a mais', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form mask="phone" onSubmit={onSubmit} initial="55999998888" />);

    await user.type(screen.getByLabelText('Documento'), '7', {
      initialSelectionStart: 15,
      initialSelectionEnd: 15,
    });
    await send(user);

    expect(screen.getByLabelText('Documento')).toHaveValue('(55) 99999-8888');
    expect(sent(onSubmit)).toBe('55999998888');
  });

  it('telefone com DDD 55 completo ignora 1 dígito vindo como insertCompositionText', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form mask="phone" onSubmit={onSubmit} initial="55999998888" />);

    fireEvent.input(screen.getByLabelText('Documento'), {
      target: { value: '(55) 99999-88887' },
      inputType: 'insertCompositionText',
      data: '7',
    });
    await send(user);

    expect(screen.getByLabelText('Documento')).toHaveValue('(55) 99999-8888');
    expect(sent(onSubmit)).toBe('55999998888');
  });

  it('telefone cheio com tudo selecionado: digitar substitui o número', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form mask="phone" onSubmit={onSubmit} initial="48999998888" />);

    const field = screen.getByLabelText<HTMLInputElement>('Documento');
    await user.type(field, '1', {
      initialSelectionStart: 0,
      initialSelectionEnd: 15,
    });
    await send(user);

    expect(field).toHaveValue('1');
    expect(sent(onSubmit)).toBe('1');
  });

  it('digitar um dígito no meio mantém o cursor depois dele', async () => {
    const user = userEvent.setup();
    render(<Form mask="cpf" onSubmit={vi.fn()} initial="5298224" />);

    const field = screen.getByLabelText<HTMLInputElement>('Documento');
    // `529.822.4`: cursor depois do segundo dígito (posição 2).
    await user.type(field, '7', {
      initialSelectionStart: 2,
      initialSelectionEnd: 2,
    });

    expect(field).toHaveValue('527.982.24');
    expect(field.selectionStart).toBe(3);
  });

  it('apagar um dígito no meio mantém o cursor no lugar', async () => {
    const user = userEvent.setup();
    render(<Form mask="cpf" onSubmit={vi.fn()} initial="52998224725" />);

    const field = screen.getByLabelText<HTMLInputElement>('Documento');
    // `529.982.247-25`: Backspace com o cursor depois do 2º dígito (posição 2).
    await user.type(field, '{Backspace}', {
      initialSelectionStart: 2,
      initialSelectionEnd: 2,
    });

    expect(field).toHaveValue('599.822.472-5');
    expect(field.selectionStart).toBe(1);
  });

  it('Backspace no início, sobre a pontuação inicial do telefone, não muda o valor', async () => {
    const user = userEvent.setup();
    render(<Form mask="phone" onSubmit={vi.fn()} initial="48999998888" />);

    const field = screen.getByLabelText<HTMLInputElement>('Documento');
    // `(48) 99999-8888`: cursor depois do "(" (posição 1).
    await user.type(field, '{Backspace}', {
      initialSelectionStart: 1,
      initialSelectionEnd: 1,
    });

    expect(field).toHaveValue('(48) 99999-8888');
    expect(field.selectionStart).toBe(0);
  });

  it('Backspace sobre a pontuação apaga o dígito vizinho e o cursor fica no lugar', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form mask="phone" onSubmit={onSubmit} initial="48999998888" />);

    const field = screen.getByLabelText<HTMLInputElement>('Documento');
    // `(48) 99999-8888`: o cursor logo depois do traço (posição 11).
    await user.type(field, '{Backspace}', {
      initialSelectionStart: 11,
      initialSelectionEnd: 11,
    });
    await send(user);

    expect(field).toHaveValue('(48) 9999-8888');
    expect(sent(onSubmit)).toBe('4899998888');
    expect(field.selectionStart).toBe(9);
  });

  it('Delete sobre a pontuação apaga o dígito seguinte', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form mask="cpf" onSubmit={onSubmit} initial="52998224725" />);

    const field = screen.getByLabelText<HTMLInputElement>('Documento');
    // `529.982.247-25`: o cursor antes do primeiro ponto (posição 3).
    await user.type(field, '{Delete}', {
      initialSelectionStart: 3,
      initialSelectionEnd: 3,
    });
    await send(user);

    expect(field).toHaveValue('529.822.472-5');
    expect(sent(onSubmit)).toBe('5298224725');
    expect(field.selectionStart).toBe(3);
  });
});

describe('MaskedInputField: acessibilidade e erro', () => {
  function Harness({
    id,
    srOnlyLabel,
    description,
    errors,
  }: {
    id?: string;
    srOnlyLabel?: boolean;
    description?: string;
    errors?: { message: string };
  }) {
    const { control } = useZodForm({
      schema,
      defaultValues: { field: '' },
    });

    return (
      <MaskedInputField
        control={control}
        name="field"
        id={id}
        label="CPF"
        mask="cpf"
        srOnlyLabel={srOnlyLabel}
        description={description}
        errors={errors}
      />
    );
  }

  it('sem `id`, deriva um e liga o rótulo ao campo', () => {
    render(<Harness />);

    const field = screen.getByLabelText('CPF');
    expect(field).toHaveAttribute('id');
    expect(screen.getByText('CPF')).toHaveAttribute(
      'for',
      field.getAttribute('id')
    );
  });

  it('o `id` do chamador vence o derivado', () => {
    render(<Harness id="meu-id" />);

    expect(screen.getByLabelText('CPF')).toHaveAttribute('id', 'meu-id');
  });

  it('`srOnlyLabel` esconde o rótulo só visualmente', () => {
    render(<Harness srOnlyLabel />);

    expect(screen.getByText('CPF')).toHaveClass('sr-only');
    expect(screen.getByLabelText('CPF')).toBeInTheDocument();
  });

  it('descrição e erro viram a descrição acessível e marcam o campo inválido', () => {
    render(
      <Harness
        description="Só números"
        errors={{ message: 'Informe um CPF válido.' }}
      />
    );

    const field = screen.getByLabelText('CPF');
    expect(field).toHaveAccessibleDescription(
      'Só números Informe um CPF válido.'
    );
    expect(field).toHaveAttribute('aria-invalid', 'true');
  });

  it('sem descrição nem erro não emite `aria-describedby` nem `aria-invalid`', () => {
    render(<Harness />);

    const field = screen.getByLabelText('CPF');
    expect(field).not.toHaveAttribute('aria-describedby');
    expect(field).not.toHaveAttribute('aria-invalid');
  });

  it('o erro de validação do schema chega ao campo', async () => {
    const user = userEvent.setup();
    const strict = z.object({ field: z.string().min(11, 'CPF incompleto.') });

    function StrictForm() {
      const { control, handleSubmit } = useZodForm({
        schema: strict,
        defaultValues: { field: '' },
      });

      return (
        <form noValidate onSubmit={handleSubmit(vi.fn())}>
          <MaskedInputField
            control={control}
            name="field"
            label="CPF"
            mask="cpf"
          />
          <Button type="submit">Enviar</Button>
        </form>
      );
    }

    render(<StrictForm />);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'CPF incompleto.'
    );
    expect(screen.getByLabelText('CPF')).toHaveAccessibleDescription(
      'CPF incompleto.'
    );
  });
});
