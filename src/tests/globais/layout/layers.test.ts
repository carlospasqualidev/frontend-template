import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Trava a ORDEM das camadas do app e o uso dos tokens `--z-*`.
 *
 * O bug que originou este teste: o `PopoverContent` estava em `z-30` (abaixo do
 * header, `z-40`) enquanto os modais estavam em `z-50` — ao abrir o calendário
 * de um `DateField` dentro de um `Modal`, o popover portalado no `body` abria
 * ATRÁS da modal. Como cada componente escrevia o próprio número solto, nada
 * garantia que as camadas continuassem coerentes entre si.
 *
 * Aqui checamos as duas metades da regra:
 *  1. os tokens em `src/index.css` estão na ordem certa (flutuante ACIMA de
 *     modal, tooltip acima de flutuante, toast no topo);
 *  2. os componentes que empilham GLOBALMENTE usam o token, não um número.
 *
 * Ver a seção "CAMADAS (z-index)" em `src/index.css`.
 */

const root = process.cwd();

function readSource(relative: string): string {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

const css = readSource('src/index.css');

/** Lê `--z-<name>: <n>;` do bloco de tokens em `src/index.css`. */
function tokenValue(name: string): number {
  const declaration = css
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith(`--z-${name}:`));

  if (!declaration) {
    throw new Error(`token --z-${name} não existe em src/index.css`);
  }

  return Number.parseInt(declaration.split(':')[1], 10);
}

/** Camadas globais, da mais ao fundo para a mais à frente. */
const LAYER_ORDER = [
  'sidebar',
  'sidebar-rail',
  'header',
  'overlay',
  'floating',
  'tooltip',
  'toast',
] as const;

/**
 * Quem é dono de cada camada global. Se um componente novo passar a empilhar
 * no root (portal/fixed), ele entra aqui — e passa a ser coberto pela checagem
 * de "sem número solto" abaixo.
 */
const LAYER_OWNERS: { file: string; token: string }[] = [
  { file: 'src/components/ui/sidebar.tsx', token: 'sidebar' },
  { file: 'src/components/ui/sidebar.tsx', token: 'sidebar-rail' },
  { file: 'src/components/global/layout/layout.tsx', token: 'header' },
  { file: 'src/components/ui/dialog.tsx', token: 'overlay' },
  { file: 'src/components/ui/alert-dialog.tsx', token: 'overlay' },
  { file: 'src/components/ui/sheet.tsx', token: 'overlay' },
  { file: 'src/components/ui/drawer.tsx', token: 'overlay' },
  { file: 'src/components/ui/popover.tsx', token: 'floating' },
  { file: 'src/components/ui/dropdown-menu.tsx', token: 'floating' },
  { file: 'src/components/ui/select.tsx', token: 'floating' },
  { file: 'src/components/ui/hover-card.tsx', token: 'floating' },
  { file: 'src/components/ui/tooltip.tsx', token: 'tooltip' },
];

describe('camadas (z-index)', () => {
  it('os tokens de `index.css` estão em ordem crescente', () => {
    const values = LAYER_ORDER.map(tokenValue);
    const sorted = [...values].sort((a, b) => a - b);

    expect(values).toEqual(sorted);
    expect(new Set(values).size).toBe(values.length);
  });

  it('flutuantes ficam ACIMA de modais (é o que impede "abrir atrás da modal")', () => {
    expect(tokenValue('floating')).toBeGreaterThan(tokenValue('overlay'));
    expect(tokenValue('tooltip')).toBeGreaterThan(tokenValue('floating'));
    expect(tokenValue('toast')).toBeGreaterThan(tokenValue('tooltip'));
  });

  it.each(LAYER_OWNERS)('$file usa o token --z-$token', ({ file, token }) => {
    expect(readSource(file)).toContain(`z-(--z-${token})`);
  });

  it.each([...new Set(LAYER_OWNERS.map((owner) => owner.file))])(
    '%s não escreve z-index global solto',
    (file) => {
      // `z-0`/`z-10` são empilhamento LOCAL (dentro de um `isolate`/`relative`
      // do próprio componente) e não escapam para o root — tudo de 20 pra cima
      // é camada global e tem de vir de um token.
      const raw = [...readSource(file).matchAll(/\bz-(\d+)\b/g)]
        .map((match) => Number(match[1]))
        .filter((value) => value >= 20);

      expect(raw).toEqual([]);
    }
  );

  it('o toaster do Sonner é preso à camada `toast` (ele traz z-index 999999999)', () => {
    expect(readSource('src/components/ui/sonner.tsx')).toContain(
      "zIndex: 'var(--z-toast)'"
    );
  });
});
