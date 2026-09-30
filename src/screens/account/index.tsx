import { Bell, CreditCard, Shield, UserCog } from 'lucide-react';

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
 * perfil alterado e não salvo pede confirmação, pelo mesmo guard de edição
 * não salva de sair da tela (`useUnsavedChangesGuard` com `searchKey: 'tab'`,
 * na aba "Perfil").
 */
export function AccountPage() {
  return (
    <UrlTabs
      defaultValue="profile"
      items={[
        {
          value: 'profile',
          icon: <UserCog />,
          label: 'Perfil',
          content: <ProfileTab />,
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
  );
}
