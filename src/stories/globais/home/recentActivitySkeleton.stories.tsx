import { Card } from '@/components/global/card/card';
import { RecentActivitySkeleton } from '@/screens/home/recentActivitySkeleton';

export default {
  title: 'Globais/Home/RecentActivitySkeleton',
  component: RecentActivitySkeleton,
};

/** A "Atividade recente" da home enquanto a trilha carrega. */
export const Default = () => (
  <Card
    title="Atividade recente"
    description="Últimos eventos da trilha de auditoria."
  >
    <RecentActivitySkeleton />
  </Card>
);
