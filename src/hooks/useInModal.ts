import { createContext, useContext } from 'react';

/**
 * Sinaliza que a subárvore está DENTRO de um `Modal` (Dialog/Drawer). O
 * `PopoverContent` ([`ui/popover.tsx`](../components/ui/popover.tsx)) lê isto
 * para decidir sozinho se portala — e com isso TODO campo com popover
 * (`Select` searchable, `Combobox`, `MultiSelect`, `DateField`, `DateTimeField`
 * e qualquer popover montado à mão) herda o comportamento correto sem precisar
 * repetir a regra.
 *
 * Motivo de NÃO portalar dentro de modal: o `react-remove-scroll` do Dialog só
 * libera a roda do mouse em descendentes do próprio Dialog, e conteúdo portalado
 * no `body` fica fora dessa subárvore — a lista do popover não rolaria.
 *
 * Motivo de portalar FORA de modal: o popover é `position: fixed` e um ancestral
 * com `transform`/`contain` (um `Card`, o layout) vira bloco de contenção e o
 * desancora, abrindo no canto da tela.
 *
 * **Isto NÃO é o mecanismo de empilhamento.** Quem garante que o popover fica na
 * frente do modal é o z-index (`--z-floating` > `--z-overlay`, ver
 * `src/index.css`), justamente para que um popover portalado dentro de um modal
 * também funcione.
 *
 * Vive em `hooks/` (e não em `components/global/`) porque é consumido pela
 * camada `components/ui/` — o inverso criaria uma dependência de `ui/` para
 * `global/`, contra a direção das camadas.
 */
export const InModalContext = createContext(false);

/** `true` quando o componente está sendo renderizado dentro de um `Modal`. */
export function useInModal(): boolean {
  return useContext(InModalContext);
}
