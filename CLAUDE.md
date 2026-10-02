# CLAUDE.md

Guia para o Claude trabalhar neste frontend. Este arquivo traz as regras gerais, que valem para toda tarefa, e os guias de `docs/` (ver **Guias de referência**) trazem as de cada área; juntos, são a fonte de verdade para convenções e comportamento esperado — leia o [`README.md`](README.md) para detalhes de stack, scripts e estrutura de pastas.

> O diretório irmão `server-template/` é o template de backend que atende este frontend (Fastify + Prisma + Zod; sobe com `npm run db:up && npm run dev` lá dentro, em `http://localhost:8080`). Não é o foco do trabalho — não otimize, refatore ou estenda essa API sem pedido explícito. O contrato HTTP dele está em `../server-template/docs/openapi.json` (ver **Contrato com o backend** em [`docs/conventions/http-and-state.md`](docs/conventions/http-and-state.md)).

---

## Stack

React 19 + Vite 7 + TypeScript • TanStack Router (code-based) + TanStack Query • Zustand • React Hook Form + Zod • Tailwind v4 + shadcn/ui (Radix) • Axios • Sonner • Vitest + Testing Library • ESLint + Prettier + Husky + lint-staged.

Sessão por cookie HTTP-only (gravado e validado pelo template de backend em `../server-template`).

---

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

1. **Procure primeiro no próprio projeto.** Antes de inventar, varra `src/screens/`, `src/components/global/` e o Storybook (`npm run storybook`) atrás de algo equivalente. Replique pasta, abstração e cadência visual que já existem (`PageActions`, `Card`, `Tabs` variant `line`, `DataTable`, organização em pastas por aba). Padronização interna **sempre** vence preferência individual — uma tela nova deve parecer parte do sistema, não um experimento isolado.
2. **Quando não houver referência interna, inspire-se em sistemas consolidados** (GitHub, Linear, Vercel Dashboard, Stripe Dashboard, Notion). Use-os para preencher lacunas — _como_ eles organizam abas de settings, _onde_ eles colocam ações primárias, _como_ eles paginam. Adapte para as abstrações deste projeto; não copie estrutura paralela ("trouxe um header novo do GitHub" em vez de usar `PageActions` é regressão de padronização).
3. **Se a decisão vai virar padrão para outras telas, documente.** Quando você introduz uma nova convenção que se repetirá (ex.: slot global de `PageActions`, organização em pasta por aba), registre brevemente no `CLAUDE.md` (regra geral) ou no guia de `docs/` do assunto para que a próxima sessão (humana ou Claude) já chegue alinhada.

Resumo: **consistência interna > inspiração externa > improvisar do zero.**

---

## Pronto e limites

O que torna uma tarefa pronta (loop por tarefa, fechamento da entrega, como reportar, documentação acompanhando a mudança) está em [`docs/definition-of-done.md`](docs/definition-of-done.md); o que nenhum agente faz sem aval, em [`docs/guardrails.md`](docs/guardrails.md).

---

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

---

## Linguagem de código

- Todo código-fonte em **inglês**.
- `camelCase` para variáveis, funções e arquivos `.ts`/`.tsx` próprios.
- `kebab-case` apenas em `components/ui/` (padrão shadcn).
- Nomes claros e que revelem intenção. Sem abreviações desnecessárias.
  - Prefira: `calculateInventoryBalance`, `createUserSession`, `validatePhoneNumber`
  - Evite: `data`, `info`, `handleThing`, `processStuff`
- Código auto-documentado é melhor que comentário. Não escreva comentário que apenas reafirma o que o código já diz.

---

## TypeScript

- **Evite `any`.** Use tipos explícitos ou genéricos.
- Use `interface` para shapes de objeto que podem ser estendidos; `type` para uniões, interseções e aliases.
- Inferência só quando o tipo é óbvio pela atribuição.
- Marque return type explicitamente em funções públicas/exportadas.
- Use `unknown` quando o tipo é genuinamente desconhecido — restrinja antes de usar.
- Mantenha o `tsconfig` em `strict`. Não relaxe flags (`strictNullChecks`, `noImplicitAny`…) para "fazer compilar" — conserte o tipo.

