import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RecentActivitySkeleton } from '@/screens/home/recentActivitySkeleton';
import { RECENT_ACTIVITY_SIZE } from '@/services/home/homeApi';

describe('RecentActivitySkeleton', () => {
  it('reserva os eventos que a home pede, escondidos do leitor de tela', () => {
    const { container } = render(<RecentActivitySkeleton />);

    const list = container.querySelector('ol');
    expect(list).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('li')).toHaveLength(RECENT_ACTIVITY_SIZE);
    // Cada evento: o círculo do ícone e duas linhas (frase; autor e data).
    expect(container.querySelectorAll('.rounded-full')).toHaveLength(
      RECENT_ACTIVITY_SIZE
    );
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      RECENT_ACTIVITY_SIZE * 3
    );
  });
});
