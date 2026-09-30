# Frontend Template

Template base para iniciar novos projetos de frontend, com uma stack moderna já
configurada (roteamento type-safe, UI, formulários validados, estado, data
fetching, testes, lint e hooks de commit).

## Stack

| Área          | Ferramenta                                                   |
| ------------- | ------------------------------------------------------------ |
| Build / Dev   | [Vite](https://vite.dev) 7                                   |
| UI            | React 19 + TypeScript                                        |
| Estilo        | Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) (Radix) |
| Roteamento    | [TanStack Router](https://tanstack.com/router) (code-based)  |
| Data fetching | [TanStack Query](https://tanstack.com/query)                 |
| Estado global | [Zustand](https://zustand-demo.pmnd.rs)                      |
| Formulários   | React Hook Form + [Zod](https://zod.dev)                     |
| HTTP          | Axios (instância em `services/api`)                          |
| Notificações  | [Sonner](https://sonner.emilkowal.ski)                       |
| Testes        | Vitest + Testing Library; Playwright (E2E)                   |
| Qualidade     | ESLint + Prettier + Husky + lint-staged                      |

## Requisitos

- Node.js >= 22
- npm

## Começando

```bash
npm install
cp .env.example .env   # ajuste as variáveis
npm run dev
```

O app fala com o backend `../server-template` (suba-o com
`npm run db:up && npm run dev` lá dentro; `VITE_API_URL` aponta para ele): sem
ele no ar, o login não entra. Ver [Modo híbrido](#modo-híbrido).

## Scripts

| Script                    | Descrição                                                       |
| ------------------------- | --------------------------------------------------------------- |
| `npm run dev`             | Servidor de desenvolvimento                                     |
| `npm run build`           | Typecheck + build de produção                                   |
| `npm run preview`         | Pré-visualiza o build                                           |
| `npm run lint`            | ESLint                                                          |
| `npm run format`          | Prettier (escrita)                                              |
| `npm run typecheck`       | Checagem de tipos (`tsc -b`)                                    |
| `npm test`                | Executa a suíte de testes uma vez                               |
| `npm run test:watch`      | Testes em modo watch                                            |
| `npm run check`           | Roda `lint + typecheck + test` em sequência                     |
| `npm run test:e2e`        | E2E contra o `../server-template` no ar (ver [E2E](#e2e))       |
| `npm run test:layers`     | Empilhamento (z-index) contra o Storybook, sem backend          |
| `npm run storybook`       | Storybook em modo dev (porta 6006)                              |
| `npm run build-storybook` | Build estático do Storybook em `storybook-static/`              |
| `npm run clean`           | Limpa `dist/` e caches (`node_modules/.tmp`, `.vite`, `.cache`) |

## Convenções de repositório

- [`.editorconfig`](.editorconfig) padroniza encoding/EOL/indent entre editores.
- [`.gitattributes`](.gitattributes) força `eol=lf` em arquivos de texto — sem isso, clonar no Windows gera diffs de CRLF↔LF a cada PR.
- Husky tem dois hooks:
  - `pre-commit` (existente): roda `lint-staged` (ESLint + Prettier no que foi staged).
  - `pre-push` (novo): roda `npm run typecheck && npm test`. Erro de tipo ou teste quebrado para o push antes do servidor.
- Antes de pushar manualmente: `npm run check` (lint + typecheck + test).
- CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) roda em **Node 22**.

## Variáveis de ambiente

As variáveis são validadas na inicialização em [`src/lib/env.ts`](src/lib/env.ts).
Se algo estiver ausente ou malformado, o app falha rápido com mensagem clara.
Ao adicionar uma env, declare-a no schema **e** em [`.env.example`](.env.example).

| Variável                   | Obrigatória | Descrição                                 |
| -------------------------- | ----------- | ----------------------------------------- |
| `VITE_API_URL`             | sim         | URL base da API                           |
| `VITE_PROJECT_NAME`        | não         | Nome do projeto (logs de erro)            |
| `VITE_PROJECT_ENVIRONMENT` | não         | Ambiente lógico (ex.: Sandbox/Production) |
| `VITE_PROJECT_SIDE`        | não         | Lado da app (ex.: Client/Backoffice)      |
| `VITE_ERROR_LOG_URL`       | não         | Endpoint de reporte de erros (só em PROD) |

## Modo híbrido

Tela com rota no backend fala só com ele, sem modo fictício: a sessão (login,
cadastro, logout e validação, com as permissões efetivas e o tempo de
inatividade), as configurações do sistema, a trilha de auditoria e o upload. Os
E2E dessas telas rodam contra o server real (ver [E2E](#e2e)).

Continuam com dados de demonstração as telas ainda não ligadas: lista e
detalhe de usuários, Minha conta e a home. Parte delas não tem rota no backend
(sessões ativas, notificações por usuário, cobrança, métricas do painel). A aba
"Atividade" do usuário já lê a trilha do backend, mas os usuários de
demonstração não existem lá, então a linha do tempo aparece vazia até a lista
de usuários ser ligada.

A suíte de unidade (`npm test`) e o Storybook não precisam do backend.

## Estrutura de pastas

```
src/
├── assets/             # imagens e estáticos importados
├── components/
│   ├── global/         # abstrações da aplicação (card, modal, empty, skeleton, button, confirmDialog, form/, layout/, sidebar/, dataTable/)
│   └── ui/             # primitivos shadcn/ui (gerados via CLI)
├── hooks/              # hooks reutilizáveis (tema, sessão, mobile...)
├── lib/                # utilidades puras (env, datas, forms, queryClient, cn)
├── screens/            # telas, cada uma com seu `routes.ts` co-localizado
├── services/           # camada de acesso a dados (api, session...)
├── types/              # tipos compartilhados de domínio
├── index.css           # tokens de design (cor da marca, dark mode, paleta)
├── routes.tsx          # árvore de rotas raiz
└── main.tsx            # entrypoint (providers globais)
```

### Convenções

- Imports internos usam o alias `@/` (ex.: `@/components/ui/button`).
- Componentes do shadcn em `components/ui` mantêm o padrão `kebab-case`.
- Código próprio usa `camelCase` para arquivos `.ts`/`.tsx`.
- Cada tela em `screens/` expõe suas rotas em um `routes.ts` próprio, montado em
  `src/routes.tsx`.

## Padrões

### Componentes globais (`components/global/`)

Wrappers sobre primitivos do shadcn que padronizam API, defaults visuais (incluindo dark mode) e integração com `react-hook-form`. Prefira estes antes de cair direto no `components/ui/`:

| Abstração          | Caminho                                                                                               | Uso                                                                                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Card`             | [`global/card/card.tsx`](src/components/global/card/card.tsx)                                         | Container com `title` + `description` + `children`. Dark mode resolvido.                                                                                                |
| `Modal`            | [`global/modal/modal.tsx`](src/components/global/modal/modal.tsx)                                     | Dialog no desktop, drawer no mobile. Controlado por `open`/`setOpen`.                                                                                                   |
| `Empty`            | [`global/empty/empty.tsx`](src/components/global/empty/empty.tsx)                                     | Empty state com ícone opcional e CTA via `children`.                                                                                                                    |
| `Skeleton*`        | [`global/skeleton/skeleton.tsx`](src/components/global/skeleton/skeleton.tsx)                         | `SkeletonText`, `SkeletonValue`, `SkeletonBadge`, `SkeletonAvatar`. Skeleton **só no dado**, não no card inteiro.                                                       |
| `Button`           | [`global/button/button.tsx`](src/components/global/button/button.tsx)                                 | Estende o Button do shadcn com prop `loading` (spinner + disable automático).                                                                                           |
| `ConfirmDialog`    | [`global/confirmDialog/confirmDialog.tsx`](src/components/global/confirmDialog/confirmDialog.tsx)     | Confirmação para ações destrutivas/reversíveis. Uncontrolled (`trigger`) ou controlled (`open`/`setOpen`). Loading interno + auto-close.                                |
| `PageHeader`       | [`global/pageHeader/pageHeader.tsx`](src/components/global/pageHeader/pageHeader.tsx)                 | Cabeçalho padrão de tela: título, descrição e área opcional de ações. Usado em `home/`.                                                                                 |
| `ErrorFallback`    | [`global/errorFallback/index.tsx`](src/components/global/errorFallback/index.tsx)                     | Fallback do `react-error-boundary` no topo do app. CTA para tentar restabelecer a sessão.                                                                               |
| `Layout` + sidebar | [`global/layout/`](src/components/global/layout) + [`global/sidebar/`](src/components/global/sidebar) | Shell autenticado: `SidebarProvider` + `AppSidebar` + header com `SidebarTrigger`, breadcrumb e `Outlet`.                                                               |
| Form fields        | [`global/form/`](src/components/global/form)                                                          | `InputField`, `Select`, `MultiSelect`, `Checkbox`, `Switch`, `TextArea`, `DateField`, `DateTimeField`, `FieldGroup`. Uncontrolled ou controlled via `control` + `name`. |
| `DataTable`        | [`global/dataTable/`](src/components/global/dataTable)                                                | Tabela server-side com filtros declarativos, ordenação, paginação. Estado em memória (`useDataTableQuery`) ou na URL (`useDataTableUrlQuery`).                          |

Veja todas em ação no Storybook (`npm run storybook`, porta 6006). Cada componente tem uma vitrine mostrando suas variações.

### Adicionar um componente shadcn/ui

```bash
npx shadcn@latest add button
```

Customize localmente quando precisar. Se criar um wrapper genérico em `components/global/`, siga o padrão: pasta `global/<nome>/<nome>.tsx`, interface prefixada com `I`, primitivo importado como `XPrimitive`.

### Nova tela + rota

1. Crie `src/screens/minha-tela/index.tsx` exportando o componente.
2. Crie `src/screens/minha-tela/routes.ts` com `createRoute`, usando
   `lazyRouteComponent` para code-splitting:

   ```ts
   import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
   import { protectedLayoutRoute } from '@/routes';

   export const minhaTelaRoute = createRoute({
     getParentRoute: () => protectedLayoutRoute,
     path: '/minha-tela',
     staticData: { breadcrumb: 'Minha tela' },
     component: lazyRouteComponent(() => import('.'), 'MinhaTela'),
   });
   ```

3. Registre a rota na árvore em `src/routes.tsx`.

### Formulários

Use o hook tipado `useZodForm` ([`src/lib/forms/useZodForm.ts`](src/lib/forms/useZodForm.ts)),
que integra React Hook Form com um schema Zod.

Componentes de campo prontos em [`src/components/global/form/`](src/components/global/form):
`inputField`, `select`, `dateField`, `dateTimeField`, `checkbox`, `switch`, `textArea`, `multiSelect`.

Todos aceitam dois modos via discriminated union:

- **Uncontrolled**: espalhe `register('campo')` + passe `errors`.
- **Controlled**: passe `control` + `name` (+ opcional `rules`/`defaultValue`).

Veja [`src/screens/session/login.tsx`](src/screens/session/login.tsx) e a story
`Formulário/Formulário completo` no Storybook como referência.

### Confirmações de ação

Para ações destrutivas (delete) ou irreversíveis (publicar, arquivar), use o `ConfirmDialog` global. O modo **uncontrolled** dispensa `useState` no consumidor — o estado de abertura é gerenciado internamente:

```tsx
import { ConfirmDialog } from '@/components/global/confirmDialog/confirmDialog';
import { Button } from '@/components/global/button/button';

<ConfirmDialog
  title="Excluir registro?"
  description="Esta ação não pode ser desfeita."
  confirmLabel="Excluir"
  destructive
  trigger={<Button variant="destructive">Excluir</Button>}
  onConfirm={async () => {
    await api.delete(`/records/${id}`);
    toast.success('Registro excluído.');
  }}
/>;
```

O componente:

- Abre quando o `trigger` é clicado
- Mantém o dialog aberto enquanto `onConfirm` resolve (botão de confirmação com spinner)
- Fecha automaticamente em sucesso; permanece aberto se `onConfirm` lançar
- Para abrir programaticamente (atalho de teclado, evento externo), use o modo controlled passando `open` + `setOpen` em vez de `trigger`

### Cor da marca e tema

A cor primária do sistema vive em **uma única variável** no topo de [`src/index.css`](src/index.css):

```css
:root {
  --brand: oklch(0.488 0.243 264.376); /* azul atual */
  --brand-foreground: oklch(0.97 0.014 254.604);
}
.dark {
  --brand: oklch(0.424 0.199 265.638); /* mesma marca, tonada */
}
```

`--primary` e `--sidebar-primary` são aliases (`var(--brand)`) — pra trocar a marca em um novo projeto, mude apenas `--brand` (light + dark) e tudo se sincroniza via cascade. Tokens neutros (background, border, muted...) e a paleta de gráficos (`--chart-1..5`) ficam intocados.

### Requisições

Use a instância `api` ([`src/services/api`](src/services/api)) — ela já trata
`baseURL`, cookies (`withCredentials`) e toasts de sucesso/erro via interceptors.
Para dados de servidor, prefira TanStack Query (`useQuery`/`useMutation`) com o
`queryClient` de [`src/lib/queryClient.ts`](src/lib/queryClient.ts).

### Autenticação

A sessão é baseada em cookie. `SessionValidation` valida a sessão antes de
renderizar as rotas protegidas; o usuário fica em `useSessionStore` (Zustand).
O login, o cadastro e a validação são do backend `../server-template`, com
cookie HTTP-only — ver [Modo híbrido](#modo-híbrido).

## Testes

Vitest + Testing Library, ambiente `jsdom`. Arquivos `*.test.ts(x)` em
[`src/tests/`](src/tests), uma pasta por módulo. Setup global em
[`src/tests/setup.ts`](src/tests/setup.ts).

As abstrações globais (`Button`, `Card`, `Empty`, `ConfirmDialog`, `Modal`,
`Switch`, `TextArea`, `InputField`), o `useDataTableQuery`, o
`validateDataTableSearch` e os utilitários puros (`cn`, `useTheme`, helpers
de data e transforms ISO ↔ display) vêm com testes que documentam o
comportamento esperado — use-os como ponto de partida ao estender.

```bash
npm test           # roda uma vez
npm run test:watch # modo watch
```

### E2E

Playwright, com os specs em [`e2e/`](e2e), numa suíte só: `npm run test:e2e`,
contra o `../server-template` real. Cobre login e login recusado, sessão ao
recarregar (cookie HTTP-only) e logout, menu por permissão, tempo de
inatividade vindo da configuração da empresa, configurações (gravação em lote,
campo marcado quando o server recusa o valor, recusa da regra entre os prazos) e
a trilha de auditoria (lista, busca, filtros por módulo e por usuário,
paginação, detalhe). As telas que ainda usam dados de demonstração (usuários,
Minha conta, home) rodam com a sessão real do admin. O empilhamento
(`npm run test:layers`) roda contra o Storybook, sem backend.

Suba o server antes, na pasta dele:

```bash
cd ../server-template
npm run db:up      # Postgres do docker compose
npm run db:deploy  # migrations
npm run db:seed    # admin@admin.com e blocked@admin.com, senha 123123123
npm run dev        # http://localhost:8080
```

Depois, na raiz deste frontend:

```bash
npm run test:e2e
```

- O Vite sobe sozinho na porta **4173**, que já está no `CORS_ORIGINS` padrão
  do server, e aponta para `VITE_API_URL` do ambiente (padrão
  `http://localhost:8080/api`). Server em outra porta:
  `VITE_API_URL=http://localhost:<porta>/api npm run test:e2e`. Vite em outra
  porta: `E2E_PORT=<porta>` aqui e `CORS_ORIGINS` com
  `http://localhost:<porta>` ao subir o server.
- Se a porta já tiver um servidor, ele é reaproveitado só se for o Vite deste
  frontend apontando para a mesma `VITE_API_URL`; outro app na porta (mesmo com
  o mesmo título) ou o `vite preview` deste frontend (que usa a mesma 4173)
  para a suíte antes dos specs, com a mensagem.
- Antes dos specs, o `globalSetup` confere a porta, `GET /health/ready` e o
  login do admin do seed; se faltar algo, para com a instrução.
- Os specs criam o que precisam pela API (usuários e cargo com nome de sufixo
  único, configurações da empresa) e desfazem no fim: rodam quantas vezes for
  preciso contra o mesmo banco de desenvolvimento.
- O server aceita 10 logins por minuto por IP, e a suíte usa 8: o do admin no
  `globalSetup` e 7 pela tela (os dois chegam ao server por `127.0.0.1` e
  dividem o contador); os demais specs entram com a sessão do admin, sem login.
  O `globalSetup` lê o limite na resposta do login do admin; se sobrarem menos
  de 7, ou se o login vier recusado (429), ele espera a janela reiniciar (até 1
  minuto, com o tempo no log) e segue. Se o 429 continuar depois da espera, ele
  para com a mensagem de que outro cliente no mesmo IP está gastando o limite (a
  tela de login aberta, outra suíte): pare esse cliente e rode de novo. Rodar de
  novo logo em seguida funciona, só demora mais.
