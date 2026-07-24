# CLAUDE.md

Guia para o Claude trabalhar neste frontend. Este arquivo é a fonte de verdade para convenções e comportamento esperado — leia o [`README.md`](README.md) para detalhes de stack, scripts e estrutura de pastas.

> O diretório irmão `ultimate-server/` existe apenas como template de backend para fazer o login funcionar. Não é o foco do trabalho — não otimize, refatore ou estenda essa API sem pedido explícito.

---

## Stack

React 19 + Vite 7 + TypeScript • TanStack Router (code-based) + TanStack Query • Zustand • React Hook Form + Zod • Tailwind v4 + shadcn/ui (Radix) • Axios • Sonner • Vitest + Testing Library • ESLint + Prettier + Husky + lint-staged.

Sessão por cookie HTTP-only (consumida pelo template de backend em `../ultimate-server`).

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
3. **Se a decisão vai virar padrão para outras telas, documente.** Quando você introduz uma nova convenção que se repetirá (ex.: slot global de `PageActions`, organização em pasta por aba), registre brevemente em `CLAUDE.md` para que a próxima sessão (humana ou Claude) já chegue alinhada.

Resumo: **consistência interna > inspiração externa > improvisar do zero.**

---

## Documentação acompanha a mudança — parte do DoD

**SEMPRE** que você mexer em algo que impacte o **funcionamento** ou a
**usabilidade** do sistema (fluxo novo, mudança de comportamento, campo novo,
regra, correção visível ao usuário), **atualize a documentação correspondente no
mesmo PR**. Documentação divergente do código é pior que documentação
inexistente.

- **Doc de usuário (quando o projeto tiver uma superfície de docs):** escreva em
  **linguagem de negócio** — o que a tela faz, como usar, o que pode/não pode,
  **erros possíveis**. Nunca jargão de código, número de card/demanda ou caminho
  de arquivo. Espelhe a estrutura das páginas existentes (seções numeradas,
  tabela de "Erros possíveis"). Se houver nota de versão/changelog voltado ao
  usuário, registre lá a mudança visível (com módulo e impacto).
- **Convenção que vai se repetir → registre neste `CLAUDE.md`.** Ao introduzir um
  padrão novo (organização de pasta, slot global, regra de UX), documente-o aqui
  para a próxima sessão (humana ou Claude) já chegar alinhada.
- Só é dispensável quando a mudança **não afeta o uso** (refactor interno, teste,
  tooling).

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
- **Query string nunca leva PII** (`?email=foo@bar.com` aparece em log de servidor, histórico do navegador, referer). Use POST body.
- **URL de tela pode conter ID opaco** (`/users/abc123`), nunca CPF na URL.
- **Toast/erro ao usuário não ecoa o input**: `"Falha ao salvar."` em vez de `"Falha ao salvar o usuário ${nome} (CPF ${cpf})."`.
- **Form com PII** (cadastro, perfil): se for usar `react-hook-form` devtools/Storybook, garanta que defaultValues não foram commitados com dado real.
- **Storybook e mocks**: dados de exemplo são fictícios — não cole CPF/e-mail real "porque é só pra testar".

---

## Performance

- Code-splitting por rota já está em uso (`lazyRouteComponent`) — mantenha o padrão.
- TanStack Query: configure `staleTime` em queries que não precisam refazer a cada navegação. Não use `useEffect` + `fetch`.
- Liste só o necessário: para tabelas grandes, use paginação server-side via [`useDataTableQuery`](src/components/global/dataTable/useDataTableQuery.ts).
- Memoize (`useMemo`/`useCallback`) apenas com benefício mensurável — não por reflexo.

---

## Testes

Duas camadas: **unit/componente** com Vitest (abaixo) e **fluxo no app real** com Playwright — ver a subseção **E2E (Playwright)** no fim desta seção.

- Vitest + Testing Library, ambiente `jsdom`.
- Todos os testes vivem em [`src/tests/`](src/tests), organizados em pastas — uma pasta por componente/módulo, com o arquivo `<name>.test.ts(x)` dentro. Espelha o agrupamento usado nas stories.
- Setup global em [`src/tests/setup.ts`](src/tests/setup.ts) (referenciado em [`vitest.config.ts`](vitest.config.ts)).
- O componente/módulo é importado via alias `@/...`, nunca por caminho relativo.

```
src/tests/
├── setup.ts
├── globais/<component>/<name>.test.tsx     # abstrações de components/global/
│   ├── button/button.test.tsx
│   ├── card/card.test.tsx
│   ├── dataTable/{dataTable,dataTableSearch,useDataTableQuery}.test.tsx
│   └── form/<field>/<field>.test.tsx
├── hooks/<hook>/<hook>.test.tsx
├── lib/<grupo>/<arquivo>.test.ts
└── services/<servico>/<arquivo>.test.ts
```

- Escreva teste para lógica não-trivial: utilidades puras, hooks com lógica, regras de negócio, edge cases.
- Teste o caminho de falha, não só o happy path.
- Testes legíveis — eles documentam o comportamento esperado.
- As abstrações globais (`Button`, `Card`, `Empty`, `ConfirmDialog`) já têm testes que cobrem o contrato público — ao mudar a API delas, atualize o teste junto, não depois.

### Como escrever testes (práticas)

Três regras pegam 90% da qualidade de teste:

**1. Use `userEvent`, não `fireEvent`.** `userEvent` simula a sequência real (`pointerdown` → `focus` → `input` → `change` → `blur`) e dispara handlers que o `fireEvent` pula. `fireEvent.click` em um botão controlado por React Hook Form não dispara `onBlur` e o erro de validação não aparece. Importe sempre de `@testing-library/user-event`.

```ts
const user = userEvent.setup();
await user.type(screen.getByLabelText('E-mail'), 'foo@bar.com');
await user.click(screen.getByRole('button', { name: 'Entrar' }));
```

**2. Prefira `getByRole` / `findByRole` a `getByTestId`.** Role + accessible name é como o usuário (e o leitor de tela) encontra o elemento — se o teste passa por role, a acessibilidade do componente também passou. `data-testid` é fallback para casos sem role natural (containers genéricos, elementos puramente visuais).

```ts
✓ screen.getByRole('button', { name: 'Salvar' });
✓ screen.getByRole('textbox', { name: 'E-mail' });
✓ screen.getByRole('alert');                          // erro de validação, toast
✗ screen.getByTestId('save-button');                  // só se não houver role
```

Ordem de prioridade (segue Testing Library): `getByRole` → `getByLabelText` (forms) → `getByPlaceholderText` → `getByText` → `getByDisplayValue` → `getByTestId`.

**3. `findBy*` para async, não `await waitFor(() => getBy*)`.** `findBy*` já é `waitFor` + `getBy` — mais curto, mais legível, mensagem de erro melhor.

```ts
✓ await screen.findByText('Registro salvo.');
✗ await waitFor(() => expect(screen.getByText('Registro salvo.')).toBeInTheDocument());
```

Use `waitFor` apenas para asserções que não são "elemento apareceu" (ex.: `expect(mock).toHaveBeenCalledWith(...)`).

**Outras práticas:**

- **`queryBy*` para asserção negativa** (`expect(queryByText('...')).not.toBeInTheDocument()`). Nunca use `getBy*` esperando ausência — ele lança.
- **Não mocke o que você está testando.** Mocke serviços externos (`api`, `toast`), não o próprio componente nem os fields globais.
- **Wrapper de teste centralizado**: queries do TanStack Query, router e theme provider devem vir de um helper em `src/tests/` para não repetir setup em cada teste.
- **Factories de dados** (`makeUser({ name: 'Maria' })`) co-localizadas no teste ou em `src/tests/factories/` — evita literais gigantes inline.
- **Limpe estado entre testes**: `afterEach(() => queryClient.clear())` quando o teste compartilha cliente.

### E2E (Playwright) — obrigatório por feature, RODADO ao fim de toda tarefa

**Regra:** toda feature entregue vem com um teste Playwright que exercita o fluxo no app real **e é executado antes de considerar a entrega concluída**. Vale para **tela nova, modificação de tela/fluxo e novo CRUD/criação**. Se a mudança altera um fluxo já coberto, **atualize o spec existente** em vez de criar outro.

**Passo de encerramento (automático e obrigatório):** ao terminar QUALQUER tarefa que se encaixe (mexeu em tela/fluxo/CRUD do app), **rode o Playwright você mesmo** como último passo — não entregue "no papel". Basta `npm run test:e2e` na raiz do frontend: o `webServer` do [`playwright.config.ts`](playwright.config.ts) **sobe o Vite sozinho** (e reaproveita um `npm run dev` já rodando). **Não há stack para subir** — este template roda em **modo fake de sessão** (ver [`sessionService`](src/services/session/sessionService.ts)) e as telas usam dados **mock**, então nenhum backend/DB é necessário. A tarefa só está **efetivada** com o e2e relevante **verde**; se falhar, corrija e rode de novo até passar. Reporte o resultado (ex.: "e2e X/X verde"). Só pule a execução se o ambiente comprovadamente não puder subir o Vite na sessão — e aí sinalize explicitamente que o spec foi escrito/atualizado mas **falta rodar**.

