import { expect, type Locator, type Page } from '@playwright/test';

/** Id da bancada de camadas (`meta.id` em `Camadas.stories.tsx`). */
const STORY_ID = 'padroes-camadas';

/** Abre uma story da bancada isolada, sem o chrome do Storybook. */
export async function openLayersStory(page: Page, story: string) {
  await page.goto(`/iframe.html?id=${STORY_ID}--${story}&viewMode=story`);
  await expect(page.locator('#storybook-root')).toBeVisible();
}

type HitTest = {
  /** Algum dos pontos amostrados resolveu para o alvo (ou um descendente)? */
  onTop: boolean;
  /** Quem estava no topo em cada ponto — a mensagem de falha diz QUEM cobriu. */
  covering: string[];
};

/**
 * Testa o empilhamento do jeito que o usuário percebe: qual elemento está
 * REALMENTE no topo dos pontos do alvo.
 *
 * Preferimos isto a comparar `z-index` computado (que ignora contexto de
 * empilhamento e ordem de portal) e a diff de screenshot (que varia por SO,
 * fonte e antialias e exigiria baselines por máquina). `elementFromPoint`
 * responde exatamente à pergunta do bug: "dá para ver e clicar, ou o modal
 * está por cima?".
 *
 * Amostramos o centro **e os quatro cantos** (recuados para dentro) porque um
 * ponto só dá falso negativo: conteúdo legítimo de camada MAIS ALTA pode cobrir
 * parte do alvo (um `Tooltip` aberto de dentro de um popover é exatamente isso).
 * Coberto pelo modal, nenhum dos cinco pontos acerta o alvo.
 */
export async function hitTest(target: Locator): Promise<HitTest> {
  return target.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const inset = 6;

    const points = [
      [rect.left + rect.width / 2, rect.top + rect.height / 2],
      [rect.left + inset, rect.top + inset],
      [rect.right - inset, rect.top + inset],
      [rect.left + inset, rect.bottom - inset],
      [rect.right - inset, rect.bottom - inset],
    ] as const;

    let onTop = false;
    const covering: string[] = [];

    for (const [x, y] of points) {
      // Ponto fora da viewport não é amostrável (`elementFromPoint` devolve
      // null) — acontece com um toast entrando pela borda.
      if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) {
        continue;
      }

      const top = document.elementFromPoint(x, y);
      if (!top) continue;

      if (element.contains(top)) {
        onTop = true;
        continue;
      }

      // Descreve quem cobriu: o `data-slot` mais próximo já identifica a camada
      // (dialog-content, popover-content...), que é a informação útil na falha.
      const slotted = top.closest('[data-slot]');
      covering.push(
        slotted?.getAttribute('data-slot') ??
          `${top.tagName.toLowerCase()}${top.className ? `.${String(top.className).split(' ')[0]}` : ''}`
      );
    }

    return { onTop, covering: [...new Set(covering)] };
  });
}

/**
 * Afirma que `content` está visível E no topo — ou seja, não abriu atrás de
 * `context`. Mensagem de falha nomeia quem cobriu.
 */
export async function expectOnTop(
  content: Locator,
  label: string
): Promise<void> {
  await expect(content, `${label}: não ficou visível`).toBeVisible();

  const { onTop, covering } = await hitTest(content);

  expect(
    onTop,
    `${label}: abriu ATRÁS — nenhum ponto do conteúdo está no topo; por cima está ${covering.map((slot) => `"${slot}"`).join(', ') || '(nada amostrável)'}`
  ).toBe(true);
}

/**
 * Fecha o flutuante aberto e espera ele sumir, para não vazar para o próximo
 * caso.
 *
 * Dois detalhes do Radix: o `HoverCard` não fecha enquanto o ponteiro está
 * sobre o gatilho (tiramos o mouse do caminho antes), e cada `Escape` dispensa
 * só a camada do TOPO da pilha do `DismissableLayer` — um `Tooltip` aberto de
 * dentro do popover consome o primeiro `Escape`. Por isso repetimos.
 */
export async function closeFloating(page: Page, content: Locator) {
  await page.mouse.move(0, 0);

  for (let attempt = 0; attempt < 3; attempt++) {
    await page.keyboard.press('Escape');

    try {
      // Espera de verdade entre as tentativas: apertar Escape em rajada faz a
      // camada de cima consumir todas antes do React reconciliar.
      await content.waitFor({ state: 'hidden', timeout: 1_000 });
      return;
    } catch {
      // Ainda aberto — a camada do topo (ex.: um Tooltip) comeu este Escape.
    }
  }

  await expect(content).toBeHidden();
}