---

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

---

## JSX e markup — menos é mais

Você tende a empilhar `<div>` e classes Tailwind a mais. **Pare**. Cada elemento e cada classe precisa pagar pelo seu lugar. JSX limpo é fundamental — quem lê depois (humano ou Claude) entende a intenção pelo formato, não escava entre wrappers.

### Antes de adicionar uma `<div>`, pergunte

1. Existe pra layout real (flex/grid/spacing)? Mantenha.
2. Tem semântica de página (`<section>`, `<article>`, `<header>`, `<footer>`, `<nav>`, `<aside>`, `<main>`)? Use o elemento certo, não div.
3. Existe só pra agrupar JSX? Troque por **Fragment** (`<>...</>`).
4. Existe só pra aplicar uma classe num filho? Passe a classe pro filho direto.

Se a resposta não é #1 ou #2, a div não deveria estar lá.

### Regras

- **Reuse abstrações globais** (`Card`, `Empty`, `Modal`, `ConfirmDialog`, `Field`) em vez de recriar a estrutura delas com divs e classes soltas.
- **Não empilhe wrappers de layout**: um `flex`/`grid` parent geralmente basta. `<div flex><div flex>` é code smell.
- **Sem classe Tailwind redundante**: nada de `w-full` em elemento block-level, `flex-col` num pai que já é `flex-col`, ou `text-foreground` quando é o default.
- **Prefira utilitários da escala Tailwind à notação em pixel**. A escala do Tailwind (1 = 0.25rem = 4px) cobre praticamente todo caso de UI — use ela em vez de bracket notation com `px`. Valores arbitrários quebram a escala, descalibram o ritmo visual entre componentes e o ESLint do projeto sinaliza casos comuns (`min-h-[4px]` → `min-h-1`).
  - ❌ `min-h-[4px]` · `w-[16px]` · `size-[20px]` · `gap-[8px]` · `mt-[12px]`
  - ✓ `min-h-1` · `w-4` · `size-5` · `gap-2` · `mt-3`
  - Bracket notation só para valores fora da escala (ex.: `min-w-[260px]` em uma coluna específica de tabela, `top-[3px]` para ajuste óptico fino).
- **Prefira styling no elemento certo**, não num wrapper criado pra isso. Se precisa de margem num botão, passe `className` no botão (ou ajuste o `gap` do pai).
- **Não comente o que o JSX já diz**. Componente bem nomeado dispensa `{/* Header */}` em cima de `<Header />`.

### Exemplo

❌ Excesso de wrappers e classes redundantes:

```tsx
<div className="flex flex-col gap-4">
  <div>
    <div className="flex items-center">
      <h2 className="text-lg text-foreground">Resumo</h2>
    </div>
    <div className="mt-2">
      <p className="w-full text-sm text-muted-foreground">Visão do dia.</p>
    </div>
  </div>
  <div>
    <Button onClick={save}>Salvar</Button>
  </div>
</div>
```

✓ Enxuto e legível:

```tsx
<section className="space-y-2">
  <Typography variant="h3">Resumo</Typography>
  <Typography variant="muted">Visão do dia.</Typography>
  <Button onClick={save}>Salvar</Button>
</section>
```

A versão enxuta mostra **o que** o bloco é (uma seção de resumo com 3 elementos) sem o leitor precisar mentalmente desempilhar 5 divs.

---

## Error handling

