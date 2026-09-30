import { Activity, MonitorSmartphone, Shield, UserCog } from 'lucide-react';

import { UserDetailSkeleton } from '@/screens/users/details/userDetailSkeleton';

export default {
  title: 'Globais/Users/UserDetailSkeleton',
  component: UserDetailSkeleton,
};

const TABS = [
  { value: 'overview', icon: <UserCog />, label: 'Visão geral' },
  { value: 'activity', icon: <Activity />, label: 'Atividade' },
  { value: 'roles', icon: <Shield />, label: 'Cargos' },
  { value: 'sessions', icon: <MonitorSmartphone />, label: 'Sessões' },
];

/** O detalhe do usuário enquanto o cadastro carrega. */
export const Default = () => <UserDetailSkeleton tabs={TABS} />;

/** Sem a permissão da trilha, a aba "Atividade" não existe. */
export const SemAtividade = () => (
  <UserDetailSkeleton tabs={TABS.filter((tab) => tab.value !== 'activity')} />
);
