import { expect, test } from '@playwright/test';

import { login } from './helpers/session';

// Configurações do sistema (`/settings`) — formulário agrupado por módulo no
// padrão "salvar aparece quando há mudança". Cobre: navegar → ver os grupos →
// editar campos → salvar o lote numa gravação → confirmar sucesso (o `message`
// da resposta, um toast só) e volta a pristine.
test.describe('Configurações', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/settings');
  });

  test('exibe os grupos de configuração', async ({ page }) => {
    await expect(page.getByText('Geral', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Nome da aplicação')).toBeVisible();
  });

  test('salvar só aparece quando há mudança e o form volta a pristine ao salvar', async ({
    page,
  }) => {
    const nome = page.getByLabel('Nome da aplicação');
    await expect(nome).toBeVisible();

    // Pristine: nenhuma ação de salvar no topo.
    await expect(page.getByRole('button', { name: 'Salvar alterações' })).toHaveCount(0);

    // Editar torna o form dirty → aparece Descartar + Salvar alterações.
    await nome.fill('Produto Renomeado');
    const inatividade = page.getByLabel('Tempo de inatividade até o logout (min)');
    await expect(inatividade).toHaveValue('20');
    await inatividade.fill('30');
    const salvar = page.getByRole('button', { name: 'Salvar alterações' });
    await expect(salvar).toBeVisible();
    await expect(page.getByRole('button', { name: 'Descartar' })).toBeVisible();

    await salvar.click();

    // Sucesso (um toast só, com o `message` da gravação) e retorno ao estado
    // pristine (as ações somem), com os dois valores gravados.
    await expect(page.getByText('Configurações atualizadas.')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Salvar alterações' })).toHaveCount(0);
    await expect(nome).toHaveValue('Produto Renomeado');
    await expect(inatividade).toHaveValue('30');
  });

  test('descartar reverte a alteração', async ({ page }) => {
    const nome = page.getByLabel('Nome da aplicação');
    const original = await nome.inputValue();

    await nome.fill('Valor Temporário');
    await page.getByRole('button', { name: 'Descartar' }).click();

    await expect(nome).toHaveValue(original);
    await expect(page.getByRole('button', { name: 'Salvar alterações' })).toHaveCount(0);
  });
});