- Trate erros de forma explícita e previsível. Sem falhas silenciosas.
- `try/catch` em operações que podem lançar (I/O, rede, parsing).
- Log com nível apropriado: `warn` para esperado/recuperável, `error` para falha inesperada.
- **Nunca** exponha stack trace ou detalhes técnicos ao usuário final — use toast/mensagens amigáveis em pt-BR.
- Os interceptors do `api` ([`src/services/api`](src/services/api)) já exibem toasts de erro. Não duplique no chamador a menos que o caso exija tratamento específico.
- Sem `catch` vazio que engole erro.
- **Erros de render e de carregamento de uma tela** são capturados pelo roteador, não por `try/catch`: a tela de erro do projeto ([`ErrorFallback`](src/components/global/errorFallback/index.tsx), pelo adaptador [`RouteErrorFallback`](src/components/global/errorFallback/routeErrorFallback.tsx), com report via `sendErrorMessage`) aparece no lugar do conteúdo nas telas do layout protegido e em tela cheia nas rotas públicas (ver **Tela de erro por rota** em [`docs/conventions/routes-and-screens.md`](docs/conventions/routes-and-screens.md)). O `ErrorBoundary` do [`App.tsx`](src/App.tsx) continua como última linha, para o que falha fora do roteador. Não embrulhe render em `try/catch` esperando pegar erro de componente.

---

## Segurança

- Valide todo input do usuário com Zod no formulário **antes** de enviar à API.
- Nunca confie em dado vindo do servidor sem tipá-lo — defina o shape esperado.
- Não logue dados sensíveis (senhas, tokens, dados pessoais) — nem em `console.log` durante desenvolvimento.
- Não armazene tokens em `localStorage`/`sessionStorage` — a sessão é por cookie HTTP-only.

### Object injection — nunca indexe objeto/array com variável

O ESLint (`security/detect-object-injection`) sinaliza `obj[key]` / `arr[i]` quando a chave é uma **variável** e não um literal — é o aviso **"Variable Assigned to Object Injection Sink"**. O risco real: se a chave vier (direta ou indiretamente) de input do usuário, ela pode resolver para `__proto__` / `constructor` / `prototype` e abrir caminho para _prototype pollution_, ou ler/escrever uma propriedade que você não pretendia expor.

**Regra dura: não escreva código que dispare esse aviso.** Nunca silencie com `// eslint-disable-next-line security/detect-object-injection` — refatore para uma forma segura. Objeto indexado por variável só é aceitável quando a chave é um **literal conhecido em tempo de compilação** (e aí não dispara o aviso).

Como evitar, por caso de uso:

- **Mapa de lookup (label/variante por chave de union)** — em vez de `Record` indexado por variável, use um `Map` (`.get()` não é sink) ou um `switch`:

  ❌ Dispara o aviso:

  ```ts
  const ROLE_BADGE_VARIANT: Record<UserRole, BadgeVariant> = { admin: 'default', member: 'secondary' };
  <Badge variant={ROLE_BADGE_VARIANT[role]} />;
  ```

  ✓ `Map` com `.get()`:

  ```ts
  const roleBadgeVariant = new Map<UserRole, BadgeVariant>([
    ['admin', 'default'],
    ['member', 'secondary'],
  ]);
  <Badge variant={roleBadgeVariant.get(role)} />;
  ```

  ✓ ou `switch` (bom quando há lógica além do lookup):

  ```ts
  function roleBadgeVariant(role: UserRole): BadgeVariant {
    switch (role) {
      case 'admin':
        return 'default';
      case 'member':
        return 'secondary';
    }
  }
  ```

- **Chave vinda de input do usuário** (query string, body, params): nunca indexe direto. Valide com `z.enum([...])` para garantir que a chave é uma das esperadas **antes** de qualquer acesso, e então use `Map`/`switch`.
- **Iteração por índice numérico**: prefira `for...of`, `.map`, `.find`, `.at(i)` — o callback do `.map((item, i) => ...)` já entrega o `item` sem você indexar o array. Só caia em `arr[i]` quando `i` for literal.

Resumo: lookup por chave → `Map`/`switch`; iteração → métodos de array; chave de fonte externa → Zod antes de tudo. Objeto indexado por variável dinâmica é proibido.

