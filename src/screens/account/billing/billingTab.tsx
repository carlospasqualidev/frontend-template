import { Download } from 'lucide-react';

import { Button } from '@/components/global/button/button';
import { Card } from '@/components/global/card/card';
import { DemoNotice } from '@/components/global/demoNotice/demoNotice';
import { notifyDemoAction } from '@/components/global/demoNotice/notifyDemoAction';
import { Badge } from '@/components/ui/badge';
import { Typography } from '@/components/ui/typography';
import {
  DEMO_INVOICES,
  DEMO_PAYMENT_METHOD,
  DEMO_PLAN,
} from '@/screens/account/billing/billingDemo';

const DEMO_DESCRIPTION =
  'O servidor ainda não tem cobrança: plano, cartão e faturas abaixo são um exemplo, e nada é gravado nem baixado.';

/** Aba "Pagamento": exemplo de tela, com o aviso de demonstração no topo. */
export function BillingTab() {
  return (
    <div className="grid gap-4">
      <DemoNotice variant="banner" description={DEMO_DESCRIPTION} />

      <Card title="Plano" description="Seu plano atual e próxima cobrança.">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Typography as="span" variant="small">
                {DEMO_PLAN.name}
              </Typography>
              <Badge variant="success">Ativo</Badge>
            </div>
            <Typography variant="muted" className="text-xs">
              {DEMO_PLAN.summary}
            </Typography>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={notifyDemoAction}>
              Trocar de plano
            </Button>
            <Button variant="ghost" onClick={notifyDemoAction}>
              Cancelar
            </Button>
          </div>
        </div>
      </Card>

      <Card
        title="Método de pagamento"
        description="Cartão usado para cobranças automáticas."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Typography as="span" variant="small">
              {DEMO_PAYMENT_METHOD.label}
            </Typography>
            <Typography variant="muted" className="text-xs">
              {DEMO_PAYMENT_METHOD.expiry}
            </Typography>
          </div>
          <Button variant="outline" onClick={notifyDemoAction}>
            Atualizar
          </Button>
        </div>
      </Card>

      <Card title="Histórico" description="Faturas emitidas nos últimos meses.">
        <ul className="divide-y divide-border/60">
          {DEMO_INVOICES.map((invoice) => (
            <li
              key={invoice.id}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 space-y-1">
                <Typography as="span" variant="small" className="block">
                  {invoice.reference}
                </Typography>
                <Typography variant="muted" className="text-xs">
                  {invoice.amount} ·{' '}
                  {invoice.status === 'paid' ? 'Pago' : 'Pendente'}
                </Typography>
              </div>
              <Button variant="ghost" size="sm" onClick={notifyDemoAction}>
                <Download />
                Baixar
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