- **Camadas (não confundir):** correção isolada de componente global (`components/global/`) continua coberta por **Vitest + story** (contrato do componente) — não escreva e2e para um primitivo isolado; ele é exercitado transitivamente pelo e2e da tela que o usa. O Playwright cobre o que o **usuário faz na aplicação rodando** (navegação, formulários, ações, filtros).
- **Onde:** specs em `e2e/<feature>.spec.ts` (na raiz do frontend). Config em [`playwright.config.ts`](playwright.config.ts): baseURL `http://localhost:5173`, chromium, `webServer` que **sobe o Vite automaticamente** (`reuseExistingServer` no dev), `workers: 1` só no CI. O Vitest ignora `e2e/**` ([`vitest.config.ts`](vitest.config.ts)) — `npm test` (unit) e `npm run test:e2e` (Playwright) são separados.
- **Como rodar:** só `npm run test:e2e` na raiz. Nenhum DB/server para subir (modo fake de sessão + dados mock). Se o Vite já estiver rodando (`npm run dev`), o Playwright o reaproveita.
- **Login:** modo fake — **qualquer e-mail válido + senha não-vazia** autentica (grava um cookie de sessão fictício). Use o helper `login(page)` de [`e2e/helpers/session.ts`](e2e/helpers/session.ts) — ponto único de autenticação dos specs; quando o backend real entrar, só ele muda. Referências: [`e2e/auditLogs.spec.ts`](e2e/auditLogs.spec.ts) e [`e2e/settings.spec.ts`](e2e/settings.spec.ts) (telas protegidas via `login` + `goto`); [`e2e/login.spec.ts`](e2e/login.spec.ts) (tela pública de login).
- **Seletores (aprendizados deste projeto):**
  - Prefira `getByRole`/`getByLabel`. Os campos de formulário têm `id` → `getByLabel('Rótulo')` funciona, inclusive nos `Select`/`MultiSelect` globais.
  - **Escope o contexto** para evitar ambiguidade: o e-mail do usuário logado aparece no menu do sidebar **e** na linha da tabela — busque linhas dentro do `tbody` (`page.locator('tbody tr', { hasText })`).
  - **Filtros server-side:** teste navegando com o estado na URL (`/users?filters=${encodeURIComponent(JSON.stringify(...))}`) e asserte o resultado — cobre filtro→fetch→render sem depender de operar cada campo.
  - **Filtro/listagem: teste o COMPORTAMENTO, não a renderização.** Um spec que só confere "as colunas aparecem" ou "o campo de filtro renderiza" é **falso positivo** — passa com o filtro quebrado (ex.: busca por match exato onde deveria ser `contains`, ou id enviado que não bate no backend). A corretude do filtro (o que casa **aparece**, o que não casa **some**) exige **dado**: cubra-a num teste de integração do backend (semeando o registro e assertando o conjunto de resultados, positivo E negativo) e, no e2e, exercite pelo menos um round-trip de filtro **com dado** (aplica o filtro → asserta que a linha esperada aparece / a não-esperada some). Nunca trate "o filtro está na tela" como cobertura do filtro.
  - `ConfirmDialog` → `getByRole('alertdialog').getByRole('button', { name })`. Menu de ações (⋯) → `getByRole('button', { name: 'Abrir menu' })` + `getByRole('menuitem', …)`. `Modal` → `getByRole('dialog', { name: 'Título' })`.
  - **Espere pelo conteúdo, não pela rede.** Com dados mock não há request para `page.waitForResponse(…)`; use asserções de visibilidade que já esperam (`await expect(locator).toBeVisible()`, `findBy…`) até a linha/campo aparecer. Num backend real, aí sim `waitForResponse` é útil.
  - **Filtros da `DataTable`** têm `id` estável (`filter-<chave>`, e `-from`/`-to` no `dateRange`) → o label associa e `getByLabel('Rótulo')` funciona em todos os tipos, inclusive `multiSelect` (o `id` vai no gatilho `role="combobox"`). Abra o `multiSelect` com `getByLabel('Rótulo').click()` e marque a opção via `getByRole('checkbox', { name: 'Opção' })`.
- **Padrão CRUD:** teste self-contained — criar → (usar) → excluir no próprio teste. Use dados **únicos** (ex.: sufixo com timestamp) já que o run pode gerar vários registros e um valor fixo colide/gera falso negativo entre execuções. No modo mock atual, cada teste roda num contexto de browser novo (memória do mock zerada entre testes) — não conte com estado persistido entre specs; num backend real, limpe o que criar.
- **DoD:** a entrega **não está concluída** sem o e2e relevante **executado e verde** (ver "Passo de encerramento" acima). Escrever o spec não basta — tem que rodar.

---

## Git e commits

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
- Um commit, uma mudança lógica.
- Mensagens em inglês, modo imperativo: `add user session validation` (não `added`/`adding`).
- PRs pequenos e revisáveis. Se não dá para revisar em 30 min, está grande demais.
- Husky + lint-staged rodam ESLint e Prettier no `pre-commit`. O `pre-push` roda `typecheck + test`. Não pule hooks (`--no-verify`) — se um teste/typecheck quebra, conserte; não bypasse.
- Antes de empurrar manualmente, rode `npm run check` (lint + typecheck + test).

---

## Texto de interface (UI)

Todo texto exposto ao usuário em **português brasileiro (pt-BR)**.

- Gramática e acentuação corretas.
- Linguagem clara, objetiva e profissional.
- Evite jargão técnico para usuários operacionais.
  - Correto: `Falha ao salvar o registro. Tente novamente.`
  - Evite: `Unexpected persistence layer failure.`
- **Nunca exponha referência interna ao usuário**: número de card/demanda, hash/código de merge, nome de branch, jargão de implementação. Não entra em label, placeholder, mensagem, toast nem em texto vindo do backend renderizado na tela. Se aparecer numa descrição/label (inclusive dado de seed), é bug — corrija na origem.

### Regra de negócio e dado derivado vêm do backend

**Regra de negócio não vive no frontend.** Cálculos, validações de estado, rótulos pt-BR e mensagens derivadas de regra vêm **prontos do backend**; a tela só renderiza. Se você se pegar reimplementando uma regra no client (recomputar totais, decidir um estado, traduzir um enum, montar uma mensagem derivada), pare: o backend deveria estar entregando pronto. Isso mantém uma única fonte de verdade e evita que duas telas divirjam ao reimplementar a mesma regra.

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
- **Botão-ícone exige `aria-label` em pt-BR**. `<Button variant="ghost" size="icon" aria-label="Fechar"><X /></Button>`. Sem isso, o leitor de tela anuncia "botão" sem dizer o quê.
- **Texto sempre dentro do elemento certo.** Não envolva texto em `<div onClick={...}>` — use `<button>` (ou `<Button variant="link">`). Div clicável não é focável por teclado, não tem role de botão, não dispara em `Enter`/`Space`.
- **Imagens precisam de `alt`.** Decorativa: `alt=""` (explícito). Informativa: descrição curta em pt-BR. Avatar: `alt={nome}` com fallback nas iniciais.
- **Contraste mínimo de 4.5:1** para texto sobre fundo (WCAG AA). Os tokens do projeto (`text-foreground` sobre `bg-background`, `text-muted-foreground` sobre `bg-card`) já passam — desvio só com motivo claro.
- **Foco inicial em Modal/Drawer/ConfirmDialog**: Radix põe foco no primeiro elemento focável; se há campo de input principal, garanta que ele seja o primeiro. Em `ConfirmDialog` destrutivo, **foco fica no botão de cancelar**, não no de confirmar (evita confirmação acidental no `Enter`).
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

## Convenções do projeto

### Imports

- Use o alias `@/` para imports internos (ex.: `@/components/ui/button`, `@/lib/utils`).
- Não use caminhos relativos longos (`../../../`) — troque por `@/`.

### Rotas (TanStack Router code-based)

- Cada tela em `screens/<nome>/` tem seu próprio `routes.ts` com `createRoute` + `lazyRouteComponent`, e é registrada na árvore em [`src/routes.tsx`](src/routes.tsx).
- Rotas protegidas ficam sob `protectedLayoutRoute` (que envolve `SessionValidation` + `Layout`). Login/signup ficam fora dela.
- `defaultPreload: 'intent'` já está ativo — não precise reconfigurar.
- Use `staticData: { breadcrumb: '...' }` para alimentar o breadcrumb global.
- Use o `Link` global em `src/components/global/link/link.tsx` para navegação no aplicativo. Ele recebe `href` como um `<a>` padrão e:
  - para caminhos internos same-origin, usa o roteamento cliente do TanStack Router;
  - para links externos, `target="_blank"`, `mailto:`, `tel:` ou clique do scroll, preserva o comportamento nativo do navegador.
  - não confunda com `Link` do `@tanstack/react-router` importado diretamente; aliase quando precisar usar os dois no mesmo arquivo.
- **Toda rota protegida declara `errorComponent`** — sem isso, um erro lançado no render derruba o app inteiro num fallback genérico. Use o [`ErrorFallback`](src/components/global/errorFallback) global, que mostra mensagem amigável em pt-BR + botão "Tentar novamente" disparando `router.invalidate()` (refaz loaders e remonta a rota).

Esqueleto para nova tela + rota:

```ts
// src/screens/minha-tela/routes.ts
import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { protectedLayoutRoute } from '@/routes';
import { ErrorFallback } from '@/components/global/errorFallback';

export const minhaTelaRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/minha-tela',
  staticData: { breadcrumb: 'Minha tela' },
  component: lazyRouteComponent(() => import('.'), 'MinhaTela'),
  errorComponent: ErrorFallback,
});
```

Depois, registre em [`src/routes.tsx`](src/routes.tsx).

### Organização de telas

`screens/<feature>/index.tsx` deve ficar **enxuto** — apenas o shell da tela: orquestração de abas, layout principal, navegação e chamadas a hooks/serviços. Quando a tela cresce com várias seções lógicas (abas, blocos extensos, dialogs específicos, formulários grandes), **promova para pasta** e separe cada bloco em seu próprio arquivo. Não empilhe `OverviewTab`, `ActivityTab`, `PermissionsTab` etc. num único arquivo gigante.

❌ Tudo num só `userDetails.tsx`:

```tsx
function OverviewTab() { ... }      // 40 linhas
function ActivityTab() { ... }      // 60 linhas
function PermissionsTab() { ... }   // 50 linhas
function SessionsTab() { ... }      // 70 linhas

export function UserDetailsPage() {
  return <Tabs>...</Tabs>;
}
```

✓ Pasta com uma seção por arquivo:

```
screens/users/userDetails/
├── index.tsx              # UserDetailsPage — só o shell, monta as abas
├── overviewTab.tsx        # exporta OverviewTab
├── activityTab.tsx        # exporta ActivityTab
├── permissionsTab.tsx     # exporta PermissionsTab
└── sessionsTab.tsx        # exporta SessionsTab
```

Cada arquivo exporta apenas o seu componente público. Helpers privados (constantes de ícones, sub-componentes usados em uma única seção, type guards locais) ficam **dentro do arquivo onde são usados**, não num `utils.ts` compartilhado por reflexo. Utilitários compartilhados entre lista e detalhe (ex.: `getInitials`, mapas de variante de `Badge`) vivem ao lado do `routes.ts` da feature (`screens/<feature>/getInitials.ts`, `screens/<feature>/userBadges.ts`).

O `lazyRouteComponent(() => import('./userDetails'), 'UserDetailsPage')` continua funcionando sem mudança — o resolver acha `userDetails/index.tsx` automaticamente.

O mesmo padrão vale para a lista (`index.tsx` da feature) quando ela ganha extensão: extraia colunas, filtros e células custom para arquivos próprios em vez de inflar o componente da página.

#### Uma pasta por sub-tela da feature

Quando a feature tem telas distintas (listagem, detalhe — e às vezes criar/editar dedicados), **cada sub-tela ganha sua própria pasta** com o `index.tsx` daquela tela + **os componentes que só existem nela**. Regra dura:

