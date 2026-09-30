import { Card } from '@/components/global/card/card';
import { ActivityTimelineSkeleton } from '@/screens/users/details/activityTimelineSkeleton';

export default {
  title: 'Globais/Users/ActivityTimelineSkeleton',
  component: ActivityTimelineSkeleton,
};

export const Default = () => (
  <Card
    title="Linha do tempo"
    description="Eventos da trilha de auditoria deste usuário, do mais recente para o mais antigo."
  >
    <ActivityTimelineSkeleton />
  </Card>
);
