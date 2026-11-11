import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { dateFormatter } from '@/lib/dateTime/dateFormatter';

// Simula navegador em inglês: sem locale explícito, o ambiente cai em en-US.
const originalDate = Date.prototype.toLocaleDateString;
const originalString = Date.prototype.toLocaleString;

describe('dateFormatter com navegador em inglês', () => {
  beforeEach(() => {
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockImplementation(function (
      this: Date,
      locale,
      options
    ) {
      return originalDate.call(this, locale ?? 'en-US', options);
    });
    vi.spyOn(Date.prototype, 'toLocaleString').mockImplementation(function (
      this: Date,
      locale,
      options
    ) {
      return originalString.call(this, locale ?? 'en-US', options);
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('dia de calendário sai dd/mm/aaaa', () => {
    expect(dateFormatter({ date: '2026-03-31', hasTimeStamp: false })).toBe(
      '31/03/2026'
    );
  });

  it('instante sem hora sai dd/mm/aaaa', () => {
    expect(
      dateFormatter({
        date: '2026-03-31T12:00:00',
        hasTimeStamp: true,
        showHours: false,
      })
    ).toBe('31/03/2026');
  });

  it('instante com hora sai dd/mm/aaaa hh:mm', () => {
    expect(
      dateFormatter({
        date: '2026-03-31T11:35:00',
        hasTimeStamp: true,
        showHours: true,
      })
    ).toMatch(/^31\/03\/2026,? 11:35$/);
  });
});