- **Componente/utilitário exclusivo de uma sub-tela → dentro da pasta daquela sub-tela.** Um modal/skeleton/célula que só aparece nos detalhes mora em `details/`; o que só aparece na listagem, em `list/`.
- **Compartilhado entre sub-telas → numa pasta `utils/` da feature — nunca solto na raiz.** Os arquivos comuns (campos de formulário reaproveitados por criar **e** editar, `queryKeys.ts`, constantes, helpers) ficam em `screens/<feature>/utils/`. A raiz da feature guarda só o que é do próprio roteamento (`routes.ts` e o layout da feature).
- Nunca deixe um componente exclusivo de uma tela "solto" na raiz da feature — se só uma tela usa, ele pertence à pasta dela; se mais de uma usa, vai para `utils/`.

Exemplo real (feature Usuários):

```
screens/users/
├── routes.ts, usersLayout.tsx        # feature (roteamento)
├── utils/                            # comuns/compartilhados (nunca soltos na raiz)
│   ├── userFormFields.tsx            # reaproveitado por criar + editar
│   ├── userImageField.tsx
│   ├── jobRoles.ts
│   └── queryKeys.ts
├── list/
│   ├── index.tsx              # UsersPage (listagem)
│   ├── createUserModal.tsx    # ação exclusiva da listagem
│   └── userListSkeleton.tsx
└── details/
    ├── index.tsx              # UserDetailsPage
    ├── editUserModal.tsx      # ação exclusiva do detalhe
    └── userDetailSkeleton.tsx
```

No `routes.ts`, cada rota aponta para a pasta da sua sub-tela: `lazyRouteComponent(() => import('./list'), 'UsersPage')` e `lazyRouteComponent(() => import('./details'), 'UserDetailsPage')`. (Chamadas de API continuam fora de `screens/`, em `services/<módulo>/` — ver seção HTTP.)

**Não embrulhe a tela inteira num wrapper de spacing/padding.** O [`Layout`](src/components/global/layout/layout.tsx) global já aplica `space-y-4` ao container que recebe `children`, então os filhos diretos do componente da tela (`<PageHeader />`, `<section>`, `<Tabs>`, grids) **já ficam espaçados automaticamente**. Adicionar `<div className="space-y-6">…</div>` (ou outro `space-y-*` / `p-*`) na raiz da tela é redundante, descalibra o ritmo visual entre telas e empilha uma `<div>` à toa.

❌ Wrapper redundante:

```tsx
export function DashboardPage() {
  return (
    <div className="space-y-6">           {/* o Layout já faz isso */}
      <PageHeader ... />
      <StatsGrid />
      <ActivityChart />
    </div>
  );
}
```

✓ Filhos soltos sob um Fragment (`<>` somente se houver `<PageActions>` ou múltiplos irmãos):

```tsx
export function DashboardPage() {
  return (
    <>
      <PageActions>...</PageActions>
      <PageHeader ... />
      <StatsGrid />
      <ActivityChart />
    </>
  );
}
```

Só introduza um wrapper na raiz quando precisar de um comportamento de layout real que o Layout não cobre — ex.: a tela quer ocupar 100% da altura disponível (`flex h-full min-h-0 flex-col`, como na lista de usuários). Nesse caso, o wrapper paga pelo seu lugar; spacing puro não.

### Ações da tela ficam no topo (`PageActions`)

**Toda ação primária/contextual de uma tela (Novo, Editar, Excluir, Salvar, Cancelar…) vai no topo, via [`PageActions`](src/components/global/layout/pageActions.tsx)** — o slot exportável que renderiza (por portal) no header global do [`Layout`](src/components/global/layout/layout.tsx), ao lado do breadcrumb. **Não** crie uma barra de ações própria no corpo da tela, nem espalhe botões de ação soltos no meio do conteúdo.

- **Todo botão do `PageActions` colapsa para ícone no mobile — sem exceção.** O header divide o espaço com o breadcrumb; botão só-texto empurra e quebra o breadcrumb em telas estreitas. Portanto **cada** ação (inclusive `Cancelar`, `Descartar`, `Criar`/`Salvar alterações`, não só `Excluir`) segue o mesmo padrão: **ícone + `aria-label` em pt-BR + texto em `<span className="hidden sm:inline">`**. No mobile fica só o ícone; no desktop, ícone + texto. Nunca deixe um botão de ação só com texto (empurra o breadcrumb) nem só com ícone sem `aria-label` (quebra a acessibilidade). Ícones canônicos: Cancelar/Descartar → `X`, salvar/confirmar → `Check`, criar → `Plus`/ícone do módulo, excluir → `Trash2`.

  ```tsx
  <Button aria-label="Salvar alterações" type="submit" form={FORM_ID}>
    <Check />
    <span className="hidden sm:inline">Salvar alterações</span>
  </Button>
  ```

  O `aria-label` também mantém o nome acessível estável para os testes (`getByRole('button', { name: 'Salvar alterações' })`) mesmo com o texto oculto no mobile.

- Ações destrutivas/críticas usam `ConfirmDialog` (ver seção de Abstrações globais).
- A ordem visual segue: ações secundárias/destrutivas à esquerda, ação primária à direita (ex.: `Excluir` sozinho; ou `Descartar` … `Salvar alterações` quando há mudança).

**Ação de uma seção (não da tela) vai no slot `action` do `Card`** — alinhada à direita do cabeçalho, não solta acima/dentro do corpo. Ação da _tela_ inteira continua no `PageActions`; ação de uma _seção_ (ex.: "Adicionar item" numa coleção-filha) fica no `action` do `Card` que a envolve.

```tsx
<Card
  title="Membros"
  description="Pessoas com acesso a este projeto."
  action={
    <Button variant="outline" size="sm">
      <Plus />
      Adicionar membro
    </Button>
  }
>
  {/* … lista … */}
</Card>
```

### Detalhe = Edição (edição sempre liberada; salvar aparece quando há mudança)

**Quando uma entidade tem edição, a tela de detalhe É a tela de edição — não crie uma tela separada só de visualização.** Regra de produto: **a ação tem que ser o mais simples possível** — a tela **abre já editável**, sem passo intermediário de "Editar". Os campos ficam editáveis desde o primeiro render; **o `Salvar alterações` só aparece quando há mudança** (o formulário fica _dirty_). No topo (`PageActions`):

- **Sem mudanças (form pristine):** só **`Excluir`** (se permitido). Nada de `Editar`, nada de `Salvar`.
- **Com mudanças (form dirty):** o `Excluir` **some** e aparecem **`Descartar`** + **`Salvar alterações`**. `Descartar` reverte o formulário (`reset()` — volta ao último estado salvo/carregado); `Salvar alterações` persiste **sem trocar de rota** e, ao concluir, o form volta a pristine (aí o `Salvar`/`Descartar` some e o `Excluir` reaparece).
- **Sem permissão de update** (ou entidade protegida/de sistema): a tela cai em **modo leitura** — os campos ficam `readOnly`/`disabled` e não há fluxo de salvar; só o `Excluir` (se houver permissão de delete). Ou seja, `readOnly` é derivado **da permissão**, não de um toggle de UI.
- **Criação (`/create`)** é sempre editável: **`Cancelar`** (volta à lista) sempre visível + **`Criar`** que aparece quando há mudança (form dirty).

Gate por permissão: o fluxo de salvar/descartar só existe com a permissão de update; `Excluir` só com a de delete. A rota de detalhe e a de criação reusam **o mesmo componente de formulário** (não duplique).

Implementação (aprendizados que evitam bugs sutis — seguir à risca):

- **Estado _dirty_ vem do RHF (`formState.isDirty`), não de `useState`.** Não crie um `editing`/`setEditing`. `readOnly` = `isDetail && !podeEditar` (a permissão), e o par `Descartar`/`Salvar alterações` renderiza sob `!readOnly && isDirty`.
- **Ao salvar, volte o form a pristine.** No `onSuccess` de update, faça `reset(getValues())` para adotar os valores atuais como novo baseline (`isDirty` → `false`). Se os filhos têm IDs do servidor que só chegam no refetch (coleção-filha com endpoints próprios), ressincronize o form com os dados refetchados **quando já estiver pristine** (guarde com um `ref` de `isDirty` para não sobrescrever uma edição em andamento por refetch de fundo).
- **`defaultValues` precisam bater com o que os controles produzem** — senão o form nasce _dirty_ à toa (ex.: campo `undefined` no default mas `''` no controle). Use mapeadores `entityToFormValues` que normalizam tudo. `setValue` que alimenta campo controlado precisa de `shouldDirty: true` para revelar o `Salvar`.
- **Leitura por tipo de campo (quando `readOnly` por falta de permissão) — NÃO use `<fieldset disabled>`.** O `fieldset` impede **copiar** o texto e não trava o dropdown do `Select` (Radix) nem widgets externos (ex.: campo de telefone). Em vez disso: campos de **texto** (`InputField`, `TextArea` e derivados como campos mascarados) recebem **`readOnly`** (ficam selecionáveis/copiáveis, mas não editáveis); os controles **sem seleção de texto** (`Select`, `Switch` e afins) recebem **`disabled`** (não abrem/não trocam). Os fields globais passam `disabled`/`readOnly` para o controle renderizado, **não** para o `useController` — então isso **não** zera o valor no RHF. Uma seção recebe um único flag `readOnly` e também o usa para **esconder** botões de adicionar/remover em leitura. O `ui/input` e `ui/textarea` têm um leve realce de leitura (`read-only:bg-muted/40`).
- **Monte o formulário só com os dados prontos** (casca que faz as queries + gate de loading → componente interno com `useZodForm({ defaultValues })`). Setar valor depois via `values`/`reset` do RHF **não sincroniza** com `Select` do Radix (o valor fica vazio). Use `key` estável no interno (ex.: `key={id ?? 'create'}`).
- **`key` distinta em cada botão de ação** do `PageActions`. Sem isso, o React reusa o mesmo nó `<button>` entre um botão `type="button"` (ex.: `Descartar`) e um `type="submit"` (`Salvar alterações`) na mesma posição — o clique passa a submeter o formulário sem querer.

### Ações de item: coleção-filha (inline) × lista de topo (menu "⋯")

Há **dois** padrões de ação sobre itens, e eles **não se misturam**. Antes de criar uma tela com itens editáveis, decida em qual caso você está e siga o padrão correspondente — não invente um terceiro (ex.: modal com "Salvar" próprio para um filho).

**1. Coleção-filha dentro de um detalhe/formulário** (endereços e contatos do Cliente; localizações do Armazém; itens/anexos de um cadastro). A coleção pertence a uma entidade-pai que tem tela de detalhe no padrão **Detalhe = Edição**. Regras **obrigatórias**:

- **Sem CRUD próprio, sem "Salvar" separado.** Nada de modal por item com botão de salvar próprio, nem de chamada à API por linha no `onClick`. Criar/editar/remover filhos é **inline** e é **persistido pelo mesmo `Salvar alterações` do topo** do pai — junto com o resto do formulário.
- Como a tela abre já editável (ver "Detalhe = Edição"), os filhos já vêm como **linha editável** (`useFieldArray`): há um botão **"Adicionar X"** (append) e um ícone de **remover** (`X`/`Trash2`, `type="button"`) por linha. Nenhum desses botões submete o form; mexer neles deixa o pai _dirty_ e faz o `Salvar alterações` aparecer. (Só ficam estáticos/read-only quando o pai inteiro está em modo leitura por **falta de permissão** de update.)
- **Prefira uma tabela compacta (uma linha por item) a um card grande por item.** Cada linha é uma linha de formulário; o cabeçalho da coluna é o rótulo visual, então os campos in-cell usam **`srOnlyLabel`** (rótulo acessível ao leitor de tela, oculto visualmente — evita repetir o rótulo em cada célula). Campos secundários/raros (ex.: conversão de unidade, opções avançadas) ficam atrás de um **popover por linha** (disclosure progressivo), não poluindo a linha. Tabela larga rola horizontalmente (`overflow-x-auto` no container — ver "Design responsivo"), nunca esconda coluna no mobile.
- No `Salvar alterações` do topo: se o backend tem um endpoint que grava o pai **com** os filhos (ex.: Cliente — o servidor recria os filhos), mande tudo num payload só. Se os filhos têm **endpoints próprios** (ex.: Armazém → `/locations`), **faça o diff** (criar/editar/excluir) contra o estado original e dispare as chamadas **na mesma ação de salvar**, depois invalide. Ressincronize o form com os dados do servidor após salvar (senão uma linha nova sem `id` é recriada no próximo salvar).
- Gate de permissão por ação do filho continua valendo (ex.: `Adicionar` só com a permissão de criar do filho).
- Referências vivas: **Clientes** (`screens/customers/form/` — `contactsTable.tsx`, `addressFields.tsx`) e **Armazéns** (`screens/warehouses/details/` — `locationsFieldArray.tsx` + diff em `schema.ts`).

**2. Lista de topo (entidades de 1ª classe numa `DataTable`)** — Usuários, Clientes, Perfis, Indicadores, Armazéns (a **listagem**).

- **Editar é SEMPRE pelo clique na linha** (`onRowClick` + `getRowHref`), que abre o detalhe/modal de edição. **Nunca** coloque uma ação "Editar" no menu "⋯" — ela seria redundante com o clique na linha e o usuário deve aprender um gesto único para editar.
- O **menu "⋯"** (`actionsColumn` de `components/global/dataTable/columnHelpers`) existe só para as ações que **não são** "abrir/editar": `Excluir` (destrutivo em vermelho), `Ativar/Inativar`, `Bloquear/Desbloquear`, `Copiar…` etc. Se, tiradas essas, não sobra nenhuma ação para a qual o usuário tenha permissão, **não renderize a coluna** (só inclua `actionsColumn` quando houver ação efetiva).
- **Não** use ícones de ação soltos na célula nem um layout de ações diferente por tela — clique na linha (editar) + "⋯" (demais ações) é o padrão único.

Resumo: **item de lista de topo → clique na linha edita; "⋯" só para Excluir/toggle de status/ações auxiliares (e some se não sobrar ação permitida). Filho de um detalhe → inline, sem save próprio, tudo pelo `Salvar alterações` do topo do pai.**

### HTTP

- Use a instância `api` de [`src/services/api`](src/services/api) — ela já trata `baseURL`, `withCredentials: true` (cookie) e toasts via interceptors. **Não crie axios direto.**
- Para server state: TanStack Query (`useQuery` / `useMutation`) com o `queryClient` de [`src/lib/queryClient.ts`](src/lib/queryClient.ts). Não use `useEffect` + `fetch`.

#### Onde vivem as chamadas de API — `services/<módulo>/`

**Toda função que fala com o backend vive em `src/services/<módulo>/` — nunca co-localizada na tela (`screens/...`) nem dentro de `services/api/`.** Cada módulo tem sua pasta (ex.: `services/users/`, `services/session/`), que agrupa os **tipos/schemas** e as **chamadas** (`api.get/post/put/delete`) daquele domínio. A tela (`screens/...`) importa essas funções e as consome via TanStack Query — **não** chama `api.*` direto, nem define `fetch*`/`create*` inline.

- **`services/api/`** é só o **cliente** `api`: a instância axios (`api.ts`), os interceptors (`errorHandlers.ts`), tipos do cliente e helpers genéricos de transporte (ex.: `upload.ts`). **Não** coloque chamadas de domínio aqui.
- **`services/<módulo>/`**: as chamadas daquele domínio + seus tipos. Modelo de referência: o `services/session/` já existente (`sessionService.ts`, `authMapper.ts`, `types.ts`). Quando o módulo cresce, separe por responsabilidade — ex.: `services/users/` → `userListApi.ts` (listagem + params), `userDetailApi.ts` (detalhe), `userFormApi.ts` (criar/editar/ações + dados auxiliares). Cada arquivo mantém o schema Zod **junto** do fetch que o usa, derivando o tipo com `z.infer<typeof schema>` (fonte de verdade do shape ao lado do parser).
- Atualize o schema/tipo quando o contrato da API mudar; importe-os em hooks, telas e testes a partir do arquivo do módulo.

❌ `screens/users/userListApi.ts` (chamada de API dentro de `screens/`)
❌ `services/api/users/userListApi.ts` (chamada de domínio dentro de `services/api/`)
✓ `services/users/userListApi.ts` (chamada no módulo, importada pela tela)

#### Convenção de `queryKey`

`queryKey` é a identidade do dado no cache — ela determina o que é deduplicado, o que é invalidado e o que sobrevive a uma navegação. Sem convenção firme, uma tela invalida `['users']`, outra invalida `['user-list']` e nada bate.

**Use array hierárquico, do mais genérico ao mais específico:**

```ts
['users']; // lista global
['users', { page: 1, search: 'maria' }]; // lista paginada/filtrada
['users', userId]; // detalhe
['users', userId, 'permissions']; // sub-recurso do detalhe
['users', userId, 'sessions']; // outro sub-recurso
```

A regra mental: o primeiro elemento é o **recurso**, o segundo é o **identificador** (ou objeto de filtros), e os elementos seguintes são **sub-recursos**. Filtros vão como objeto (`{ page, search }`), nunca concatenados em string (`['users-page-1-maria']`) — TanStack Query compara estruturalmente.

**Factory por feature.** Para cada feature, exporte um `queryKeys` factory em `screens/<feature>/queryKeys.ts` (ou no arquivo de serviço) — assim a tela, o hook e a mutation falam a mesma língua:

```ts
// screens/users/queryKeys.ts
export const userKeys = {
  all: ['users'] as const,
  list: (filters: UserFilters) => [...userKeys.all, filters] as const,
  detail: (id: string) => [...userKeys.all, id] as const,
  permissions: (id: string) => [...userKeys.detail(id), 'permissions'] as const,
};
```

**Invalidação: invalide o prefixo certo, não o mundo.** `invalidateQueries({ queryKey: userKeys.all })` invalida tudo que começa com `['users']` — lista, detalhe, sub-recursos. Use isso para "alguma coisa no domínio mudou, recarregue". Para invalidação cirúrgica, passe a key mais específica.

```ts
// editou permissões de um usuário
queryClient.invalidateQueries({ queryKey: userKeys.permissions(id) }); // só esse sub-recurso
// criou usuário novo
queryClient.invalidateQueries({ queryKey: userKeys.all }); // refaz lista e qualquer detalhe stale
```

**Nunca chame `invalidateQueries()` sem args** — invalida o cache inteiro e derruba todas as telas montadas.

**`setQueryData` vs `invalidateQueries`**: se você já tem a resposta da API em mãos (POST que retorna o registro criado), use `setQueryData(userKeys.detail(id), data)` para popular o cache sem ida ao servidor. `invalidate` é para forçar refetch quando não temos o dado novo.

#### Toda tela usa TanStack Query

Qualquer dado vindo do servidor entra na tela via **TanStack Query** — sem exceção. Não há `useEffect` + `fetch`, não há `useState` espelhando resposta de API, não há `axios` chamado direto no `onClick`. Isso não é preferência estética: o cache compartilhado, deduplicação, refetch em foco, retry, devtools e integração com router só funcionam se **todo mundo** usar a biblioteca.

**Estrutura mínima de uma tela com dados:**

```tsx
const { data, isPending, isError, refetch } = useQuery({
  queryKey: userKeys.list(filters),
  queryFn: () => api.get('/users', { params: filters }).then((r) => r.data),
  staleTime: 30_000,
});

if (isPending) return <UsersListSkeleton />;
if (isError) return <ErrorFallback onRetry={refetch} />;
return <UsersTable rows={data} />;
```

**Técnicas que toda tela deve aplicar quando se aplicarem:**

**1. `staleTime` consciente, não default.** O default do TanStack Query é `staleTime: 0` — qualquer remontagem refetcha. Para uma listagem que muda pouco (catálogo, settings), use `staleTime: 60_000` (1 min) ou mais; para dado volátil (saldo, status em tempo real), `staleTime: 0` é correto. Sem `staleTime` definido, navegar entre telas vira "carregando..." perpétuo.

**2. `staleTime` ≠ `gcTime`.** `staleTime` decide quando o dado é considerado velho (e refetcha em background); `gcTime` decide quando o dado **sai do cache** depois que nenhum componente o usa (default 5 min). Para dados consultados várias vezes na mesma sessão (perfil do usuário logado), aumente `gcTime` para evitar refetch ao voltar pra uma tela já visitada.

**3. `placeholderData` para paginação/filtro sem flicker.** Em listas paginadas, ao trocar de página o default é "limpar tudo e mostrar skeleton". Com `placeholderData: keepPreviousData` (ou função custom), a tela mantém os dados anteriores enquanto a nova página carrega — sem layout jumping. Já usado em `useDataTableQuery`; replique em listas custom.

```ts
import { keepPreviousData } from '@tanstack/react-query';
useQuery({ queryKey, queryFn, placeholderData: keepPreviousData });
```

**4. `enabled` para queries dependentes.** Quando uma query depende de outra (`useQuery` do detalhe depende do `id` que veio da rota), nunca chame com `id` vazio — passe `enabled: !!id`. Sem isso, a query roda com `undefined` e a API retorna 404.