### LGPD e dados pessoais (PII)

Produto pt-BR opera sob a LGPD. Considere PII e **proibido logar** em qualquer canal (console, Sentry/breadcrumb, analytics, query string da URL, body de erro exibido ao usuário, payload de toast):

- **Identificadores pessoais**: nome completo, CPF, CNPJ (de pessoa física), RG, CNH, passaporte, título de eleitor, PIS.
- **Contato**: e-mail, telefone, endereço, CEP.
- **Credenciais e sessão**: senha (em qualquer forma — texto puro, hash, parcial), token de API, cookie de sessão, código 2FA, perguntas de recuperação.
- **Financeiro**: número de cartão (mesmo mascarado), CVV, dados bancários, conta, chave PIX.
- **Sensíveis (art. 5º, II)**: dados de saúde, biometria, origem racial, religião, opinião política, orientação sexual.

Regras práticas:

- **Erros de API**: o interceptor do `api` exibe mensagem amigável — não relogue o objeto de erro cru no `console.error` de produção. Em dev, OK, desde que o `.env.local` não vá pro repo.
- **Reporte de erro** (`sendErrorMessage` em [`services/api/errorHandlers.ts`](src/services/api/errorHandlers.ts), para `VITE_ERROR_LOG_URL`): do usuário da sessão vai só o `userId` (id opaco, o mesmo campo que o `server-template` manda ao log dele), nunca nome, e-mail ou o objeto `user` inteiro. Contexto novo no reporte segue a mesma regra.
- **Query string nunca leva PII** (`?email=foo@bar.com` aparece em log de servidor, histórico do navegador, referer). Use POST body.
- **Exceção explícita: o texto livre de busca.** O que a pessoa digita no campo "Buscar" de uma listagem (ex.: "Nome ou e-mail" em `/users`) fica em `filters` na URL e vai como `search` na query do GET: é a regra "Filtros na URL" ([`docs/conventions/filters-and-tables.md`](docs/conventions/filters-and-tables.md)) (link compartilhável, F5 restaura) e o contrato do servidor é GET com query. Só esse termo: nenhum outro dado pessoal vai como filtro nomeado (`?cpf=`, `?phone=`, `?email=` como parâmetro próprio). Mascarar o termo de busca no log é do servidor (`server-template`). Por isso o **reporte de erro do cliente nunca leva a query nem o hash da URL**: do endereço, o `sendErrorMessage` manda só o `pathname` (`/users`, nunca `/users?filters=...`), e contexto novo no reporte não reintroduz a URL inteira (`location.href`, `location.search`).
- **URL de tela pode conter ID opaco** (`/users/abc123`), nunca CPF na URL.
- **Toast/erro ao usuário não ecoa o input**: `"Falha ao salvar."` em vez de `"Falha ao salvar o usuário ${nome} (CPF ${cpf})."`.
- **Form com PII** (cadastro, perfil): se for usar `react-hook-form` devtools/Storybook, garanta que defaultValues não foram commitados com dado real.
- **Storybook e mocks**: dados de exemplo são fictícios — não cole CPF/e-mail real "porque é só pra testar".

---

## Performance

- Code-splitting por rota já está em uso (`lazyRouteComponent`) — mantenha o padrão.
- TanStack Query: configure `staleTime` em queries que não precisam refazer a cada navegação. Não use `useEffect` + `fetch`.
- Liste só o necessário: para tabelas grandes, use paginação server-side via [`useDataTableQuery`](src/components/global/dataTable/useDataTableQuery.ts).
- **Não passe objeto/função inline** como prop para componente memoizado (linha de tabela, item de lista, célula custom) — recria a referência a cada render e mata a memoização. Handlers em `useCallback` estáveis, `options`/`columns` em `useMemo`.
- Memoize (`useMemo`/`useCallback`) apenas com benefício mensurável — não por reflexo.

---

