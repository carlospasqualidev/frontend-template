# CLAUDE.md

Guia para o Claude trabalhar neste frontend. Este arquivo traz as regras gerais, que valem para toda tarefa, e os guias de `docs/` (ver **Guias de referência**) trazem as de cada área; juntos, são a fonte de verdade para convenções e comportamento esperado — leia o [`README.md`](README.md) para detalhes de stack, scripts e estrutura de pastas.

> O diretório irmão `server-template/` é o template de backend que atende este frontend (Fastify + Prisma + Zod; sobe com `pnpm run db:up && pnpm run dev` lá dentro, em `http://localhost:8080`). Não é o foco do trabalho — não otimize, refatore ou estenda essa API sem pedido explícito. O contrato HTTP dele está em `../server-template/docs/openapi.json` (ver **Contrato com o backend** em [`docs/conventions/http-and-state.md`](docs/conventions/http-and-state.md)).

---

## Stack

React 19 + Vite 8 + TypeScript • TanStack Router (code-based) + TanStack Query • Zustand • React Hook Form + Zod • Tailwind v4 + shadcn/ui (Radix) • Axios • Sonner • Vitest + Testing Library • Playwright • Storybook • ESLint + Prettier + Husky + lint-staged.

Sessão por cookie HTTP-only (gravado e validado pelo template de backend em `../server-template`).

## Comportamento esperado

Aja como engenheiro sênior responsável por qualidade e manutenibilidade de longo prazo.

Antes de escrever código:

- Leia o código existente ao redor do arquivo que você vai mexer.
- Identifique padrões, arquitetura e convenções já adotadas.
- Prefira consistência com o código atual a introduzir padrões novos.
- Avalie efeitos colaterais e impacto em outras partes do sistema.

Prioridade ao decidir: **correctness → readability → maintainability → consistency → performance** (performance só quando relevante).

Evite complexidade desnecessária, over-engineering e soluções que desviem da arquitetura atual.

### Estratégia de decisão (quando há múltiplas soluções)

1. A solução correta mais simples
2. A mais legível
3. A mais consistente com o codebase
4. Razoável em performance e escalabilidade

Se uma mudança ameaça introduzir instabilidade, inconsistência ou complexidade desnecessária, prefira a versão mais simples e segura.

### Inspirações de design e organização

Para decisões de UX, layout ou organização de tela, siga esta ordem:

1. **Procure primeiro no próprio projeto.** Antes de inventar, varra `src/screens/`, `src/components/global/` e o Storybook (`pnpm run storybook`) atrás de algo equivalente. Replique pasta, abstração e cadência visual que já existem (`PageActions`, `Card`, `Tabs` variant `line`, `DataTable`, organização em pastas por aba). Padronização interna **sempre** vence preferência individual — uma tela nova deve parecer parte do sistema, não um experimento isolado.
2. **Quando não houver referência interna, inspire-se em sistemas consolidados** (GitHub, Linear, Vercel Dashboard, Stripe Dashboard, Notion). Use-os para preencher lacunas — _como_ eles organizam abas de settings, _onde_ eles colocam ações primárias, _como_ eles paginam. Adapte para as abstrações deste projeto; não copie estrutura paralela ("trouxe um header novo do GitHub" em vez de usar `PageActions` é regressão de padronização).
3. **Se a decisão vai virar padrão para outras telas, documente.** Quando você introduz uma nova convenção que se repetirá (ex.: slot global de `PageActions`, organização em pasta por aba), registre brevemente onde manda **Onde registrar convenção nova** para que a próxima sessão (humana ou Claude) já chegue alinhada.

Resumo: **consistência interna > inspiração externa > improvisar do zero.**

## Pronto e limites

O que torna uma tarefa pronta (loop por tarefa, fechamento da entrega, como reportar, documentação acompanhando a mudança) está em [`docs/definition-of-done.md`](docs/definition-of-done.md); o que nenhum agente faz sem aval, em [`docs/guardrails.md`](docs/guardrails.md).

## Guias de referência

As regras que valem para toda tarefa ficam neste arquivo. As de cada área vivem nos guias abaixo, lidos sob demanda (não importe com `@`: o guia entra quando a tarefa chega na área dele).

