import { ArrowRight } from 'lucide-react';

import { Card } from '@/components/global/card/card';
import { Link } from '@/components/global/link/link';
import { Typography } from '@/components/ui/typography';
import { useSessionStore } from '@/hooks/useSessionStore';
import { hasPermission } from '@/lib/permissions';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
  /** Sem `permission`, o atalho aparece para todo usuário logado. */
  permission?: string;
}

// Atalhos para telas que existem; cada um some sem a permissão da tela.
const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'qa-users',
    label: 'Gerenciar usuários',
    description: 'Veja a lista completa e filtre por cargo e status.',
    href: '/users',
    permission: 'backoffice.users.read',
  },
  {
    id: 'qa-new-user',
    label: 'Novo usuário',
    description: 'Cadastre uma pessoa e depois dê os cargos dela.',
    href: '/users/create',
    permission: 'backoffice.users.create',
  },
  {
    id: 'qa-audit',
    label: 'Abrir auditoria',
    description: 'Histórico das ações feitas no sistema.',
    href: '/audit-logs',
    permission: 'backoffice.audit.read',
  },
  {
    id: 'qa-settings',
    label: 'Configurações',
    description: 'Preferências da empresa, como o tempo de inatividade.',
    href: '/settings',
    permission: 'backoffice.systemConfigs.read',
  },
  {
    id: 'qa-account',
    label: 'Minha conta',
    description: 'Seu perfil, sua foto e sua senha.',
    href: '/account',
  },
];

interface QuickActionsProps {
  className?: string;
}

/** Atalhos da home: links de verdade para as telas que a pessoa pode abrir. */
export function QuickActions({ className }: QuickActionsProps) {
  const user = useSessionStore((state) => state.user);
  const actions = QUICK_ACTIONS.filter(
    (action) => !action.permission || hasPermission(user, action.permission)
  );

  return (
    <Card
      title="Acesso rápido"
      description="Atalhos para as telas mais usadas."
      className={className}
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {actions.map((action) => (
          <li key={action.id}>
            <Link
              href={action.href}
              newTabIcon={false}
              className="group flex items-start gap-3 rounded-2xl border border-border/70 bg-background p-4 text-foreground no-underline transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <Typography as="span" variant="small" className="block">
                  {action.label}
                </Typography>
                <Typography variant="muted" className="text-xs">
                  {action.description}
                </Typography>
              </div>
              <ArrowRight
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