```ts
useQuery({
  queryKey: userKeys.detail(id),
  queryFn: () => api.get(`/users/${id}`).then((r) => r.data),
  enabled: !!id,
});
```

**5. Prefetch em hover / loader de rota.** `defaultPreload: 'intent'` do TanStack Router já dispara prefetch do **chunk** ao passar o mouse — mas **não** prefetcha os dados. Para tela rápida sem skeleton, prefetch o dado em paralelo:

```ts
// no routes.ts da tela
loader: ({ params }) =>
  queryClient.prefetchQuery({
    queryKey: userKeys.detail(params.id),
    queryFn: () => api.get(`/users/${params.id}`).then((r) => r.data),
  }),
```

Quando o usuário chega na tela, o `useQuery` encontra o cache pronto e renderiza sem loading.

**6. Mutations expõem estado, não inventam.** Use `isPending`, `error`, `isSuccess` da `useMutation` — não crie `useState('loading' | 'idle')` paralelo. O `Button` global aceita `loading={mutation.isPending}` direto.

```tsx
const mutation = useMutation({ mutationFn: api.createUser });
<Button loading={mutation.isPending} onClick={() => mutation.mutate(data)}>
  Criar
</Button>;
```

**7. Invalide na hora certa.** Após mutation, invalide a key afetada em `onSuccess` (ou `onSettled` se a UI precisa esperar o refetch antes do próximo passo). Veja a subseção "Convenção de `queryKey`" acima.

**8. `refetchOnWindowFocus`**: ligado por default — bom para dado que envelhece (dashboard, lista de tickets). Para dado caro/raro de mudar, desligue na query específica (`refetchOnWindowFocus: false`), não globalmente.

**9. Deduplicação é automática.** Dois componentes que chamam `useQuery` com a **mesma `queryKey`** ao mesmo tempo disparam **uma** requisição. Aproveite isso: extraia hooks (`useUserDetail(id)`) e use em quantos lugares precisar — não há custo de rede extra.

**10. `useInfiniteQuery` para "carregar mais" / scroll infinito.** Não recrie scroll infinito com `useState([...itens, ...novos])`. `useInfiniteQuery` cuida de paginação cumulativa, `getNextPageParam`, e expõe `fetchNextPage` + `hasNextPage`.

**11. DevTools no dev.** O `@tanstack/react-query-devtools` está disponível — mantenha montado em desenvolvimento (oculto por default). Cache, key, estado de cada query ficam inspecionáveis sem `console.log`.

**Anti-padrões a evitar:**

- ❌ `useState` + `useEffect(() => fetch(...))` — substitua por `useQuery`.
- ❌ `useQuery` dentro de `useEffect` ou dentro de condicional — sempre top-level do componente; use `enabled` para condicionar.
- ❌ `queryKey: ['users']` em duas telas com filtros diferentes — vira mesma entrada de cache e uma sobrescreve a outra.
- ❌ `queryClient.invalidateQueries()` sem args — derruba o cache inteiro.
- ❌ Espelhar `data` em `useState` local — duplica fonte de verdade; consuma `data` direto.
- ❌ Chamar `api.get` no `onClick` para "atualizar a tela" — invalide a queryKey, o `useQuery` refetcha sozinho.

**Optimistic updates** — quando a mutação é simples (toggle, delete, edit de campo único) e o servidor raramente recusa, antecipe o resultado no cache pra UI parecer instantânea:

```tsx
const mutation = useMutation({
  mutationFn: api.toggleFollow,
  onMutate: async () => {
    await queryClient.cancelQueries({ queryKey: KEY });
    const previous = queryClient.getQueryData(KEY);
    queryClient.setQueryData(KEY, (prev) => !prev); // mudança otimista
    return { previous }; // snapshot pro rollback
  },
  onError: (_err, _vars, context) => {
    queryClient.setQueryData(KEY, context?.previous); // rollback
    toast.error('Falha ao atualizar.');
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }), // revalida
});
```

Veja o padrão demonstrado na story `Padrões/OptimisticUpdate` no Storybook (`npm run storybook`). Use só onde a latência percebida vale o risco de inconsistência momentânea — pra fluxos críticos (pagamento, perfil), prefira o pattern padrão com loading visível.

### Sessão e autenticação

- Sessão por cookie HTTP-only. `SessionValidation` ([`src/components/global/layout/sessionValidation.tsx`](src/components/global/layout/sessionValidation.tsx)) valida antes de renderizar rotas protegidas.
- Usuário fica em `useSessionStore` ([`src/hooks/useSessionStore.ts`](src/hooks/useSessionStore.ts)) — Zustand.

### Estado global

- Zustand para client state global compartilhado (sessão, tema).
- TanStack Query para server state — não duplique resposta de API no Zustand.
- Estado local de tela: `useState` normal.

### Formulários

- Use `useZodForm` ([`src/lib/forms/useZodForm.ts`](src/lib/forms/useZodForm.ts)) — integra React Hook Form com schema Zod.
- Componentes de campo prontos em [`src/components/global/form/`](src/components/global/form) (`inputField`, `numberField`, `select`, `dateField`, `dateTimeField`, `checkbox`, `switch`, `textArea`, `multiSelect`).
- **Campo numérico/monetário/decimal SEMPRE via [`NumberField`](src/components/global/form/numberField.tsx) — nunca `<input type="number">`.** Ele aplica máscara pt-BR (milhar "." e decimal ",") **na digitação e na exibição**, guarda um `number` no RHF (não a string), e mostra o zero mascarado como placeholder. Para dinheiro passe `prefix="R$ "`; ajuste as casas com `maxDecimals` (padrão 2; ex.: 5 para taxas/índices). O `type="number"` nativo não formata milhar/decimal pt-BR, aceita `e`/`+`/`-` e tem setas indesejadas — não use para quantidade/valor.
- Todos seguem o mesmo padrão: aceitam **uncontrolled** (`{...register('campo')}` + `errors`) **ou controlled** (`control` + `name` + opcional `rules`/`defaultValue`). Discriminated union impede misturar os dois modos.
- Veja [`src/screens/session/login.tsx`](src/screens/session/login.tsx) e a story `Formulário/Formulário completo` no Storybook como referência.

#### Nenhum input sem placeholder (regra dura)

**Todo campo de entrada tem um `placeholder` que orienta o que digitar/selecionar — sem exceção.** Vale para `InputField`, `NumberField`, `MaskedInputField`, `TextArea`, `Select`/`MultiSelect`, `DateField`/`DateTimeField`, qualquer `Combobox`/campo pesquisável, e os filtros da `DataTable`/barra de filtros. Um campo sem placeholder (só o rótulo e a caixa vazia) deixa o usuário sem pista do formato/ação esperados.

- O placeholder **complementa** o rótulo, **nunca o substitui** (o `label` continua obrigatório — ver a11y "Toda input precisa de label").
- **Texto/número/máscara:** exemplo do formato/conteúdo esperado ("Digite o código", "seu@email.com"). `DateField` já usa "dd/mm/aaaa"; `NumberField` já mostra o zero mascarado.
- **Select/Combobox/MultiSelect:** ação de escolha ("Selecione", "Selecione o cliente", "Todos" nos filtros multi).
- **Únicas exceções** (não têm placeholder por natureza): `Switch`, `Checkbox`, `RadioGroup` e campos read-only de exibição.

#### `readOnly` copiável × campo-espelho inerte

Há **duas** situações de `readOnly` num `InputField`/`TextArea` — não as confunda:

- **Travado por permissão** (o form inteiro em modo leitura por falta de `update`): o campo continua **focável e selecionável** de propósito — o usuário precisa **copiar** o valor (CNPJ, código do lote, etc.). É o `readOnly` documentado em "Detalhe = Edição". **Não** o torne inerte.
- **Campo-espelho de exibição** (mostra um valor **derivado** que o usuário nunca digita — ex.: "Cliente" espelhando o pedido de origem, "Peso líquido" calculado): renderizar como `<input readOnly>` deixa ele **focável e com realce de seleção**, o que parece um bug ("o campo disabled ainda seleciona texto"). Torne-o **inerte**: `readOnly` + `tabIndex={-1}` + `className="pointer-events-none select-none"`. Fica com o visual de campo (alinha no grid), mas sem foco nem seleção. Julgue pelo campo: se o valor vale a pena copiar (código de lote/corrida), mantenha selecionável; se é só um espelho de contexto, deixe inerte.

#### Cobertura obrigatória com Zod

**Todo formulário precisa ter cada campo coberto por um schema Zod — sem exceção.** A validação acontece **antes** do submit e antes de qualquer chamada à API. O schema é a fonte de verdade do shape e das regras do formulário; nada de validação ad-hoc dentro do `onSubmit` ou em `useState`.

- **Defina um schema por formulário** com `z.object({ ... })` colocando regra apropriada em cada campo (`z.string().min(1, 'Obrigatório')`, `z.string().email('E-mail inválido')`, `z.coerce.number().int().positive()`, etc.). Não deixe campo "solto" — se ele existe no form, ele existe no schema.
- **Mensagens de erro em pt-BR** dentro do próprio schema (`{ message: 'Informe um CPF válido.' }`). Erros do Zod chegam direto nos `errors` dos fields — não reescreva no componente.
- **Tipos derivam do schema**: `type FormData = z.infer<typeof schema>`. Não declare uma `interface` paralela ao schema — quando ela diverge, o form mente.
- **Validações com dependência entre campos** vão em `.refine()` / `.superRefine()` (ex.: `passwordConfirm === password`, `endDate >= startDate`), não em `useEffect`.
- **Transformações de entrada/saída** (máscaras de CPF/telefone, parse de data) ficam no schema via `.transform()` ou nos utilitários de [`src/lib/dateTime/`](src/lib/dateTime). Não duplique no `onSubmit`.
- **Resposta da API que vira valor inicial** (modo edição) também passa por um schema — defina `apiSchema` e use `.parse()` antes de jogar no `defaultValues`. Servidor não é fonte de verdade do shape do cliente.

❌ Validação à mão fora do schema:

```tsx
const onSubmit = (data: FormData) => {
  if (!data.email.includes('@')) {
    toast.error('E-mail inválido');
    return;
  }
  // ...
};
```

✓ Tudo no schema, o form bloqueia o submit sozinho:

```ts
const schema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(8, 'Mínimo de 8 caracteres.'),
});
type FormData = z.infer<typeof schema>;
```

### Variáveis de ambiente

- Validadas em [`src/lib/env.ts`](src/lib/env.ts) com Zod no boot — falha rápido se faltar.
- Ao adicionar uma env, declare-a no schema **e** em [`.env.example`](.env.example).
- Variáveis devem começar com `VITE_` para serem expostas ao cliente.

