import { MonitorSmartphone } from 'lucide-react';

import { Button } from '@/components/global/button/button';
import { Card } from '@/components/global/card/card';
import { DemoNotice } from '@/components/global/demoNotice/demoNotice';
import { notifyDemoAction } from '@/components/global/demoNotice/notifyDemoAction';
import { Empty } from '@/components/global/empty/empty';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Typography } from '@/components/ui/typography';
import { dateFormatter } from '@/lib/dateTime/dateFormatter';
import { getDemoUserSessions } from '@/screens/users/details/userSessionsDemo';
import { type CompanyUser } from '@/services/users/types';

interface SessionsTabProps {
  user: CompanyUser;
}

const DEMO_DESCRIPTION =
  'O servidor ainda não guarda as sessões por usuário: os dispositivos abaixo são um exemplo, e encerrar não desconecta ninguém.';

/**
 * Aba "Sessões" do detalhe: dados de demonstração (`userSessionsDemo.ts`),
 * porque a sessão é um cookie sem registro no servidor. O aviso fica no topo
 * da aba.
 */
export function SessionsTab({ user }: SessionsTabProps) {
  const sessions = getDemoUserSessions(user);

  return (
    <div className="grid gap-4">
      <DemoNotice variant="banner" description={DEMO_DESCRIPTION} />
      {sessions.length === 0 ? (
        <Empty
          title="Sem sessões ativas"
          description="O usuário ainda não acessou o sistema."
          icon={<MonitorSmartphone />}
        />
      ) : (
        <Card
          title="Sessões ativas"
          description="Dispositivos conectados a esta conta. Encerre sessões suspeitas para forçar o reenvio do login."
        >
          <ul className="space-y-3">
            {sessions.map((session, index) => (
              <li key={session.id} className="space-y-3">
                {index > 0 ? <Separator /> : null}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Typography as="span" variant="small">
                        {session.device}
                      </Typography>
                      {session.current ? (
                        <Badge variant="info">Sessão atual</Badge>
                      ) : null}
                    </div>
                    <Typography variant="muted" className="text-xs">
                      {session.browser} · {session.location} · {session.ip}
                    </Typography>
                    <Typography variant="muted" className="text-xs">
                      Último uso em{' '}
                      {dateFormatter({
                        date: session.lastActiveAt,
                        hasTimeStamp: true,
                        showHours: false,
                      })}
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
        </Card>
      )}
    </div>
  );
}
