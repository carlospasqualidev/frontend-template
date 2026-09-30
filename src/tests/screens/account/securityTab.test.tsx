import { AxiosError, AxiosHeaders } from 'axios';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@/hooks/useSessionStore';
import { AccountPage } from '@/screens/account';
import {
  changeAccountPassword,
  fetchAccountProfile,
} from '@/services/account/accountApi';
import {
  makeTestQueryClient,
  renderRoutes,
} from '@/tests/helpers/renderRoutes';
import type { IUser } from '@/types/user/types';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

// Mocka só o transporte; a leitura dos `issues` é a real.
vi.mock('@/services/account/accountApi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/account/accountApi')>();
  return {
    ...actual,
    fetchAccountProfile: vi.fn(),
    changeAccountPassword: vi.fn(),
  };
});

const SESSION_USER: IUser = {
  id: '01a0f253-fc4e-745c-b069-dff39ba3116e',
  name: 'Camila Oliveira',
  email: 'camila@example.com',
  image: null,
  permissions: [],
  idleTimeoutMinutes: 20,
};

let queryClient: ReturnType<typeof makeTestQueryClient>;

function renderAccount(tab: string) {
  return renderRoutes({
    queryClient,
    initialUrl: `/account?tab=${tab}`,
    routes: [
      {
        path: '/account',
        component: AccountPage,
        validateSearch: (value) => ({ tab: value.tab }),
      },
      { path: '/', component: () => <p>Início</p> },
    ],
  });
}

function httpError(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(
    'Falha',
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    { data, status, statusText: '', headers: {}, config }
  );
}

function cardOf(title: string): HTMLElement {
  const card = screen
    .getByText(title, { selector: '[data-slot="card-title"]' })
    .closest('[data-slot="card"]');
  if (!(card instanceof HTMLElement)) throw new Error(`Card ${title} ausente.`);
  return card;
}

async function openPasswordModal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole('button', { name: 'Alterar senha' })
  );
  return screen.findByRole('dialog', { name: 'Alterar senha' });
}

async function fillPasswordForm(
  user: ReturnType<typeof userEvent.setup>,
  dialog: HTMLElement,
  values: { current: string; next: string; confirm: string }
) {
  await user.type(within(dialog).getByLabelText('Senha atual'), values.current);
  await user.type(within(dialog).getByLabelText('Nova senha'), values.next);
  await user.type(
    within(dialog).getByLabelText('Confirmação da nova senha'),
    values.confirm
  );
}

beforeEach(() => {
  queryClient = makeTestQueryClient();
  useSessionStore.setState({ user: SESSION_USER });
  vi.mocked(fetchAccountProfile).mockReset();
  vi.mocked(changeAccountPassword).mockReset();
  vi.mocked(toast).mockClear();
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
});

afterEach(() => {
  queryClient.clear();
  useSessionStore.setState({ user: null });
});

