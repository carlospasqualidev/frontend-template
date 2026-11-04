import { Card } from '@/components/global/card/card';
import { ActivityTimelineSkeleton } from '@/screens/users/details/activityTimelineSkeleton';

export default {
  title: 'Globais/Users/ActivityTimelineSkeleton',
  component: ActivityTimelineSkeleton,
};

export const Default = () => (
  <Card title="Linha do tempo">
    <ActivityTimelineSkeleton />
  </Card>
);
