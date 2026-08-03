import { Link, useMatchRoute } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useSessionStore } from '@/hooks/useSessionStore';
import { sidebarData } from '@/lib/constants/sidebar';
import { hasPermission } from '@/lib/permissions';

export function NavMain() {
  const matchRoute = useMatchRoute();
  const user = useSessionStore((state) => state.user);
  const { state, isMobile } = useSidebar();

  // Sidebar recolhida em ícones (só no desktop; no mobile ela é um sheet full).
  // Nesse modo o `SidebarMenuSub` fica escondido — então os filhos vão para um
  // flyout (DropdownMenu à direita), senão não dá pra clicar neles.
  const collapsed = state === 'collapsed' && !isMobile;

  return (
    <SidebarGroup>
      <SidebarMenu>
        {sidebarData.nav.map((module) => {
          // Esconde os itens sem a permissão correspondente; um item sem
          // `permission` aparece para todos. O módulo some se ficar sem itens.
          // Itens sempre exibidos em ordem alfabética (pt-BR), independente da
          // ordem da lista de origem.
          const items = module.items
            .filter((item) => {
              // `anyPermission`: visível se o usuário tiver AO MENOS UMA.
              if (item.anyPermission) {
                return item.anyPermission.some((permission) =>
                  hasPermission(user, permission)
                );
              }
              return !item.permission || hasPermission(user, item.permission);
            })
            .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));

          if (items.length === 0) return null;

          const isModuleActive = items.some((item) =>
            Boolean(matchRoute({ to: item.url, fuzzy: item.url !== '/' }))
          );

          // Recolhida: ícone do módulo abre um flyout com os itens-filho.
          if (collapsed) {
            return (
              <SidebarMenuItem key={module.title}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton isActive={isModuleActive}>
                      {module.icon}
                      <span>{module.title}</span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="right"
                    align="start"
                    className="min-w-48"
                  >
                    <DropdownMenuLabel>{module.title}</DropdownMenuLabel>
                    {items.map((item) => (
                      <DropdownMenuItem key={item.url} asChild>
                        <Link to={item.url}>
                          {item.icon}
                          <span>{item.title}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              key={module.title}
              asChild
              defaultOpen={isModuleActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={module.title}>
                    {module.icon}
                    <span>{module.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {items.map((item) => {
                      const isActive = Boolean(
                        matchRoute({ to: item.url, fuzzy: item.url !== '/' })
                      );

                      return (
                        <SidebarMenuSubItem key={item.url}>
                          <SidebarMenuSubButton asChild isActive={isActive}>
                            <Link to={item.url}>
                              {item.icon}
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}

        {sidebarData.links
          .filter(
            (link) => !link.permission || hasPermission(user, link.permission)
          )
          .map((link) => {
            const isActive = Boolean(
              matchRoute({ to: link.url, fuzzy: link.url !== '/' })
            );

            return (
              <SidebarMenuItem key={link.url}>
                <SidebarMenuButton
                  asChild
                  tooltip={link.title}
                  isActive={isActive}
                >
                  <Link to={link.url}>
                    {link.icon}
                    <span>{link.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