## Git e commits

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
- Um commit, uma mudança lógica.
- Mensagens em inglês, modo imperativo: `add user session validation` (não `added`/`adding`).
- PRs pequenos e revisáveis. Se não dá para revisar em 30 min, está grande demais.
- Husky + lint-staged rodam ESLint e Prettier no `pre-commit`. O `pre-push` roda `typecheck + test`. Não pule hooks (`--no-verify`) — se um teste/typecheck quebra, conserte; não bypasse.
- Antes de empurrar manualmente, rode `npm run check` (lint + format:check + typecheck + test).

---

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

**Sempre acentue corretamente.** Texto pt-BR sem acento é erro, não estilo — `usuario`, `nao`, `acao`, `informacoes` viram bug visível para o usuário final. Mesmo em rascunho, mantenha `usuário`, `não`, `ação`, `informações`.

- **Salve arquivos em UTF-8 sem BOM.** Strings literais (`'Não foi possível salvar.'`), comentários, labels, mensagens de erro de schema Zod, títulos de `Card`/`Modal`/`Empty`, tudo em UTF-8 correto.
- **Mojibake é zero-tolerância.** Se você ver `não`, `ã`, `Ã§`, `Ã©`, `â€"`, `?` no lugar de letra acentuada, ou caracteres invertidos `Â`, `Ã`, isso é arquivo lido como Latin-1/CP1252 e escrito como UTF-8 (ou vice-versa). Conserte o arquivo (re-salve em UTF-8) — **não "corrija" o texto trocando por versão sem acento.**
- **No PowerShell (Windows), nunca redirecione texto pt-BR com `>` ou `Out-File` sem `-Encoding utf8`** — o default vira UTF-16 LE com BOM e quebra o build/leitura. Para escrever texto com acento via shell, use as ferramentas `Write`/`Edit` do projeto, não `echo "..." > arquivo`.
- **Caracteres comuns que precisam aparecer corretos**: `á é í ó ú â ê ô ã õ à ç` (minúsculas) e suas maiúsculas. Aspas tipográficas (`" "` `' '`) e travessão (`—`) também são UTF-8 — preserve.
- **Lista mínima de palavras que aparecem direto no produto e precisam estar acentuadas**: ação, não, número, código, válido/inválido, próximo/anterior, página, último, índice, descrição, padrão, série, área, é/está, mês, está, três, após, até, já, só.
- **Atalhos automáticos do editor** (autocorreção que troca `não` por `nao`, configuração regional do shell) são fonte recorrente de regressão. Se você notar um arquivo onde acento sumiu silenciosamente, é provável que tenha sido salvo numa codificação errada — re-salve em UTF-8 antes de continuar editando.

❌ `<Empty title="Nenhum usuario encontrado" description="Tente uma nova busca." />`
✓ `<Empty title="Nenhum usuário encontrado" description="Tente uma nova busca." />`

❌ `z.string().min(1, 'Campo obrigatorio.')`
✓ `z.string().min(1, 'Campo obrigatório.')`

---

## Acessibilidade (a11y)

Radix (via shadcn) dá a base de a11y — foco, ARIA, navegação por teclado. Mas as regressões comuns vêm de **remover** ou **ignorar** o que Radix já entrega. As regras abaixo são o mínimo para uma tela nova não degradar.

