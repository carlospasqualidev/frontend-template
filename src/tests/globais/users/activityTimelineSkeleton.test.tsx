import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ActivityTimelineSkeleton } from '@/screens/users/details/activityTimelineSkeleton';

describe('ActivityTimelineSkeleton', () => {
  it('reserva os itens da linha do tempo, escondidos do leitor de tela', () => {
    const { container } = render(<ActivityTimelineSkeleton />);

    const list = container.querySelector('ol');
    expect(list).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('li')).toHaveLength(4);
    // Cada item tem o círculo do ícone e três linhas de texto.
    expect(container.querySelectorAll('.rounded-full')).toHaveLength(4);
  });
});
