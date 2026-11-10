import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';

import { isForbidden } from '@/lib/isForbidden';

function axiosErrorWithStatus(status: number): AxiosError {
  const error = new AxiosError('falha');
  error.response = {
    status,
    data: {},
    statusText: '',
    headers: {},
    config: error.config as never,
  };
  return error;
}

describe('isForbidden', () => {
  it('é verdadeiro para erro do axios com status 403', () => {
    expect(isForbidden(axiosErrorWithStatus(403))).toBe(true);
  });

  it.each([401, 404, 500])('é falso para status %i', (status) => {
    expect(isForbidden(axiosErrorWithStatus(status))).toBe(false);
  });

  it('é falso para erro do axios sem resposta (rede)', () => {
    expect(isForbidden(new AxiosError('Network Error'))).toBe(false);
  });

  it('é falso para valor que não é erro do axios', () => {
    expect(isForbidden(new Error('403'))).toBe(false);
    expect(isForbidden({ response: { status: 403 } })).toBe(false);
    expect(isForbidden(null)).toBe(false);
    expect(isForbidden(undefined)).toBe(false);
  });
});
