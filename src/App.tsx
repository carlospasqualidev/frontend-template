import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorFallback } from '@/components/global/errorFallback';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/routes';
import { sendErrorMessage } from '@/services/api/errorHandlers';

export function App() {
  return (
    <ErrorBoundary
      // O `onError` reporta: a tela pode dizer que a equipe foi notificada.
      fallbackRender={(props) => <ErrorFallback {...props} reported />}
      onError={(error) => {
        sendErrorMessage({ error });
      }}
    >
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