| Arquivo                                                                            | Quando ler                                                                                                     |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`docs/definition-of-done.md`](docs/definition-of-done.md)                         | Ao começar e ao fechar qualquer tarefa, e antes de reportar                                                    |
| [`docs/guardrails.md`](docs/guardrails.md)                                         | Antes de push, commit, mexer em config, desligar teste ou lint, ou apontar o e2e para outro server             |
| [`docs/testing-guide.md`](docs/testing-guide.md)                                   | Antes de escrever ou mudar teste Vitest ou spec Playwright, e antes de rodar o e2e                             |
| [`docs/conventions/routes-and-screens.md`](docs/conventions/routes-and-screens.md) | Antes de criar tela, rota, link, item de menu ou sub-tela                                                      |
| [`docs/conventions/screen-layout.md`](docs/conventions/screen-layout.md)           | Antes de pôr botão, ação de tela (`PageActions`), tela de detalhe/edição ou ação de item                       |
| [`docs/conventions/http-and-state.md`](docs/conventions/http-and-state.md)         | Antes de chamar API, mexer em `queryKey`/`useQuery`/`useMutation`, sessão, permissões, estado global ou env    |
| [`docs/conventions/forms.md`](docs/conventions/forms.md)                           | Antes de criar ou mudar formulário, campo, máscara ou schema Zod                                               |
| [`docs/conventions/components.md`](docs/conventions/components.md)                 | Antes de usar ou criar componente global ou shadcn, modal, card, popover/z-index, toast, demonstração ou story |
| [`docs/conventions/theme.md`](docs/conventions/theme.md)                           | Antes de mexer em cor, tema claro/escuro, gráfico, badge ou tipografia                                         |
| [`docs/conventions/filters-and-tables.md`](docs/conventions/filters-and-tables.md) | Antes de criar listagem, filtro, cabeçalho de tela com filtros ou `DataTable`                                  |
| [`docs/dates.md`](docs/dates.md)                                                   | Antes de exibir, preencher, gravar ou filtrar data                                                             |
| [`docs/claude/ui.md`](docs/claude/ui.md)                                           | Antes de escrever JSX, skeleton, carregamento, texto com acento, tabela larga, foco, ícone ou modal            |
| [`docs/claude/erros-e-seguranca.md`](docs/claude/erros-e-seguranca.md)             | Ao indexar por variável, logar/reportar erro, pôr dado na URL ou filtro, ou PII em toast, mock, story ou form  |
| [`docs/claude/dependencias.md`](docs/claude/dependencias.md)                       | Antes de atualizar `@tanstack/*` ou Storybook, ou mexer em `overrides` do `package.json`                       |
| [`docs/claude/estrutura-e-scripts.md`](docs/claude/estrutura-e-scripts.md)         | Antes de criar pasta ou arquivo novo em `src/`, ou rodar um script que não seja o `pnpm run check`             |

## Linguagem de código

- Todo código-fonte em **inglês**.
- `camelCase` para variáveis, funções e arquivos `.ts`/`.tsx` próprios.
- `kebab-case` apenas em `components/ui/` (padrão shadcn).
- Nomes claros e que revelem intenção. Sem abreviações desnecessárias.
  - Prefira: `calculateInventoryBalance`, `createUserSession`, `validatePhoneNumber`
  - Evite: `data`, `info`, `handleThing`, `processStuff`
- Código auto-documentado é melhor que comentário. Não escreva comentário que apenas reafirma o que o código já diz.

## TypeScript

- **Evite `any`.** Use tipos explícitos ou genéricos.
- Use `interface` para shapes de objeto que podem ser estendidos; `type` para uniões, interseções e aliases.
- Inferência só quando o tipo é óbvio pela atribuição.
- Marque return type explicitamente em funções públicas/exportadas.
- Use `unknown` quando o tipo é genuinamente desconhecido — restrinja antes de usar.
- Mantenha o `tsconfig` em `strict`. Não relaxe flags (`strictNullChecks`, `noImplicitAny`…) para "fazer compilar" — conserte o tipo.

## Qualidade de código

- Implementações simples e explícitas.
- Sem abstrações prematuras. Três linhas parecidas é melhor que uma abstração precoce.
- Funções pequenas, com responsabilidade única.
- Composição > herança complexa.
- Remova código redundante/não-usado **apenas dentro do escopo da mudança atual**.
- Sem error handling, fallbacks ou validação para cenários que não podem acontecer. Confie em código interno e garantias do framework. Valide apenas em fronteiras (input do usuário, respostas de API).

