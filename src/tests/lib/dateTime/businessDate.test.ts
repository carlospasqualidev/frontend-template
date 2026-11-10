import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  businessDatePlusDays,
  businessToday,
} from '@/lib/dateTime/businessDate';

const SAO_PAULO = 'America/Sao_Paulo';

function setNow(iso: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
}

describe('businessToday', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('usa o dia do fuso do negócio quando o UTC já virou o dia', () => {
    setNow('2026-03-31T01:30:00Z');

    expect(businessToday(SAO_PAULO)).toBe('2026-03-30');
  });

  it('usa o dia do fuso passado, não o do aparelho', () => {
    setNow('2026-03-31T01:30:00Z');

    expect(businessToday('Asia/Tokyo')).toBe('2026-03-31');
    expect(businessToday('Pacific/Honolulu')).toBe('2026-03-30');
  });

  it('sem fuso explícito usa o da env (America/Sao_Paulo nos testes)', () => {
    setNow('2026-03-31T01:30:00Z');

    expect(businessToday()).toBe('2026-03-30');
  });
});

describe('businessDatePlusDays', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('soma dias sobre o dia do negócio', () => {
    setNow('2026-03-31T01:30:00Z');

    expect(businessDatePlusDays(0, SAO_PAULO)).toBe('2026-03-30');
    expect(businessDatePlusDays(1, SAO_PAULO)).toBe('2026-03-31');
    expect(businessDatePlusDays(7, SAO_PAULO)).toBe('2026-04-06');
  });

  it('vira o mês', () => {
    setNow('2026-01-30T15:00:00Z');

    expect(businessDatePlusDays(3, SAO_PAULO)).toBe('2026-02-02');
  });

  it('vira o ano', () => {
    setNow('2026-12-30T15:00:00Z');

    expect(businessDatePlusDays(7, SAO_PAULO)).toBe('2027-01-06');
  });

  it('respeita 29/02 em ano bissexto e não em ano comum', () => {
    setNow('2028-02-28T15:00:00Z');
    expect(businessDatePlusDays(1, SAO_PAULO)).toBe('2028-02-29');
    expect(businessDatePlusDays(2, SAO_PAULO)).toBe('2028-03-01');

    setNow('2027-02-28T15:00:00Z');
    expect(businessDatePlusDays(1, SAO_PAULO)).toBe('2027-03-01');
  });
});
