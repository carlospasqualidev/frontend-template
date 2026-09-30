import { useRef, useState } from 'react';
import { Bell, CreditCard, Shield, UserCog } from 'lucide-react';

import { ConfirmDialog } from '@/components/global/confirmDialog/confirmDialog';
import { UrlTabs } from '@/components/global/tabs/urlTabs';
import { BillingTab } from '@/screens/account/billing/billingTab';
import { NotificationsTab } from '@/screens/account/notifications/notificationsTab';
import { ProfileTab } from '@/screens/account/profile/profileTab';
import { SecurityTab } from '@/screens/account/security/securityTab';

/**
 * Minha conta: "Perfil" e a senha em "Segurança" falam com o servidor
 * (autoatendimento em `/client/users/me`); 2FA, sessões ativas,
 * "Notificações" e "Pagamento" são exemplo de tela, com o aviso de
 * demonstração.
 *
 * Cada aba tem o seu formulário e a inativa desmonta: trocar de aba com o
 * perfil alterado e não salvo pede confirmação. Confirmar troca de aba e
 * descarta a edição; cancelar fica no perfil, com a edição.
 */
export function AccountPage() {
  const [profileDirty, setProfileDirty] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingTabChange = useRef<() => void>(undefined);
  const tabsRef = useRef<HTMLDivElement>(null);

  const confirmTabChange = (_next: string, change: () => void) => {
    if (!profileDirty) {
      change();
      return;
    }
    pendingTabChange.current = change;
    setConfirmOpen(true);
  };

  // O dialog abre sem trigger (pela troca de aba): ao fechar, o foco volta à
  // aba ativa em vez de cair no `body` — o "Perfil", depois de "Continuar
  // editando". Focar a aba ativa não pede outra troca.
  const focusActiveTab = (event: Event) => {
    event.preventDefault();
    tabsRef.current
      ?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
      ?.focus();
  };

  return (
    <>
      <div ref={tabsRef}>
        <UrlTabs
          defaultValue="profile"
          onBeforeChange={confirmTabChange}
          items={[
            {
              value: 'profile',
              icon: <UserCog />,
              label: 'Perfil',
              content: <ProfileTab onDirtyChange={setProfileDirty} />,
            },
            {
              value: 'security',
              icon: <Shield />,
              label: 'Segurança',
              content: <SecurityTab />,
            },
            {
              value: 'notifications',
              icon: <Bell />,
              label: 'Notificações',
              content: <NotificationsTab />,
            },
            {
              value: 'billing',
              icon: <CreditCard />,
              label: 'Pagamento',
              content: <BillingTab />,
            },
          ]}
        />
      </div>
      <ConfirmDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        title="Descartar as alterações do perfil?"
        description="O que você mudou no perfil ainda não foi salvo. Trocar de aba descarta essas alterações."
        confirmLabel="Descartar alterações"
        cancelLabel="Continuar editando"
        destructive
        onConfirm={() => pendingTabChange.current?.()}
        onCloseAutoFocus={focusActiveTab}
      />
    </>
  );
}
