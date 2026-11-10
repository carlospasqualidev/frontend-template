import { BadgeCheckIcon, EllipsisVerticalIcon, LogOutIcon } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

import { UserAvatar } from '@/components/global/avatar/userAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { ToggleTheme } from '@/components/global/layout/toggleTheme';
import { useSessionStore } from '@/hooks/useSessionStore';
import { confirmLeaveIfDirty } from '@/hooks/useUnsavedChangesGuard';

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user, signOut } = useSessionStore();
  const navigate = useNavigate();

  async function handleSignOut() {
    // Com edição não salva, pergunta antes de encerrar a sessão: perguntar
    // depois deixaria "Continuar editando" numa tela sem sessão.
    if (!(await confirmLeaveIfDirty())) return;
    try {
      await signOut();
    } catch {
      // Falha ao encerrar a sessão no servidor não pode prender o usuário na
      // tela protegida — o interceptor do `api` já avisou, e o `signOut` da
      // store já limpou o estado local. Sem este `catch`, a rejeição sobe por
      // um `void handleSignOut()` e vira unhandled rejection no console.
    } finally {
      // A edição já foi descartada acima (ou não havia): a saída não passa
      // pelo guard de novo.
      await navigate({ to: '/login', replace: true, ignoreBlocker: true });
    }
  }

  if (!user) return null;

  return (
    <SidebarMenu>
      {/* Linha de perfil: o gatilho abre o menu da conta e o alternador de tema
          (ghost) fica sempre à vista ao lado, empilhado quando a sidebar recolhe. */}
      <SidebarMenuItem className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col-reverse group-data-[collapsible=icon]:justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="flex-1 group-data-[collapsible=icon]:flex-none data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar
                name={user.name}
                imageUrl={user.image}
                className="rounded-full"
                fallbackClassName="rounded-full font-bold"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                {/* Contraste medido (WCAG): sidebar-foreground a 70% sobre
                    sidebar, 7,55:1 no claro e 8,76:1 no escuro (mínimo 4,5:1). */}
                <span className="truncate text-xs text-sidebar-foreground/70">
                  {user.email}
                </span>
              </div>
              <EllipsisVerticalIcon className="ml-auto size-5" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserAvatar
                  name={user.name}
                  imageUrl={user.image}
                  className="rounded-full"
                  fallbackClassName="rounded-full font-bold"
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  void navigate({ to: '/account' });
                }}
              >
                <BadgeCheckIcon />
                Conta
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuItem
              onClick={() => {
                void handleSignOut();
              }}
            >
              <LogOutIcon />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ToggleTheme variant="ghost" />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
