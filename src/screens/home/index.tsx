import { useSessionStore } from '@/hooks/useSessionStore';
import { hasPermission } from '@/lib/permissions';
import { ActivityChart } from '@/screens/home/activityChart';
import { HomeGreeting } from '@/screens/home/homeGreeting';
import { PendingTasks } from '@/screens/home/pendingTasks';
import { QuickActions } from '@/screens/home/quickActions';
import { RecentActivity } from '@/screens/home/recentActivity';
import { StatsGrid } from '@/screens/home/statsGrid';

/**
 * Home. Reais: os números de usuários (com `backoffice.users.read`), a
 * atividade recente (com `backoffice.audit.read`) e os atalhos, filtrados pela
 * permissão de cada tela; bloco sem permissão some, sem chamar o servidor.
 * Sessões ativas, convites, a série semanal e as pendências não têm rota e
 * ficam como demonstração, com o aviso em cada bloco.
 */
export function DashboardPage() {
  const user = useSessionStore((state) => state.user);
  const canReadAudit = hasPermission(user, 'backoffice.audit.read');

  return (
    <>
      <HomeGreeting userName={user?.name} />
      <StatsGrid />

      <div className="grid gap-4 lg:grid-cols-3">
        <ActivityChart className="lg:col-span-2" />
        <PendingTasks />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {canReadAudit && <RecentActivity />}
        <QuickActions className={canReadAudit ? undefined : 'lg:col-span-2'} />
      </div>
    </>
  );
}
