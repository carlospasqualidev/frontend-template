import { useLocation } from '@tanstack/react-router';

import { useSidebar } from '@/components/ui/sidebar';

/**
 * Tocar no link do destino em que o usuário já está (mesmo caminho e mesma
 * busca) não navega, então o efeito do `CloseMobileSidebarOnNavigate` não
 * roda: o clique fecha o menu mobile direto. Destino diferente, inclusive só
 * pela busca, deixa a navegação decidir (o guard de edição pode barrá-la) e o
 * fechamento vem pelo efeito. `search` é a busca do destino, como em
 * `location.searchStr` (`''` quando o link não tem busca).
 */
export function useCloseMobileSidebarOnSamePage(): (
  url: string,
  search?: string
) => void {
  const { pathname, searchStr } = useLocation();
  const { setOpenMobile } = useSidebar();

  return (url, search = '') => {
    if (url === pathname && search === searchStr) setOpenMobile(false);
  };
}