- **Nunca remova o `focus-visible:ring`.** Se está atrapalhando o visual, ajuste a cor do ring (`--ring`), não remova. Sem indicador de foco, navegação por teclado fica cega.
- **Toda input precisa de label associada.** Use os fields globais (`InputField`, `Select`, `DateField`...) — eles já geram `<FieldLabel htmlFor>` ↔ `<Input id>`. **Não use `placeholder` como label** — placeholder some quando o usuário começa a digitar e leitor de tela ignora.
- **Botão-ícone exige rótulo E tooltip — use a prop `tooltip` do [`Button`](src/components/global/button/button.tsx) global (regra dura).** Ação renderizada **só como ícone** passa `tooltip="..."` em pt-BR: o componente usa o texto como `aria-label` (leitor de tela) **e** revela o tooltip no hover/foco (vidente descobre o que o ícone faz). `<Button variant="ghost" size="icon" tooltip="Fechar"><X /></Button>`. Só `aria-label` deixa o usuário vidente adivinhando; só tooltip deixa o leitor de tela anunciando "botão". O `Button` traz o próprio `TooltipProvider` — funciona em qualquer tela, sem provider ancestral.
  - **Exceção `asChild`:** com `asChild` o `Button` é um `Slot` para outro gatilho (um `<a>`, um `DropdownMenuTrigger`) e a prop `tooltip` é ignorada — monte o `Tooltip` em volta do gatilho na própria tela e passe `aria-label` no botão. Ver `toggleTheme.tsx` e `rowActions.tsx`.
- **Texto sempre dentro do elemento certo.** Não envolva texto em `<div onClick={...}>` — use `<button>` (ou `<Button variant="link">`). Div clicável não é focável por teclado, não tem role de botão, não dispara em `Enter`/`Space`.
- **Imagens precisam de `alt`.** Decorativa: `alt=""` (explícito). Informativa: descrição curta em pt-BR. Avatar: `alt={nome}` com fallback nas iniciais.
- **Contraste mínimo de 4.5:1** para texto sobre fundo (WCAG AA). Os tokens do projeto (`text-foreground` sobre `bg-background`, `text-muted-foreground` sobre `bg-card`) já passam — desvio só com motivo claro.
- **Estado e significado nunca só pela cor.** Status, erro, seleção e obrigatoriedade precisam de um segundo canal (texto, ícone, borda, `aria-*`): daltônico e leitor de tela não recebem "vermelho". Estado de controle vai também em ARIA (`aria-invalid`, `aria-selected`, `aria-disabled`, `aria-busy`), não apenas na classe visual.
- **Alvo de clique mínimo de 24×24 px** (WCAG 2.2 AA, "Target Size (Minimum)"). Os tamanhos do sistema já passam (`size="icon"` = `size-8`, botão padrão `h-8`) — o erro é encolher abaixo disso ou usar um ícone nu como gatilho. Ícone pequeno ganha área pelo padding do botão, nunca pelo alvo menor.
- **Foco inicial em Modal/Drawer/ConfirmDialog**: Radix põe foco no primeiro elemento focável; se há campo de input principal, garanta que ele seja o primeiro. Em `ConfirmDialog` destrutivo, **foco fica no botão de cancelar**, não no de confirmar (evita confirmação acidental no `Enter`).
- **Explicação ao lado de um controle é a descrição acessível dele.** O texto que diz por que um item está desabilitado ou travado (ex.: "Você não tem esta permissão." na árvore de cargos) vai pela `description` do [`Checkbox`](src/components/global/form/checkbox.tsx) global, que o liga ao controle por `aria-describedby` (somado a um `aria-describedby` de quem usa): o leitor de tela o lê junto do nome. Parágrafo solto ao lado só chega a quem vê a tela. No teste: `getByRole('checkbox', { name, description })`.
- **Toasts (`sonner`)**: já anunciam via `aria-live` por padrão. Não envolva toast em wrapper que sobrescreva role.
- **Listas com seleção/navegação por teclado**: use `role="listbox"` + `role="option"` + `aria-selected`, ou simplesmente reuse `Select` / `MultiSelect` globais que já têm isso.
- **`tabIndex` só quando há motivo.** `tabIndex={0}` em elemento naturalmente focável é redundante; `tabIndex={-1}` só para remover do tab order temporariamente; `tabIndex` positivo (`tabIndex={1}`) **nunca** — quebra a ordem natural do documento.
- **Não esconda conteúdo só para vidente.** `display: none` / `hidden` esconde de todos; para conteúdo só-leitor-de-tela use a classe utilitária `sr-only`. Para esconder do leitor mas manter visível, `aria-hidden="true"`.
- **Animação respeita `prefers-reduced-motion`**: Tailwind tem `motion-safe:` / `motion-reduce:` — use em qualquer animação não-trivial.

