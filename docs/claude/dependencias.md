# Dependências fixadas

Parte do [`CLAUDE.md`](../../CLAUDE.md), movida de lá sem reescrita: o texto é o mesmo, só alguns títulos mudaram de nível. Quando ler: antes de atualizar `@tanstack/*` ou Storybook, ou mexer em `overrides` do `package.json`. A versão curta fica em **Ambiente**, no `CLAUDE.md`.

## Ambiente

- **Pin do router (`overrides` no `package.json`):** `@tanstack/router-core` fica em `1.171.29` e `@tanstack/react-router` em `1.170.35`. A partir do `router-core` 1.171.30 o `interpolatePath` virou posicional, e o `@storybook/tanstack-react` 10.6 ainda o chama com objeto — toda story quebra com `path.endsWith is not a function`. Remova o override quando o Storybook publicar a correção, e confirme com `npm run test:layers`.
  > Verificar: possivelmente desatualizado — o `overrides` do `package.json:91-93` fixa só o `@tanstack/router-core` (1.171.29); o `@tanstack/react-router` 1.170.35 é dependência exata (`package.json:34`), não override.
