import { UserDetailSkeleton } from '@/screens/users/details/userDetailSkeleton';

export default {
  title: 'Globais/Users/UserDetailSkeleton',
  component: UserDetailSkeleton,
};

const TABS = [
  { value: 'overview', label: 'Visão geral' },
  { value: 'activity', label: 'Atividade' },
  { value: 'roles', label: 'Cargos' },
  { value: 'sessions', label: 'Sessões' },
];

/** O detalhe do usuário enquanto o cadastro carrega. */
export const Default = () => <UserDetailSkeleton tabs={TABS} />;

/** Sem a permissão da trilha, a aba "Atividade" não existe. */
export const SemAtividade = () => (
  <UserDetailSkeleton tabs={TABS.filter((tab) => tab.value !== 'activity')} />
);