---

## Design responsivo

**Não esconda colunas, células ou qualquer conteúdo em mobile.** Quando uma tabela (ou área) não cabe na largura, a solução é **scroll lateral** dentro do container — não esconder informação.

- Tabelas largas: `overflow-x-auto` no container imediato do `<table>`. Deixe a `<table>` ficar mais larga que o viewport e rolar horizontalmente.
- Inputs de filtro: `w-full` em mobile (largura fixa só a partir de `sm:`/`md:`).
- **Não use** `hidden`, `md:hidden`, `md:table-cell` para esconder coluna/campo por breakpoint.
- Se a tabela parece cortada e não rola, o problema é um ancestral com `overflow-hidden` ou container com largura indefinida sendo expandido pelo conteúdo — conserte lá, não escondendo dados.

Esconder coluna em mobile é regressão de UX, não responsividade.

---

## Loading e estados intermediários

**Não substitua a tela por um spinner gigante nem por um skeleton genérico.** Quando algo está carregando, monte a **estrutura final da tela primeiro** e troque **apenas o dado que muda** por skeleton. Cabeçalhos, rótulos, ações, filtros, navegação, breadcrumb — tudo que não muda entre vazio e preenchido continua **visível e interativo**.

### Por quê

Spinner gigante centralizado no lugar do conteúdo:

- **Atrasa a percepção do que a tela é** — o usuário só descobre o layout depois que carrega.
- **Esconde a navegação contextual** (breadcrumb, abas, ações secundárias) que ele poderia usar pra clicar em outro lugar enquanto espera.
- **Provoca CLS** (layout shift) — quando o conteúdo aparece, a estrutura se monta de uma vez e empurra tudo.

Skeleton localizado onde o dado entra:

- O usuário já entende **o que a tela faz** antes dos dados chegarem.
- Mantém a UI **interativa** ao redor (filtros, breadcrumb, ações secundárias).
- Sem layout shift: o espaço final do dado já está reservado.

### Padrões corretos (já no projeto — reuse antes de criar)

- **[`DataTable`](src/components/global/dataTable/dataTable.tsx)** com `isLoading={true}`: header, filtros e paginação **continuam visíveis**; só as células do `<tbody>` viram skeleton, linha-a-linha.
- **Atualizações parciais:** Evite recarregar a tela ou refetchar listas inteiras quando apenas um pedaço do dado muda. Por exemplo, ao editar um usuário diretamente na listagem, atualize apenas as informações daquele usuário (via `queryClient.setQueryData`, `useMutation` com `onMutate`/optimistic update ou atualizando a linha correspondente no estado) em vez de rebuscar todos os dados de todos os usuários. Isso mantém a UI responsiva, reduz tráfego desnecessário e evita flicker.
- **[`Skeleton*`](src/components/global/skeleton/skeleton.tsx)** (`SkeletonText`, `SkeletonValue`, `SkeletonBadge`, `SkeletonAvatar`): granulares por design — coloque no lugar **exato** do dado, dentro do card real.
- **[`Button` global](src/components/global/button/button.tsx)** com `loading`: spinner pequeno inline **dentro do botão** que disparou a ação. Esse spinner é localizado, não é "spinner de tela".

Regra adicional: Os skeletons devem ser extraídos para arquivos próprios em vez de serem definidos inline nos `index` ou arquivos de tela. Coloque o skeleton co-localizado com o componente que ele simula (por exemplo: `src/screens/users/userListSkeleton.tsx`) ou em `src/components/global/skeleton/` quando for reutilizável. Nome recomendado: `ComponentSkeleton.tsx` (camelCase para arquivos .tsx do projeto). Cada skeleton novo deve vir acompanhado de uma story e um teste (mesma regra das abstrações globais) para manter a vitrine e a cobertura automatizada. Isso evita poluição do arquivo `index` e melhora legibilidade e reuso.

