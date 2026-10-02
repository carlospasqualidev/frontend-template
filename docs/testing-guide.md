# Testes

Guia de testes do frontend, lido sob demanda (ver **Guias de referência** no [`CLAUDE.md`](../CLAUDE.md)). Quando cada camada roda e o que conta como pronto está em [`definition-of-done.md`](definition-of-done.md).

Duas camadas: **unit/componente** com Vitest (abaixo) e **fluxo no app real** com Playwright — ver a subseção **E2E (Playwright)** no fim deste guia.

- Vitest + Testing Library, ambiente `jsdom`.
- Todos os testes vivem em [`src/tests/`](../src/tests), organizados em pastas — uma pasta por componente/módulo, com o arquivo `<name>.test.ts(x)` dentro. Espelha o agrupamento usado nas stories.
- Setup global em [`src/tests/setup.ts`](../src/tests/setup.ts) (referenciado em [`vitest.config.ts`](../vitest.config.ts)).
- O componente/módulo é importado via alias `@/...`, nunca por caminho relativo.

```
src/tests/
├── setup.ts
├── globais/<component>/<name>.test.tsx     # abstrações de components/global/
│   ├── button/button.test.tsx
│   ├── card/card.test.tsx
│   ├── dataTable/{dataTable,dataTableSearch,useDataTableQuery}.test.tsx
│   └── form/<field>/<field>.test.tsx
├── helpers/axiosAdapter.ts                  # `respondWith(status, data)` e `failWithNetworkError()`: resposta (ou rede fora) do `axiosApi` sem rede, pelos interceptors reais
├── hooks/<hook>/<hook>.test.tsx
├── lib/<grupo>/<arquivo>.test.ts
└── services/<servico>/<arquivo>.test.ts
```

- Escreva teste para lógica não-trivial: utilidades puras, hooks com lógica, regras de negócio, edge cases.
- Teste o caminho de falha, não só o happy path.
- Testes legíveis — eles documentam o comportamento esperado.
- As abstrações globais (`Button`, `Card`, `Empty`, `ConfirmDialog`) já têm testes que cobrem o contrato público — ao mudar a API delas, atualize o teste junto, não depois.

## Como escrever testes (práticas)

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

## E2E (Playwright)

Toda feature entregue vem com um spec Playwright, executado antes de considerar a entrega concluída: a regra, o passo de encerramento e o placar ("e2e X/X") estão em [`definition-of-done.md`](definition-of-done.md). Aqui fica como os specs funcionam.

