import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PROFILE_SECTIONS } from '@/screens/account/profile/profileForm';
import { ProfileTabSkeleton } from '@/screens/account/profile/profileTabSkeleton';

describe('ProfileTabSkeleton', () => {
  it('mostra os cards e os rótulos reais do perfil; só os campos viram skeleton', () => {
    const { container } = render(<ProfileTabSkeleton />);

    const titles = [
      ...container.querySelectorAll('[data-slot="card-title"]'),
    ].map((title) => title.textContent);
    expect(titles).toEqual([
      PROFILE_SECTIONS.identification.title,
      PROFILE_SECTIONS.access.title,
      PROFILE_SECTIONS.photo.title,
    ]);

    for (const label of [
      'Nome',
      'E-mail',
      'Telefone',
      'Tempo de inatividade (min)',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    // Três campos de identificação, o tempo e a foto.
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      5
    );
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
  });
});