Adicionalmente, o skeleton deve seguir a estrutura da tela e reproduzir o layout real o mais próximo possível: mantenha as mesmas margens, espaçamentos, tamanhos de blocos e ordem visual dos elementos para evitar shifts visuais quando o conteúdo real for carregado. O objetivo é minimizar CLS e dar ao usuário uma prévia fiel da UI enquanto os dados carregam.

### Anti-padrões a evitar

- ❌ `<div className="flex min-h-64 items-center justify-center"><Loader2 /></div>` no lugar do conteúdo de uma tela.
- ❌ Envolver tela ou card inteiro num `<Skeleton className="h-full w-full" />` genérico.
- ❌ Skeletonizar rótulos fixos ("Nome", "E-mail", "Status") — eles nunca mudam, não precisam virar bloco cinza.
- ❌ Modal/Drawer que abre e mostra spinner gigante até o form aparecer. Renderize o form com skeleton nos campos.

### Exceções legítimas

Tela cheia com indicador grande **só** quando ainda não existe shell pra mostrar — ex.: [`SessionValidationScreen`](src/components/global/layout/sessionValidationScreen.tsx) durante o boot da app, antes de qualquer rota protegida ter renderizado. Aí o "shell" não existe ainda; branding + barra de progresso é o melhor que dá.

O fallback do `<Suspense>` que carrega chunks de rota (em [`layout.tsx`](src/components/global/layout/layout.tsx)) deve ser **discreto** (barra fina pulsante, dots, ou nada visível) — `defaultPreload: 'intent'` já cobre 99% dos casos; o fallback é só pra cliques antes do hover. Spinner gigante aqui empobrece a navegação.

---

## Estrutura de pastas

```
src/
├── assets/              # imagens e estáticos importados
├── components/
│   ├── global/          # abstrações da aplicação (card, modal, empty, skeleton, button, form/, layout/, sidebar/, dataTable/)
│   └── ui/              # primitivos shadcn/ui (gerados via CLI — kebab-case)
├── hooks/               # hooks reutilizáveis (tema, sessão, mobile...)
├── lib/                 # utilidades puras (env, datas, forms, queryClient, cn)
├── screens/             # telas; cada uma com seu routes.ts co-localizado
├── services/            # camada de acesso a dados (api, session...)
├── types/               # tipos de domínio compartilhados
├── index.css            # tokens de design (cor da marca, dark mode, paleta)
├── routes.tsx           # árvore de rotas raiz
└── main.tsx             # entrypoint (providers globais)
```

---

## Imports

- Use o alias `@/` para imports internos (ex.: `@/components/ui/button`, `@/lib/utils`).
- Não use caminhos relativos longos (`../../../`) — troque por `@/`.

---

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
| `npm run test:watch`   | Vitest watch                                            |
| `npm run check`        | Lint + format:check + typecheck + test                  |
| `npm run test:e2e`     | E2E (Playwright) contra o `../server-template` no ar    |
| `npm run test:layers`  | Empilhamento (z-index) no navegador, contra o Storybook |
| `npm run clean`        | Remove `dist/` e caches                                 |

---

## Ambiente

- Windows (PowerShell). Em comandos shell use sintaxe PS (`$env:VAR`, `$null`, sem `&&` em PS 5.1).
- Node >= 22 (versão fixa do template; CI roda em Node 22).
- `npm` (lockfile `package-lock.json`).
- **Pin do router (`overrides` no `package.json`):** `@tanstack/router-core` fica em `1.171.29` e `@tanstack/react-router` em `1.170.35`. A partir do `router-core` 1.171.30 o `interpolatePath` virou posicional, e o `@storybook/tanstack-react` 10.6 ainda o chama com objeto — toda story quebra com `path.endsWith is not a function`. Remova o override quando o Storybook publicar a correção, e confirme com `npm run test:layers`.
