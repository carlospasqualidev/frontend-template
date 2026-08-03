import { BadgeCheckIcon, ChevronsUpDownIcon, LogOutIcon } from 'lucide-react';
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

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user, signOut } = useSessionStore();
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      await signOut();
    } catch {
      // Falha ao encerrar a sessão no servidor não pode prender o usuário na
      // tela protegida — o interceptor do `api` já avisou, e o `signOut` da
      // store já limpou o estado local. Sem este `catch`, a rejeição sobe por
      // um `void handleSignOut()` e vira unhandled rejection no console.
    } finally {
      await navigate({ to: '/login', replace: true });
    }
  }

  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar
                name={user.name}
                imageUrl={user.image}
                className="rounded-lg"
                fallbackClassName="rounded-lg"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
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
                  className="rounded-lg"
                  fallbackClassName="rounded-lg"
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ToggleTheme />
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
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
