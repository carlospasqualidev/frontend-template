import { ShieldOff } from 'lucide-react';

import { Empty } from '@/components/global/empty/empty';

/**
 * Estado de "sem acesso" para a tela aberta por URL direta sem permissão. Só a
 * mensagem: o servidor segue sendo quem recusa de verdade. Combine com
 * `isForbidden(error)` para decidir quando mostrar.
 */
export function NoAccess({
  description = 'Você não tem acesso a esta área.',
}: {
  description?: string;
}) {
  return (
    <Empty icon={<ShieldOff />} title="Sem acesso" description={description} />
  );
}
