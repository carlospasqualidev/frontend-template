import { Card } from '@/components/global/card/card';
import { PermissionTreeSkeleton } from '@/screens/roles/utils/permissionTreeSkeleton';

export default {
  title: 'Globais/Roles/PermissionTreeSkeleton',
  component: PermissionTreeSkeleton,
};

/** A árvore de permissões do cargo enquanto o catálogo carrega. */
export const Default = () => (
  <Card
    title="Permissões"
    description="O que o cargo permite. Marcar uma ação de escrita marca também a de visualizar do mesmo grupo."
  >
    <PermissionTreeSkeleton />
  </Card>
);
