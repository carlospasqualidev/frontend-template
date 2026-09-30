import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PermissionTreeSkeleton } from '@/screens/roles/utils/permissionTreeSkeleton';

describe('PermissionTreeSkeleton', () => {
  it('reserva o bloco do módulo com os grupos, marcado como carregando', () => {
    const { container } = render(<PermissionTreeSkeleton />);

    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
    // O módulo (1), os 4 grupos e as 3 permissões de cada um.
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      1 + 4 + 4 * 3
    );
  });
});
