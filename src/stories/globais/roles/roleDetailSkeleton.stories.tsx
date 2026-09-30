import { Shield, Users } from 'lucide-react';

import { RoleDetailSkeleton } from '@/screens/roles/details/roleDetailSkeleton';

export default {
  title: 'Globais/Roles/RoleDetailSkeleton',
  component: RoleDetailSkeleton,
};

const TABS = [
  { value: 'overview', icon: <Shield />, label: 'Visão geral' },
  { value: 'users', icon: <Users />, label: 'Usuários' },
];

/** O detalhe do cargo enquanto ele e os usuários dele carregam. */
export const Default = () => <RoleDetailSkeleton tabs={TABS} />;

/** Sem a leitura de usuários, a aba "Usuários" não existe. */
export const SemUsuarios = () => (
  <RoleDetailSkeleton tabs={TABS.filter((tab) => tab.value !== 'users')} />
);
