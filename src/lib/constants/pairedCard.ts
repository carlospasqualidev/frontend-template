/**
 * Par de cards na mesma linha de grid: um card com LISTA (que pode crescer) e
 * um vizinho de "âncora" (ex.: Home, pendências + gráfico).
 *
 * Regra (em `lg`): a linha mede a LISTA, até um teto. O card da lista tem
 * `lg:max-h-*`, e só acima do teto o corpo rola por dentro (o cabeçalho do
 * card, com título, descrição e ações se houver, fica fixo). O teto é
 * escalonado: `xl` reduz, porque a coluna larga já comporta a lista sem esticar
 * o gráfico. A âncora estica até a altura da linha e preenche o corpo, sem
 * vazio embaixo. Abaixo de `lg` o par empilha: a lista tem altura máxima com
 * scroll (nunca `hidden`).
 *
 * Não use altura fixa na âncora: com a sidebar a coluna estreita e a lista
 * quebra linha, então nenhuma altura fixa serve a todas as larguras.
 *
 * Uso na lista: `className={PAIRED_LIST_CARD_CLASS}` +
 * `contentClassName={PAIRED_LIST_CONTENT_CLASS}`. Na âncora:
 * `contentClassName={PAIRED_ANCHOR_CONTENT_CLASS}` e, no elemento interno,
 * `lg:h-auto lg:min-h-48 lg:flex-1`. Só vale no `Card` estático (no recolhível
 * o `CollapsibleContent` entra na cadeia flex).
 */
export const PAIRED_LIST_CARD_CLASS = 'lg:max-h-[46rem] xl:max-h-[36rem]';

/** `pt-1` evita cortar o anel de foco do primeiro item dentro do scroll. */
export const PAIRED_LIST_CONTENT_CLASS =
  'max-h-112 overflow-y-auto pt-1 lg:max-h-none lg:min-h-0 lg:flex-1';

export const PAIRED_ANCHOR_CONTENT_CLASS = 'lg:flex lg:min-h-0 lg:flex-1';
