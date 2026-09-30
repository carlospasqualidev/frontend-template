import { Badge } from '@/components/ui/badge';

/**
 * Status do usuário. O servidor só tem `isActive` ("o cliente deriva daqui"):
 * `true` é "Ativo", `false` é "Bloqueado". O texto acompanha a cor.
 */
export function UserStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? 'success' : 'destructive'}>
      {isActive ? 'Ativo' : 'Bloqueado'}
    </Badge>
  );
}