### Notificações

- `sonner` (Toaster montado no `Layout`). Os interceptors do `api` já disparam toasts de erro — não duplique no caller.
- **Cores por tipo** (em [`ui/sonner.tsx`](src/components/ui/sonner.tsx)): `richColors` ligado; sucesso em **verde** (`--success`) e erro em **vermelho** (`--destructive`), derivados dos tokens semânticos. O mix de cor é em **`srgb`** (não `oklch`) — no oklch a interpolação de matiz contra o neutro puxa o verde para o lado errado no dark. Ao mexer nas cores do toast, mantenha `in srgb`.

### shadcn/ui

- Adicione componentes via CLI: `npx shadcn@latest add <nome>`. **Não escreva à mão.**
- Customize `components/ui/<x>.tsx` localmente quando necessário; mas só edite o que foi gerado pelo shadcn.
- **Componentes próprios (não-shadcn) ficam em `components/global/`, não em `components/ui/`.** Exemplo: o primitivo `MultiSelect` é escrito à mão e vive em [`global/form/multiSelectPrimitive.tsx`](src/components/global/form/multiSelectPrimitive.tsx), ao lado do wrapper integrado ao `react-hook-form`.
- Wrappers genéricos só com ganho real (API simplificada, default visual do projeto, integração com `react-hook-form`). Quando criar um, siga o padrão em **Abstrações globais** abaixo.
- Use `cn()` de [`src/lib/utils.ts`](src/lib/utils.ts) para concatenar classes do Tailwind.

### Abstrações globais (`components/global/`)

Wrappers sobre primitivos do shadcn que padronizam API, defaults visuais (incluindo dark mode) e integração com `react-hook-form`.

**Regra dura: sempre prefira a abstração de `components/global/` antes de importar do `components/ui/`.** O `components/ui/` é o andar do primitivo shadcn cru — ele existe para alimentar o `global/`, não para ser consumido direto pelas telas. Quando você importa `@/components/ui/...` numa tela, você está pulando a camada que padroniza dark mode, espaçamento, integração com `react-hook-form` e tom visual do projeto — e a próxima tela vai parecer diferente da anterior.

- **Antes de importar de `components/ui/`**, varra `components/global/` (incluindo `global/form/`) atrás de equivalente. Se já existe, use o global.
- **Se faltar a abstração**, crie uma nova em `components/global/<nome>/` seguindo o padrão da seção "Padrão para criar uma nova abstração global" abaixo — assim a próxima tela já encontra pronto. Não saia importando `ui/` direto "só por essa vez".
- **Exceções legítimas para importar de `ui/` direto**: (1) você está escrevendo a própria abstração `global/` que envolve aquele primitivo; (2) é um primitivo composicional puro sem equivalente global (ex.: `Tabs`, `Sheet`, `Popover` usados como blocos de layout). Em nenhum caso `Button`, `Card`, `Input`, `Select`, `Dialog`, `Checkbox`, `Switch`, `Textarea` devem ser importados de `ui/` numa tela — todos têm wrapper global.

Use estes antes de cair direto no `components/ui/`:

| Abstração       | Caminho                                                                                    | Quando usar                                                                                                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Card`          | [`card/card.tsx`](src/components/global/card/card.tsx)                                     | Container de conteúdo com `title` + `description` + `children`. Já trata `bg-card`, borda, `shadow-sm` (light) e `dark:shadow-none`.                                                                                    |
| `Modal`         | [`modal/modal.tsx`](src/components/global/modal/modal.tsx)                                 | Dialog no desktop, drawer no mobile. Props: `title`, `description`, `children`, `open`, `setOpen`, `size` (`default`/`lg`/`xl` — largura no desktop; no mobile é sempre full-width), `onBack`/`backLabel` (ver abaixo). |
| `ModalFooter`   | [`modal/modal.tsx`](src/components/global/modal/modal.tsx)                                 | Rodapé de ações de um modal. Envolve o(s) botão(ões) de ação (Salvar/Criar) para que ocupem **100% da largura** do modal (empilhados quando há mais de um). Padrão único de todos os modais de ação.                    |
| `Empty`         | [`empty/empty.tsx`](src/components/global/empty/empty.tsx)                                 | Empty state. Props: `title`, `description` (obrigatórios), `icon`, `children` (opcionais).                                                                                                                              |
| `Skeleton*`     | [`skeleton/skeleton.tsx`](src/components/global/skeleton/skeleton.tsx)                     | `SkeletonText`, `SkeletonValue`, `SkeletonBadge`, `SkeletonAvatar`. **Skeleton só no dado, nunca no card inteiro** — rótulos, títulos e estrutura permanecem visíveis durante o load.                                   |
| `Button`        | [`button/button.tsx`](src/components/global/button/button.tsx)                             | Estende o Button do shadcn com prop `loading` — exibe spinner antes do label e desabilita o botão automaticamente. Mantém todas as variantes/props do primitivo.                                                        |
| `ConfirmDialog` | [`confirmDialog/confirmDialog.tsx`](src/components/global/confirmDialog/confirmDialog.tsx) | Confirmação para ações destrutivas/reversíveis. **Uncontrolled** (`trigger` prop, estado interno) ou **controlled** (`open`/`setOpen`). Loading interno automático e auto-close.                                        |
| `PageHeader`    | [`pageHeader/pageHeader.tsx`](src/components/global/pageHeader/pageHeader.tsx)             | Cabeçalho padrão de tela: `title`, `description`, `actions` opcional. Usado em `home/`.                                                                                                                                 |
| `InfoTooltip`   | [`infoTooltip/infoTooltip.tsx`](src/components/global/infoTooltip/infoTooltip.tsx)         | Ícone `i` com tooltip acessível (hover/foco) ao lado de um rótulo/campo. Traz o próprio `TooltipProvider`; props `label`/`triggerLabel`/`className`.                                                                    |
| `FileDropzone`  | [`fileDropzone/fileDropzone.tsx`](src/components/global/fileDropzone/fileDropzone.tsx)     | Área de upload com arrastar-e-soltar, seleção por clique/teclado e prévia (nome + tamanho + remover). Controlado por `file`/`onFileChange`; props `accept`/`hint`/`disabled`/`id`.                                      |

**`Modal` — botões de ação (`ModalFooter`), dirty-gate e botão de voltar (`onBack`):** três regras para todo modal de ação seguir o mesmo padrão.

- **Botões de ação SEMPRE via `ModalFooter`, ocupando 100% da largura.** Envolva o(s) botão(ões) de ação (Salvar/Criar) do modal em `<ModalFooter>` — nunca use `<div className="flex justify-end">` nem deixe o botão solto. O `ModalFooter` estica os botões para a largura total do modal (`flex flex-col`; quando há mais de um, ficam empilhados, cada um 100%).
- **Salvar/Criar só aparece quando o formulário está _dirty_.** Em qualquer modal de formulário (criar **ou** editar), o botão de submit renderiza sob `{formState.isDirty && ...}` — nada mudou, nenhum botão. Não adicione um "Cancelar" próprio: o `X` do modal (e o clique fora) já cancela. Exceção: ações **de estado** que não dependem de alteração podem ficar sempre visíveis quando aplicáveis.
- **Botão de voltar (`onBack`) para fluxos com passos.** Quando um modal tem passos (ex.: escolher uma opção → formulário), passe `onBack` (e `backLabel` para o `aria-label`, padrão "Voltar") ao `Modal`: ele renderiza um **botão-ícone de voltar à esquerda do título**, alinhado verticalmente entre título e descrição. Não coloque o "voltar" solto no corpo do modal.

**`Modal` — scroll do corpo (Dialog no desktop / Drawer no mobile):** o corpo do `Modal` precisa rolar quando o conteúdo passa da altura da tela. No **mobile (Drawer/vaul)** o corpo é um **container de scroll NATIVO** (`<div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">`), **nunca** o `ScrollArea` do Radix — o vaul só reconhece overflow nativo para diferenciar "rolar conteúdo" de "arrastar o drawer" no toque; com `ScrollArea` o gesto não rola no celular. `flex-1 min-h-0` limita a altura ao espaço restante do drawer (habilita o scroll interno). O drawer inferior (`ui/drawer.tsx`) usa `mt-6` + `max-h-[92dvh]` (não `mt-24`/`max-h-[80vh]`) para não deixar uma faixa de fechamento morta grande acima dele. No desktop (Dialog), scroll do corpo é normal (roda do mouse).

**Lista suspensa (dropdown/popover) dentro de Dialog/Drawer: scroll NATIVO + conteúdo NÃO portalado.** Para a roda do mouse rolar a lista de um popover que vive dentro de um `Modal` (opções de um combobox, menu longo, etc.), **duas** coisas precisam ser verdade — uma só não basta:

1. **Container de overflow nativo** (`max-h-* overflow-y-auto`), nunca o `ScrollArea` do Radix. O `react-remove-scroll` do Dialog/Drawer só reconhece scroll nativo.
2. **Conteúdo do popover NÃO portalado** (`PopoverContent portal={false}`). O `react-remove-scroll` bloqueia o wheel em tudo que está **fora** da subárvore do Dialog; como o `PopoverContent` portala para o `body` por padrão, a lista fica fora dessa subárvore e o wheel é bloqueado mesmo com overflow nativo. Com `portal={false}` o conteúdo renderiza dentro do Dialog (dentro do allowlist do RemoveScroll) e a roda funciona. O Popover é `position: fixed` (Floating UI), então não portalar **não** causa recorte por `overflow` nem erra o posicionamento.

Sintoma de esquecer o item 2: a lista rola pela barra mas **não pela roda do mouse** dentro do modal. O `PopoverContent` de [`ui/popover.tsx`](src/components/ui/popover.tsx) já expõe o prop `portal` (padrão `true`) exatamente para esse opt-out — passe `portal={false}` quando o popover vive dentro de um `Modal`.

**Regra dura — qualquer campo com popover próprio (Combobox/Select pesquisável) nasce com `portal={true}` (padrão de PÁGINA).** Se você criar uma abstração de campo que abre um `Popover` (ex.: um `Combobox` pesquisável, um `Select` com busca), o default do `portal` **tem que ser `true`** (portala — igual ao `PopoverContent` e ao `Select`), **nunca `false`**. Em página o popover é `position: fixed`; sem portal, um ancestral com `transform`/`contain` (um `Card`, o layout) o desancora e ele abre no **canto da tela**. O único lugar que passa `portal={false}` é **DENTRO de um `Modal`/Dialog/Drawer** (pelo motivo da roda do mouse acima). Nunca inverta esse default "para consertar o scroll do modal" — isso quebra TODAS as telas de página. Resumo: **default portala (página ancora); `portal={false}` só dentro de modal.** Mantenha o mesmo default entre todos os componentes que envolvem `Popover` — defaults divergentes entre `Select` e um `Combobox` são a origem clássica desse bug reaparecer.

