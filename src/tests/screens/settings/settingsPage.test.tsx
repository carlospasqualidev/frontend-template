import { QueryClient } from '@tanstack/react-query';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { SettingsPage } from '@/screens/settings';
import { sendErrorMessage } from '@/services/api/errorHandlers';
import {
  fetchSystemConfigs,
  updateSystemConfigs,
  type SystemConfig,
} from '@/services/systemConfigs/systemConfigsApi';
import { renderRoutes } from '@/tests/helpers/renderRoutes';

vi.mock('@/services/api/errorHandlers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/errorHandlers')>()),
  sendErrorMessage: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

// Mocka só o transporte (leitura e gravação); o rótulo dos módulos é o real.
vi.mock('@/services/systemConfigs/systemConfigsApi', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/services/systemConfigs/systemConfigsApi')
    >();
  return {
    ...actual,
    fetchSystemConfigs: vi.fn(),
    updateSystemConfigs: vi.fn(),
  };
});

function makeConfig(overrides: Partial<SystemConfig>): SystemConfig {
  return {
    key: 'app.name',
    module: 'GENERAL',
    label: 'Nome da aplicação',
    description: 'Nome exibido na interface.',
    valueType: 'string',
    value: 'Meu Produto',
    ...overrides,
  };
}

const CONFIGS: SystemConfig[] = [
  makeConfig({}),
  makeConfig({
    key: 'security.idleTimeoutMinutes',
    module: 'SECURITY',
    label: 'Tempo de inatividade até o logout (min)',
    description: 'Minutos sem atividade até a sessão ser encerrada.',
    valueType: 'int',
    value: '20',
  }),
  makeConfig({
    key: 'notifications.email',
    module: 'NOTIFICATIONS',
    label: 'Notificações por e-mail',
    description: 'Envia por e-mail os avisos do sistema.',
    valueType: 'boolean',
    value: 'true',
  }),
];

let queryClient: QueryClient;

// A tela com o roteador, o slot das ações do topo e a confirmação do guard de
// edição não salva; `/users` é outra tela, para onde se sai.
function renderSettings() {
  return renderRoutes({
    queryClient,
    initialUrl: '/settings',
    routes: [
      { path: '/settings', component: SettingsPage },
      { path: '/users', component: () => <p>Lista de usuários</p> },
    ],
  });
}

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  vi.mocked(fetchSystemConfigs).mockResolvedValue({ systemConfigs: CONFIGS });
  vi.mocked(updateSystemConfigs).mockReset();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
  vi.mocked(sendErrorMessage).mockClear();
});

afterEach(() => {
  queryClient.clear();
});

describe('SettingsPage — carregando', () => {
  // O skeleton segue o formato esperado da tela (`SETTINGS_OUTLINE`), sem
  // depender da leitura: um card por grupo, com a descrição da tela, e uma
  // linha por chave. Cada linha tem três blocos (rótulo, descrição, campo).
  it('reserva os três grupos e as seis chaves do catálogo', async () => {
    vi.mocked(fetchSystemConfigs).mockReturnValue(new Promise(() => {}));
    renderSettings();
    await screen.findByText('Nome da aplicação e e-mail de suporte.');

    const titles = [
      ...document.querySelectorAll('[data-slot="card-title"]'),
    ].map((title) => title.textContent);
    expect(titles).toEqual(['Geral', 'Segurança', 'Notificações']);

    const rowsIn = (title: string) =>
      (screen
        .getByText(title)
        .closest('[data-slot="card"]')
        ?.querySelectorAll('[data-slot="skeleton"]').length ?? 0) / 3;
    expect(rowsIn('Geral')).toBe(2);
    expect(rowsIn('Segurança')).toBe(3);
    expect(rowsIn('Notificações')).toBe(1);

    expect(
      screen.getByText('Nome da aplicação e e-mail de suporte.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Sessão e retenção da auditoria.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Envio de notificações por e-mail.')
    ).toBeInTheDocument();
  });
});

