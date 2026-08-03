import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { getRememberedSearch } from '@/lib/navigation/searchMemory';

/**
 * Volta para uma listagem **com os filtros que estavam aplicados nela**.
 *
 * Telas de detalhe/criação não carregam os filtros da lista na própria URL, então
 * um `navigate({ to: '/lista' })` cru abre a listagem limpa e descarta a busca do
 * usuário. Este hook lê o último search conhecido daquele caminho
 * ([`searchMemory`](src/lib/navigation/searchMemory.ts), alimentado a cada
 * navegação pelo `Layout` e usado também pelo breadcrumb) e o reaplica.
 *
 * Use em todo retorno à listagem — depois de salvar, criar, excluir e no
 * `Cancelar`/`Descartar`:
 *
 * ```ts
 * const returnToList = useReturnToList('/lab/technical-specifications');
 * // ...
 * onSuccess: () => { toast.success('...'); returnToList(); }
 * ```
 *
 * Quem nunca passou pela listagem nesta sessão (deep link direto no detalhe, F5)
 * cai na listagem sem filtro — a memória reinicia no reload e a URL volta a ser a
 * fonte de verdade.
 *
 * Quando a tela pode ter sido aberta a partir de MAIS de um lugar (não só da
 * listagem), o retorno certo é "para onde o usuário veio" (`history.back`) — este
 * hook é para o caso comum, em que o destino é sempre a listagem.
 */
export function useReturnToList(listPath: string) {
  const navigate = useNavigate();

  return useCallback(() => {
    void navigate({ to: listPath, search: getRememberedSearch(listPath) });
  }, [navigate, listPath]);
}