**Empilhamento (z-index) do popover portalado — não regredir.** Como o popover portala no `body`, ele disputa empilhamento no root e cobriria o header/breadcrumb se tivesse z-index maior. A convenção é: **`PopoverContent` = `z-30`** (`ui/popover.tsx`) + `collisionPadding={{ top: 68 }}` (fica abaixo do header quando possível); **header/breadcrumb do layout = `z-40` com `bg-background`** (`layout.tsx` — ACIMA do popover para ele nunca cobrir o breadcrumb/ações, sem vazar pelo bg opaco); **sidebar mobile (Sheet) e modais = `z-50`** (cobrem o header quando abertos). Não suba o header acima de 50 (quebra mobile/modais) nem o popover acima de 30 (voltaria a cobrir o breadcrumb).

**Padrão para criar uma nova abstração global:**

- Pasta `components/global/<nome>/<nome>.tsx`, export nomeado, interface prefixada com `I`.
- Importe o primitivo como `XPrimitive` (ex.: `Card as CardPrimitive`) para evitar shadowing.
- Mantenha a API minimalista: props essenciais como obrigatórias, extras como opcionais.
- **Story obrigatória no mesmo PR.** Toda abstração nova em `components/global/<nome>/` precisa entrar acompanhada de `src/stories/globais/<nome>/<nome>.stories.tsx` com vitrine das variações principais (estados: default, loading, error/disabled, com/sem prop opcional). Sem story, a abstração some do radar da próxima sessão — humano ou Claude — e a tela seguinte reinventa o componente.
- **Teste obrigatório no mesmo PR.** Espelhe a story com `src/tests/globais/<nome>/<nome>.test.tsx` cobrindo o contrato público (props obrigatórias, estados, handlers). Veja `button/button.test.tsx` e `confirmDialog/confirmDialog.test.tsx` como referência de profundidade esperada.
- Para componentes de formulário ou de "abre/fecha", espelhe o padrão de `inputField.tsx` / `switch.tsx` / `confirmDialog.tsx`: modo **uncontrolled** + modo **controlled** via discriminated union. Discrimine via `'prop' in props` — nunca via `prop !== undefined`. Quando uma das variantes declarar `prop?: never`, o `'prop' in props` sozinho não narrowed para TS; nesses casos, encapsule num **type guard** com type predicate. Padrão usado em todos os fields e no `ConfirmDialog`:

```ts
function isControlled<TFieldValues, TName>(
  props: FieldProps<TFieldValues, TName>
): props is ControlledFieldProps<TFieldValues, TName> {
  return 'control' in props;
}

export function Field(props: FieldProps<...>) {
  if (isControlled(props)) {
    return <ControlledField {...props} />;
  }
  return <FieldBase {...props} />;
}
```

**Confirmações de ação (delete, publicar, arquivar)**: use `ConfirmDialog` com modo uncontrolled — dispensa `useState` no consumidor:

```tsx
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
/>
```

O dialog fica aberto enquanto `onConfirm` resolve (botão com spinner via `loading`), fecha em sucesso e permanece aberto se a promise lançar — deixe o erro propagar pro interceptor do `api` (que já mostra o toast).

**Confirmação dupla para ações críticas:** Para ações mais sérias (bloquear/banir usuário, apagar dados sensíveis, reverter cobrança), exija uma confirmação adicional antes de executar. Padrões recomendados:

- UX: primeiro `ConfirmDialog` com descrição clara; se o usuário confirmar, abra um segundo passo que peça digitar o nome do recurso ou uma palavra de confirmação (`BLOCK`, `APAGAR`) antes de habilitar o botão final. Isso reduz confirmações acidentais.
- Técnica: reuse `ConfirmDialog` em modo uncontrolled para o gatilho, e no `onConfirm` do primeiro passo abra um segundo modal ou um pequeno inline form que exige a confirmação textual. Implemente a ação final através de `useMutation` com `onMutate`/`onError`/`onSettled` para optimistic updates/rollback quando aplicável.
- Exemplo rápido: botão "Bloquear" → `ConfirmDialog` com `description` → ao confirmar mostrar campo `Digite "BLOQUEAR" para confirmar` + botão final que só fica `enabled` quando o texto bate.

Use confirmação dupla apenas em ações irreversíveis ou que tenham alto impacto de negócio; para ações de rotina, o `ConfirmDialog` simples é suficiente.

### Cor da marca e tema

A cor primária do sistema vive em **uma única variável** no topo de [`src/index.css`](src/index.css):

```css
:root {
  --brand: oklch(0.46 0.235 308.433); /* roxo Vallen (#7D00B8) */
  --brand-foreground: oklch(1 0 0);
}
.dark {
  --brand: oklch(0.639 0.273 312.16); /* mesma marca, tonada para dark */
}
```

`--primary`, `--primary-foreground`, `--sidebar-primary` e `--sidebar-primary-foreground` são apenas aliases (`var(--brand)`) — não duplicar valores. Pra trocar a marca em um novo projeto, mude apenas `--brand` (light + dark).

**A paleta de gráficos faz parte da marca.** `--chart-1..5` é um ramp de 5 tons harmonizados com `--brand` (mesmo hue, luminosidade escalonada) — não uma paleta independente. Ao trocar a marca, atualize o ramp de gráficos para o novo hue, senão os gráficos destoam do resto da UI. Mantenha a estrutura de luminosidade (do tom mais claro no `--chart-1` ao mais escuro no `--chart-5`) e mude só o hue/croma para acompanhar `--brand`.

**Não fazem parte da marca**: `--ring`/`--sidebar-ring` (neutros, convenção shadcn) e os tokens neutros (background, border, muted, etc.).

**Dark mode em superfícies "card-like"**: use `bg-card` em vez de `bg-background` (o `.dark` já clareia `--card` em relação ao `--background` pra dar elevação) e adicione `dark:shadow-none` — sombras não rendem em fundo escuro. O `Card` global já faz isso automaticamente.

### Tipografia

- Use o componente [`Typography`](src/components/ui/typography.tsx) para textos do sistema (headings de página, parágrafos, labels). Variantes: `hero`, `h1`, `h2`, `h3`, `lead`, `p`, `small`, `muted`.
- `as` aceita o elemento HTML semântico independente do styling (ex.: `<Typography as="h1" variant="h3">` para uma h1 com peso visual de h3).
- Não use a classes `text-{size} font-{weight} text-muted-foreground` manualmente quando uma variante já bate — isso garante consistência visual entre telas.
- Texto dentro de primitivos shadcn (`CardTitle`, `EmptyTitle`, `FieldLabel`, `Badge`) já tem tipografia interna — não envolver com `Typography`.
- **Hierarquia: subtítulo NUNCA maior que o título do container (regra dura).** Dentro de um `Modal`, `Card`, `Dialog` ou seção, o **título do container é o maior heading**; todo **heading de subseção** no corpo deve ser **visualmente menor** que esse título — nunca maior. Um subtítulo maior que o título inverte a hierarquia e confunde o que é o quê (ex.: um bloco "Variáveis" renderizado como `h1`/`h2` dentro de um modal cujo título "Lançar resultado" é `h3` — o subtítulo "grita" mais que o título). Na prática: o título de `Modal`/`Card` já tem sua tipografia; subseções internas usam no máximo `Typography variant="small"`/`muted` (rótulo de grupo) ou um heading **abaixo** do tamanho do título — **nunca** `hero`/`h1`/`h2`. Se a subseção parece maior que o título, **reduza a variante da subseção** (não aumente o título). Vale para qualquer nível: sub-subtítulo < subtítulo < título.

### Datas

- Utilitários em [`src/lib/dateTime/`](src/lib/dateTime) cobrem parsing/formatação para inputs e queries (`transformIntoInputDate`, `transformIntoDatabaseDate`, `transformIntoDatabaseQueryDate`, `dateFormatter`). Reaproveite — não importe `date-fns` direto em telas.

### Filtros sempre persistidos na URL

**Toda filtragem, busca, ordenação e paginação vive na query string da URL — sem exceção.** O estado de filtro nunca fica só em `useState` local: a URL é a fonte de verdade. O objetivo é que qualquer estado de uma listagem seja **compartilhável e restaurável** — colar a URL em outra aba, recarregar a página ou enviar o link a um colega reproduz exatamente a mesma visão (mesma busca, mesma página, mesmos filtros, mesma ordenação).

Por quê:

- **Compartilhável**: `/users?search=maria&status=active&page=2` abre na visão exata para quem receber o link. Não dá para compartilhar `useState`.
- **Restaurável**: recarregar (F5) ou voltar/avançar no histórico do navegador preserva a busca em vez de resetar para o estado inicial.
- **Deep-linkable**: outra tela pode linkar direto para uma visão filtrada (ex.: um card de dashboard que abre a lista já filtrada).

Regras:

- **Tabelas e listas server-side**: use [`useDataTableQuery`](src/components/global/dataTable/useDataTableQuery.ts) / [`useDataTableUrlQuery`](src/components/global/dataTable/useDataTableUrlQuery.ts) — já fazem isso. Não reimplemente estado de filtro com `useState`.
- **Filtros fora de `DataTable`** (tabs, toggles, faixas de data, selects de filtro): leia e escreva via search params do TanStack Router (`useSearch` + `navigate({ search })`), não `useState`. Tipar os search params com schema (`validateSearch`) garante shape e defaults.
- **`useState` para filtro é antipadrão** — só é aceitável para estado verdadeiramente efêmero e não-compartilhável (ex.: o texto sendo digitado antes do debounce que ainda não virou busca aplicada).
- **PII nunca vai na URL** (ver seção Segurança/LGPD): filtre por ID opaco ou termo genérico, nunca CPF, e-mail ou telefone na query string.
- **Defaults limpos**: filtro no valor default não suja a URL (ex.: `status=all` não precisa aparecer) — mantenha a URL curta e o link legível.
- **Restaura ao voltar pelo breadcrumb.** Ao entrar num detalhe/criar, a URL da lista (com seus filtros) sai da barra; para voltar à listagem com os mesmos filtros, o `Layout` lembra o último search de cada rota via [`rememberSearch`](src/lib/navigation/searchMemory.ts) e o breadcrumb reanexa esse search no link de volta (`getRememberedSearch`). A URL segue como fonte de verdade (reload restaura pela própria URL); a memória só cobre o "voltar" onde a URL de destino não carrega mais os filtros.

