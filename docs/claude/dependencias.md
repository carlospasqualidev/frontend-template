# Dependências fixadas

Parte do [`CLAUDE.md`](../../CLAUDE.md), movida de lá sem reescrita: o texto é o mesmo, só alguns títulos mudaram de nível. Quando ler: antes de atualizar `@tanstack/*` ou Storybook, ou mexer em `overrides` do `package.json`. A versão curta fica em **Ambiente**, no `CLAUDE.md`.

## Ambiente

- **Pin do router:** `@tanstack/router-core` fica em `1.171.29` (via `overrides` no `package.json`) e `@tanstack/react-router` em `1.170.35` (versão exata em `dependencies`). A partir do `router-core` 1.171.30 o `interpolatePath` virou posicional, e o `@storybook/tanstack-react` 10.6 ainda o chama com objeto — toda story quebra com `path.endsWith is not a function`. Remova o override quando o Storybook publicar a correção, e confirme com `npm run test:layers`.
