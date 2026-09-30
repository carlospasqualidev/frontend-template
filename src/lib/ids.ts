import { z } from 'zod';

const uuidSchema = z.uuid();

/**
 * O valor tem o formato dos ids do servidor (uuid, a mesma regra do `idSchema`
 * de `../server-template`)? Para descartar, antes de chamar a API, um id que
 * veio de fora (a URL de um link antigo ou editado à mão): o servidor recusaria
 * a requisição inteira com 400.
 */
export function isUuid(value: string): boolean {
  return uuidSchema.safeParse(value).success;
}
