import { describe, expect, it } from 'vitest';

import { formatConfigValue } from '@/services/audit/auditMock';

// O `value` de configuração no de→para, como o servidor o formata: pelo tipo da
// chave no mock de configurações; o que não é do tipo sai como gravado.
describe('formatConfigValue', () => {
  it('mostra o booleano como Sim/Não', () => {
    expect(formatConfigValue('notifications.email', 'true')).toBe('Sim');
    expect(formatConfigValue('notifications.email', 'false')).toBe('Não');
  });

  it('mostra o número com vírgula decimal', () => {
    expect(formatConfigValue('audit.anonymizeAfterMonths', '12')).toBe('12');
    expect(formatConfigValue('security.idleTimeoutMinutes', '020')).toBe('20');
  });

  it('mantém como gravado o texto fora do tipo da chave', () => {
    expect(formatConfigValue('notifications.email', '[omitido]')).toBe(
      '[omitido]'
    );
    expect(formatConfigValue('notifications.email', 'sim')).toBe('sim');
    expect(formatConfigValue('audit.deleteAfterMonths', '[omitido]')).toBe(
      '[omitido]'
    );
  });

  it('mantém como gravado o valor de chave fora do catálogo', () => {
    expect(formatConfigValue('app.inexistente', 'true')).toBe('true');
  });

  it('mostra [Vazio] para valor ausente, nulo ou vazio', () => {
    expect(formatConfigValue('notifications.email', undefined)).toBe('[Vazio]');
    expect(formatConfigValue('notifications.email', null)).toBe('[Vazio]');
    expect(formatConfigValue('audit.deleteAfterMonths', '')).toBe('[Vazio]');
  });
});