### DataTable

- Padrão de tabela com paginação/filtro server-side em [`src/components/global/dataTable/`](src/components/global/dataTable). Use [`useDataTableQuery`](src/components/global/dataTable/useDataTableQuery.ts) (estado da URL via [`useDataTableUrlQuery`](src/components/global/dataTable/useDataTableUrlQuery.ts)).
- Empty state automático: quando não há resultados e há filtros ativos, exibe um `Empty` com botão "Limpar filtros" que dispara `onSearch({})`. Sem filtros, mostra "Ainda não há registros para exibir.".
- Exemplo vivo: story `DataTable/ServerSide` no Storybook.

#### Colunas ordenáveis pelo cabeçalho — padrão obrigatório

**Por padrão, TODA coluna de uma `DataTable` é ordenável pelo cabeçalho.** O clique no cabeçalho alterna asc/desc. A `DataTable` **nunca reordena localmente** (`manualSorting: true`): quem ordena é o **dono dos dados** — o backend (listas paginadas server-side) ou a própria tela (listas pequenas carregadas por inteiro). Regra dura ao criar/tocar uma listagem:

- **Frontend (sempre):** o `header` da coluna usa [`SortableHeader`](src/components/global/dataTable/columnHelpers.tsx) — `header: ({ column }) => <SortableHeader column={column}>Rótulo</SortableHeader>` — com `id`/`accessorKey` que identifique o campo. O `onSortingChange` já vem fiado em `tableProps` (via `useDataTableQuery`/`useDataTableUrlQuery`), então o estado de ordenação chega em `query.sort`.
- **Lista server-side (paginada):** traduza `query.sort[0]` em `orderBy`/`order` no service e a rota/serviço aplica no banco. O `orderBy` é **sempre validado contra uma allowlist** de campos (nunca interpolar o nome da coluna cru numa query — em SQL raw isso é injeção; com um ORM, restrinja a um union/`switch`). Defina uma **ordenação padrão** explícita no banco (ex.: `createdAt desc`, `name asc`).
- **Lista client-side (carrega tudo, filtra/ordena na tela):** a tela ordena o array de `rows` conforme `query.sort[0]` (comparador por coluna via `switch`/`Map`, sem indexar objeto por variável). Não precisa de mudança no backend.
- **Ordem padrão (sem sort ativo):** a ordem inicial vem do **backend** (server-side) ou do **fallback do comparador** (client-side, ex.: `sort?.id ?? 'name'`) — **não** passe `defaultSorting` ao `useDataTable*Query` só para isso. `defaultSorting` **semeia a URL** com `?sort=...` no mount, o que polui o link e quebra asserções de URL "limpa". Reserve `defaultSorting` para quando o padrão do backend **não** for a coluna/ordem que você quer destacar como já-ativa no cabeçalho.

**Exceções legítimas (as ÚNICAS):** colunas de **ação** (`actionsColumn`) e **seleção** (`selectColumn`) — já vêm com `enableSorting: false`; e colunas **compostas/derivadas sem um único campo de banco** que dê para ordenar (ex.: uma coluna que combina dois campos). Fora esses casos, cabeçalho sem `SortableHeader` é regressão — não deixe coluna "muda". Se a coluna mapeia um campo real (inclusive contagens e booleanos de status), ela é ordenável.

### Storybook (demos de componentes)

Todas as stories vivem em [`src/stories/`](src/stories), organizadas em três pastas — uma pasta por componente, com o arquivo `<name>.stories.tsx` dentro. Cada componente tem uma "Vitrine" mostrando todas as variações em um só lugar. Rode com `npm run storybook` (porta 6006).

```
src/stories/
├── Introducao.stories.tsx                    # boas-vindas
├── globais/<component>/<component>.stories.tsx     # abstrações em components/global/
│   ├── button/button.stories.tsx
│   ├── card/card.stories.tsx
│   ├── dataTable/DataTable.stories.tsx
│   ├── pageActions/pageActions.stories.tsx
│   └── form/<field>/<field>.stories.tsx       # inputField, select, dateField...
├── ui-primitivos/<component>/<Component>.stories.tsx  # primitivos shadcn em components/ui/
│   ├── tabs/Tabs.stories.tsx
│   └── typography/Typography.stories.tsx
└── padroes/<padrao>/<Padrao>.stories.tsx      # composições e padrões
    ├── form/Form.stories.tsx                  # formulário completo com Zod
    └── patterns/Patterns.stories.tsx          # OptimisticUpdate, CRUD, etc.
```

- Stories ficam **separadas** do componente (diferente dos `*.test.tsx`, que continuam co-localizados). Isso mantém o source dos componentes enxuto e centraliza a documentação visual.
- Cada vitrine envolve as variações em `Card` global com título + descrição explicativa.
- O componente é importado via alias `@/components/...`, nunca por caminho relativo.
- O título da story (`title:` no `meta`) usa o mesmo prefixo da pasta (`Globais/Button`, `UI primitivos/Tabs`, `Padrões/OptimisticUpdate`).
- Configuração: [`.storybook/main.ts`](.storybook/main.ts) e [`.storybook/preview.tsx`](.storybook/preview.tsx) (já injetam `ThemeProvider`, `QueryClient` e `Toaster`).

---

## Scripts

| Script               | O que faz                          |
| -------------------- | ---------------------------------- |
| `npm run dev`        | Servidor de desenvolvimento (Vite) |
| `npm run build`      | Typecheck + build de produção      |
| `npm run preview`    | Pré-visualiza o build              |
| `npm run lint`       | ESLint                             |
| `npm run format`     | Prettier (escrita)                 |
| `npm run typecheck`  | `tsc -b`                           |
| `npm test`           | Vitest run                         |
| `npm run test:watch` | Vitest watch                       |
| `npm run check`      | Lint + typecheck + test            |
| `npm run clean`      | Remove `dist/` e caches            |

---

## Ambiente

- Windows (PowerShell). Em comandos shell use sintaxe PS (`$env:VAR`, `$null`, sem `&&` em PS 5.1).
- Node >= 22 (versão fixa do template; CI roda em Node 22).
- `npm` (lockfile `package-lock.json`).

---

## 📅 Manipulação de Datas

Utilitários em `dateTime/`. Regra de ouro: **a natureza do valor decide o tratamento de fuso**, e ela é sempre **explícita** via `hasTimeStamp` — nunca adivinhada por formato de string.

- **Dia de calendário** — representa um _dia_, sem hora útil (nascimento, vencimento, competência, data de recebimento). Use `hasTimeStamp: false`. Gravado/exibido **sem fuso** (UTC), pra não "andar" para frente/trás na virada da meia-noite.
- **Instante** — um _momento_ no tempo (`createdAt`/`updatedAt`, agendamento com hora). Use `hasTimeStamp: true`. Gravado/exibido respeitando o **fuso local** do usuário.

> ⚠️ A mesma flag `hasTimeStamp` que decide a **gravação** decide a **exibição**. Misturar (ex.: salvar como dia de calendário e exibir como instante) faz o dia pular ±1.

> **Contrato de entrada:** as funções de transformação recebem **string ISO** (`YYYY-MM-DD` ou `YYYY-MM-DDTHH:mm[...]`) — valor de `<input type="date">` / `<input type="datetime-local">` ou ISO vinda do backend. Formatos locais (`31/03/2026`, `2026/03/31`) **lançam erro** (fail loud), não silenciam num `Invalid Date`.

### Resumo

| Função                           | Uso                                        |
| -------------------------------- | ------------------------------------------ |
| `dateFormatter`                  | Exibir data para o usuário                 |
| `transformIntoInputDate`         | Preencher inputs `date` / `datetime-local` |
| `transformIntoDatabaseDate`      | Persistir via body                         |
| `transformIntoDatabaseQueryDate` | Filtros/buscas via query                   |

### `dateFormatter` — exibição

Função única que cobre os 3 casos via flags:

```ts
dateFormatter({ date, hasTimeStamp, showHours });
```

| Flags                                  | Natureza          | Resultado                       |
| -------------------------------------- | ----------------- | ------------------------------- |
| `hasTimeStamp: false`                  | dia de calendário | `31/03/2026` (sem fuso, UTC)    |
| `hasTimeStamp: true, showHours: false` | instante          | `31/03/2026` (fuso local)       |
| `hasTimeStamp: true, showHours: true`  | instante          | `31/03/2026 11:35` (fuso local) |

`date` nulo/indefinido → `"-"`.

### `transformIntoInputDate` — preencher inputs

```ts
transformIntoInputDate({ date, hasTimeStamp });
```

- `hasTimeStamp: true` → `"YYYY-MM-DDTHH:mm"` (data e hora locais, para `datetime-local`)
- `hasTimeStamp: false` → `"YYYY-MM-DD"` (para `date`)
- `null | undefined` → `""`

### `transformIntoDatabaseDate` — persistir via body

```ts
transformIntoDatabaseDate({ date, hasTimeStamp, databaseDateHasTimeStamp });
```

- `hasTimeStamp: true` → instante exato em UTC (`toISOString`)
- `hasTimeStamp: false` + `databaseDateHasTimeStamp: false` → **dia de calendário**: meia-noite **UTC** (`2026-03-31T00:00:00.000Z`)
- `hasTimeStamp: false` + `databaseDateHasTimeStamp: true` → meia-noite no **fuso local** (banco guarda datetime)
- `null | undefined` → `null`

`databaseDateHasTimeStamp` (default `false`) = o backend espera data com hora? Data pura (nascimento etc.) quase sempre `false`.

### `transformIntoDatabaseQueryDate` — filtros via query

```ts
transformIntoDatabaseQueryDate({
  date,
  type,
  hasTimeStamp,
  databaseDateHasTimeStamp,
});
```

- `type: "start" | "end"` → borda inicial ou final do dia.
- `hasTimeStamp: true` → instante exato em UTC (`type` é ignorado)
- `hasTimeStamp: false` + banco `date` → bordas em **UTC** (`start` = `00:00:00.000Z`, `end` = `23:59:59.999Z`)
- `hasTimeStamp: false` + banco `datetime` → bordas no **fuso local**
- `null | undefined` → `""`

### Como escolher (decisão rápida)

1. O valor é um **dia** ou um **momento**? → define `hasTimeStamp`.
2. Vou **exibir**? → `dateFormatter`. **Preencher input**? → `transformIntoInputDate`. **Salvar**? → `transformIntoDatabaseDate`. **Filtrar**? → `transformIntoDatabaseQueryDate`.
3. Mantenha a **mesma** `hasTimeStamp` em toda a vida do dado (input → gravação → exibição).