describe('Minha conta — Segurança: troca de senha', () => {
  it('manda a senha atual, a nova e a confirmação, e fecha o modal', async () => {
    const user = userEvent.setup();
    vi.mocked(changeAccountPassword).mockResolvedValue(undefined);
    renderAccount('security');

    const dialog = await openPasswordModal(user);
    await fillPasswordForm(user, dialog, {
      current: 'senha-de-hoje',
      next: 'senha-nova-1',
      confirm: 'senha-nova-1',
    });
    await user.click(
      within(dialog).getByRole('button', { name: 'Alterar senha' })
    );

    await waitFor(() =>
      expect(changeAccountPassword).toHaveBeenCalledWith({
        currentPassword: 'senha-de-hoje',
        password: 'senha-nova-1',
        confirmPassword: 'senha-nova-1',
      })
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Alterar senha' })
      ).not.toBeInTheDocument()
    );
    // O toast é o do servidor ("Senha alterada."), não um da tela.
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('só oferece enviar depois de digitar algo', async () => {
    const user = userEvent.setup();
    renderAccount('security');

    const dialog = await openPasswordModal(user);

    expect(
      within(dialog).queryByRole('button', { name: 'Alterar senha' })
    ).not.toBeInTheDocument();
  });

  it('recusa antes de enviar a confirmação diferente e a nova igual à atual', async () => {
    const user = userEvent.setup();
    renderAccount('security');

    const dialog = await openPasswordModal(user);
    await fillPasswordForm(user, dialog, {
      current: 'senha-de-hoje',
      next: 'senha-de-hoje',
      confirm: 'outra-senha',
    });
    await user.click(
      within(dialog).getByRole('button', { name: 'Alterar senha' })
    );

    expect(
      await within(dialog).findByText('As senhas precisam ser iguais.')
    ).toBeInTheDocument();
    expect(changeAccountPassword).not.toHaveBeenCalled();
  });

  // O único 400 sem `issues`: a senha atual errada. Marca o campo, sem toast.
  it('a senha atual errada marca o campo, e o modal fica aberto', async () => {
    const user = userEvent.setup();
    vi.mocked(changeAccountPassword).mockRejectedValue(
      httpError(400, { message: 'Senha atual incorreta.' })
    );
    renderAccount('security');

    const dialog = await openPasswordModal(user);
    await fillPasswordForm(user, dialog, {
      current: 'senha-errada',
      next: 'senha-nova-1',
      confirm: 'senha-nova-1',
    });
    await user.click(
      within(dialog).getByRole('button', { name: 'Alterar senha' })
    );

    expect(
      await within(dialog).findByText('Senha atual incorreta.')
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Senha atual')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(toast.error).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Alterar senha' })).toBeVisible();
  });

  it('o 400 com `issues` marca o campo apontado', async () => {
    const user = userEvent.setup();
    vi.mocked(changeAccountPassword).mockRejectedValue(
      httpError(400, {
        message: 'password: A nova senha precisa ser diferente da atual.',
        issues: [
          {
            path: 'password',
            message: 'A nova senha precisa ser diferente da atual.',
          },
        ],
      })
    );
    renderAccount('security');

    const dialog = await openPasswordModal(user);
    await fillPasswordForm(user, dialog, {
      current: 'senha-de-hoje',
      next: 'senha-nova-1',
      confirm: 'senha-nova-1',
    });
    await user.click(
      within(dialog).getByRole('button', { name: 'Alterar senha' })
    );

    expect(
      await within(dialog).findByText(
        'A nova senha precisa ser diferente da atual.'
      )
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Nova senha')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  // 409 e 429: o toast do interceptor é a resposta; a tela não soma outro.
  it('outras recusas ficam no toast do servidor, com o modal aberto', async () => {
    const user = userEvent.setup();
    vi.mocked(changeAccountPassword).mockRejectedValue(
      httpError(429, {
        message: 'Muitas tentativas. Aguarde um instante e tente novamente.',
      })
    );
    renderAccount('security');

    const dialog = await openPasswordModal(user);
    await fillPasswordForm(user, dialog, {
      current: 'senha-de-hoje',
      next: 'senha-nova-1',
      confirm: 'senha-nova-1',
    });
    await user.click(
      within(dialog).getByRole('button', { name: 'Alterar senha' })
    );

    await waitFor(() => expect(changeAccountPassword).toHaveBeenCalled());
    expect(toast.error).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Alterar senha' })).toBeVisible();
  });

  it('fechar o modal descarta o que foi digitado', async () => {
    const user = userEvent.setup();
    renderAccount('security');

    const dialog = await openPasswordModal(user);
    await user.type(within(dialog).getByLabelText('Senha atual'), 'abc');
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Alterar senha' })
      ).not.toBeInTheDocument()
    );

    const reopened = await openPasswordModal(user);
    expect(within(reopened).getByLabelText('Senha atual')).toHaveValue('');
  });

  // Fechar o modal é o cancelar dele (sem pergunta, acima); sair da tela com
  // algo digitado passa pelo guard de edição não salva.
  it('com algo digitado, sair da tela pergunta; "Continuar editando" mantém o modal e o digitado', async () => {
    const user = userEvent.setup();
    const { router } = renderAccount('security');

    const dialog = await openPasswordModal(user);
    const current = within(dialog).getByLabelText('Senha atual');
    await user.type(current, 'senha-de-hoje');
    await act(async () => {
      void router.navigate({ to: '/' });
    });

    const confirm = await screen.findByRole('alertdialog', {
      name: 'Descartar as alterações?',
    });
    await user.click(
      within(confirm).getByRole('button', { name: 'Continuar editando' })
    );

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    );
    expect(router.state.location.pathname).toBe('/account');
    expect(
      screen.getByRole('dialog', { name: 'Alterar senha' })
    ).toBeInTheDocument();
    expect(current).toHaveValue('senha-de-hoje');
    await waitFor(() => expect(current).toHaveFocus());
  });

  it('sem nada digitado, sair da tela não pergunta', async () => {
    const user = userEvent.setup();
    const { router } = renderAccount('security');

    await openPasswordModal(user);
    await act(async () => {
      void router.navigate({ to: '/' });
    });

    expect(await screen.findByText('Início')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});

describe('Minha conta — Segurança: demonstração', () => {
  it('2FA e sessões ativas mostram o aviso; a senha, não', async () => {
    renderAccount('security');

    await screen.findByRole('button', { name: 'Alterar senha' });
    expect(
      within(cardOf('Autenticação em 2 fatores')).getByText(
        'Dados de demonstração'
      )
    ).toBeVisible();
    expect(
      within(cardOf('Sessões ativas')).getByText('Dados de demonstração')
    ).toBeVisible();
    expect(
      within(cardOf('Senha')).queryByText('Dados de demonstração')
    ).not.toBeInTheDocument();
  });

  it('as ações de demonstração dizem que nada mudou', async () => {
    const user = userEvent.setup();
    renderAccount('security');

    await user.click(
      await screen.findByRole('button', {
        name: 'Encerrar todas as outras sessões',
      })
    );
    const twoFactor = screen.getByRole('switch', {
      name: 'Aplicativo autenticador',
    });
    expect(twoFactor).toBeChecked();
    await user.click(twoFactor);

    // O toque não vira o `Switch`: a tela continua dizendo o que o toast diz.
    expect(twoFactor).toBeChecked();
    expect(toast).toHaveBeenCalledTimes(2);
    expect(toast).toHaveBeenCalledWith(
      'Dados de demonstração: nada foi alterado.',
      { id: 'demoActionToastId' }
    );
    expect(toast.success).not.toHaveBeenCalled();
  });
});
