/** Chaves de cache da conta da pessoa logada (autoatendimento em `/users/me`). */
export const accountKeys = {
  all: ['account'] as const,
  profile: ['account', 'profile'] as const,
};