### Refatoração

- Não quebre comportamento existente.
- Refatoração incremental e segura > grandes rewrites.
- Mantenha interfaces, APIs e contratos quando possível.
- Limite o escopo da refatoração ao que se relaciona com a tarefa atual.

## JSX e markup — menos é mais

Você tende a empilhar `<div>` e classes Tailwind a mais. **Pare**. Cada elemento e cada classe precisa pagar pelo seu lugar. JSX limpo é fundamental — quem lê depois (humano ou Claude) entende a intenção pelo formato, não escava entre wrappers.

### Antes de adicionar uma `<div>`, pergunte

1. Existe pra layout real (flex/grid/spacing)? Mantenha.
2. Tem semântica de página (`<section>`, `<article>`, `<header>`, `<footer>`, `<nav>`, `<aside>`, `<main>`)? Use o elemento certo, não div.
3. Existe só pra agrupar JSX? Troque por **Fragment** (`<>...</>`).
4. Existe só pra aplicar uma classe num filho? Passe a classe pro filho direto.

Se a resposta não é #1 ou #2, a div não deveria estar lá.

Regras de JSX e Tailwind: reuse abstrações globais, não empilhe wrappers de layout, sem classe Tailwind redundante, prefira a escala do Tailwind à notação em `px` (bracket só para valor fora da escala), prefira styling no elemento certo e não comente o que o JSX já diz — exemplo e detalhe em `docs/claude/ui.md`.

## Error handling

- Trate erros de forma explícita e previsível. Sem falhas silenciosas.
- `try/catch` em operações que podem lançar (I/O, rede, parsing).
- Log com nível apropriado: `warn` para esperado/recuperável, `error` para falha inesperada.
- **Nunca** exponha stack trace ou detalhes técnicos ao usuário final — use toast/mensagens amigáveis em pt-BR.
- Os interceptors do `api` ([`src/services/api`](src/services/api)) já exibem toasts de erro. Não duplique no chamador a menos que o caso exija tratamento específico.
- Sem `catch` vazio que engole erro.
- **Erros de render e de carregamento de uma tela** são capturados pelo roteador, não por `try/catch`: a tela de erro do projeto ([`ErrorFallback`](src/components/global/errorFallback/index.tsx), pelo adaptador [`RouteErrorFallback`](src/components/global/errorFallback/routeErrorFallback.tsx), com report via `sendErrorMessage`) aparece no lugar do conteúdo nas telas do layout protegido e em tela cheia nas rotas públicas (ver **Tela de erro por rota** em [`docs/conventions/routes-and-screens.md`](docs/conventions/routes-and-screens.md)). O `ErrorBoundary` do [`App.tsx`](src/App.tsx) continua como última linha, para o que falha fora do roteador. Não embrulhe render em `try/catch` esperando pegar erro de componente.

## Segurança

- Valide todo input do usuário com Zod no formulário **antes** de enviar à API.
- Nunca confie em dado vindo do servidor sem tipá-lo — defina o shape esperado.
- Não logue dados sensíveis (senhas, tokens, dados pessoais) — nem em `console.log` durante desenvolvimento.
- Não armazene tokens em `localStorage`/`sessionStorage` — a sessão é por cookie HTTP-only.
- **Permissão só ajusta a UI:** `hasPermission` serve **apenas para ajustar a UI** (esconder item de menu, botão ou coluna de ação); o backend continua sendo a autoridade — nunca trate o gate de UI como segurança — detalhe em `docs/conventions/http-and-state.md`.

### Object injection — nunca indexe objeto/array com variável

**Regra dura:** nunca indexe objeto ou array com variável nem silencie `security/detect-object-injection` com `eslint-disable`; lookup por chave → `Map`/`switch`, iteração → métodos de array (`for...of`, `.map`, `.find`, `.at(i)`), chave de fonte externa (query string, body, params) → `z.enum([...])` antes de qualquer acesso — detalhe em `docs/claude/erros-e-seguranca.md`.

### LGPD e dados pessoais (PII)