describe('SettingsPage — gravação em lote', () => {
  it('grava numa única chamada só os itens alterados, identificados pela `key`', async () => {
    const user = userEvent.setup();
    vi.mocked(updateSystemConfigs).mockImplementation(async (items) => ({
      message: 'Configurações atualizadas.',
      systemConfigs: CONFIGS.map((config) => ({
        ...config,
        value:
          items.find((item) => item.key === config.key)?.value ?? config.value,
      })),
    }));
    renderSettings();

    const name = await screen.findByLabelText('Nome da aplicação');
    await user.clear(name);
    await user.type(name, 'Produto Renomeado');
    const idle = screen.getByLabelText(
      'Tempo de inatividade até o logout (min)'
    );
    await user.clear(idle);
    await user.type(idle, '30');

    await user.click(
      await screen.findByRole('button', { name: 'Salvar alterações' })
    );

    await waitFor(() => expect(updateSystemConfigs).toHaveBeenCalledTimes(1));
    expect(updateSystemConfigs).toHaveBeenCalledWith([
      { key: 'app.name', value: 'Produto Renomeado' },
      { key: 'security.idleTimeoutMinutes', value: '30' },
    ]);

    // Volta a pristine: as ações somem.
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Salvar alterações' })
      ).not.toBeInTheDocument()
    );
  });

  // O toast de sucesso é o `message` da resposta (interceptor do `api`): a
  // tela não dispara um segundo toast próprio.
  it('não dispara toast próprio ao salvar', async () => {
    const user = userEvent.setup();
    vi.mocked(updateSystemConfigs).mockResolvedValue({
      message: 'Configurações atualizadas.',
      systemConfigs: CONFIGS,
    });
    renderSettings();

    await user.click(await screen.findByLabelText('Notificações por e-mail'));
    await user.click(
      await screen.findByRole('button', { name: 'Salvar alterações' })
    );

    await waitFor(() => expect(updateSystemConfigs).toHaveBeenCalledTimes(1));
    expect(updateSystemConfigs).toHaveBeenCalledWith([
      { key: 'notifications.email', value: 'false' },
    ]);
    expect(toast.success).not.toHaveBeenCalled();
  });

  // O backend normaliza o valor gravado (texto sem espaço nas pontas): o form
  // assume o valor devolvido, não o digitado.
  it('assume os valores devolvidos pela gravação', async () => {
    const user = userEvent.setup();
    vi.mocked(updateSystemConfigs).mockResolvedValue({
      message: 'Configurações atualizadas.',
      systemConfigs: CONFIGS.map((config) =>
        config.key === 'app.name' ? { ...config, value: 'Produto' } : config
      ),
    });
    renderSettings();

    const name = await screen.findByLabelText('Nome da aplicação');
    await user.clear(name);
    await user.type(name, '  Produto  ');
    await user.click(
      await screen.findByRole('button', { name: 'Salvar alterações' })
    );

    await waitFor(() => expect(name).toHaveValue('Produto'));
    expect(
      screen.queryByRole('button', { name: 'Salvar alterações' })
    ).not.toBeInTheDocument();
  });
});

