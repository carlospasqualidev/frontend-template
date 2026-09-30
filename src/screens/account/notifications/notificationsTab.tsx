import { Card } from '@/components/global/card/card';
import { DemoNotice } from '@/components/global/demoNotice/demoNotice';
import { notifyDemoAction } from '@/components/global/demoNotice/notifyDemoAction';
import { Switch } from '@/components/global/form/switch';
import {
  DEMO_NOTIFICATION_CHANNELS,
  DEMO_NOTIFICATION_EVENTS,
  type NotificationSetting,
} from '@/screens/account/notifications/notificationSettingsDemo';

const DEMO_DESCRIPTION =
  'O servidor ainda não guarda preferências de notificação por pessoa: os canais e eventos abaixo são um exemplo, e nada é gravado.';

// Cada `Switch` fica preso ao valor do exemplo: o toque só avisa que nada
// mudou, sem virar na tela.
function SettingList({ settings }: { settings: NotificationSetting[] }) {
  return (
    <ul className="divide-y divide-border/60">
      {settings.map((setting) => (
        <li key={setting.id} className="py-3 first:pt-0 last:pb-0">
          <Switch
            id={setting.id}
            label={setting.label}
            description={setting.description}
            checked={setting.checked}
            onCheckedChange={notifyDemoAction}
          />
        </li>
      ))}
    </ul>
  );
}

/** Aba "Notificações": exemplo de tela, com o aviso de demonstração no topo. */
export function NotificationsTab() {
  return (
    <div className="grid gap-4">
      <DemoNotice variant="banner" description={DEMO_DESCRIPTION} />
      <Card
        title="Canais"
        description="Onde você quer ser notificado sobre eventos do sistema."
      >
        <SettingList settings={DEMO_NOTIFICATION_CHANNELS} />
      </Card>
      <Card
        title="Eventos"
        description="Quais tipos de evento disparam uma notificação."
      >
        <SettingList settings={DEMO_NOTIFICATION_EVENTS} />
      </Card>
    </div>
  );
}
