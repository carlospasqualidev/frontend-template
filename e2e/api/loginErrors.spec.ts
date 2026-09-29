import { expect, test, type Page } from '@playwright/test';

import { SEED_ADMIN, SEED_BLOCKED } from '../helpers/serverApi';
import { submitLogin } from '../helpers/session';

// Login recusado pelo server real: a mensagem do server vira o toast (pelo
// interceptor do `api`) e a pessoa continua na tela de login.
function toastWithText(page: Page, text: string) {
  return page.locator('[data-sonner-toast]', { hasText: text });
}

test.describe('Login recusado pelo server real', () => {
  test('senha errada mostra "Credenciais inválidas."', async ({ page }) => {
    await submitLogin(page, {
      email: SEED_ADMIN.email,
      password: 'senha-errada',
    });

    await expect(toastWithText(page, 'Credenciais inválidas.')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeEnabled();
  });

  test('conta bloqueada mostra "Sua conta está bloqueada."', async ({
    page,
  }) => {
    await submitLogin(page, SEED_BLOCKED);

    await expect(
      toastWithText(page, 'Sua conta está bloqueada.')
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeEnabled();
  });
});