// Sair da tela (um link do menu, o voltar do navegador) com a edição não salva
// pergunta antes, pelo guard global; salvar e "Descartar" liberam a saída.
describe('SettingsPage — edição não salva', () => {
  async function editName(user: ReturnType<typeof userEvent.setup>) {
    const name = await screen.findByLabelText('Nome da aplicação');
    await user.clear(name);
    await user.type(name, 'Produto Renomeado');
    return name;
  }

  function leaveToUsers(router: ReturnType<typeof renderSettings>['router']) {
    return act(async () => {
      void router.navigate({ to: '/users' });
    });
  }

  it('sem alteração, sai da tela sem perguntar', async () => {
    const { router } = renderSettings();
    await screen.findByLabelText('Nome da aplicação');

    await leaveToUsers(router);

    expect(await screen.findByText('Lista de usuários')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('com alteração, pergunta; "Continuar editando" fica com a edição e devolve o foco ao campo', async () => {
    const user = userEvent.setup();
    const { router } = renderSettings();
    const name = await editName(user);

    await leaveToUsers(router);

    const dialog = await screen.findByRole('alertdialog', {
      name: 'Descartar as alterações?',
    });
    expect(dialog).toHaveTextContent(
      'O que você alterou ainda não foi salvo. Sair agora descarta essas alterações.'
    );
    await user.click(
      within(dialog).getByRole('button', { name: 'Continuar editando' })
    );

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    );
    expect(router.state.location.pathname).toBe('/settings');
    expect(name).toHaveValue('Produto Renomeado');
    expect(
      screen.getByRole('button', { name: 'Salvar alterações' })
    ).toBeInTheDocument();
    await waitFor(() => expect(name).toHaveFocus());
  });

  it('"Descartar alterações" sai da tela', async () => {
    const user = userEvent.setup();
    const { router } = renderSettings();
    await editName(user);

    await leaveToUsers(router);
    const dialog = await screen.findByRole('alertdialog');
    await user.click(
      within(dialog).getByRole('button', { name: 'Descartar alterações' })
    );

    expect(await screen.findByText('Lista de usuários')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/users');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(updateSystemConfigs).not.toHaveBeenCalled();
  });

  it('depois de salvar, sai sem perguntar', async () => {
    const user = userEvent.setup();
    vi.mocked(updateSystemConfigs).mockResolvedValue({
      message: 'Configurações atualizadas.',
      systemConfigs: CONFIGS.map((config) =>
        config.key === 'app.name'
          ? { ...config, value: 'Produto Renomeado' }
          : config
      ),
    });
    const { router } = renderSettings();
    await editName(user);
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Salvar alterações' })
      ).not.toBeInTheDocument()
    );

    await leaveToUsers(router);

    expect(await screen.findByText('Lista de usuários')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('depois de "Descartar", sai sem perguntar', async () => {
    const user = userEvent.setup();
    const { router } = renderSettings();
    await editName(user);
    await user.click(screen.getByRole('button', { name: 'Descartar' }));

    await leaveToUsers(router);

    expect(await screen.findByText('Lista de usuários')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});

// O 400 da gravação, como o `api` o rejeita (o serviço o deixa sem toast).
function badRequest(data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(
    'Request failed with status code 400',
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    { data, status: 400, statusText: 'Bad Request', headers: {}, config }
  );
}

const IDLE_RANGE_MESSAGE =
  'Tempo de inatividade até o logout (min): Informe um valor de 1 a 480 minutos.';

describe('SettingsPage — recusa do servidor', () => {
  // Só a inatividade muda: ela é o item 0 do lote e o campo 1 da tela. O erro
  // aponta o lote, e a tela acha o campo pela chave.
  it('marca o campo que o servidor recusou, sem toast', async () => {
    const user = userEvent.setup();
    vi.mocked(updateSystemConfigs).mockRejectedValue(
      badRequest({
        message: `items.0.value: ${IDLE_RANGE_MESSAGE}`,
        issues: [{ path: 'items.0.value', message: IDLE_RANGE_MESSAGE }],
      })
    );
    renderSettings();

    const idle = await screen.findByLabelText(
      'Tempo de inatividade até o logout (min)'
    );
    await user.clear(idle);
    await user.type(idle, '999');
    await user.click(
      await screen.findByRole('button', { name: 'Salvar alterações' })
    );

    expect(updateSystemConfigs).toHaveBeenCalledWith([
      { key: 'security.idleTimeoutMinutes', value: '999' },
    ]);
    expect(await screen.findByText(IDLE_RANGE_MESSAGE)).toBeInTheDocument();
    expect(idle).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Nome da aplicação')).not.toHaveAttribute(
      'aria-invalid'
    );
    expect(toast.error).not.toHaveBeenCalled();
    // A alteração continua pendente, para a pessoa corrigir.
    expect(
      screen.getByRole('button', { name: 'Salvar alterações' })
    ).toBeInTheDocument();

    // Mudar o valor tira a marca.
    await user.type(idle, '0');
    expect(screen.queryByText(IDLE_RANGE_MESSAGE)).not.toBeInTheDocument();
  });

  // A regra entre os prazos conferida contra o valor gravado vem só com
  // `message`: não há campo a marcar, e o texto do servidor vira o toast.
  it('mostra como toast o 400 que não aponta campo', async () => {
    const user = userEvent.setup();
    const message =
      'Prazo para apagar a auditoria (meses): Informe um valor maior que o prazo para anonimizar.';
    vi.mocked(updateSystemConfigs).mockRejectedValue(badRequest({ message }));
    renderSettings();

    const name = await screen.findByLabelText('Nome da aplicação');
    await user.type(name, ' 2');
    await user.click(
      await screen.findByRole('button', { name: 'Salvar alterações' })
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(message, { id: 'errorToastId' })
    );
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(name).not.toHaveAttribute('aria-invalid');
  });

  // Outras falhas já tiveram o toast do interceptor: a tela não repete.
  it('não repete o toast das outras falhas', async () => {
    const user = userEvent.setup();
    vi.mocked(updateSystemConfigs).mockRejectedValue(
      new AxiosError('Network Error', AxiosError.ERR_NETWORK)
    );
    renderSettings();

    await user.click(await screen.findByLabelText('Notificações por e-mail'));
    await user.click(
      await screen.findByRole('button', { name: 'Salvar alterações' })
    );

    await waitFor(() => expect(updateSystemConfigs).toHaveBeenCalledTimes(1));
    expect(toast.error).not.toHaveBeenCalled();
    expect(sendErrorMessage).not.toHaveBeenCalled();
  });

  // Resposta 200 fora do contrato: o `.parse` do serviço recusa com um
  // `ZodError`, que não teve toast do interceptor. É falha inesperada:
  // mensagem genérica, `console.error` e reporte.
  it('avisa e reporta a falha que não é HTTP', async () => {
    const user = userEvent.setup();
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const parseError = new ZodError([]);
    vi.mocked(updateSystemConfigs).mockRejectedValue(parseError);
    renderSettings();

    await user.click(await screen.findByLabelText('Notificações por e-mail'));
    await user.click(
      await screen.findByRole('button', { name: 'Salvar alterações' })
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Não foi possível salvar agora. Tente novamente em instantes.',
        { id: 'errorToastId' }
      )
    );
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(sendErrorMessage).toHaveBeenCalledWith({ error: parseError });
    expect(consoleError).toHaveBeenCalledWith(expect.any(String), parseError);
    consoleError.mockRestore();
  });

  // Gravação que respondeu 200 com `message` (o toast de sucesso já saiu) e
  // corpo fora do contrato: o cache não recebeu a resposta. A tela relê as
  // configurações e mostra o que o servidor gravou.
  it('relê as configurações e adota o que o servidor gravou', async () => {
    const user = userEvent.setup();
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    vi.mocked(updateSystemConfigs).mockRejectedValue(new ZodError([]));
    renderSettings();

    const name = await screen.findByLabelText('Nome da aplicação');
    await user.clear(name);
    await user.type(name, 'Produto Gravado');
    vi.mocked(fetchSystemConfigs).mockResolvedValue({
      systemConfigs: CONFIGS.map((config) =>
        config.key === 'app.name'
          ? { ...config, value: 'Produto Gravado' }
          : config
      ),
    });
    await user.click(
      await screen.findByRole('button', { name: 'Salvar alterações' })
    );

    await waitFor(() => expect(fetchSystemConfigs).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Salvar alterações' })
      ).not.toBeInTheDocument()
    );
    expect(name).toHaveValue('Produto Gravado');

    // "Descartar" volta ao valor do servidor, não ao de antes da gravação.
    await user.type(name, '!');
    await user.click(screen.getByRole('button', { name: 'Descartar' }));
    expect(name).toHaveValue('Produto Gravado');
    consoleError.mockRestore();
  });

  // Sem a releitura (servidor fora), a alteração continua pendente.
  it('mantém a alteração pendente quando a releitura falha', async () => {
    const user = userEvent.setup();
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    vi.mocked(updateSystemConfigs).mockRejectedValue(new ZodError([]));
    renderSettings();

    await user.click(await screen.findByLabelText('Notificações por e-mail'));
    vi.mocked(fetchSystemConfigs).mockRejectedValue(
      new AxiosError('Network Error', AxiosError.ERR_NETWORK)
    );
    await user.click(
      await screen.findByRole('button', { name: 'Salvar alterações' })
    );

    await waitFor(() => expect(fetchSystemConfigs).toHaveBeenCalledTimes(2));
    expect(
      screen.getByRole('button', { name: 'Salvar alterações' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Notificações por e-mail')).not.toBeChecked();
    consoleError.mockRestore();
  });
});
