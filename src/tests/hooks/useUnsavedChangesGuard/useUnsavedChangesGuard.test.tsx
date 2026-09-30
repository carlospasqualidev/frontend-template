import { useState } from 'react';
import {
  createBrowserHistory,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  type AnyRouter,
  type RouterHistory,
} from '@tanstack/react-router';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { UnsavedChangesDialog } from '@/components/global/layout/unsavedChangesDialog';
import {
  confirmLeaveIfDirty,
  useUnsavedChangesGuard,
  useUnsavedChangesStore,
} from '@/hooks/useUnsavedChangesGuard';

interface ISecondForm {
  searchKey?: string;
}

// Outro formulário alterado na mesma tela (um modal de edição aberto sobre o
// formulário principal).
function SecondForm({ searchKey }: ISecondForm) {
  useUnsavedChangesGuard(true, { searchKey });
  return <input aria-label="Observação" />;
}

// Uma tela de edição: começa com (ou sem) alteração, "Salvar" a leva a
// pristine, e o campo é onde a pessoa estava quando a saída foi pedida.
function EditPage({
  initialDirty,
  searchKey,
  secondForm,
}: {
  initialDirty: boolean;
  searchKey?: string;
  secondForm?: ISecondForm;
}) {
  const [dirty, setDirty] = useState(initialDirty);
  useUnsavedChangesGuard(dirty, { searchKey });

  return (
    <>
      <input aria-label="Nome" />
      <button type="button" onClick={() => setDirty(false)}>
        Salvar
      </button>
      {secondForm && <SecondForm {...secondForm} />}
    </>
  );
}

let history: RouterHistory | undefined;

function setup({
  initialDirty = true,
  searchKey,
  secondForm,
  routerHistory = createMemoryHistory({ initialEntries: ['/edit'] }),
}: {
  initialDirty?: boolean;
  searchKey?: string;
  secondForm?: ISecondForm;
  routerHistory?: RouterHistory;
} = {}): AnyRouter {
  history = routerHistory;
  const rootRoute = createRootRoute({
    component: () => (
      <>
        <UnsavedChangesDialog />
        <Outlet />
      </>
    ),
  });
  const editRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/edit',
    validateSearch: (search: Record<string, unknown>) => ({
      tab: search.tab,
      page: search.page,
    }),
    component: () => (
      <EditPage
        initialDirty={initialDirty}
        searchKey={searchKey}
        secondForm={secondForm}
      />
    ),
  });
  const otherRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/other',
    component: () => <p>Outra tela</p>,
  });
  const thirdRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/third',
    component: () => <p>Terceira tela</p>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([editRoute, otherRoute, thirdRoute]),
    history: routerHistory,
  });
  render(<RouterProvider router={router} />);
  return router;
}

// Sem esperar a navegação: a bloqueada só termina com a resposta da pessoa.
function go(router: AnyRouter, options: Parameters<AnyRouter['navigate']>[0]) {
  return act(async () => {
    void router.navigate(options);
  });
}

// A mesma tela com outra URL (a aba, a página), como as abas a pedem.
function pushUrl(router: AnyRouter, href: string) {
  return act(async () => {
    router.history.push(href);
  });
}

async function answer(label: 'Descartar alterações' | 'Continuar editando') {
  const user = userEvent.setup();
  const dialog = await screen.findByRole('alertdialog', {
    name: 'Descartar as alterações?',
  });
  await user.click(within(dialog).getByRole('button', { name: label }));
  await waitFor(() =>
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  );
}

afterEach(() => {
  history?.destroy();
  history = undefined;
});

