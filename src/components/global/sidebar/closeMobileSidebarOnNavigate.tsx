import { useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';

import { useSidebar } from '@/components/ui/sidebar';

/**
 * Fecha o menu mobile (a sidebar em `Sheet`) quando a tela muda. Observa o
 * caminho e a busca, não o clique: item que só expande submenu não navega e não fecha, e
 * navegação barrada pelo guard de edição não salva (o usuário cancela) mantém
 * o menu aberto, no mesmo lugar onde ele estava.
 */
export function CloseMobileSidebarOnNavigate(): null {
  const { pathname, searchStr } = useLocation();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, searchStr, setOpenMobile]);

  return null;
}
