import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  closeFloating,
  expectAnchoredTo,
  expectOnTop,
  expectScrollLock,
  expectToastAboveOverlays,
  openLayersStory,
} from './helpers/layers';

/**
 * Empilhamento das camadas, medido no navegador de verdade contra a bancada
 * `Padrões/Camadas (z-index)` do Storybook.
 *
 * Regressão coberta: "ao abrir o input de data em um modal, o menu abriu por
 * trás da modal". Cada caso abre um flutuante e verifica, por hit-test, que ele
 * está de fato NO TOPO — e depois interage com ele, porque o Playwright falha a
 * ação quando outro elemento intercepta o clique (a prova final de que não está
 * coberto).
 */

/** Um flutuante da bancada: como abrir e onde o conteúdo aparece. */
type FloatingCase = {
  label: string;
  open: (bench: Locator) => Promise<void>;
  content: (page: Page) => Locator;
  /**
   * Rótulo do campo que ancora o conteúdo. Quando presente, verificamos também
   * que o conteúdo abriu SOBRE o campo — e não jogado num canto da tela.
   */
  anchorLabel?: string;
  /**
   * Camada de ESCOLHA tranca o scroll da página (como o `Select` do Radix);
   * camada AUXILIAR (`HoverCard`) não. Metade travando e metade não é o bug.
   */
  locksScroll: boolean;
};

const FLOATING_CASES: FloatingCase[] = [
  {
    label: 'DateField (calendário)',
    open: (bench) =>
      bench
        .getByRole('button', { name: 'Abrir calendário', exact: true })
        .click(),
    content: (page) => page.locator('[data-slot="popover-content"]'),
    anchorLabel: 'DateField (calendário)',
    locksScroll: true,
  },
  {
    label: 'DateTimeField (calendário + hora)',
    open: (bench) =>
      bench.getByRole('button', { name: 'Abrir calendário e horário' }).click(),
    content: (page) => page.locator('[data-slot="popover-content"]'),
    anchorLabel: 'DateTimeField (calendário + hora)',
    locksScroll: true,
  },
  {
    label: 'Select simples (Radix Select)',
    open: (bench) => bench.getByLabel('Select simples (lista curta)').click(),
    content: (page) => page.locator('[data-slot="select-content"]'),
    anchorLabel: 'Select simples (lista curta)',
    locksScroll: true,
  },
  {
    label: 'Select com busca (Combobox)',
    open: (bench) => bench.getByLabel('Select com busca (Combobox)').click(),
    content: (page) => page.locator('[data-slot="popover-content"]'),
    anchorLabel: 'Select com busca (Combobox)',
    locksScroll: true,
  },
  {
    label: 'MultiSelect',
    open: (bench) => bench.getByLabel('MultiSelect').click(),
    content: (page) => page.locator('[data-slot="multi-select-content"]'),
    anchorLabel: 'MultiSelect',
    locksScroll: true,
  },
  {
    label: 'DropdownMenu',
    open: (bench) =>
      bench.getByRole('button', { name: 'DropdownMenu' }).click(),
    content: (page) => page.locator('[data-slot="dropdown-menu-content"]'),
    locksScroll: true,
  },
  {
    label: 'Popover montado à mão',
    open: (bench) => bench.getByRole('button', { name: 'Popover cru' }).click(),
    content: (page) => page.locator('[data-slot="popover-content"]'),
    locksScroll: true,
  },
  {
    label: 'HoverCard',
    open: (bench) => bench.getByRole('button', { name: 'HoverCard' }).hover(),
    content: (page) => page.locator('[data-slot="hover-card-content"]'),
    // Camada auxiliar: aparece no hover e não pode prender a página.
    locksScroll: false,
  },
];

/** Percorre a bancada inteira num contexto (página, modal, sheet, drawer). */
async function assertBenchStacking(
  page: Page,
  bench: Locator,
  context: string
) {
  for (const item of FLOATING_CASES) {
    await test.step(`${context} → ${item.label}`, async () => {
      await item.open(bench);

      const content = item.content(page);
      await expectOnTop(content, `${context} → ${item.label}`);

      // Só faz sentido medir a tranca do scroll em PÁGINA: dentro de um
      // Modal/Sheet o próprio overlay já mantém o body travado.
      if (context === 'Página') {
        await expectScrollLock(
          page,
          item.locksScroll,
          `${context} → ${item.label}`
        );
      }

      if (item.anchorLabel) {
        await expectAnchoredTo(
          content,
          bench.getByLabel(item.anchorLabel),
          `${context} → ${item.label}`
        );
      }

      await closeFloating(page, content);
    });
  }
}

