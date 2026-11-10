import { useLayoutEffect } from 'react';
import { useLocation } from '@tanstack/react-router';
import { create } from 'zustand';

export interface BreadcrumbCrumb {
  title: string;
  /** Caminho concreto do link (ex.: `/users/abc123`). */
  pathname: string;
}

interface BreadcrumbExtraState {
  crumbs: BreadcrumbCrumb[];
  /** Rota (`location.pathname`) em que os crumbs foram registrados. */
  ownerPathname: string;
  set: (crumbs: BreadcrumbCrumb[], ownerPathname: string) => void;
}

const useBreadcrumbExtraStore = create<BreadcrumbExtraState>((set) => ({
  crumbs: [],
  ownerPathname: '',
  set: (crumbs, ownerPathname) => set({ crumbs, ownerPathname }),
}));

/**
 * Os crumbs dinâmicos atuais, lidos pelo `Breadcrumb`. Só valem na rota em que
 * foram registrados: em outra, a lista vem vazia, mesmo que a limpeza da tela
 * anterior ainda não tenha rodado.
 */
export function useBreadcrumbExtraCrumbs(
  currentPathname: string
): BreadcrumbCrumb[] {
  const { crumbs, ownerPathname } = useBreadcrumbExtraStore();
  return ownerPathname === currentPathname ? crumbs : NO_CRUMBS;
}

const NO_CRUMBS: BreadcrumbCrumb[] = [];

/**
 * Crumbs dinâmicos na trilha, para o que a hierarquia de rotas não traz. Dois
 * usos, decididos pelo `pathname` de cada crumb (ver `Breadcrumb`):
 * - **Substituir** o rótulo da própria página, quando o `pathname` é o da página
 *   atual: o nome do registro no lugar de "Detalhes do usuário".
 * - **Inserir antes** do item da página atual, quando o `pathname` é outro.
 *
 * Aceita um crumb, uma lista deles, ou `null`. A página chama assim que conhece
 * o dado; `null` (ou desmontar) limpa. Crumb sem `title` ou sem `pathname` é
 * ignorado.
 */
export function useBreadcrumbExtra(
  crumb: BreadcrumbCrumb | BreadcrumbCrumb[] | null
): void {
  const set = useBreadcrumbExtraStore((state) => state.set);
  const pathname = useLocation({ select: (location) => location.pathname });

  // Serializado para a dependência do efeito ser estável: um objeto ou array
  // literal novo a cada render dispararia o efeito à toa.
  const serialized = JSON.stringify(
    (crumb == null ? [] : Array.isArray(crumb) ? crumb : [crumb]).filter(
      (item) => item.title && item.pathname
    )
  );

  // Layout effect: a limpeza roda antes da pintura, sem piscar o crumb antigo.
  useLayoutEffect(() => {
    set(JSON.parse(serialized) as BreadcrumbCrumb[], pathname);
    return () => set([], '');
  }, [serialized, pathname, set]);
}
