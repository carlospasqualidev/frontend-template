import type { PropsWithChildren } from 'react';
import {
  CatchBoundary,
  isNotFound,
  useMatches,
  type ErrorComponentProps,
} from '@tanstack/react-router';

import { RouteErrorFallback } from './routeErrorFallback';

function ContentErrorFallback(props: ErrorComponentProps) {
  // O `notFound()` é repassado pelo `onCatch` logo depois deste render: nada a
  // mostrar nem a reportar como erro.
  if (isNotFound(props.error)) return null;
  return <RouteErrorFallback {...props} variant="content" />;
}

/**
 * O `errorComponent` das telas do layout protegido, montado uma vez em volta
 * do `Outlet` dele e herdado por todas as filhas: o erro de render ou de
 * carregamento de uma tela troca só o conteúdo dela pela tela de erro, e o
 * menu e o cabeçalho continuam.
 *
 * Ir para outro endereço (outra tela, outros parâmetros ou outra busca) limpa
 * o erro. A chave é a tela que o roteador está desenhando, não a URL: a URL
 * muda antes de a tela nova entrar, e limpar o erro nesse meio desenharia a
 * tela antiga de novo.
 *
 * O `notFound()` lançado no render de uma tela não é erro: sobe para o
 * `notFoundComponent` da raiz, como nos boundaries de rota do TanStack Router.
 */
export function RouteErrorBoundary({ children }: PropsWithChildren) {
  const renderedAddress = useMatches({
    select: (matches) => {
      const screen = matches.at(-1);
      return screen && `${screen.id}${JSON.stringify(screen.search)}`;
    },
  });

  return (
    <CatchBoundary
      getResetKey={() => renderedAddress}
      errorComponent={ContentErrorFallback}
      onCatch={(error) => {
        if (isNotFound(error)) throw error;
      }}
    >
      {children}
    </CatchBoundary>
  );
}