test.describe('camadas — flutuantes dentro de um Modal', () => {
  test('todo flutuante abre NA FRENTE do modal (desktop/Dialog)', async ({
    page,
  }) => {
    await openLayersStory(page, 'dentro-do-modal');

    const modal = page.getByRole('dialog', { name: 'Agendar coleta' });
    await expect(modal).toBeVisible();

    await assertBenchStacking(page, page.getByTestId('bench-modal'), 'Modal');
  });

  test('o calendário é CLICÁVEL dentro do modal (nada intercepta o clique)', async ({
    page,
  }) => {
    await openLayersStory(page, 'dentro-do-modal');

    const bench = page.getByTestId('bench-modal');
    await bench
      .getByRole('button', { name: 'Abrir calendário', exact: true })
      .click();

    // A prova funcional: o Playwright só clica se o dia estiver realmente
    // recebendo eventos. Com o popover atrás do modal, isto falha com
    // "intercepts pointer events".
    const calendar = page.locator('[data-slot="popover-content"]');
    // O nome acessível do dia é a data inteira ("terça-feira, 15 de …").
    await calendar.getByRole('button', { name: /15 de / }).click();

    await expect(bench.getByLabel('DateField (calendário)')).not.toHaveValue(
      ''
    );
  });

  test('o painel do calendário abraça o conteúdo (não estica com o modal)', async ({
    page,
  }) => {
    await openLayersStory(page, 'dentro-do-modal');

    const bench = page.getByTestId('bench-modal');
    await bench
      .getByRole('button', { name: 'Abrir calendário', exact: true })
      .click();

    const popover = page.locator('[data-slot="popover-content"]');
    await expect(popover).toBeVisible();

    // Regressão: com o `PopoverContent` como filho DIRETO do `Field`, o
    // `*:w-full` dele acertava o wrapper do popper. Sendo `position: fixed`, o
    // popover resolvia `width: 100%` contra o `DialogContent` e esticava para a
    // largura inteira do modal, com o calendário encolhido num canto.
    const [popoverBox, gridBox] = await Promise.all([
      popover.boundingBox(),
      popover.locator('table').first().boundingBox(),
    ]);

    expect(popoverBox).not.toBeNull();
    expect(gridBox).not.toBeNull();
    expect(
      popoverBox!.width - gridBox!.width,
      'o painel do popover esticou muito além do calendário'
    ).toBeLessThan(60);
  });

  test('mesmo comportamento no mobile, onde o Modal vira Drawer', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openLayersStory(page, 'dentro-do-modal');

    // O vaul renderiza o drawer, não o Dialog.
    await expect(page.locator('[data-slot="drawer-content"]')).toBeVisible();

    await assertBenchStacking(page, page.getByTestId('bench-modal'), 'Drawer');
  });
});

test.describe('camadas — flutuantes dentro de um Sheet', () => {
  test('todo flutuante abre NA FRENTE do sheet', async ({ page }) => {
    await openLayersStory(page, 'dentro-do-sheet');

    await expect(page.locator('[data-slot="sheet-content"]')).toBeVisible();

    await assertBenchStacking(page, page.getByTestId('bench-sheet'), 'Sheet');
  });
});

test.describe('camadas — em página', () => {
  test('todo flutuante abre por cima do conteúdo', async ({ page }) => {
    await openLayersStory(page, 'em-pagina');

    await assertBenchStacking(page, page.getByTestId('bench-pagina'), 'Página');
  });

  test('flutuante não cobre o header, mesmo flipando para cima', async ({
    page,
  }) => {
    await openLayersStory(page, 'em-pagina');

    const header = page.getByTestId('header-falso');
    const headerBox = await header.boundingBox();
    expect(headerBox).not.toBeNull();

    // A bancada de baixo abre para CIMA (não cabe abaixo). É aí que ela
    // invadiria o header se o `collisionPadding` de topo sumisse — o z-index
    // não protege o header, por decisão de projeto.
    const bench = page.getByTestId('bench-rodape');
    await bench.getByRole('button', { name: 'Popover cru' }).click();

    const popover = page.locator('[data-slot="popover-content"]');
    await expect(popover).toBeVisible();

    const popoverBox = await popover.boundingBox();
    expect(popoverBox).not.toBeNull();
    expect(
      popoverBox!.y,
      'o popover invadiu a faixa do header/breadcrumb'
    ).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height);
  });
});

test.describe('camadas — empilhamento profundo', () => {
  test('Modal → DropdownMenu → ConfirmDialog → Toast, cada um na frente do anterior', async ({
    page,
  }) => {
    await openLayersStory(page, 'empilhamento-profundo');

    const modal = page.getByRole('dialog', { name: 'Registro #4821' });
    await expect(modal).toBeVisible();

    await modal.getByRole('button', { name: 'Ações do registro' }).click();
    const menu = page.locator('[data-slot="dropdown-menu-content"]');
    await expectOnTop(menu, 'Modal → DropdownMenu');

    await menu.getByRole('menuitem', { name: 'Excluir registro' }).click();
    const confirm = page.getByRole('alertdialog');
    await expectOnTop(confirm, 'DropdownMenu → ConfirmDialog');

    await confirm.getByRole('button', { name: 'Confirmar' }).click();
    await expectToastAboveOverlays(page);
  });

  test('Tooltip fica acima do Popover que o contém', async ({ page }) => {
    await openLayersStory(page, 'dentro-do-modal');

    const bench = page.getByTestId('bench-modal');
    await bench.getByRole('button', { name: 'Popover cru' }).click();

    const popover = page.locator('[data-slot="popover-content"]');
    await expectOnTop(popover, 'Modal → Popover');

    await popover
      .getByRole('button', { name: 'Ajuda dentro do popover' })
      .hover();

    await expectOnTop(
      page.locator('[data-slot="tooltip-content"]').first(),
      'Popover → Tooltip'
    );
  });
});

test.describe('camadas — escala de tokens', () => {
  test('os tokens --z-* estão em ordem crescente no navegador', async ({
    page,
  }) => {
    await openLayersStory(page, 'escala');

    await expect(page.getByTestId('escala-veredito')).toHaveText(
      'Ordem crescente — escala coerente.'
    );

    // A invariante que originou o bug, medida no CSS realmente aplicado.
    const [overlay, floating, tooltip, toast] = await Promise.all([
      page.getByTestId('token-overlay').innerText(),
      page.getByTestId('token-floating').innerText(),
      page.getByTestId('token-tooltip').innerText(),
      page.getByTestId('token-toast').innerText(),
    ]);

    expect(Number(floating)).toBeGreaterThan(Number(overlay));
    expect(Number(tooltip)).toBeGreaterThan(Number(floating));
    expect(Number(toast)).toBeGreaterThan(Number(tooltip));
  });
});
