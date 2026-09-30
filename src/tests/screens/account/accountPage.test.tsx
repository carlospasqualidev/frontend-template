import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@/hooks/useSessionStore';
import { AccountPage } from '@/screens/account';
import { fetchAccountProfile } from '@/services/account/accountApi';
import {
  makeTestQueryClient,
  renderRoutes,
} from '@/tests/helpers/renderRoutes';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

vi.mock('@/services/account/accountApi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/account/accountApi')>();
  return { ...actual, fetchAccountProfile: vi.fn() };
});

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
    ],
  });
}

beforeEach(() => {
  queryClient = makeTestQueryClient();
  useSessionStore.setState({
    user: {
      id: '01a0f253-fc4e-745c-b069-dff39ba3116e',
      name: 'Camila Oliveira',
      email: 'camila@example.com',
      image: null,
      permissions: [],
      idleTimeoutMinutes: 20,
    },
  });
  vi.mocked(fetchAccountProfile).mockReset();
  vi.mocked(toast).mockClear();
  vi.mocked(toast.success).mockClear();
});

afterEach(() => {
  queryClient.clear();
  useSessionStore.setState({ user: null });
});

// As abas sem servidor são exemplo de tela: o aviso fica no topo, e as
// ações não simulam confirmação.
describe('Minha conta — abas de demonstração', () => {
  it('"Notificações" mostra o aviso e não grava as preferências', async () => {
    const user = userEvent.setup();
    renderAccount('notifications');

    const note = await screen.findByRole('note', {
      name: 'Dados de demonstração',
    });
    expect(note).toHaveTextContent('preferências de notificação');
    const email = screen.getByRole('switch', { name: 'E-mail' });
    const product = screen.getByRole('switch', {
      name: 'Atualizações do produto',
    });
    await user.click(email);
    await user.click(product);

    // Os `Switch` ficam no valor do exemplo: nada vira na tela.
    expect(email).toBeChecked();
    expect(product).not.toBeChecked();
    expect(toast).toHaveBeenCalledTimes(2);
    expect(toast).toHaveBeenCalledWith(
      'Dados de demonstração: nada foi alterado.',
      { id: 'demoActionToastId' }
    );
    expect(fetchAccountProfile).not.toHaveBeenCalled();
  });

  it('"Pagamento" mostra o aviso e não simula a fatura', async () => {
    const user = userEvent.setup();
    renderAccount('billing');

    const note = await screen.findByRole('note', {
      name: 'Dados de demonstração',
    });
    expect(note).toHaveTextContent('cobrança');
    const [firstInvoice] = screen.getAllByRole('button', { name: 'Baixar' });
    if (!firstInvoice) throw new Error('Fatura ausente.');
    await user.click(firstInvoice);

    expect(toast).toHaveBeenCalledWith(
      'Dados de demonstração: nada foi alterado.',
      { id: 'demoActionToastId' }
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('"Perfil" é real: sem aviso de demonstração', async () => {
    vi.mocked(fetchAccountProfile).mockResolvedValue({
      name: 'Camila Oliveira',
      email: 'camila@example.com',
      phone: null,
      image: null,
      idleTimeoutMinutes: null,
    });
    renderAccount('profile');

    const tabPanel = await screen.findByRole('tabpanel');
    await within(tabPanel).findByLabelText('Nome');
    expect(
      within(tabPanel).queryByText('Dados de demonstração')
    ).not.toBeInTheDocument();
  });
});

// Cada aba tem o seu formulário e a inativa desmonta: a edição do perfil não
// salva não se perde sem a pessoa confirmar.
describe('Minha conta — trocar de aba com o perfil alterado', () => {
  beforeEach(() => {
    vi.mocked(fetchAccountProfile).mockResolvedValue({
      name: 'Camila Oliveira',
      email: 'camila@example.com',
      phone: null,
      image: null,
      idleTimeoutMinutes: null,
    });
  });

  async function editName(user: ReturnType<typeof userEvent.setup>) {
    const name = await screen.findByLabelText('Nome');
    await user.clear(name);
    await user.type(name, 'Outro nome');
  }

  it('sem alteração, troca de aba na hora', async () => {
    const user = userEvent.setup();
    const { router } = renderAccount('profile');

    await screen.findByLabelText('Nome');
    await user.click(screen.getByRole('tab', { name: 'Segurança' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(router.state.location.search).toEqual({ tab: 'security' });
  });

  it('com alteração, pede confirmação; cancelar fica no perfil com a edição', async () => {
    const user = userEvent.setup();
    const { router } = renderAccount('profile');

    await editName(user);
    await user.click(screen.getByRole('tab', { name: 'Segurança' }));

    const dialog = await screen.findByRole('alertdialog', {
      name: 'Descartar as alterações do perfil?',
    });
    await user.click(
      within(dialog).getByRole('button', { name: 'Continuar editando' })
    );

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(router.state.location.search).toEqual({ tab: 'profile' });
    expect(screen.getByRole('tab', { name: 'Perfil' })).toHaveAttribute(
      'data-state',
      'active'
    );
    expect(screen.getByLabelText('Nome')).toHaveValue('Outro nome');
    expect(
      screen.getByRole('button', { name: 'Salvar alterações' })
    ).toBeInTheDocument();
    // O dialog não tem trigger: o foco volta à aba "Perfil", não ao `body`.
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Perfil' })).toHaveFocus()
    );
  });

  it('pelo teclado, sem alteração, a seta troca de aba na hora', async () => {
    const user = userEvent.setup();
    const { router } = renderAccount('profile');

    await screen.findByLabelText('Nome');
    await user.click(screen.getByRole('tab', { name: 'Perfil' }));
    await user.keyboard('{ArrowRight}');

    await waitFor(() =>
      expect(router.state.location.search).toEqual({ tab: 'security' })
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Segurança' })).toHaveFocus();
  });

  it('pelo teclado, com alteração: a seta pede confirmação, Enter continua editando e Espaço descarta', async () => {
    const user = userEvent.setup();
    const { router } = renderAccount('profile');

    await editName(user);
    await user.click(screen.getByRole('tab', { name: 'Perfil' }));
    await user.keyboard('{ArrowRight}');

    // O foco abre no "Continuar editando" (destrutivo: o cancelar primeiro).
    const dialog = await screen.findByRole('alertdialog', {
      name: 'Descartar as alterações do perfil?',
    });
    const keepEditing = within(dialog).getByRole('button', {
      name: 'Continuar editando',
    });
    await waitFor(() => expect(keepEditing).toHaveFocus());
    await user.keyboard('{Enter}');

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Perfil' })).toHaveFocus()
    );
    expect(router.state.location.search).toEqual({ tab: 'profile' });
    expect(screen.getByLabelText('Nome')).toHaveValue('Outro nome');

    // De novo, para trás (dá a volta até "Pagamento"), e agora descarta.
    await user.keyboard('{ArrowLeft}');
    const again = await screen.findByRole('alertdialog');
    await waitFor(() =>
      expect(
        within(again).getByRole('button', { name: 'Continuar editando' })
      ).toHaveFocus()
    );
    await user.tab();
    expect(
      within(again).getByRole('button', { name: 'Descartar alterações' })
    ).toHaveFocus();
    await user.keyboard(' ');

    await waitFor(() =>
      expect(router.state.location.search).toEqual({ tab: 'billing' })
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(
      await screen.findByRole('note', { name: 'Dados de demonstração' })
    ).toBeInTheDocument();
  });

  it('confirmar troca de aba e descarta a edição', async () => {
    const user = userEvent.setup();
    const { router } = renderAccount('profile');

    await editName(user);
    await user.click(screen.getByRole('tab', { name: 'Notificações' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(
      within(dialog).getByRole('button', { name: 'Descartar alterações' })
    );

    await waitFor(() =>
      expect(router.state.location.search).toEqual({ tab: 'notifications' })
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(
      await screen.findByRole('note', { name: 'Dados de demonstração' })
    ).toBeInTheDocument();

    // De volta ao perfil: o gravado, sem nada pendente, e a troca seguinte
    // não pede confirmação.
    await user.click(screen.getByRole('tab', { name: 'Perfil' }));
    expect(await screen.findByLabelText('Nome')).toHaveValue('Camila Oliveira');
    expect(
      screen.queryByRole('button', { name: 'Salvar alterações' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Pagamento' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(router.state.location.search).toEqual({ tab: 'billing' });
  });
});
