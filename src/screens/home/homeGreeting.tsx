import { Typography } from '@/components/ui/typography';
import { APP_LOCALE } from '@/lib/locale';

interface HomeGreetingProps {
  userName: string | null | undefined;
}

function pickGreeting(hour: number): string {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatToday(date: Date): string {
  return date.toLocaleDateString(APP_LOCALE, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

function firstName(fullName: string | null | undefined): string {
  if (!fullName) return 'visitante';
  const first = fullName.trim().split(/\s+/)[0];
  return first || 'visitante';
}

export function HomeGreeting({ userName }: HomeGreetingProps) {
  const now = new Date();
  const greeting = pickGreeting(now.getHours());
  const today = formatToday(now);

  return (
    <section className="space-y-1">
      <Typography as="h1" variant="h2">
        {greeting}, {firstName(userName)}
      </Typography>
      <Typography variant="muted" className="first-letter:uppercase">
        {today}
      </Typography>
    </section>
  );
}
