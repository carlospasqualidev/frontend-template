import { isAxiosError } from 'axios';

/** O servidor recusou por falta de permissão (403). */
export function isForbidden(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 403;
}
