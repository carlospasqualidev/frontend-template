import { createContext, useContext } from 'react';

/**
 * Sinaliza que a subárvore está DENTRO de um `Modal` (Dialog/Drawer). Os campos
 * com popover (`Select` searchable, `Combobox`, `MultiSelect`) leem isto para
 * **não portalar por padrão** quando estão num modal.
 *
 * Motivo: o popover portala no `body` (z abaixo do modal) e abre **atrás** dele;
 * além disso o `react-remove-scroll` do modal bloqueia a roda do mouse em conteúdo
 * portalado. Fora de modal (página) o default continua portalando, para ancorar
 * corretamente sob o campo mesmo com ancestrais que criam containing block.
 *
 * A prop `portal` explícita do campo sempre vence este default.
 */
export const InModalContext = createContext(false);

/** `true` quando o componente está sendo renderizado dentro de um `Modal`. */
export function useInModal(): boolean {
  return useContext(InModalContext);
}
