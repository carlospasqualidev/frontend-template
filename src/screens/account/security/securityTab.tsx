import { createElement, useState } from 'react';
import {
  KeyRound,
  Laptop,
  MonitorSmartphone,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/global/button/button';
import { Card } from '@/components/global/card/card';
import { DemoNotice } from '@/components/global/demoNotice/demoNotice';
import { notifyDemoAction } from '@/components/global/demoNotice/notifyDemoAction';
import { Switch } from '@/components/global/form/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Typography } from '@/components/ui/typography';
import {
  DEMO_ACCOUNT_SESSIONS,
  DEMO_TWO_FACTOR_ENABLED,
  type AccountSessionDevice,
} from '@/screens/account/security/accountSecurityDemo';
import { ChangePasswordModal } from '@/screens/account/security/changePasswordModal';

// Ícone de cada tipo de aparelho (Map: sem indexar objeto por variável).
const DEVICE_ICON = new Map<AccountSessionDevice, LucideIcon>([
  ['laptop', Laptop],
  ['phone', Smartphone],
]);

/** Troca de senha, real (`PUT /client/users/me/password`). */
function PasswordCard() {
  const [open, setOpen] = useState(false);

  return (
    <Card
      title="Senha"
      description="Use uma senha forte e exclusiva deste sistema."
      action={
        <Button variant="outline" onClick={() => setOpen(true)}>
          <KeyRound />
          Alterar senha
        </Button>
      }
    >
      <Typography variant="muted">
        A troca pede a senha atual. As sessões abertas em outros aparelhos
        continuam válidas até expirar.
      </Typography>
      <ChangePasswordModal open={open} setOpen={setOpen} />
    </Card>
  );
}

/**
 * Autenticação em dois fatores: demonstração (o servidor não tem 2FA). O
 * `Switch` fica preso ao valor do exemplo: o toque só avisa que nada mudou,
 * sem virar na tela.
 */
function TwoFactorCard() {
  return (
    <Card
      title="Autenticação em 2 fatores"
      description="Exige um código adicional do seu app autenticador a cada login."
      action={<DemoNotice />}
    >
      <Switch
        id="account-two-factor"
        label="Aplicativo autenticador"
        description="Recomendado. Compatível com 1Password, Authy e Google Authenticator."
        checked={DEMO_TWO_FACTOR_ENABLED}
        onCheckedChange={notifyDemoAction}
      />
    </Card>
  );
}

/** Sessões ativas da conta: demonstração (a sessão não tem registro no servidor). */
function SessionsCard() {
  return (
    <Card
      title="Sessões ativas"
      description="Dispositivos que estão atualmente conectados à sua conta."
      action={<DemoNotice />}
    >
      <ul className="space-y-3">
        {DEMO_ACCOUNT_SESSIONS.map((session, index) => (
          <li key={session.id} className="space-y-3">
            {index > 0 ? <Separator /> : null}
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground [&>svg]:size-5">
                {createElement(DEVICE_ICON.get(session.icon) ?? Laptop, {
                  'aria-hidden': true,
                })}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Typography as="span" variant="small">
                    {session.device}
                  </Typography>
                  {session.current ? (
                    <Badge variant="info">Sessão atual</Badge>
                  ) : null}
                </div>
                <Typography variant="muted" className="text-xs">
                  {session.location} · ativa {session.lastActive}
                </Typography>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={session.current}
                onClick={notifyDemoAction}
              >
                Encerrar
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-end">
        <Button variant="ghost" onClick={notifyDemoAction}>
          <MonitorSmartphone />
          Encerrar todas as outras sessões
        </Button>
      </div>
    </Card>
  );
}

/**
 * Aba "Segurança": a troca de senha fala com o servidor; 2FA e sessões ativas
 * são exemplo de tela, com o aviso de demonstração em cada card.
 */
export function SecurityTab() {
  return (
    <div className="grid gap-4">
      <PasswordCard />
      <TwoFactorCard />
      <SessionsCard />
    </div>
  );
}
