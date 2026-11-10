import { env } from '@/lib/env';

/**
 * Dia do NEGÓCIO: o dia de calendário no fuso do projeto (`VITE_BUSINESS_TIME_ZONE`),
 * não o do relógio do aparelho. Perto da meia-noite os dois diferem: às 23h30 em
 * São Paulo o UTC já virou o dia seguinte. O fuso explícito faz cliente e servidor
 * concordarem mesmo num aparelho com o fuso trocado. `en-CA` formata `aaaa-mm-dd`.
 */

/** Hoje no fuso do negócio, em `aaaa-mm-dd`. */
export function businessToday(
  timeZone: string = env.VITE_BUSINESS_TIME_ZONE
): string {
  return new Date().toLocaleDateString('en-CA', { timeZone });
}

/**
 * Hoje + N dias no fuso do negócio, em `aaaa-mm-dd`. A soma é aritmética de
 * calendário sobre o dia do negócio (`Date.UTC` normaliza virada de mês, de ano
 * e 29/02), sem o deslocamento do fuso do aparelho.
 */
export function businessDatePlusDays(
  days: number,
  timeZone: string = env.VITE_BUSINESS_TIME_ZONE
): string {
  const [year, month, day] = businessToday(timeZone).split('-').map(Number);

  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}