PII (identificadores pessoais como nome completo e CPF, contato, credenciais e sessão, financeiro e dados sensíveis) é **proibido logar** em qualquer canal: console, Sentry/breadcrumb, analytics, query string da URL, body de erro exibido ao usuário, payload de toast. Nenhuma PII na URL: no caminho, só ID opaco; na query, a única PII admitida é o termo de busca (`search`), e nenhum outro dado pessoal vai como filtro nomeado. O reporte de erro (`sendErrorMessage`) leva do usuário só o `userId` e, do endereço, só o `pathname` — nunca nome, e-mail, o objeto `user` inteiro, a query nem o hash. Dado de mock e de Storybook é fictício — detalhe em `docs/claude/erros-e-seguranca.md`.

## Performance

- Code-splitting por rota já está em uso (`lazyRouteComponent`) — mantenha o padrão.
- TanStack Query: configure `staleTime` em queries que não precisam refazer a cada navegação. Não use `useEffect` + `fetch`.
- Liste só o necessário: para tabelas grandes, use paginação server-side via [`useDataTableQuery`](src/components/global/dataTable/useDataTableQuery.ts).
- **Não passe objeto/função inline** como prop para componente memoizado (linha de tabela, item de lista, célula custom) — recria a referência a cada render e mata a memoização. Handlers em `useCallback` estáveis, `options`/`columns` em `useMemo`.
- Memoize (`useMemo`/`useCallback`) apenas com benefício mensurável — não por reflexo.

## Git e commits

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
- Um commit, uma mudança lógica.
- Mensagens em inglês, modo imperativo: `add user session validation` (não `added`/`adding`).
- PRs pequenos e revisáveis. Se não dá para revisar em 30 min, está grande demais.
- Husky + lint-staged rodam no `pre-commit` `eslint --fix` em ts/tsx/js/jsx e Prettier em json/css/md (o Prettier de ts/tsx fica no `format:check`). O `pre-push` roda `typecheck + test`. Não pule hooks (`--no-verify`) — se um teste/typecheck quebra, conserte; não bypasse.
- Antes de empurrar manualmente, rode `pnpm run check` (lint + format:check + typecheck + test).

## Texto de interface (UI)

Todo texto exposto ao usuário em **português brasileiro (pt-BR)**.

- Gramática e acentuação corretas.
- Linguagem clara, objetiva e profissional.
- Evite jargão técnico para usuários operacionais.
  - Correto: `Falha ao salvar o registro. Tente novamente.`
  - Evite: `Unexpected persistence layer failure.`
- **Nunca exponha referência interna ao usuário**: número de card/demanda, hash/código de merge, nome de branch, jargão de implementação. Não entra em label, placeholder, mensagem, toast nem em texto vindo do backend renderizado na tela. Se aparecer numa descrição/label (inclusive dado de seed), é bug — corrija na origem.

### Dado derivado, rótulos e mensagens vêm do backend

**Regra de negócio não vive no frontend.** Cálculos, validações de estado, rótulos pt-BR e mensagens derivadas de regra vêm **prontos do backend**; a tela só renderiza. Se você se pegar reimplementando uma regra no client (recomputar totais, decidir um estado, traduzir um enum, montar uma mensagem derivada), pare: o backend deveria estar entregando pronto. Isso mantém uma única fonte de verdade e evita que duas telas divirjam ao reimplementar a mesma regra.

**Corolário — nome de arquivo de download também.** Quando a API serve um arquivo (relatório, PDF, planilha), o nome vem no `Content-Disposition` da resposta, não chumbado na tela: use [`downloadFile`](src/services/api/download.ts), que lê o header (`filename*` RFC 5987 com acento + fallback ASCII) e cai num nome padrão só se ele não vier. Nome montado no client perde o contexto que o servidor colocou nele e passa a divergir do arquivo real.

### Acentuação e codificação (evitar mojibake)

Todo texto pt-BR com acentuação correta (sem acento é erro, não estilo) e arquivo salvo em UTF-8 sem BOM. Mojibake é zero-tolerância: conserte re-salvando o arquivo em UTF-8, nunca trocando o texto por versão sem acento. No PowerShell, nunca redirecione texto pt-BR com `>` ou `Out-File` sem `-Encoding utf8` — detalhe em `docs/claude/ui.md`.

## Acessibilidade (a11y)

