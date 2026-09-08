/**
 * Constantes de empilhamento/posicionamento das camadas flutuantes.
 *
 * Os **valores de z-index** vivem em `src/index.css` (tokens `--z-*`) e são
 * aplicados com `z-(--z-floating)`, `z-(--z-overlay)` etc. Aqui ficam só os
 * números que precisam existir em **JS** (props do Floating UI/Radix).
 *
 * Ver a seção "CAMADAS (z-index)" em `src/index.css` para a ordem completa.
 */

/**
 * Folga de topo usada como `collisionPadding` por TODO conteúdo flutuante
 * portalado (Popover, DropdownMenu, Select, HoverCard).
 *
 * O header do `Layout` tem `h-16` (64px) e fica sempre no topo. Como os
 * flutuantes ficam ACIMA do header no eixo z (`--z-floating` > `--z-header`),
 * é esta folga — e não o z-index — que impede um menu de ser posicionado por
 * cima do breadcrumb/ações ao flipar perto do topo da viewport.
 *
 * Se a altura do header mudar em `layout.tsx`, ajuste aqui junto.
 */
export const FLOATING_COLLISION_TOP = 68;

/** Pronto para passar em `collisionPadding` dos conteúdos Radix. */
export const FLOATING_COLLISION_PADDING = { top: FLOATING_COLLISION_TOP };
