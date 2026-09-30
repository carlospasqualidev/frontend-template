import {
  type CatalogGroup,
  type CatalogModule,
  type CatalogPermission,
} from '@/services/roles/roleDetailApi';

/*
 * Regras da árvore de permissões do formulário de cargo, espelhando o servidor
 * (`POST`/`PUT /client/roles`), que continua sendo a autoridade:
 *
 * - qualquer ação diferente de `read` num grupo inclui, ao salvar, o `read` do
 *   mesmo grupo. A tela marca o `read` junto e o trava enquanto houver uma
 *   escrita do grupo marcada;
 * - ninguém acrescenta a um cargo uma permissão que não tem (403). Manter ou
 *   retirar as que o cargo já tem é permitido.
 */

/** Escrita = qualquer ação que não seja `read` (a regra da expansão). */
export function isWritePermission(permission: CatalogPermission): boolean {
  return permission.action !== 'read';
}

function findGroupRead(group: CatalogGroup): CatalogPermission | undefined {
  return group.permissions.find((permission) => permission.action === 'read');
}

/**
 * Os ids numa ordem só (sem repetidos), para o formulário comparar conjuntos:
 * marcar e desmarcar a mesma permissão volta ao valor de partida, sem deixar
 * o formulário com alteração pendente.
 */
export function normalizeIds(ids: Iterable<string>): string[] {
  return [...new Set(ids)].sort((first, second) => first.localeCompare(second));
}

/**
 * Marca ou desmarca uma permissão do grupo. Marcar uma escrita marca também o
 * `read` do grupo, como o servidor faria ao salvar.
 */
export function togglePermission(
  selected: readonly string[],
  group: CatalogGroup,
  permission: CatalogPermission,
  checked: boolean
): string[] {
  const next = new Set(selected);

  if (checked) {
    next.add(permission.id);
    const read = findGroupRead(group);
    if (read && isWritePermission(permission)) next.add(read.id);
  } else {
    next.delete(permission.id);
  }

  return normalizeIds(next);
}

/**
 * O `read` do grupo fica marcado e travado enquanto alguma escrita do grupo
 * estiver marcada: o servidor o incluiria de qualquer jeito.
 */
export function isLockedRead(
  permission: CatalogPermission,
  group: CatalogGroup,
  selected: ReadonlySet<string>
): boolean {
  return (
    !isWritePermission(permission) &&
    group.permissions.some(
      (other) => isWritePermission(other) && selected.has(other.id)
    )
  );
}

/**
 * Quem edita pode dar esta permissão ao cargo: ele a tem (`authorPermissions`,
 * os nomes da sessão), ou o cargo gravado já a tem (`savedPermissionIds`),
 * e então manter ou retirar é permitido.
 */
export function canGrantPermission(
  permission: CatalogPermission,
  authorPermissions: ReadonlySet<string>,
  savedPermissionIds: ReadonlySet<string>
): boolean {
  return (
    authorPermissions.has(permission.name) ||
    savedPermissionIds.has(permission.id)
  );
}

/** Quantas permissões do módulo estão marcadas, e quantas ele tem. */
export function countModulePermissions(
  module: CatalogModule,
  selected: ReadonlySet<string>
): { checked: number; total: number } {
  const permissions = module.groups.flatMap((group) => group.permissions);
  return {
    checked: permissions.filter((permission) => selected.has(permission.id))
      .length,
    total: permissions.length,
  };
}