Mínimo para uma tela nova não degradar: nunca remova o `focus-visible:ring`; toda input precisa de label associada (`placeholder` não é label); botão só com ícone passa `tooltip` em pt-BR ao [`Button`](src/components/global/button/button.tsx) global, que vira `aria-label` e tooltip, nunca só um dos dois (com `asChild`, o `Tooltip` é montado na tela e o `aria-label` vai no botão); contraste mínimo de 4.5:1 para texto sobre fundo; estado e significado nunca só pela cor; em `ConfirmDialog` destrutivo, o foco fica no botão de cancelar — detalhe em `docs/claude/ui.md`.

## Design responsivo

**Não esconda colunas, células ou qualquer conteúdo em mobile** (nada de `hidden`, `md:hidden` ou `md:table-cell` por breakpoint): o que não cabe ganha scroll lateral (`overflow-x-auto`) no container — detalhe em `docs/claude/ui.md`.

## Loading e estados intermediários

Nada de spinner gigante nem skeleton genérico no lugar da tela: monte a estrutura final primeiro e troque só o dado que muda por skeleton; tudo que não muda entre vazio e preenchido (cabeçalho, rótulos, ações, filtros, navegação) continua visível e interativo. Exceção: tela cheia com indicador grande só quando ainda não existe shell para mostrar, como a `SessionValidationScreen` no boot da app. Skeleton novo vai em arquivo próprio, com story e teste — detalhe em `docs/claude/ui.md`.

## Imports

- Use o alias `@/` para imports internos (ex.: `@/components/ui/button`, `@/lib/utils`).
- Não use caminhos relativos longos (`../../../`) — troque por `@/`.

## Ambiente

- Windows (PowerShell). Em comandos shell use sintaxe PS (`$env:VAR`, `$null`, sem `&&` em PS 5.1).
- Node >= 22 (versão fixa do template; CI roda em Node 22).
- `npm` (lockfile `package-lock.json`).
- Comandos do dia a dia: `pnpm run dev`: Servidor de desenvolvimento (Vite); `pnpm test`: Vitest run; `pnpm run test:related`: Vitest só nos testes afetados pelo não commitado; `pnpm run test:e2e`: E2E (Playwright) contra o `../server-template` no ar; `pnpm run lint`: ESLint; `pnpm run typecheck`: `tsc -b`; `pnpm run build`: Typecheck + build de produção; `pnpm run check`: Lint + format:check + typecheck + test — detalhe em `docs/claude/estrutura-e-scripts.md`.
- **Pin do router:** `@tanstack/router-core` e `@tanstack/react-router` ficam fixos até o Storybook publicar a correção (sem o pin, toda story quebra); ao remover, confirme com `pnpm run test:layers` — detalhe em `docs/claude/dependencias.md`.

## Onde registrar convenção nova

- Convenção de uma área vai para o guia dela, listado em **Guias de referência**: o `docs/claude/<área>.md` ou o guia de `docs/conventions/` que já cobre o assunto.
- Neste `CLAUDE.md` só entra regra que vale para quase toda tarefa.
- Área nova ganha arquivo novo em `docs/claude/` e uma linha em **Guias de referência** e no índice abaixo.

## Índice das seções que saíram deste arquivo

Citação antiga por título ("`CLAUDE.md`, seção X") se resolve aqui. "Versão curta aqui" quer dizer que o título continua neste arquivo, só com a regra curta, e o texto inteiro está no arquivo indicado.

- [`docs/claude/ui.md`](docs/claude/ui.md): Regras e Exemplo (de **JSX e markup — menos é mais**); Acentuação e codificação (evitar mojibake), Acessibilidade (a11y), Design responsivo e Loading e estados intermediários (versão curta aqui); Por quê; Padrões corretos (já no projeto — reuse antes de criar); Anti-padrões a evitar; Exceções legítimas.
- [`docs/claude/erros-e-seguranca.md`](docs/claude/erros-e-seguranca.md): Object injection — nunca indexe objeto/array com variável e LGPD e dados pessoais (PII), de **Segurança** (versão curta aqui).
- [`docs/claude/dependencias.md`](docs/claude/dependencias.md): o Pin do router, de **Ambiente** (versão curta aqui).
- [`docs/claude/estrutura-e-scripts.md`](docs/claude/estrutura-e-scripts.md): Estrutura de pastas; Scripts (versão curta dos scripts em **Ambiente**).
