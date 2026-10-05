# Estrutura de pastas e scripts

Parte do [`CLAUDE.md`](../../CLAUDE.md), movida de lá sem reescrita: o texto é o mesmo, só alguns títulos mudaram de nível. Quando ler: antes de criar pasta ou arquivo novo em `src/`, ou rodar um script que não seja o `npm run check`. Os comandos do dia a dia ficam em **Ambiente**, no `CLAUDE.md`.

## Estrutura de pastas

```
src/
├── assets/              # imagens e estáticos importados
├── components/
│   ├── global/          # abstrações da aplicação (card, modal, empty, skeleton, button, form/, layout/, sidebar/, dataTable/)
│   └── ui/              # primitivos shadcn/ui (gerados via CLI — kebab-case)
├── hooks/               # hooks reutilizáveis (tema, sessão, mobile...)
├── lib/                 # utilidades puras (constants/, dateTime/, env, forms/, getInitials, ids, listQueryParams, masks/, navigation/, permissions, queryClient, utils com cn)
├── screens/             # telas; cada uma com seu routes.ts co-localizado
├── services/            # camada de acesso a dados (api, session...)
├── stories/             # stories do Storybook
├── tests/               # testes Vitest (setup.ts e uma pasta por componente/módulo)
├── types/               # tipos de domínio compartilhados
├── index.css            # tokens de design (cor da marca, dark mode, paleta)
├── routes.tsx           # árvore de rotas raiz
└── main.tsx             # entrypoint (providers globais)
```

## Scripts

| Script                 | O que faz                                               |
| ---------------------- | ------------------------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento (Vite)                      |
| `npm run build`        | Typecheck + build de produção                           |
| `npm run preview`      | Pré-visualiza o build                                   |
| `npm run lint`         | ESLint                                                  |
| `npm run format`       | Prettier (escrita)                                      |
| `npm run format:check` | Prettier (só confere; entra no `check`)                 |
| `npm run typecheck`    | `tsc -b`                                                |
| `npm test`             | Vitest run                                              |
| `npm run test:related` | Vitest só nos testes afetados pelo não commitado        |
| `npm run test:watch`   | Vitest watch                                            |
| `npm run check`        | Lint + format:check + typecheck + test                  |
| `npm run test:e2e`     | E2E (Playwright) contra o `../server-template` no ar    |
| `npm run test:layers`  | Empilhamento (z-index) no navegador, contra o Storybook |
| `npm run clean`        | Remove `dist/` e caches                                 |