describe('useUnsavedChangesGuard — navegação do app', () => {
  it('sem alteração, sai da tela sem perguntar', async () => {
    const router = setup({ initialDirty: false });
    await screen.findByLabelText('Nome');

    await go(router, { to: '/other' });

    expect(await screen.findByText('Outra tela')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('com alteração, pergunta; "Continuar editando" fica na tela', async () => {
    const router = setup();
    await screen.findByLabelText('Nome');

    await go(router, { to: '/other' });
    await answer('Continuar editando');

    expect(router.state.location.pathname).toBe('/edit');
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.queryByText('Outra tela')).not.toBeInTheDocument();
  });

  it('"Descartar alterações" deixa a navegação seguir', async () => {
    const router = setup();
    await screen.findByLabelText('Nome');

    await go(router, { to: '/other' });
    await answer('Descartar alterações');

    expect(await screen.findByText('Outra tela')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/other');
  });

  it('o Esc fecha a pergunta e fica na tela', async () => {
    const user = userEvent.setup();
    const router = setup();
    await screen.findByLabelText('Nome');

    await go(router, { to: '/other' });
    await screen.findByRole('alertdialog');
    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    );
    expect(router.state.location.pathname).toBe('/edit');
  });

  it('depois de salvar (pristine), sai sem perguntar', async () => {
    const user = userEvent.setup();
    const router = setup();

    await user.click(await screen.findByRole('button', { name: 'Salvar' }));
    await go(router, { to: '/other' });

    expect(await screen.findByText('Outra tela')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('a navegação da própria tela com `ignoreBlocker` não pergunta', async () => {
    const router = setup();
    await screen.findByLabelText('Nome');

    await go(router, { to: '/other', ignoreBlocker: true });

    expect(await screen.findByText('Outra tela')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('uma segunda saída com a pergunta aberta passa a valer, e a primeira fica', async () => {
    const router = setup();
    await screen.findByLabelText('Nome');

    await go(router, { to: '/other' });
    await screen.findByRole('alertdialog');
    await go(router, { to: '/third' });

    expect(screen.getAllByRole('alertdialog')).toHaveLength(1);
    await answer('Descartar alterações');

    expect(await screen.findByText('Terceira tela')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/third');
  });
});

describe('useUnsavedChangesGuard — mesma tela', () => {
  // Abas e paginação que não desmontam o formulário (o formulário acima das
  // abas, no detalhe de usuário e de cargo) não saem da edição.
  it('sem `searchKey`, trocar só a URL da mesma tela não pergunta', async () => {
    const router = setup();
    await screen.findByLabelText('Nome');

    await pushUrl(router, '/edit?tab=roles&page=2');

    await waitFor(() =>
      expect(router.state.location.search).toEqual({ tab: 'roles', page: 2 })
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('com `searchKey`, trocar esse parâmetro pergunta; outro não', async () => {
    const router = setup({ searchKey: 'tab' });
    await screen.findByLabelText('Nome');

    await pushUrl(router, '/edit?page=2');
    await waitFor(() =>
      expect(router.state.location.search).toEqual({ page: 2 })
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    await pushUrl(router, '/edit?page=2&tab=security');
    await answer('Continuar editando');
    expect(router.state.location.search).toEqual({ page: 2 });

    await pushUrl(router, '/edit?page=2&tab=security');
    await answer('Descartar alterações');
    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        page: 2,
        tab: 'security',
      })
    );
  });
});

describe('useUnsavedChangesGuard — dois formulários alterados na tela', () => {
  it('sair pergunta uma vez só, e "Descartar alterações" sai', async () => {
    const router = setup({ secondForm: {} });
    await screen.findByLabelText('Observação');

    await go(router, { to: '/other' });
    expect(await screen.findAllByRole('alertdialog')).toHaveLength(1);
    await answer('Descartar alterações');

    expect(await screen.findByText('Outra tela')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/other');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  // Quem pergunta decide por todos: a troca de aba que só um dos formulários
  // não sobrevive (o `searchKey` dele) também pergunta.
  it('a troca do `searchKey` de um deles pergunta uma vez', async () => {
    const router = setup({ searchKey: 'tab', secondForm: {} });
    await screen.findByLabelText('Observação');

    await pushUrl(router, '/edit?tab=security');
    await answer('Continuar editando');
    expect(router.state.location.search).toEqual({});

    await pushUrl(router, '/edit?tab=security');
    await answer('Descartar alterações');
    await waitFor(() =>
      expect(router.state.location.search).toEqual({ tab: 'security' })
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});

// O "Sair" do menu da pessoa: a sessão só acaba depois da resposta.
describe('confirmLeaveIfDirty', () => {
  function confirmNow(): Promise<boolean> {
    let confirmation: Promise<boolean> = Promise.resolve(true);
    act(() => {
      confirmation = confirmLeaveIfDirty();
    });
    return confirmation;
  }

  it('sem edição, resolve sair sem perguntar', async () => {
    setup({ initialDirty: false });
    await screen.findByLabelText('Nome');

    await expect(confirmNow()).resolves.toBe(true);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('com edição, pergunta: "Continuar editando" fica, "Descartar alterações" sai', async () => {
    const router = setup();
    await screen.findByLabelText('Nome');

    const staying = confirmNow();
    await answer('Continuar editando');
    await expect(staying).resolves.toBe(false);
    expect(router.state.location.pathname).toBe('/edit');

    const leaving = confirmNow();
    await answer('Descartar alterações');
    await expect(leaving).resolves.toBe(true);
  });

  // A tela sai ainda alterada, sem passar pela pergunta (a navegação que a
  // própria tela pede, com `ignoreBlocker`): o guard dela sai do registro.
  it('depois de a tela alterada desmontar, resolve sair sem perguntar', async () => {
    const router = setup();
    await screen.findByLabelText('Nome');

    await go(router, { to: '/other', ignoreBlocker: true });
    await screen.findByText('Outra tela');
    expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument();

    await expect(confirmNow()).resolves.toBe(true);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('depois de salvar, resolve sair sem perguntar', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(await screen.findByRole('button', { name: 'Salvar' }));

    await expect(confirmNow()).resolves.toBe(true);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  // O menu fecha ao escolher "Sair": o foco volta ao botão que o abriu.
  it('o foco volta ao botão do menu de onde veio a saída', async () => {
    setup();
    await screen.findByLabelText('Nome');
    const opener = document.createElement('button');
    opener.id = 'user-menu';
    const menu = document.createElement('div');
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-labelledby', 'user-menu');
    const item = document.createElement('div');
    item.setAttribute('role', 'menuitem');
    item.tabIndex = -1;
    menu.append(item);
    document.body.append(opener, menu);
    item.focus();

    const staying = confirmNow();
    menu.remove();
    await answer('Continuar editando');

    await expect(staying).resolves.toBe(false);
    await waitFor(() => expect(opener).toHaveFocus());
    opener.remove();
  });
});

// A sessão acaba com a pergunta aberta (a inatividade leva ao login, fora do
// `Layout`): a confirmação sai da tela e a pergunta não reaparece depois.
describe('UnsavedChangesDialog — fim da sessão', () => {
  it('ao sair da tela, esquece a pergunta aberta sem responder', async () => {
    const resolveLeave = vi.fn();
    useUnsavedChangesStore.setState({ resolveLeave, returnFocus: null });
    const { unmount } = render(<UnsavedChangesDialog />);
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();

    unmount();

    expect(useUnsavedChangesStore.getState().resolveLeave).toBeNull();
    expect(resolveLeave).not.toHaveBeenCalled();
    render(<UnsavedChangesDialog />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});

describe('useUnsavedChangesGuard — foco ao fechar', () => {
  it('volta para onde estava quando a saída foi pedida', async () => {
    const user = userEvent.setup();
    const router = setup();
    const name = await screen.findByLabelText('Nome');
    await user.click(name);

    await go(router, { to: '/other' });
    await answer('Continuar editando');

    await waitFor(() => expect(name).toHaveFocus());
  });
});

// O navegador de verdade: o voltar e o fechar ou recarregar a aba.
describe('useUnsavedChangesGuard — navegador', () => {
  function browserSetup(initialDirty: boolean) {
    window.history.replaceState(null, '', '/other');
    const router = setup({
      initialDirty,
      routerHistory: createBrowserHistory(),
    });
    return router;
  }

  async function openEdit(router: AnyRouter) {
    await screen.findByText('Outra tela');
    await go(router, { to: '/edit' });
    await screen.findByLabelText('Nome');
  }

  function beforeUnload(): Event {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event;
  }

  it('fechar ou recarregar com alteração pede o aviso nativo; sem alteração, não', async () => {
    const user = userEvent.setup();
    const router = browserSetup(true);
    await openEdit(router);

    expect(beforeUnload().defaultPrevented).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(beforeUnload().defaultPrevented).toBe(false));
  });

  it('o voltar do navegador com alteração pergunta; ficar volta a URL', async () => {
    const router = browserSetup(true);
    await openEdit(router);

    act(() => window.history.back());
    await answer('Continuar editando');

    await waitFor(() => expect(window.location.pathname).toBe('/edit'));
    expect(router.state.location.pathname).toBe('/edit');
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
  });

  it('o voltar do navegador com "Descartar alterações" volta à tela anterior', async () => {
    const router = browserSetup(true);
    await openEdit(router);

    act(() => window.history.back());
    await answer('Descartar alterações');

    expect(await screen.findByText('Outra tela')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/other');
    expect(router.state.location.pathname).toBe('/other');
  });

  // Dois voltar seguidos: a terceira tela, a outra e a edição no histórico.
  describe('um segundo voltar com a pergunta aberta', () => {
    let visited: string[] = [];
    const recordPop = () => visited.push(window.location.pathname);

    afterEach(() => {
      window.removeEventListener('popstate', recordPop);
    });

    async function backTwiceFromEdit(): Promise<AnyRouter> {
      window.history.replaceState(null, '', '/third');
      const router = setup({ routerHistory: createBrowserHistory() });
      await screen.findByText('Terceira tela');
      await go(router, { to: '/other' });
      await screen.findByText('Outra tela');
      await go(router, { to: '/edit' });
      await screen.findByLabelText('Nome');
      visited = [];
      window.addEventListener('popstate', recordPop);

      act(() => window.history.back());
      await screen.findByRole('alertdialog');
      await waitFor(() => expect(visited).toEqual(['/other']));
      act(() => window.history.back());
      // O segundo voltar chega à terceira tela, e o navegador volta para
      // onde a pergunta o deixou, sem trocar a pergunta.
      await waitFor(() => expect(visited).toEqual(['/other', '/third', '/other']));
      expect(screen.getAllByRole('alertdialog')).toHaveLength(1);
      return router;
    }

    it('"Continuar editando" mantém URL e tela na edição, e o próximo voltar pergunta de novo', async () => {
      const router = await backTwiceFromEdit();

      await answer('Continuar editando');

      await waitFor(() => expect(window.location.pathname).toBe('/edit'));
      expect(router.state.location.pathname).toBe('/edit');
      expect(screen.getByLabelText('Nome')).toBeInTheDocument();

      act(() => window.history.back());
      await answer('Descartar alterações');
      expect(await screen.findByText('Outra tela')).toBeInTheDocument();
      expect(window.location.pathname).toBe('/other');
    });

    it('"Descartar alterações" vai aonde o primeiro voltar ia', async () => {
      const router = await backTwiceFromEdit();

      await answer('Descartar alterações');

      expect(await screen.findByText('Outra tela')).toBeInTheDocument();
      expect(window.location.pathname).toBe('/other');
      expect(router.state.location.pathname).toBe('/other');
    });
  });
});
