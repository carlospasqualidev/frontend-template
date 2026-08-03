import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  SkeletonAvatar,
  SkeletonBadge,
  SkeletonText,
  SkeletonValue,
} from '@/components/global/skeleton/skeleton';

function slot(container: HTMLElement) {
  return container.querySelector('[data-slot="skeleton"]');
}

describe('Skeleton (global)', () => {
  it('cada variante nasce com a dimensão do dado que substitui', () => {
    const text = render(<SkeletonText />);
    expect(slot(text.container)).toHaveClass('h-4', 'w-24');

    const value = render(<SkeletonValue />);
    expect(slot(value.container)).toHaveClass('h-8', 'w-32');

    const badge = render(<SkeletonBadge />);
    expect(slot(badge.container)).toHaveClass('h-5', 'w-16', 'rounded-2xl');

    const avatar = render(<SkeletonAvatar />);
    expect(slot(avatar.container)).toHaveClass('size-10', 'rounded-full');
  });

  // `className` ajusta a dimensão por uso (uma célula mais larga, um avatar
  // menor) sem precisar de uma variante nova.
  it('aceita `className` para ajustar a dimensão no uso', () => {
    const { container } = render(<SkeletonText className="w-48" />);

    expect(slot(container)).toHaveClass('w-48');
  });

  it('o tailwind-merge resolve o conflito em favor da classe do uso', () => {
    const { container } = render(<SkeletonAvatar className="size-6" />);

    expect(slot(container)).toHaveClass('size-6');
    expect(slot(container)).not.toHaveClass('size-10');
  });

  // Skeleton é decorativo: substitui o DADO, não a estrutura. Não deve virar
  // conteúdo anunciado pelo leitor de tela.
  it('não expõe texto nem role próprio (é decorativo)', () => {
    const { container } = render(<SkeletonText />);

    expect(container.textContent).toBe('');
    expect(slot(container)).not.toHaveAttribute('role');
  });
});