- **Banco e trava de host:** os E2E usam o banco de desenvolvimento do `../server-template` (o mesmo do `npm run dev` dele, com o seed), sem banco próprio, por isso todo spec desfaz o que cria. Antes de qualquer requisição, o `globalSetup` recusa uma `VITE_API_URL` cujo host não seja `localhost`, `127.0.0.1` ou `::1` (`assertLocalApiUrl`, em [`e2e/helpers/apiHost.ts`](../e2e/helpers/apiHost.ts), testada em [`src/tests/e2e/apiHost/apiHost.test.ts`](../src/tests/e2e/apiHost/apiHost.test.ts)) e a suíte para sem rodar nada: ela cria e exclui usuários, cargos e configuração pela API, e nunca roda contra homologação ou produção. Não há flag de escape.
- **Camadas (não confundir):** correção isolada de componente global (`components/global/`) continua coberta por **Vitest + story** (contrato do componente) — não escreva e2e para um primitivo isolado; ele é exercitado transitivamente pelo e2e da tela que o usa. O Playwright cobre o que o **usuário faz na aplicação rodando** (navegação, formulários, ações, filtros). O Storybook e o `npm run test:layers` (empilhamento, [`playwright.storybook.config.ts`](../playwright.storybook.config.ts)) seguem **sem backend**.
- **Onde:** specs em `e2e/<feature>.spec.ts` (na raiz do frontend), uma suíte só. Config em [`playwright.config.ts`](../playwright.config.ts): chromium, um worker e sem paralelismo (os specs dividem o banco de desenvolvimento e mudam a configuração da empresa), [`globalSetup`](../e2e/globalSetup.ts), e `webServer` que sobe o Vite com `--strictPort` na porta `E2E_PORT` (padrão `4173`, que está no `CORS_ORIGINS` padrão do server e não disputa a 5173 do `npm run dev`; outra porta pede a origem no `CORS_ORIGINS` do server), com `VITE_API_URL` do ambiente ou `http://localhost:8080/api`. O Vitest ignora `e2e/**` ([`vitest.config.ts`](../vitest.config.ts)) — `npm test` (unit, sem rede) e `npm run test:e2e` (Playwright, com o server) são separados.
- **Porta ocupada:** um servidor já de pé na porta dos E2E é reaproveitado, mas o `globalSetup` confere antes de qualquer spec que ele é o Vite **deste** frontend (pelo `/@fs/` do Vite, que só entrega arquivo de dentro da raiz do próprio projeto — outro app, mesmo com o mesmo `<title>`, responde 403; servidor com fallback de SPA, como o `vite preview`, responde 200 com outro conteúdo, e o `index.html` servido precisa ser igual ao desta pasta), que `src/lib/env.ts` volta como JavaScript transformado pelo Vite de desenvolvimento, e que ele aponta para a mesma `VITE_API_URL` do preparo. Se não for, para com a mensagem: pare o que está na porta ou use `E2E_PORT=<porta livre>`.
- **Pré-condições no `globalSetup`:** a porta (acima), `GET /health/ready` do server, o login do admin do seed e o limite de login (abaixo); se faltar algo, para com a instrução. Depois, exclui pela API os gestores que execuções interrompidas deixaram no banco (o nome começa com `Pessoa Gestora ` e o e-mail é o do preparo, `deleteLeftoverPreparedUsers`), abre as duas sessões que a suíte reaproveita (abaixo) e devolve o fim da suíte, que exclui o gestor.
- **Sessões pelo `storageState`, login só onde ele é o assunto:** o `globalSetup` entra **uma vez** com o admin do seed e com o **gestor** (uma pessoa que ele mesmo cria, sem cargo, e exclui no fim) e grava as sessões em `playwright/.auth/` (`ADMIN_STORAGE_STATE` e `MANAGER_STORAGE_STATE`, de [`e2e/helpers/storageState.ts`](../e2e/helpers/storageState.ts); a pasta fica fora do git, no `.gitignore`: guarda o cookie de sessão e é regravada a cada execução). O spec entra com `test.use({ storageState: ADMIN_STORAGE_STATE })` no `describe` (ou `browser.newContext({ storageState })` para uma segunda página), sem login. Quem precisa de alguém **sem** todas as permissões usa o gestor: o `beforeAll` dá a ele um cargo só com as permissões do caso (`setUserRoles`/`grantRoleWithPermissions` com o id de `readManager()`; o server relê as permissões a cada requisição) e o `afterAll` tira o cargo antes de excluí-lo (referências: o anti-escalonamento em [`e2e/users.spec.ts`](../e2e/users.spec.ts) e em [`e2e/roles.spec.ts`](../e2e/roles.spec.ts), o filtro por usuário em [`e2e/auditLogs.spec.ts`](../e2e/auditLogs.spec.ts), a inatividade em [`e2e/idleTimeout.spec.ts`](../e2e/idleTimeout.spec.ts)). Sair (`POST /session/logout`) só apaga o cookie daquele navegador (o JWT não é revogado): o teste de logout parte da sessão do admin sem derrubar a dos outros specs. **Login de verdade, só no spec que prova o próprio login:** a tela ([`e2e/session.spec.ts`](../e2e/session.spec.ts)), os recusados (senha errada e conta bloqueada, [`e2e/loginErrors.spec.ts`](../e2e/loginErrors.spec.ts)), a pessoa sem cargo ([`e2e/userWithoutRole.spec.ts`](../e2e/userWithoutRole.spec.ts)) e a troca de senha ([`e2e/account.spec.ts`](../e2e/account.spec.ts): a pessoa edita o próprio perfil e troca a própria senha, então não é o gestor nem o admin do seed). Helpers de [`e2e/helpers/session.ts`](../e2e/helpers/session.ts): `login(page, credenciais)` é o login pela tela (as do seed em [`e2e/helpers/serverApi.ts`](../e2e/helpers/serverApi.ts), `SEED_ADMIN`, ou as de um usuário criado no preparo), e `submitLogin` quando o login deve ser recusado; `signInThroughApi(credenciais)` abre uma vez, pela API, a sessão de uma pessoa preparada, e `openSession(page, sessão)` a reaproveita em cada teste do spec. Referências de tela protegida com `storageState` + `goto` e dado preparado por API: [`e2e/settings.spec.ts`](../e2e/settings.spec.ts), [`e2e/auditLogs.spec.ts`](../e2e/auditLogs.spec.ts) e [`e2e/users.spec.ts`](../e2e/users.spec.ts); [`e2e/login.spec.ts`](../e2e/login.spec.ts) é a tela pública de login, sem dado.
- **Preparo por API, o resto como uma pessoa:** o spec só chama a API direto para preparar e limpar dado, pelos helpers de [`e2e/helpers/serverApi.ts`](../e2e/helpers/serverApi.ts) (`newAdminApiContext`, criar e editar usuário, cargo com permissões, ler e gravar configuração). Tudo o que cria tem sufixo único (`uniqueSuffix`) e é desfeito no `afterAll` (usuário e cargo excluídos, configuração devolvida ao valor anterior): o spec roda várias vezes contra o mesmo banco. O que a própria tela cria e o spec não recebe o id (um cargo criado ou copiado pela tela) leva o sufixo no nome e sai pela busca dele (`deleteRolesMatching`, depois de excluir as pessoas: cargo com usuário não é excluído). Nada de contagem ou texto fixo do banco: o spec cria o dado de que precisa e o isola pelo nome único (ex.: a busca da auditoria pelo nome da pessoa criada no preparo). Resposta do server pode ser conferida com `page.waitForResponse`/`waitForRequest` (`isLoginResponse`, `isValidateResponse`, `serverApiUrl`).
- **Limite de login do server: 10 por minuto por IP** (login e register, cada um com o seu contador; janela fixa, aberta pelo primeiro login). A suíte gasta **7**: os 2 do `globalSetup` (o admin e o gestor) e os 5 dos specs que provam o próprio login (`SPEC_LOGIN_COUNT`: 1 pela tela em `session.spec.ts`, os 2 recusados de propósito em `loginErrors.spec.ts`, 1 pela tela em `userWithoutRole.spec.ts` e 1 pela API em `account.spec.ts`). O Node do `globalSetup` e o Chromium dividem o contador (os dois chegam por `127.0.0.1`). A troca de senha (`PUT /client/users/me/password`) tem o mesmo limite, com contador à parte (a suíte faz 3). O `globalSetup` lê `x-ratelimit-remaining` e `x-ratelimit-reset` da resposta do login do admin: com menos que os logins que vêm depois (o gestor e `SPEC_LOGIN_COUNT`) sobrando, ou com 429, espera a janela reiniciar e escreve o tempo no log; se o 429 continuar depois disso, para apontando outro cliente no mesmo IP. Spec novo entra com o `storageState` do admin ou do gestor, sem login; só o que prova o próprio login entra de verdade, soma em `SPEC_LOGIN_COUNT` (no número e no comentário, junto desta seção e do README) e, para outra pessoa, faz um login só por spec, reaproveitado.
- **Configuração da empresa mudada no preparo ou no teste:** no `afterAll`, restaure a configuração primeiro, em `try/finally`, e só depois exclua o que o spec criou. Se o valor lido no preparo já é o do teste, uma execução anterior parou antes de restaurar: devolva o padrão do catálogo do server, não esse valor. Referências: [`e2e/idleTimeout.spec.ts`](../e2e/idleTimeout.spec.ts) e [`e2e/settings.spec.ts`](../e2e/settings.spec.ts).
- **Ausência de toast:** conte uma vez (`expect(await locator.count()).toBe(0)`), depois do ponto em que o toast já teria saído. `toHaveCount(0)` espera e passa quando o toast some sozinho (4 s), então não prova nada.
- **Falha de render de uma tela:** o spec troca, com `page.route`, o módulo da tela pelo caminho da fonte, o mesmo que o `lazyRouteComponent` da rota importa (`/src/screens/settings/index.tsx`, `/src/screens/session/login.tsx`), por um que exporta só o componente da tela e lança no render até o teste liberar. Prova a tela de erro no app real sem mexer no código. Vale com duas condições: o servidor dos e2e é o Vite de desenvolvimento, que entrega cada módulo pelo caminho da fonte (o `globalSetup` confere isso antes de qualquer spec; num build, a tela está num chunk com hash e o caminho não existe); e o módulo trocado não tem outro importador além do `lazyRouteComponent` (se outro arquivo também o importasse, esse importador não acharia no substituto o que importava e quebraria junto, e a falha deixaria de ser só a daquela tela). Referência: [`e2e/routeError.spec.ts`](../e2e/routeError.spec.ts).
- **Tempo:** inatividade e outros cronômetros se provam com o relógio do Playwright (`page.clock.install()` antes da navegação e `page.clock.fastForward(...)`), sem esperar de verdade. Referência: [`e2e/idleTimeout.spec.ts`](../e2e/idleTimeout.spec.ts).
- **Edição não salva** (ver a regra em **Formulários**, [`conventions/forms.md`](conventions/forms.md#edição-não-salva-toda-tela-de-edição-usa-o-guard-regra-dura)): sair de uma tela com o formulário alterado abre a confirmação "Descartar as alterações?" (`getByRole('alertdialog', { name })`); um spec que só quer sair salva ou descarta antes. O voltar do navegador é `page.goBack()`; a nova guia, `click({ modifiers: ['Control'] })` com `context.waitForEvent('page')`; o aviso nativo ao fechar, `page.close({ runBeforeUnload: true })` com `page.waitForEvent('dialog')` (tipo `beforeunload`), depois de um clique no campo (o navegador só avisa página que recebeu interação). O "Sair" com edição prova que o `POST /client/session/logout` só sai depois de "Descartar alterações". Referência: [`e2e/unsavedChanges.spec.ts`](../e2e/unsavedChanges.spec.ts).
- **Partes de demonstração** (ver **Dados de demonstração** em **Abstrações globais**, [`conventions/components.md`](conventions/components.md#dados-de-demonstração-toda-parte-sem-servidor-usa-o-demonotice-regra-dura)): o spec da tela confere que o aviso está visível nelas e ausente no que é real (Minha conta em [`e2e/account.spec.ts`](../e2e/account.spec.ts), a home em [`e2e/home.spec.ts`](../e2e/home.spec.ts), a aba "Sessões" do usuário em [`e2e/users.spec.ts`](../e2e/users.spec.ts)). O real da mesma tela usa dado preparado por API e é conferido contra a resposta que a própria tela recebeu (os números da home contra o `count` da resposta, sem contagem fixa do banco; a atividade recente pela frase do cadastro feito no preparo). Parte que passa a falar com o servidor troca o spec para dado preparado por API.
- **Seletores (aprendizados deste projeto):**
  - Prefira `getByRole`/`getByLabel`. Os campos de formulário têm `id` → `getByLabel('Rótulo')` funciona, inclusive nos `Select`/`MultiSelect` globais.
  - **Escope o contexto** para evitar ambiguidade: o e-mail do usuário logado aparece no menu do sidebar **e** na linha da tabela — busque linhas dentro do `tbody` (`page.locator('tbody tr', { hasText })`).
  - **Filtros server-side:** teste navegando com o estado na URL (`/users?filters=${encodeURIComponent(JSON.stringify(...))}`) e asserte o resultado — cobre filtro→fetch→render sem depender de operar cada campo.
  - **Filtro/listagem: teste o COMPORTAMENTO, não a renderização.** Um spec que só confere "as colunas aparecem" ou "o campo de filtro renderiza" é **falso positivo** — passa com o filtro quebrado (ex.: busca por match exato onde deveria ser `contains`, ou id enviado que não bate no backend). A corretude do filtro (o que casa **aparece**, o que não casa **some**) exige **dado**: cubra-a num teste de integração do backend (semeando o registro e assertando o conjunto de resultados, positivo E negativo) e, no e2e, exercite pelo menos um round-trip de filtro **com dado** preparado por API (aplica o filtro → asserta que a linha esperada aparece / a não-esperada some). Nunca trate "o filtro está na tela" como cobertura do filtro.
  - `ConfirmDialog` → `getByRole('alertdialog').getByRole('button', { name })`. Menu de ações (⋯) → `getByRole('button', { name: 'Abrir menu' })` + `getByRole('menuitem', …)`. `Modal` → `getByRole('dialog', { name: 'Título' })`.
  - **Espere pelo conteúdo; a rede, só quando ela é o que se prova.** Asserções de visibilidade já esperam (`await expect(locator).toBeVisible()`) até a linha/campo aparecer. `waitForResponse`/`waitForRequest` servem para provar o que foi ao server (o lote do `PATCH`, o status da resposta).
  - **Filtros da `DataTable`** têm `id` estável (`filter-<chave>`, e `-from`/`-to` no `dateRange`) → o label associa e `getByLabel('Rótulo')` funciona em todos os tipos, inclusive `multiSelect` (o `id` vai no gatilho `role="combobox"`). Abra o `multiSelect` com `getByLabel('Rótulo').click()` e marque a opção via `getByRole('checkbox', { name: 'Opção' })`.
- **Padrão CRUD:** teste self-contained — criar → (usar) → excluir no próprio spec. Use dados **únicos** (`uniqueSuffix`) já que o run pode gerar vários registros e um valor fixo colide/gera falso negativo entre execuções. O banco é o de desenvolvimento, compartilhado entre execuções: limpe o que criar.