/**
 * O toaster do Sonner é `pointer-events: none` por design (não rouba clique da
 * tela), então `elementFromPoint` o atravessa e o hit-test não se aplica. Para
 * ele, a verificação possível — e suficiente — é de ordem de pintura: o toaster
 * é `position: fixed` no root, sem contexto de empilhamento intermediário, logo
 * o z-index decide, e ele tem de estar acima da camada dos overlays.
 */
export async function expectToastAboveOverlays(page: Page): Promise<void> {
  const toast = page.locator('[data-sonner-toast]').first();
  await expect(toast, 'o toast não apareceu').toBeVisible();

  const layers = await page.evaluate(() => {
    const toaster = document.querySelector('[data-sonner-toaster]');
    const styles = getComputedStyle(document.documentElement);

    return {
      toaster: toaster ? Number(getComputedStyle(toaster).zIndex) : Number.NaN,
      position: toaster ? getComputedStyle(toaster).position : null,
      overlay: Number(styles.getPropertyValue('--z-overlay')),
      tooltip: Number(styles.getPropertyValue('--z-tooltip')),
    };
  });

  expect(layers.position, 'o toaster deixou de ser `fixed` no root').toBe(
    'fixed'
  );
  expect(
    layers.toaster,
    'o toaster do Sonner caiu abaixo da camada dos overlays'
  ).toBeGreaterThan(layers.overlay);
  expect(layers.toaster).toBeGreaterThan(layers.tooltip);
}

/**
 * Afirma que o conteúdo flutuante está ANCORADO no seu campo: as duas caixas
 * têm de se sobrepor no eixo X.
 *
 * Regressão coberta: sem portal, o wrapper do popper cai como filho direto do
 * `Field` e o `*:w-full` dele o estica até o bloco de contenção; o `shift` do
 * Floating UI então prende o conteúdo no canto da tela, longe do campo. Dentro
 * de um `Sheet` (bloco de contenção = viewport) isso jogava a lista para x=0.
 *
 * Sobreposição em X — e não "centros a N pixels" — porque perto da borda da
 * viewport o `shift` desloca o conteúdo de propósito, e isso é correto.
 */
export async function expectAnchoredTo(
  content: Locator,
  field: Locator,
  label: string
): Promise<void> {
  const [contentBox, fieldBox] = await Promise.all([
    content.boundingBox(),
    field.boundingBox(),
  ]);

  expect(contentBox, `${label}: conteúdo sem caixa`).not.toBeNull();
  expect(fieldBox, `${label}: campo sem caixa`).not.toBeNull();

  const overlap =
    Math.min(contentBox!.x + contentBox!.width, fieldBox!.x + fieldBox!.width) -
    Math.max(contentBox!.x, fieldBox!.x);

  expect(
    overlap,
    `${label}: desancorou — o conteúdo (x=${Math.round(contentBox!.x)}, w=${Math.round(contentBox!.width)}) não se sobrepõe ao campo (x=${Math.round(fieldBox!.x)}, w=${Math.round(fieldBox!.width)})`
  ).toBeGreaterThan(0);
}

/**
 * Afirma se a camada aberta tranca (ou não) o scroll da página.
 *
 * A regra do sistema: camada de ESCOLHA (lista de opções, calendário) e overlay
 * trancam; camada AUXILIAR (`Tooltip`, `HoverCard`) não. O sintoma que originou
 * a checagem: o `Select` do Radix trancava e os campos baseados em `Popover`
 * não, então a lista ancorada escorregava junto com a página.
 *
 * Lemos o efeito do `react-remove-scroll` no `body` — é o mecanismo que Radix
 * usa em todas as camadas modais, então serve igual para Select, DropdownMenu,
 * Popover e os overlays.
 */
export async function expectScrollLock(
  page: Page,
  shouldLock: boolean,
  label: string
): Promise<void> {
  const locked = await page.evaluate(
    () => getComputedStyle(document.body).overflow === 'hidden'
  );

  expect(
    locked,
    shouldLock
      ? `${label}: deveria trancar o scroll da página e não trancou`
      : `${label}: NÃO deveria trancar o scroll da página, mas trancou`
  ).toBe(shouldLock);
}
