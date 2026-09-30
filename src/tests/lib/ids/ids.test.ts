import { describe, expect, it } from 'vitest';

import { isUuid } from '@/lib/ids';

describe('isUuid', () => {
  it('aceita o id do servidor (uuid v7)', () => {
    expect(isUuid('01a0f253-fc4e-745c-b069-dff39ba3116e')).toBe(true);
  });

  it('recusa o que o servidor recusaria com 400', () => {
    for (const value of [
      '',
      '123',
      'role-financeiro',
      '01a0f253-fc4e-745c-b069-dff39ba3116',
      '01a0f253fc4e745cb069dff39ba3116e',
      ' 01a0f253-fc4e-745c-b069-dff39ba3116e',
    ]) {
      expect(isUuid(value)).toBe(false);
    }
  });
});
