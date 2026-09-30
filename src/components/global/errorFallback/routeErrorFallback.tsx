import { useEffect } from 'react';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router';

import {
  ErrorFallback,
  type ErrorFallbackVariant,
} from '@/components/global/errorFallback';
import { sendErrorMessage } from '@/services/api/errorHandlers';

export interface IRouteErrorFallbackProps extends ErrorComponentProps {
  variant?: ErrorFallbackVariant;
}

/**
 * O `errorComponent` do TanStack Router (`error`, `reset`) sobre o
 * `ErrorFallback` global: a mesma tela de erro, com o erro reportado por
 * `sendErrorMessage` (do usuário, só o `userId`).
 *
 * "Tentar novamente" libera as queries que tenham lançado o erro para a tela
 * (`useQueryErrorResetBoundary`, para as que usarem `throwOnError`), refaz o
 * carregamento da rota (`router.invalidate()`: loaders e o módulo da tela) e só
 * então chama o `reset` do roteador, que desenha a tela de novo. Enquanto o
 * carregamento não termina, o botão fica desabilitado, em carregamento: um
 * segundo clique não invalida de novo.
 */
export function RouteErrorFallback({
  error,
  reset,
  variant,
}: IRouteErrorFallbackProps) {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  useEffect(() => {
    void sendErrorMessage({ error });
  }, [error]);

  async function retry() {
    queryErrorResetBoundary.reset();
    await router.invalidate();
    reset();
  }

  return (
    <ErrorFallback error={error} onRetry={retry} variant={variant} reported />
  );
}
