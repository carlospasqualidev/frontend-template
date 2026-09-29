import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PageActionsSlot } from '@/components/global/layout/pageActions';
import { SettingsPage } from '@/screens/settings';
import {
  fetchSystemConfigs,
  updateSystemConfigs,
  type SystemConfig,
} from '@/services/systemConfigs/systemConfigsApi';

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

function renderSettings() {
  return render(
    <QueryClientProvider client={queryClient}>
      <PageActionsSlot />
      <SettingsPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  vi.mocked(fetchSystemConfigs).mockResolvedValue({ systemConfigs: CONFIGS });
  vi.mocked(updateSystemConfigs).mockReset();
  vi.mocked(toast.success).mockClear();
});

afterEach(() => {
  queryClient.clear();
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
