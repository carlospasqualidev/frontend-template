import { describe, expect, it } from 'vitest';

import {
  newUsersThisMonthParams,
  RECENT_ACTIVITY_PARAMS,
  RECENT_ACTIVITY_SIZE,
  TOTAL_USERS_PARAMS,
} from '@/services/home/homeApi';

describe('parâmetros da home', () => {
  it('o total de usuários lê só uma linha: interessa o `count`', () => {
    expect(TOTAL_USERS_PARAMS).toEqual({ page: 0, pageSize: 1 });
  });

  it('novos no mês: desde a meia-noite local do dia 1º, em ISO UTC', () => {
    const params = newUsersThisMonthParams(new Date(2026, 8, 30, 15, 45));

    expect(params).toEqual({
      page: 0,
      pageSize: 1,
      createdFrom: new Date(2026, 8, 1, 0, 0, 0, 0).toISOString(),
    });
    expect(params.createdFrom).toMatch(/Z$/);
  });

  it('no primeiro dia do mês, conta desde a meia-noite daquele dia', () => {
    expect(
      newUsersThisMonthParams(new Date(2027, 0, 1, 0, 5)).createdFrom
    ).toBe(new Date(2027, 0, 1, 0, 0, 0, 0).toISOString());
  });

  it('atividade recente: os mais novos da trilha, poucos', () => {
    expect(RECENT_ACTIVITY_PARAMS).toEqual({
      page: 0,
      pageSize: RECENT_ACTIVITY_SIZE,
      orderBy: 'createdAt',
      order: 'desc',
    });
    expect(RECENT_ACTIVITY_SIZE).toBeLessThanOrEqual(10);
  });
});
