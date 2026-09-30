/*
 * DADOS DE DEMONSTRAÇÃO da aba "Pagamento": o servidor não tem cobrança
 * (plano, cartão nem faturas). A aba mostra o aviso de demonstração e nada é
 * gravado nem baixado. Fica assim até existir o domínio de cobrança.
 */

export const DEMO_PLAN = {
  name: 'Plano Pro',
  summary: 'R$ 149,00/mês · próxima cobrança em 15 de junho de 2026.',
};

export const DEMO_PAYMENT_METHOD = {
  label: 'Visa terminando em 4242',
  expiry: 'Expira em 08/2028.',
};

export interface Invoice {
  id: string;
  reference: string;
  amount: string;
  status: 'paid' | 'pending';
}

export const DEMO_INVOICES: Invoice[] = [
  {
    id: 'inv-2026-05',
    reference: 'Maio 2026',
    amount: 'R$ 149,00',
    status: 'paid',
  },
  {
    id: 'inv-2026-04',
    reference: 'Abril 2026',
    amount: 'R$ 149,00',
    status: 'paid',
  },
  {
    id: 'inv-2026-03',
    reference: 'Março 2026',
    amount: 'R$ 149,00',
    status: 'paid',
  },
  {
    id: 'inv-2026-02',
    reference: 'Fevereiro 2026',
    amount: 'R$ 149,00',
    status: 'paid',
  },
];
