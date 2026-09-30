import { Suspense, useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';

import { Breadcrumb } from '@/components/global/layout/breadcrumb';
import { IdleTimeout } from '@/components/global/layout/idleTimeout';
import { rememberSearch } from '@/lib/navigation/searchMemory';
import { PageActionsSlot } from '@/components/global/layout/pageActions';
import { SuspenseFallback } from '@/components/global/layout/suspenseFallback';
import { UnsavedChangesDialog } from '@/components/global/layout/unsavedChangesDialog';
import { AppSidebar } from '@/components/global/sidebar/appSidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  // Lembra os filtros/ordenação/página de cada rota para restaurá-los ao voltar
  // (breadcrumb, "Cancelar") mesmo após entrar num detalhe/criar.
  useEffect(() => {
    rememberSearch(
      location.pathname,
      location.search as Record<string, unknown>
    );
  }, [location.pathname, location.search]);

  return (
    <SidebarProvider>
      <IdleTimeout />
      <UnsavedChangesDialog />
      <AppSidebar />
      <SidebarInset className="h-svh overflow-hidden">
        {/* Camada `--z-header`: ACIMA do conteúdo da página e do sidebar, ABAIXO
            dos modais (`--z-overlay`) e dos flutuantes (`--z-floating`). O que
            impede um popover de cobrir o breadcrumb NÃO é o z-index (ele perde
            para os flutuantes, de propósito, para que menus abram na frente de
            modais) e sim o `collisionPadding` de topo deles —
            `FLOATING_COLLISION_TOP` (68px) casa com o `h-16` daqui. Ao mudar a
            altura do header, ajuste `lib/constants/layers.ts` junto. O
            `bg-background` mantém o header opaco sobre o conteúdo que rola. */}
        <header className="relative z-(--z-header) flex h-16 shrink-0 items-center gap-2 bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 cursor-pointer" />
            <Separator orientation="vertical" className="mr-2 h-5" />
            <Breadcrumb />
          </div>
          <PageActionsSlot />
        </header>
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex min-h-full flex-col gap-4 p-4 pt-0">
            <div className="flex-1 space-y-4 rounded-xl bg-muted/50 p-4">
              <Suspense fallback={<SuspenseFallback />}>{children}</Suspense>
            </div>
          </div>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
