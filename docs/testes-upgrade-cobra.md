# Relatório de testes: rodada 9, "upgrade vindo do Cobra Melhor" (TPL-43 a TPL-53)

## 1. Cabeçalho

| Campo                | Valor                                                                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recorte              | Rodada 9 (TPL-43 a TPL-53): e2e de fluxo nunca rodado na rodada e conferência no navegador real do que o jsdom não prova                                                           |
| Plataforma           | frontend (Playwright contra o app real e o server real; Storybook para os componentes sem tela)                                                                                    |
| Repositório          | `D:\Development\personal-projects\templates\frontend-template`; par: `D:\Development\personal-projects\templates\server-template` (branch `main`, sem alteração)                   |
| Branch               | `upgrade-cobra`, HEAD `4d8f921` (nada em `src/`, `e2e/` ou config foi editado; sem commit, sem push)                                                                               |
| Data da execução     | 2026-11-10                                                                                                                                                                         |
| Specs lidos          | `docs/specs/upgrade-cobra.pedido.md`, `docs/specs/upgrade-cobra.validacao.md`, `TASKS.md` (rodada 9), `docs/specs/TPL-43/44/46b/46c/49/51/52b.handoff.md`, `docs/specs/TPL-46b.md` |
| Fora deste relatório | `pnpm run check`, `build`, `build-storybook` e `test:layers` (já verdes em `upgrade-cobra.validacao.md`, não repetidos)                                                            |

## 2. Bloqueios

Nenhum bloqueio aberto. Resolvidos durante a sessão:

| O que travou                                                                                                                                                                                              | Casos derrubados                              | O que foi feito                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Porta 8080 ocupada por outro projeto local (ts-node-dev), que responde 404 em `/health/ready`                                                                                                             | nenhum                                        | não foi tocado; o `server-template` subiu na **8090** e a suíte rodou com `VITE_API_URL=http://localhost:8090/api` (host `localhost`, aceito pela trava `e2e/helpers/apiHost.ts`)                                                                                                                                     |
| `pnpm run test:e2e` com o `webServer` do `playwright.config.ts:44`: `vite -- --port 4173 --strictPort` não abriu a 4173 e o runner estourou os 120 s (`Timed out waiting 120000ms from config.webServer`) | a 1ª tentativa do `loop` (nenhum teste rodou) | é o F3 preexistente registrado no `TASKS.md` (pnpm repassa o `--` e o Vite ignora o `--port`). Subi o Vite à mão (`VITE_API_URL=http://localhost:8090/api pnpm exec vite --port 4173 --strictPort`); o `reuseExistingServer` o reaproveitou e o `globalSetup` conferiu que é este frontend apontando para a mesma API |
| `DATABASE_URL` do `.env` do server aponta para `server_template_local`, que não existe no Postgres local                                                                                                  | nenhum                                        | banco descartável `temporary-ebb87be9` (seção 9)                                                                                                                                                                                                                                                                      |

## 3. O que a automação já garante

| Camada                                                     | Escopo                                                       | Comando                                                                                                                                                                                                  | Resultado                                                                                                   |
| ---------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| e2e (Playwright, suíte do repo)                            | `loop`: os 5 specs da rodada                                 | `VITE_API_URL=http://localhost:8090/api pnpm exec playwright test e2e/users.spec.ts e2e/roles.spec.ts e2e/columnVisibility.spec.ts e2e/auditLogs.spec.ts e2e/account.spec.ts`                            | **43 passed** (1.3m), `exit=0`                                                                              |
| e2e (Playwright, suíte do repo)                            | `fechamento`: camada inteira, 14 specs                       | `VITE_API_URL=http://localhost:8090/api pnpm run test:e2e`                                                                                                                                               | **70 passed, 0 failed, 0 skipped** (1.9m), `exit=0`                                                         |
| Conferência no navegador (script Playwright fora da suíte) | pendências visuais e de foco da rodada, temas claro e escuro | `node conferencia.mjs`, `node senha-modal.mjs`, `node tooltip-master.mjs` (scripts em `C:\Users\admin\AppData\Local\Temp\claude\0a63b47506d5ac85\2fb4e0b5-aae0-4939-89c8-e6dca2eb3994\scratchpad\conf\`) | 16 verificações, todas conforme (seção 5); 3 achados `normal`, nenhum da rodada que quebre função (seção 6) |

Por spec, no `fechamento`: `users` 14, `roles` 13, `auditLogs` 8, `unsavedChanges` 7, `account` 5, `settings` 5, `columnVisibility` 3, `login` 3, `routeError` 3, `session` 3, `home` 2, `loginErrors` 2, `idleTimeout` 1, `userWithoutRole` 1. Os 4 specs alterados na rodada (`users`, `roles`, `columnVisibility`, `auditLogs`) e o `account` (salvar sempre visível no modal de senha) rodaram pela primeira vez e passaram nas duas execuções.

**Vermelho:** nenhum. Nada trava o push por parte da suíte.

A conferência no navegador não ganha selo `automatizado`: é script desta sessão, não spec da suíte. Cada item tem a medida que o script leu da página e a captura.

Capturas (67 PNG, 1440x900 no app e 1280x900 no Storybook, Chromium do Playwright no canal `chromium`) e medidas brutas (`medidas.json`): `C:\Users\admin\AppData\Local\Temp\claude\0a63b47506d5ac85\2fb4e0b5-aae0-4939-89c8-e6dca2eb3994\scratchpad\shots\`. Nome: `<tema>-<tela ou story>-<estado>.png`.

## 4. Cobertura das regras

| Regra                                                                                                                                            | Âncora                                                                                                                                             | Superfície                    | Caso      |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | --------- |
| Painel `bg-muted/50` no `ScrollArea`, sem raio nem margem; conteúdo `p-4 pt-2` alinhado ao `px-4` do header; header `bg-card dark:bg-background` | `src/components/global/layout/layout.tsx:46`, `:54`, `:62`                                                                                         | shell                         | V01       |
| Cabeçalho de tabela `bg-muted`, texto `muted-foreground`                                                                                         | `src/components/ui/table.tsx` (TPL-43); `src/index.css` (`--muted-foreground` claro 0.54)                                                          | listas                        | V02       |
| Menu de usuário com `ToggleTheme` ghost ao lado; empilhado na sidebar recolhida                                                                  | `src/components/global/sidebar/navUser.tsx:54`, `:123`                                                                                             | sidebar                       | V03, V04  |
| Ações de linha por ícone do catálogo, com tooltip; menu de colunas por padrão; colunas ocultas por padrão                                        | `src/screens/users/list/index.tsx:37`, `:208`; `src/screens/roles/list/index.tsx:29`, `:115`; `src/components/global/rowActions/actions.tsx:48-96` | users, roles                  | V05, V06  |
| audit-logs só em card, sem ação de linha                                                                                                         | `docs/specs/TPL-46b.md:27`; `src/screens/audit-logs/list/index.tsx:213`                                                                            | audit-logs                    | V07       |
| Quatro estados da lista: carregando, vazio, erro com "Tentar novamente", com dado                                                                | `src/components/global/dataTable/dataTable.tsx:71-90`, `:190-196`; `src/screens/users/list/index.tsx:200-201`                                      | users                         | V08       |
| Abas separadas por pipe, sem ícone                                                                                                               | `src/components/global/tabs/urlTabs.tsx:28-36`, `:102`                                                                                             | detalhe de usuário e de cargo | V09       |
| Trilha com o nome do registro, presa à rota dona                                                                                                 | `src/screens/users/details/index.tsx:122-124`; `src/screens/roles/details/index.tsx:148-150`                                                       | detalhe                       | V10       |
| Confirmação de bloquear irmã das abas, foco devolvido ao gatilho                                                                                 | `src/screens/users/details/index.tsx:329-346`, `:423`                                                                                              | detalhe de usuário            | V11       |
| `headerAction` no Modal; Esc fecha na primeira tecla                                                                                             | `src/components/global/modal/modal.tsx:110`, `:191`                                                                                                | Modal                         | V12       |
| Visualizador: imagem em `img`, PDF em `iframe` sem `sandbox`, texto em `iframe` com `sandbox=""`                                                 | `src/components/global/attachmentRow/attachmentPreview.tsx:114-133`                                                                                | AttachmentRow                 | V13       |
| Atalhos de data (dia do negócio) e de %; atalho indisponível com `aria-disabled` e motivo                                                        | `src/components/global/form/fieldShortcuts.tsx:42-60`                                                                                              | FieldShortcuts                | V14       |
| "Selecionar tudo" do MultiSelect                                                                                                                 | `src/components/global/form/multiSelectPrimitive.tsx:215-219`, `:347`                                                                              | MultiSelect                   | V15       |
| Salvar do modal sempre visível e desabilitado até haver mudança                                                                                  | `src/screens/account/security/changePasswordModal.tsx:133`                                                                                         | Minha conta                   | V16, E05  |
| Fluxos de usuários, cargos, colunas, auditoria e conta contra o server                                                                           | `e2e/users.spec.ts`, `e2e/roles.spec.ts`, `e2e/columnVisibility.spec.ts`, `e2e/auditLogs.spec.ts`, `e2e/account.spec.ts`                           | e2e                           | E01 a E05 |

Anti-lacuna:

- Dado existente: a rodada não mexe em schema nem em dado do server; não há fase de migração.
- Campo com máscara: nenhum campo novo de máscara nas telas; o `NumberField` da story de atalhos foi digitado tecla a tecla (V14). Colagem e autofill não fazem parte das pendências pedidas.
- Integração externa: nenhuma. O visualizador usa `blob:` local.
- Regra aplicada pela interface e pela API: bloquear, excluir, cargo com permissão que o autor não tem e nome repetido são conferidos contra a resposta do server nos specs E01 e E02.

## 5. Resultado por caso

| Id  | Título                                                                                          | Severidade | Execução              | Resultado      | Spec / evidência                                                                           |
| --- | ----------------------------------------------------------------------------------------------- | ---------- | --------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| E01 | Usuários: lista, ordenação, filtros, criar, editar, cargo, bloquear, excluir, recusas do server | alto       | automatizado          | passou (14/14) | `e2e/users.spec.ts` (saída na seção 11)                                                    |
| E02 | Cargos: lista, menu, criar, editar, vincular, copiar, excluir, Administrador só leitura, gestor | alto       | automatizado          | passou (13/13) | `e2e/roles.spec.ts`                                                                        |
| E03 | Colunas: ocultar e manter após recarregar, cor do cabeçalho com menu aberto, filtros intactos   | normal     | automatizado          | passou (3/3)   | `e2e/columnVisibility.spec.ts`                                                             |
| E04 | Auditoria: lista, detalhe, filtro por usuário, atividade do usuário                             | alto       | automatizado          | passou (8/8)   | `e2e/auditLogs.spec.ts`                                                                    |
| E05 | Minha conta: perfil, limite de inatividade, troca de aba com edição, troca de senha pelo modal  | alto       | automatizado          | passou (5/5)   | `e2e/account.spec.ts` ("Segurança: troca a senha..." usa o botão "Alterar senha" do modal) |
| V01 | Painel tingido de ponta a ponta, cards a 16 px da borda e alinhados ao header                   | normal     | script de conferência | passou         | ver abaixo                                                                                 |
| V02 | Cabeçalho de tabela em `bg-muted`                                                               | normal     | script de conferência | passou         | ver abaixo                                                                                 |
| V03 | Menu de usuário da sidebar                                                                      | normal     | script de conferência | passou         | ver abaixo                                                                                 |
| V04 | Sidebar recolhida                                                                               | normal     | script de conferência | passou         | ver abaixo                                                                                 |
| V05 | Lista de usuários: ícones, tooltip, menu de colunas, ocultas por padrão                         | normal     | script de conferência | passou         | ver abaixo                                                                                 |
| V06 | Lista de cargos: ícones, menu de colunas, oculta por padrão                                     | normal     | script de conferência | passou         | ver abaixo                                                                                 |
| V07 | Auditoria em card                                                                               | normal     | script de conferência | passou         | ver abaixo                                                                                 |
| V08 | Quatro estados da lista                                                                         | normal     | script de conferência | passou         | ver abaixo                                                                                 |
| V09 | Abas com pipe e sem ícone                                                                       | normal     | script de conferência | passou         | ver abaixo                                                                                 |
| V10 | Trilha com o nome, sem piscar ao voltar                                                         | normal     | script de conferência | passou         | ver abaixo                                                                                 |
| V11 | Confirmação de bloquear com o foco devolvido                                                    | normal     | script de conferência | passou         | ver abaixo                                                                                 |
| V12 | Modal com `headerAction`: Esc fecha na primeira tecla                                           | normal     | script de conferência | passou         | ver abaixo                                                                                 |
| V13 | Visualizador de anexo: imagem, PDF em `iframe` `blob:` no Chromium, texto                       | alto       | script de conferência | passou         | ver abaixo                                                                                 |
| V14 | Atalhos de data e de %                                                                          | normal     | script de conferência | passou         | ver abaixo                                                                                 |
| V15 | "Selecionar tudo" do MultiSelect                                                                | normal     | script de conferência | passou         | ver abaixo                                                                                 |
| V16 | Modal "Alterar senha": salvar visível e desabilitado até haver mudança                          | normal     | script de conferência | passou         | ver abaixo                                                                                 |

Contagem: 21 casos; `critico` 0, `alto` 5, `normal` 16. `nao executado`: nenhum.

O que cada verificação mediu (claro e escuro, salvo onde dito):

- **V01.** Em `/` , `/users`, detalhe de usuário e `/audit-logs`, 1440x900: `main` de 256 a 1440 px, raio `0px`, margem `0px`; painel (o `ScrollArea`) de x 256 a 1440 e de y 64 a 900, ou seja, do header até o pé da janela e até a borda direita, raio `0px`, fundo `muted/50` (claro `oklab(0.967 … / 0.5)`, escuro `oklab(0.274 … / 0.5)`). Header `oklch(1 0 0)` no claro e `oklch(0.141 0.005 285.823)` no escuro (igual ao `body`). Card a **16 px** da borda esquerda do painel em todas as telas e a **16 px** da direita nos cards de largura total (users, audit-logs); borda esquerda do card menos o início do conteúdo do header (`px-4`) = **0 px**. Nenhum card de largura total encolheu. Capturas: `light-home-1440.png`, `dark-home-1440.png`, `light-users-list.png`, `dark-user-detail.png`.
- **V02.** Linha do `thead`: `oklch(0.967 0.001 286.375)` no claro e `oklch(0.274 0.006 286.033)` no escuro; texto `oklch(0.54 0.016 285.938)` / `oklch(0.705 0.015 286.067)`. O fundo está no `tr`, não no `thead`.
- **V03.** O gatilho (avatar, nome, e-mail, reticências) abre "Admin / admin@admin.com / Conta / Sair"; o alternador de tema fica fora do menu, à direita. `light-sidebar-user-menu.png`, `dark-sidebar-user-menu.png`.
- **V04.** Recolhida: `main` começa em 48 px, header com 48 px de altura; o alternador de tema fica acima do avatar (y 824 e 860, 32x32 cada); o menu abre à direita com Conta e Sair. `light-sidebar-collapsed.png`, `dark-sidebar-collapsed-user-menu.png`.
- **V05.** Linha de uma pessoa ativa: "Copiar e-mail" (`text-muted-foreground`), "Bloquear" (`text-warning`), "Excluir" (`text-destructive`); o hover mostra o tooltip "Copiar e-mail". Cabeçalhos visíveis: Nome, E-mail, Cargos, Status, Ações; menu "Configurar colunas": Nome, E-mail, Cargos, Status marcados, **Último acesso e Criado em desmarcados**. `light-users-tooltip.png`, `dark-users-column-menu.png`.
- **V06.** Cabeçalhos: Nome, Descrição, Permissões, Usuários, Ações; ações "Copiar" e "Excluir"; **Criado em desmarcado** no menu; o Administrador sem ações. `light-roles-list-column-menu.png`, `dark-roles-list.png`.
- **V07.** Lista e filtros dentro de um card de largura total; colunas Data/hora, Módulo, Entidade, Ação, Usuário, Resumo; sem ação de linha e sem coluna oculta por padrão, como o `TPL-46b.md:27` pede (a linha abre o detalhe). `light-audit-list.png`, `dark-audit-list.png`.
- **V08.** Com dado: lista. Vazio: busca sem casamento, "Nenhum usuário encontrado." (`*-users-empty.png`). Carregando: a resposta de `GET /client/users` segurada pelo `page.route` até a captura, 40 esqueletos na tabela (`*-users-loading.png`). Erro: a mesma requisição abortada pelo `page.route`, "Não foi possível carregar os usuários / Tente novamente em instantes. / Tentar novamente"; o clique em "Tentar novamente" (com a rota liberada) traz a lista de volta (`*-users-error.png`). Carregando e erro foram provocados no transporte, não com resposta inventada: é a única forma de provocá-los com o server de pé, e fica declarado aqui.
- **V09.** Detalhe de usuário: "Visão geral | Atividade | Cargos | Sessões", 4 abas, 3 pipes, **0 `svg`** nas abas. Detalhe de cargo: "Visão geral | Usuários", 1 pipe, 0 `svg`. `light-user-detail.png`, `dark-role-detail.png`.
- **V10.** Um `MutationObserver` no `nav[aria-label=breadcrumb]` gravou cada texto da trilha. Entrando no usuário pela linha: "Usuários" → "Usuários Detalhes do usuário" (enquanto carrega) → "Usuários Pessoa Conferência …". Saindo pela trilha e pelo voltar do navegador: "Usuários Pessoa Conferência …" → "Usuários", sem estado intermediário com outro nome. Cargo: "Cargos" → "Cargos Detalhes do cargo" → "Cargos Cargo Conferência …"; saindo, "Cargos Cargo Conferência …" → "Cargos". Os dois temas, mesma sequência.
- **V11.** "Bloquear" no card Situação abre "Bloquear usuário?" (`*-user-block-confirm.png`). Foco depois de fechar: Cancelar → botão "Bloquear"; Esc → "Bloquear"; confirmar → o mesmo botão, agora "Desbloquear"; desbloquear de volta → "Bloquear". Nenhum caso deixou o foco no `body`.
- **V12.** Story `Globais/Modal › ComAcaoNoCabecalho`: foco inicial no próprio diálogo (não há campo); **um** Esc fecha. O mesmo vale para os quatro visualizadores do V13 (o "Baixar" do `headerAction` está lá). `*-sb-modal-header-action.png`.
- **V13.** Story `Globais/AttachmentRow › Vitrine`. Imagem: `img` com `src` `blob:`, carregada (`naturalWidth` 320). **PDF: `iframe` com `src` `blob:`, sem `sandbox`, documento `application/pdf`, e o visualizador do Chromium desenha a página "Documento de exemplo" com a barra de páginas** (`light-sb-attachment-preview-pdf.png`, `dark-sb-attachment-preview-pdf.png`). Texto: `iframe` `blob:` com `sandbox=""`, conteúdo "Linha 1 do arquivo de exemplo / Linha 2 do arquivo". Zip: sem visualizador, botão "Baixar arquivo" no corpo. Em todos, "Baixar <nome>" e "Fechar" no cabeçalho e um Esc fecha. Firefox não foi conferido (o pedido é Chromium).
- **V14.** Story `Formulário/FieldShortcuts`: "7 dias" grava **17/11/2026** com hoje 10/11/2026 em America/Sao_Paulo. Com "Valor base" vazio, "50%" fica `aria-disabled="true"`, o foco mostra o tooltip "Informe o valor base." e o clique não preenche nada (`*-sb-field-shortcuts-disabled.png`). Digitando "1000" tecla a tecla na base, o campo mostra "R$ 10,00" (o campo enche pelos centavos) e "50%" grava "R$ 5,00" (`*-sb-field-shortcuts.png`).
- **V15.** Story `Formulário/MultiSelect › Vitrine`, campo "Benefícios": antes, 5 opções desmarcadas; "Selecionar tudo" marca as 5, o gatilho mostra "5 selecionados" e o botão some (não há mais o que marcar). `*-sb-multiselect-open.png`, `*-sb-multiselect-select-all.png`.
- **V16.** Conta › Segurança › "Alterar senha": o botão "Alterar senha" do modal está visível e **desabilitado** com o formulário limpo, e habilitado depois de digitar a senha atual. `*-account-password-modal-clean.png`, `*-account-password-modal-dirty.png`. O script não gravou senha.

## 6. Bugs encontrados

Nenhuma regressão da rodada. Achados, todos `normal`:

| Id  | Descrição                                                                                                                                                                                                                                                                                                                           | Severidade | Âncora                                                                 | Status                                                                                                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | Depois de fechar "Configurar colunas" com Esc, o foco volta ao gatilho e o tooltip "Configurar colunas" (lado de cima) cobre o centro do botão "Buscar": `elementFromPoint` no centro do "Buscar" devolve o tooltip em `/users`, `/roles` e `/audit-logs`. Um clique no meio do "Buscar" cai no tooltip até o foco sair do gatilho. | normal     | `src/components/global/dataTable/columnVisibilityMenu.tsx:71`          | **preexistente, provado no master** (`f6be575`, worktree destacada servida na 4174 contra o mesmo server: mesmo resultado nas três telas; `master-users-after-column-menu-esc.png` e `branch-users-after-column-menu-esc.png`) |
| A2  | No Storybook, o tema do addon (padrão "Escuro", e o seletor da barra) não vale: o `ThemeProvider` do decorador reaplica o tema do sistema por cima. Com `globals=theme:Escuro` e o sistema claro, o `html` fica com a classe `light`. As capturas escuras do Storybook foram feitas com o sistema em escuro.                        | normal     | `.storybook/preview.tsx:49-54`; `src/hooks/useThemeProvider.tsx:94-95` | **preexistente** (`git diff master..HEAD -- .storybook src/hooks/useThemeProvider.tsx` vazio)                                                                                                                                  |
| A3  | Visualizador de texto: o comentário promete "tema claro fixo" (`bg-white [color-scheme:light]`), mas com o sistema em escuro o documento do `iframe` sai em fundo escuro e letra clara. Continua legível (não é branco sobre branco), só não é o que o comentário diz.                                                              | normal     | `src/components/global/attachmentRow/attachmentPreview.tsx:121-132`    | da rodada (TPL-52b), não quebra função; `dark-sb-attachment-preview-text.png`                                                                                                                                                  |

## 7. Critério para considerar pronto

- `loop` verde: 43/43. `fechamento` verde: 70/70. As 16 verificações no navegador conforme o pedido.
- Os três achados são `normal`; A1 e A2 vêm do master. Nenhum trava o push.

## 8. Dado existente

A rodada não altera schema, migration nem dado do server. Não há fase de migração.

## 9. Ambiente de teste

| Processo                     | Comando                                                                                                                                                                                                         | Porta | Como foi derrubado                                                                                                                                                        |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Banco descartável            | `docker exec db-local createdb -U admin temporary-ebb87be9` (container `db-local`, `localhost:5432`, credenciais do `.env` do server, só o nome trocado)                                                        | 5432  | `docker exec db-local dropdb -U admin temporary-ebb87be9`; conferido: `select count(*) from pg_database where datname='temporary-ebb87be9'` = 0                           |
| Migrations e seed            | `DATABASE_URL=postgresql://admin:***@localhost:5432/temporary-ebb87be9 pnpm exec prisma migrate deploy` (10 migrations) e `... pnpm exec prisma db seed` (`admin@admin.com` ativo, `blocked@admin.com` inativo) |       |                                                                                                                                                                           |
| server-template              | `DATABASE_URL=<temporário> PORT=8090 CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:4173,http://localhost:4174 pnpm run dev`                                                         | 8090  | `taskkill /T` no processo `--watch src/server.ts`                                                                                                                         |
| Vite do e2e e da conferência | `VITE_API_URL=http://localhost:8090/api pnpm exec vite --port 4173 --strictPort`                                                                                                                                | 4173  | `taskkill /T`                                                                                                                                                             |
| Storybook                    | `pnpm exec storybook dev -p 6006 --ci --no-open`                                                                                                                                                                | 6006  | `taskkill /T`                                                                                                                                                             |
| Vite do master (só A1)       | worktree destacada de `master` com `node_modules` por junção, `VITE_API_URL=http://localhost:8090/api node node_modules/vite/bin/vite.js --port 4174 --strictPort`                                              | 4174  | `taskkill /T`; junção removida com `rmdir` antes de `git worktree remove --force` (a `node_modules` do repo ficou intacta, `git worktree list` só com a árvore principal) |

Prova do banco antes de qualquer escrita: `pg_stat_activity` com a única conexão do server em `temporary-ebb87be9`; `GET /health/ready` na 8090 respondeu `{"status":"ok","database":"ok"}`. Reset entre rodadas: não foi preciso; cada spec desfaz o que cria e os scripts de conferência excluíram a pessoa e o cargo que criaram (DELETE 200 e 200). Tentativas interrompidas do script de conferência deixaram pessoas e cargos "Conferência" no banco temporário; saíram com o `dropdb`.

O `docs/testing-guide.md` manda o e2e usar o banco de desenvolvimento do server; aqui ele rodou sobre um banco descartável do mesmo Postgres local, que é o que a regra de banco desta skill exige. A trava de host foi respeitada: `VITE_API_URL` com host `localhost`.

## 10. Dúvidas abertas

- Estado de erro da lista com rede fora: além do bloco "Não foi possível carregar os usuários", o interceptor mostra o toast "Erro de comunicação" (`light-users-error.png`). É o comportamento padrão do `api` (`CLAUDE.md`, "Os interceptors do `api` já exibem toasts de erro"); fica para o dono dizer se o aviso duplo é desejado.
- Esc no modal "Alterar senha" com a senha atual digitada fecha sem perguntar (V16). O guard de edição não salva é regra de tela de edição; o modal de senha não é coberto por ela. Não tratado como achado.
- Visualizador de PDF e texto no Firefox: não conferido (fora do pedido).

## 11. Portão de fechamento

1. **A suíte rodou, e em que escopo?** Sim. `loop`: `VITE_API_URL=http://localhost:8090/api pnpm exec playwright test e2e/users.spec.ts e2e/roles.spec.ts e2e/columnVisibility.spec.ts e2e/auditLogs.spec.ts e2e/account.spec.ts` → `43 passed (1.3m)`, `exit=0`. `fechamento`: `VITE_API_URL=http://localhost:8090/api pnpm run test:e2e` → `70 passed (1.9m)`, `exit=0`. Saída colada abaixo. Atalhos de preparação: os specs preparam pessoas, cargos e configuração pela API pelos helpers de `e2e/helpers/serverApi.ts`, como o `docs/testing-guide.md` define; a criação pela tela está em `e2e/users.spec.ts` ("cria um usuário e abre o detalhe dele na aba \"Cargos\"") e `e2e/roles.spec.ts` ("cria um cargo..."). O script de conferência criou pela API uma pessoa, um cargo com as 4 permissões de usuários e o vínculo; os pares pela tela são esses dois testes e `e2e/roles.spec.ts` ("vincula um usuário pela aba \"Usuários\", com a busca do servidor").
2. **Cada selo `automatizado` tem teste nomeado?** E01 → `e2e/users.spec.ts` (14 testes, títulos na saída abaixo); E02 → `e2e/roles.spec.ts` (13); E03 → `e2e/columnVisibility.spec.ts` (3); E04 → `e2e/auditLogs.spec.ts` (8); E05 → `e2e/account.spec.ts` (5). V01 a V16 não têm selo `automatizado`: são script de conferência desta sessão, com a medida e a captura de cada um na seção 5.
3. **A app foi dirigida como uma pessoa dirige?** Sim. Na conferência: login pela tela, telas abertas pelo menu "Administração" da sidebar, detalhe aberto pelo clique na linha, volta pela trilha e pelo voltar do navegador, bloqueio e desbloqueio pela tela com a confirmação. Ciclo de vida: a pessoa "Pessoa Conferência <sufixo>" foi criada (API), editada (bloqueada e desbloqueada pela tela; o efeito apareceu no status "Bloqueado"/"Ativo" do card e nas linhas "Bloqueou/Desbloqueou o usuário" da auditoria, que lê do banco) e excluída (API, 200). Nos specs, os ciclos de criar, editar e excluir de usuário e cargo são os de E01 e E02, conferidos contra a resposta do server.
4. **De onde veio cada login?** `admin@admin.com` e `blocked@admin.com`: seed do server (`prisma/seed.ts:16`, senha `123123123`). Gestor: criado pelo `globalSetup` pela API e excluído no fim. Pessoa do `account.spec.ts`: criada pela API pelo próprio spec. A conferência entrou com o admin do seed pela tela de login.
5. **O banco temporário foi apagado?** Sim: `temporary-ebb87be9`, com `docker exec db-local dropdb -U admin temporary-ebb87be9`; a consulta a `pg_database` devolveu 0.

### Saída do runner: `loop`

```
Running 43 tests using 1 worker
  ok  1 [chromium] › e2e\account.spec.ts:103:3 › Minha conta › Perfil: pré-preenche pelo servidor, salva só o que mudou e atualiza a sessão (2.2s)
  ok  2 [chromium] › e2e\account.spec.ts:148:3 › Minha conta › Perfil: tempo acima do limite da empresa é recusado no campo, sem toast (1.1s)
  ok  3 [chromium] › e2e\account.spec.ts:187:3 › Minha conta › Perfil: trocar de aba com edição não salva pede confirmação (1.9s)
  ok  4 [chromium] › e2e\account.spec.ts:223:3 › Minha conta › Segurança: troca a senha (a atual errada marca o campo) e volta à original (2.9s)
  ok  5 [chromium] › e2e\account.spec.ts:277:3 › Minha conta › o que não tem servidor mostra o aviso de demonstração (2.7s)
  ok  6 [chromium] › e2e\auditLogs.spec.ts:93:3 › Auditoria › lista os registros de auditoria, o mais recente primeiro (1.0s)
  ok  7 [chromium] › e2e\auditLogs.spec.ts:102:3 › Auditoria › filtra por conteúdo: o que casa aparece, o que não casa some (1.3s)
  ok  8 [chromium] › e2e\auditLogs.spec.ts:116:3 › Auditoria › filtra por módulo (multiSelect) mantendo só o que casa (1.8s)
  ok  9 [chromium] › e2e\auditLogs.spec.ts:135:3 › Auditoria › pagina a partir do primeiro registro (1.5s)
  ok 10 [chromium] › e2e\auditLogs.spec.ts:149:3 › Auditoria › abre o detalhe com o que mudou e os dados técnicos recolhidos (1.8s)
  ok 11 [chromium] › e2e\auditLogs.spec.ts:181:3 › Auditoria › evento sem campos alterados mostra o estado vazio do de→para (1.4s)
  ok 12 [chromium] › e2e\auditLogs.spec.ts:225:3 › Auditoria — filtro por usuário › só aparece com a permissão de ver usuários, e filtra pelo autor (3.1s)
  ok 13 [chromium] › e2e\auditLogs.spec.ts:315:3 › Atividade do usuário › mostra a linha do tempo do usuário, paginada, a mais recente primeiro (1.0s)
  ok 14 [chromium] › e2e\columnVisibility.spec.ts:16:3 › Tabela — mostrar e ocultar colunas › oculta uma coluna e mantém a escolha após recarregar (2.7s)
  ok 15 [chromium] › e2e\columnVisibility.spec.ts:43:3 › Tabela — mostrar e ocultar colunas › abrir o menu de colunas mantém a cor do cabeçalho (1.1s)
  ok 16 [chromium] › e2e\columnVisibility.spec.ts:57:3 › Tabela — mostrar e ocultar colunas › ocultar colunas não altera os filtros da URL (1.3s)
  ok 17 [chromium] › e2e\roles.spec.ts:204:5 › Cargos › como admin › lista os cargos do servidor pela busca, com as contagens (1.6s)
  ok 18 [chromium] › e2e\roles.spec.ts:229:5 › Cargos › como admin › o item "Cargos" do menu abre a lista (1.2s)
  ok 19 [chromium] › e2e\roles.spec.ts:246:5 › Cargos › como admin › cria um cargo: marcar uma escrita marca e trava a leitura (1.4s)
  ok 20 [chromium] › e2e\roles.spec.ts:284:5 › Cargos › como admin › recusa o nome repetido com o toast do servidor, um só (1.1s)
  ok 21 [chromium] › e2e\roles.spec.ts:298:5 › Cargos › como admin › edita as permissões e o servidor guarda a expansão para leitura (1.9s)
  ok 22 [chromium] › e2e\roles.spec.ts:339:5 › Cargos › como admin › vincula um usuário pela aba "Usuários", com a busca do servidor (2.4s)
  ok 23 [chromium] › e2e\roles.spec.ts:383:5 › Cargos › como admin › o vínculo feito na tela de usuários aparece no cargo, sem recarregar (2.8s)
  ok 24 [chromium] › e2e\roles.spec.ts:414:5 › Cargos › como admin › copia um cargo pela lista e abre a cópia (1.2s)
  ok 25 [chromium] › e2e\roles.spec.ts:432:5 › Cargos › como admin › exclui com confirmação, e recusa o cargo com usuários vinculados (2.4s)
  ok 26 [chromium] › e2e\roles.spec.ts:464:5 › Cargos › como admin › o Administrador aparece só para leitura, sem ações (1.3s)
  ok 27 [chromium] › e2e\roles.spec.ts:496:5 › Cargos › como gestor › a permissão que o gestor não tem aparece desabilitada, com a explicação (955ms)
  ok 28 [chromium] › e2e\roles.spec.ts:512:5 › Cargos › como gestor › o servidor recusa copiar um cargo com permissão que o gestor não tem (1.1s)
  ok 29 [chromium] › e2e\roles.spec.ts:538:5 › Cargos › como gestor › editar o próprio cargo muda na hora o que a tela oferece (1.2s)
  ok 30 [chromium] › e2e\users.spec.ts:147:5 › Usuários › como admin › lista do servidor, com cargos e status derivado de isActive (1.0s)
  ok 31 [chromium] › e2e\users.spec.ts:170:5 › Usuários › como admin › ordena por status pelo cabeçalho, no servidor (1.3s)
  ok 32 [chromium] › e2e\users.spec.ts:200:5 › Usuários › como admin › id de cargo fora do formato na URL sai do filtro, sem toast (1.1s)
  ok 33 [chromium] › e2e\users.spec.ts:220:5 › Usuários › como admin › a aba "Sessões" do detalhe mostra o aviso de demonstração (924ms)
  ok 34 [chromium] › e2e\users.spec.ts:230:5 › Usuários › como admin › filtra por status pelos campos: o que casa aparece, o que não casa some (1.6s)
  ok 35 [chromium] › e2e\users.spec.ts:245:5 › Usuários › como admin › filtra por cargo e por período de cadastro no servidor (2.4s)
  ok 36 [chromium] › e2e\users.spec.ts:269:5 › Usuários › como admin › cria um usuário e abre o detalhe dele na aba "Cargos" (1.5s)
  ok 37 [chromium] › e2e\users.spec.ts:296:5 › Usuários › como admin › recusa o e-mail já cadastrado com o toast do servidor (1.0s)
  ok 38 [chromium] › e2e\users.spec.ts:310:5 › Usuários › como admin › edita o cadastro no detalhe e o valor fica no servidor (1.7s)
  ok 39 [chromium] › e2e\users.spec.ts:339:5 › Usuários › como admin › troca o cargo na aba "Cargos" e mostra as permissões dele (2.4s)
  ok 40 [chromium] › e2e\users.spec.ts:366:5 › Usuários › como admin › bloqueia e desbloqueia pela lista, com confirmação (2.0s)
  ok 41 [chromium] › e2e\users.spec.ts:388:5 › Usuários › como admin › exclui pela lista, com confirmação (1.7s)
  ok 42 [chromium] › e2e\users.spec.ts:406:5 › Usuários › como admin › a recusa do servidor aparece num toast só, sem toast da tela (1.5s)
  ok 43 [chromium] › e2e\users.spec.ts:432:5 › Usuários › como gestor › o servidor recusa dar cargo com permissão que o autor não tem (1.7s)
  43 passed (1.3m)
exit=0
```

### Saída do runner: `fechamento`

```
Running 70 tests using 1 worker
  ok  1 [chromium] › e2e\account.spec.ts:103:3 › Minha conta › Perfil: pré-preenche pelo servidor, salva só o que mudou e atualiza a sessão (1.8s)
  ok  2 [chromium] › e2e\account.spec.ts:148:3 › Minha conta › Perfil: tempo acima do limite da empresa é recusado no campo, sem toast (1.1s)
  ok  3 [chromium] › e2e\account.spec.ts:187:3 › Minha conta › Perfil: trocar de aba com edição não salva pede confirmação (2.0s)
  ok  4 [chromium] › e2e\account.spec.ts:223:3 › Minha conta › Segurança: troca a senha (a atual errada marca o campo) e volta à original (2.9s)
  ok  5 [chromium] › e2e\account.spec.ts:277:3 › Minha conta › o que não tem servidor mostra o aviso de demonstração (2.5s)
  ok  6 [chromium] › e2e\auditLogs.spec.ts:93:3 › Auditoria › lista os registros de auditoria, o mais recente primeiro (1.0s)
  ok  7 [chromium] › e2e\auditLogs.spec.ts:102:3 › Auditoria › filtra por conteúdo: o que casa aparece, o que não casa some (1.2s)
  ok  8 [chromium] › e2e\auditLogs.spec.ts:116:3 › Auditoria › filtra por módulo (multiSelect) mantendo só o que casa (1.7s)
  ok  9 [chromium] › e2e\auditLogs.spec.ts:135:3 › Auditoria › pagina a partir do primeiro registro (1.4s)
  ok 10 [chromium] › e2e\auditLogs.spec.ts:149:3 › Auditoria › abre o detalhe com o que mudou e os dados técnicos recolhidos (1.6s)
  ok 11 [chromium] › e2e\auditLogs.spec.ts:181:3 › Auditoria › evento sem campos alterados mostra o estado vazio do de→para (1.4s)
  ok 12 [chromium] › e2e\auditLogs.spec.ts:225:3 › Auditoria — filtro por usuário › só aparece com a permissão de ver usuários, e filtra pelo autor (3.1s)
  ok 13 [chromium] › e2e\auditLogs.spec.ts:315:3 › Atividade do usuário › mostra a linha do tempo do usuário, paginada, a mais recente primeiro (1.0s)
  ok 14 [chromium] › e2e\columnVisibility.spec.ts:16:3 › Tabela — mostrar e ocultar colunas › oculta uma coluna e mantém a escolha após recarregar (2.8s)
  ok 15 [chromium] › e2e\columnVisibility.spec.ts:43:3 › Tabela — mostrar e ocultar colunas › abrir o menu de colunas mantém a cor do cabeçalho (1.1s)
  ok 16 [chromium] › e2e\columnVisibility.spec.ts:57:3 › Tabela — mostrar e ocultar colunas › ocultar colunas não altera os filtros da URL (1.3s)
  ok 17 [chromium] › e2e\home.spec.ts:76:3 › Home › números de usuários e atividade recente reais (885ms)
  ok 18 [chromium] › e2e\home.spec.ts:107:3 › Home › o que não tem rota mostra o aviso; os atalhos abrem telas reais (1.2s)
  ok 19 [chromium] › e2e\idleTimeout.spec.ts:58:3 › Tempo de inatividade da sessão › segue a configuração da empresa gravada no preparo (930ms)
  ok 20 [chromium] › e2e\login.spec.ts:11:3 › Login › renderiza o formulário de login (590ms)
  ok 21 [chromium] › e2e\login.spec.ts:20:3 › Login › valida e-mail inválido antes de enviar (701ms)
  ok 22 [chromium] › e2e\login.spec.ts:28:3 › Login › navega para a tela de criar conta (627ms)
  ok 23 [chromium] › e2e\loginErrors.spec.ts:13:3 › Login recusado pelo server real › senha errada mostra "Credenciais inválidas." (902ms)
  ok 24 [chromium] › e2e\loginErrors.spec.ts:24:3 › Login recusado pelo server real › conta bloqueada mostra "Sua conta está bloqueada." (895ms)
  ok 25 [chromium] › e2e\roles.spec.ts:204:5 › Cargos › como admin › lista os cargos do servidor pela busca, com as contagens (1.6s)
  ok 26 [chromium] › e2e\roles.spec.ts:229:5 › Cargos › como admin › o item "Cargos" do menu abre a lista (1.1s)
  ok 27 [chromium] › e2e\roles.spec.ts:246:5 › Cargos › como admin › cria um cargo: marcar uma escrita marca e trava a leitura (1.5s)
  ok 28 [chromium] › e2e\roles.spec.ts:284:5 › Cargos › como admin › recusa o nome repetido com o toast do servidor, um só (1.1s)
  ok 29 [chromium] › e2e\roles.spec.ts:298:5 › Cargos › como admin › edita as permissões e o servidor guarda a expansão para leitura (1.9s)
  ok 30 [chromium] › e2e\roles.spec.ts:339:5 › Cargos › como admin › vincula um usuário pela aba "Usuários", com a busca do servidor (2.4s)
  ok 31 [chromium] › e2e\roles.spec.ts:383:5 › Cargos › como admin › o vínculo feito na tela de usuários aparece no cargo, sem recarregar (2.8s)
  ok 32 [chromium] › e2e\roles.spec.ts:414:5 › Cargos › como admin › copia um cargo pela lista e abre a cópia (1.3s)
  ok 33 [chromium] › e2e\roles.spec.ts:432:5 › Cargos › como admin › exclui com confirmação, e recusa o cargo com usuários vinculados (2.6s)
  ok 34 [chromium] › e2e\roles.spec.ts:464:5 › Cargos › como admin › o Administrador aparece só para leitura, sem ações (1.2s)
  ok 35 [chromium] › e2e\roles.spec.ts:496:5 › Cargos › como gestor › a permissão que o gestor não tem aparece desabilitada, com a explicação (938ms)
  ok 36 [chromium] › e2e\roles.spec.ts:512:5 › Cargos › como gestor › o servidor recusa copiar um cargo com permissão que o gestor não tem (998ms)
  ok 37 [chromium] › e2e\roles.spec.ts:538:5 › Cargos › como gestor › editar o próprio cargo muda na hora o que a tela oferece (1.2s)
  ok 38 [chromium] › e2e\routeError.spec.ts:56:3 › Tela de erro por rota: telas protegidas › o erro no render troca só o conteúdo, e "Tentar novamente" desenha a tela de novo (845ms)
  ok 39 [chromium] › e2e\routeError.spec.ts:82:3 › Tela de erro por rota: telas protegidas › ir para outra tela pelo menu limpa o erro (1.2s)
  ok 40 [chromium] › e2e\routeError.spec.ts:101:3 › Tela de erro por rota: rotas públicas › o erro no render do login mostra a tela de erro sem o menu, e "Tentar novamente" desenha de novo (761ms)
  ok 41 [chromium] › e2e\session.spec.ts:47:3 › Sessão contra o server real › abrir o app sem sessão vai ao login, sem toast de erro (787ms)
  ok 42 [chromium] › e2e\session.spec.ts:64:3 › Sessão contra o server real › o admin entra, vê Usuários, Cargos, Auditoria e Configurações, e recarregar mantém a sessão (2.0s)
  ok 43 [chromium] › e2e\session.spec.ts:89:5 › Sessão contra o server real › com a sessão aberta › sair volta ao login, e a rota protegida depois redireciona para o login (1.6s)
  ok 44 [chromium] › e2e\settings.spec.ts:86:3 › Configurações › exibe os grupos e só as configurações do servidor (783ms)
  ok 45 [chromium] › e2e\settings.spec.ts:109:3 › Configurações › grava as alterações numa chamada só, com um toast, e o valor fica no servidor (1.4s)
  ok 46 [chromium] › e2e\settings.spec.ts:163:3 › Configurações › marca o campo que o servidor recusou, sem toast e sem gravar (844ms)
  ok 47 [chromium] › e2e\settings.spec.ts:200:3 › Configurações › recusa apagar a auditoria antes de anonimizá-la, com toast, sem gravar (856ms)
  ok 48 [chromium] › e2e\settings.spec.ts:223:3 › Configurações › descartar reverte a alteração (822ms)
  ok 49 [chromium] › e2e\unsavedChanges.spec.ts:72:3 › Edição não salva › menu lateral: "Continuar editando" fica com a edição, "Descartar alterações" sai (1.8s)
  ok 50 [chromium] › e2e\unsavedChanges.spec.ts:97:3 › Edição não salva › voltar do navegador com edição pergunta; ficar mantém a URL e a edição (2.2s)
  ok 51 [chromium] › e2e\unsavedChanges.spec.ts:124:3 › Edição não salva › dois voltar com a pergunta aberta: uma pergunta só, e ficar mantém URL e edição (2.3s)
  ok 52 [chromium] › e2e\unsavedChanges.spec.ts:158:3 › Edição não salva › Ctrl+clique no menu abre a tela em nova guia, sem perguntar (1.4s)
  ok 53 [chromium] › e2e\unsavedChanges.spec.ts:179:3 › Edição não salva › fechar a aba com edição pede o aviso nativo; sem edição, fecha direto (1.8s)
  ok 54 [chromium] › e2e\unsavedChanges.spec.ts:209:3 › Edição não salva › "Sair" com edição pergunta antes: "Continuar editando" fica logado na edição, "Descartar alterações" sai (2.1s)
  ok 55 [chromium] › e2e\unsavedChanges.spec.ts:244:3 › Edição não salva › depois de salvar, o menu sai sem perguntar (1.3s)
  ok 56 [chromium] › e2e\users.spec.ts:147:5 › Usuários › como admin › lista do servidor, com cargos e status derivado de isActive (1.0s)
  ok 57 [chromium] › e2e\users.spec.ts:170:5 › Usuários › como admin › ordena por status pelo cabeçalho, no servidor (1.4s)
  ok 58 [chromium] › e2e\users.spec.ts:200:5 › Usuários › como admin › id de cargo fora do formato na URL sai do filtro, sem toast (1.1s)
  ok 59 [chromium] › e2e\users.spec.ts:220:5 › Usuários › como admin › a aba "Sessões" do detalhe mostra o aviso de demonstração (907ms)
  ok 60 [chromium] › e2e\users.spec.ts:230:5 › Usuários › como admin › filtra por status pelos campos: o que casa aparece, o que não casa some (1.6s)
  ok 61 [chromium] › e2e\users.spec.ts:245:5 › Usuários › como admin › filtra por cargo e por período de cadastro no servidor (2.5s)
  ok 62 [chromium] › e2e\users.spec.ts:269:5 › Usuários › como admin › cria um usuário e abre o detalhe dele na aba "Cargos" (1.5s)
  ok 63 [chromium] › e2e\users.spec.ts:296:5 › Usuários › como admin › recusa o e-mail já cadastrado com o toast do servidor (1.0s)
  ok 64 [chromium] › e2e\users.spec.ts:310:5 › Usuários › como admin › edita o cadastro no detalhe e o valor fica no servidor (1.8s)
  ok 65 [chromium] › e2e\users.spec.ts:339:5 › Usuários › como admin › troca o cargo na aba "Cargos" e mostra as permissões dele (2.5s)
  ok 66 [chromium] › e2e\users.spec.ts:366:5 › Usuários › como admin › bloqueia e desbloqueia pela lista, com confirmação (2.0s)
  ok 67 [chromium] › e2e\users.spec.ts:388:5 › Usuários › como admin › exclui pela lista, com confirmação (1.7s)
  ok 68 [chromium] › e2e\users.spec.ts:406:5 › Usuários › como admin › a recusa do servidor aparece num toast só, sem toast da tela (1.5s)
  ok 69 [chromium] › e2e\users.spec.ts:432:5 › Usuários › como gestor › o servidor recusa dar cargo com permissão que o autor não tem (1.7s)
  ok 70 [chromium] › e2e\userWithoutRole.spec.ts:31:3 › Usuário sem cargo › entra e não vê Usuários, Cargos, Auditoria nem Configurações, nem os blocos deles na home (1.2s)
  70 passed (1.9m)
exit=0
```

### Medidas da conferência (`medidas.json`, uma chave por linha)

```
preparo {"userId":"01a1c748-b777-7588-b4a5-7011df1bd67e","roleId":"01a1c748-b791-7270-b63b-c91ad5da117c","userStatus":201,"roleStatus":201}
light.home.panel {"viewport":{"w":1440,"h":900},"main":{"l":256,"t":0,"r":1440,"b":900,"w":1184},"mainRadius":"0px","mainMargin":"0px","header":{"l":256,"t":0,"r":1440,"b":64,"w":1184},"headerBg":"oklch(1 0 0)","headerPadLeft":"16px","panel":{"l":256,"t":64,"r":1440,"b":900,"w":1184},"panelBg":"oklab(0.967 0.000281923 -0.000959437 / 0.5)","panelRadius":"0px","bodyBg":"oklch(1 0 0)","firstCard":{"l":272,"t":354,"r":1035,"b":739,"w":763},"cardCount":4,"cardToPanelLeft":16,"cardToPanelRight":405,"cardLeftMinusHeaderContentLeft":0,"cardsNarrower":[763,373,568,568]}
light.users.panel {"viewport":{"w":1440,"h":900},"main":{"l":256,"t":0,"r":1440,"b":900,"w":1184},"mainRadius":"0px","mainMargin":"0px","header":{"l":256,"t":0,"r":1440,"b":64,"w":1184},"headerBg":"oklch(1 0 0)","headerPadLeft":"16px","panel":{"l":256,"t":64,"r":1440,"b":900,"w":1184},"panelBg":"oklab(0.967 0.000281923 -0.000959437 / 0.5)","panelRadius":"0px","bodyBg":"oklch(1 0 0)","firstCard":{"l":272,"t":72,"r":1424,"b":1043,"w":1152},"cardCount":1,"cardToPanelLeft":16,"cardToPanelRight":16,"cardLeftMinusHeaderContentLeft":0,"cardsNarrower":[]}
light.users.headers ["Nome","E-mail","Cargos","Status","Ações",""]
light.users.rowButtons [{"name":"Copiar e-mail","cls":"text-sm text-foreground text-muted-foreground text-foreground"},{"name":"Bloquear","cls":"text-sm text-foreground text-foreground text-warning"},{"name":"Excluir","cls":"text-sm text-foreground text-foreground text-destructive"}]
light.users.headerRowBg {"thead":"rgba(0, 0, 0, 0)","tr":"oklch(0.967 0.001 286.375)","th":"rgba(0, 0, 0, 0)","thColor":"oklch(0.54 0.016 285.938)"}
light.users.tooltip ["Copiar e-mail"]
light.users.columnMenu ["Nome=true","E-mail=true","Cargos=true","Status=true","Último acesso=false","Criado em=false"]
light.users.afterColumnMenuEsc {"focused":"Configurar colunas","tooltips":["Configurar colunas"],"buscarCenterHits":"tooltip"}
light.users.loading {"heldCount":1,"busy":0,"skeletons":40,"rows":8}
light.users.errorState {"retryVisible":true,"texts":"Nome\n\tE-mail\n\tCargos\tStatus\n\tAções\t\n\n\nNão foi possível carregar os usuários\nTente novamente em instantes.\nTentar novamente"}
light.userDetail.crumbsEntering ["Usuários","Usuários Detalhes do usuário","Usuários Pessoa Conferência 1794344793532"]
light.userDetail.tabs {"tabs":[{"name":"Visão geral","svg":0},{"name":"Atividade","svg":0},{"name":"Cargos","svg":0},{"name":"Sessões","svg":0}],"pipes":3,"text":"Visão geral | Atividade | Cargos | Sessões"}
light.userDetail.panel {"viewport":{"w":1440,"h":900},"main":{"l":256,"t":0,"r":1440,"b":900,"w":1184},"mainRadius":"0px","mainMargin":"0px","header":{"l":256,"t":0,"r":1440,"b":64,"w":1184},"headerBg":"oklch(1 0 0)","headerPadLeft":"16px","panel":{"l":256,"t":64,"r":1440,"b":900,"w":1184},"panelBg":"oklab(0.967 0.000281923 -0.000959437 / 0.5)","panelRadius":"0px","bodyBg":"oklch(1 0 0)","firstCard":{"l":272,"t":128,"r":840,"b":385,"w":568},"cardCount":4,"cardToPanelLeft":16,"cardToPanelRight":600,"cardLeftMinusHeaderContentLeft":0,"cardsNarrower":[568,568,568,568]}
light.userDetail.focus {"afterCancel":"BUTTON:Bloquear","afterEsc":"BUTTON:Bloquear","afterConfirm":"BUTTON:Desbloquear","afterUnblock":"BUTTON:Bloquear"}
light.userDetail.crumbsLeaving ["Usuários Pessoa Conferência 1794344793532","Usuários"]
light.userDetail.crumbsBrowserBack ["Usuários Pessoa Conferência 1794344793532","Usuários"]
light.roles.headers ["Nome","Descrição","Permissões","Usuários","Ações",""]
light.roles.rowButtons ["Copiar","Excluir"]
light.roles.columnMenu ["Nome=true","Descrição=true","Permissões=true","Usuários=true","Criado em=false"]
light.roleDetail.crumbsEntering ["Cargos","Cargos Detalhes do cargo","Cargos Detalhes do cargo","Cargos Cargo Conferência 1794344793532","Cargos Cargo Conferência 1794344793532"]
light.roleDetail.tabs {"tabs":[{"name":"Visão geral","svg":0},{"name":"Usuários","svg":0}],"pipes":1}
light.roleDetail.crumbsLeaving ["Cargos Cargo Conferência 1794344793532","Cargos Cargo Conferência 1794344793532","Cargos","Cargos"]
light.audit.headers ["Data/hora","Módulo","Entidade","Ação","Usuário","Resumo",""]
light.audit.rowButtons []
light.audit.panel {"viewport":{"w":1440,"h":900},"main":{"l":256,"t":0,"r":1440,"b":900,"w":1184},"mainRadius":"0px","mainMargin":"0px","header":{"l":256,"t":0,"r":1440,"b":64,"w":1184},"headerBg":"oklch(1 0 0)","headerPadLeft":"16px","panel":{"l":256,"t":64,"r":1440,"b":900,"w":1184},"panelBg":"oklab(0.967 0.000281923 -0.000959437 / 0.5)","panelRadius":"0px","bodyBg":"oklch(1 0 0)","firstCard":{"l":272,"t":72,"r":1424,"b":1356,"w":1152},"cardCount":1,"cardToPanelLeft":16,"cardToPanelRight":16,"cardLeftMinusHeaderContentLeft":0,"cardsNarrower":[]}
light.audit.columnMenu ["Data/hora=true","Módulo=true","Entidade=true","Ação=true","Usuário=true","Resumo=true"]
light.navUser.menu "AD\nAdmin\nadmin@admin.com\nConta\nSair"
light.sidebarCollapsed {"mainLeft":48,"headerH":48,"themeBtn":{"x":7.5,"y":824,"width":32,"height":32},"userBtn":{"x":7.5,"y":860,"width":32,"height":32}}
dark.home.panel {"viewport":{"w":1440,"h":900},"main":{"l":256,"t":0,"r":1440,"b":900,"w":1184},"mainRadius":"0px","mainMargin":"0px","header":{"l":256,"t":0,"r":1440,"b":64,"w":1184},"headerBg":"oklch(0.141 0.005 285.823)","headerPadLeft":"16px","panel":{"l":256,"t":64,"r":1440,"b":900,"w":1184},"panelBg":"oklab(0.274 0.00165715 -0.00576662 / 0.5)","panelRadius":"0px","bodyBg":"oklch(0.141 0.005 285.823)","firstCard":{"l":272,"t":354,"r":1035,"b":739,"w":763},"cardCount":4,"cardToPanelLeft":16,"cardToPanelRight":405,"cardLeftMinusHeaderContentLeft":0,"cardsNarrower":[763,373,568,568]}
dark.users.panel {"viewport":{"w":1440,"h":900},"main":{"l":256,"t":0,"r":1440,"b":900,"w":1184},"mainRadius":"0px","mainMargin":"0px","header":{"l":256,"t":0,"r":1440,"b":64,"w":1184},"headerBg":"oklch(0.141 0.005 285.823)","headerPadLeft":"16px","panel":{"l":256,"t":64,"r":1440,"b":900,"w":1184},"panelBg":"oklab(0.274 0.00165715 -0.00576662 / 0.5)","panelRadius":"0px","bodyBg":"oklch(0.141 0.005 285.823)","firstCard":{"l":272,"t":72,"r":1424,"b":1043,"w":1152},"cardCount":1,"cardToPanelLeft":16,"cardToPanelRight":16,"cardLeftMinusHeaderContentLeft":0,"cardsNarrower":[]}
dark.users.headers ["Nome","E-mail","Cargos","Status","Ações",""]
dark.users.rowButtons [{"name":"Copiar e-mail","cls":"text-sm text-foreground text-muted-foreground text-foreground"},{"name":"Bloquear","cls":"text-sm text-foreground text-foreground text-warning"},{"name":"Excluir","cls":"text-sm text-foreground text-foreground text-destructive"}]
dark.users.headerRowBg {"thead":"rgba(0, 0, 0, 0)","tr":"oklch(0.274 0.006 286.033)","th":"rgba(0, 0, 0, 0)","thColor":"oklch(0.705 0.015 286.067)"}
dark.users.tooltip ["Copiar e-mail"]
dark.users.columnMenu ["Nome=true","E-mail=true","Cargos=true","Status=true","Último acesso=false","Criado em=false"]
dark.users.afterColumnMenuEsc {"focused":"Configurar colunas","tooltips":["Configurar colunas"],"buscarCenterHits":"tooltip"}
dark.users.loading {"heldCount":1,"busy":0,"skeletons":40,"rows":8}
dark.users.errorState {"retryVisible":true,"texts":"Nome\n\tE-mail\n\tCargos\tStatus\n\tAções\t\n\n\nNão foi possível carregar os usuários\nTente novamente em instantes.\nTentar novamente"}
dark.userDetail.crumbsEntering ["Usuários","Usuários Detalhes do usuário","Usuários Pessoa Conferência 1794344793532"]
dark.userDetail.tabs {"tabs":[{"name":"Visão geral","svg":0},{"name":"Atividade","svg":0},{"name":"Cargos","svg":0},{"name":"Sessões","svg":0}],"pipes":3,"text":"Visão geral | Atividade | Cargos | Sessões"}
dark.userDetail.panel {"viewport":{"w":1440,"h":900},"main":{"l":256,"t":0,"r":1440,"b":900,"w":1184},"mainRadius":"0px","mainMargin":"0px","header":{"l":256,"t":0,"r":1440,"b":64,"w":1184},"headerBg":"oklch(0.141 0.005 285.823)","headerPadLeft":"16px","panel":{"l":256,"t":64,"r":1440,"b":900,"w":1184},"panelBg":"oklab(0.274 0.00165715 -0.00576662 / 0.5)","panelRadius":"0px","bodyBg":"oklch(0.141 0.005 285.823)","firstCard":{"l":272,"t":128,"r":840,"b":385,"w":568},"cardCount":4,"cardToPanelLeft":16,"cardToPanelRight":600,"cardLeftMinusHeaderContentLeft":0,"cardsNarrower":[568,568,568,568]}
dark.userDetail.focus {"afterCancel":"BUTTON:Bloquear","afterEsc":"BUTTON:Bloquear","afterConfirm":"BUTTON:Desbloquear","afterUnblock":"BUTTON:Bloquear"}
dark.userDetail.crumbsLeaving ["Usuários Pessoa Conferência 1794344793532","Usuários"]
dark.userDetail.crumbsBrowserBack ["Usuários Pessoa Conferência 1794344793532","Usuários"]
dark.roles.headers ["Nome","Descrição","Permissões","Usuários","Ações",""]
dark.roles.rowButtons ["Copiar","Excluir"]
dark.roles.columnMenu ["Nome=true","Descrição=true","Permissões=true","Usuários=true","Criado em=false"]
dark.roleDetail.crumbsEntering ["Cargos","Cargos Detalhes do cargo","Cargos Detalhes do cargo","Cargos Cargo Conferência 1794344793532","Cargos Cargo Conferência 1794344793532"]
dark.roleDetail.tabs {"tabs":[{"name":"Visão geral","svg":0},{"name":"Usuários","svg":0}],"pipes":1}
dark.roleDetail.crumbsLeaving ["Cargos Cargo Conferência 1794344793532","Cargos Cargo Conferência 1794344793532","Cargos","Cargos"]
dark.audit.headers ["Data/hora","Módulo","Entidade","Ação","Usuário","Resumo",""]
dark.audit.rowButtons []
dark.audit.panel {"viewport":{"w":1440,"h":900},"main":{"l":256,"t":0,"r":1440,"b":900,"w":1184},"mainRadius":"0px","mainMargin":"0px","header":{"l":256,"t":0,"r":1440,"b":64,"w":1184},"headerBg":"oklch(0.141 0.005 285.823)","headerPadLeft":"16px","panel":{"l":256,"t":64,"r":1440,"b":900,"w":1184},"panelBg":"oklab(0.274 0.00165715 -0.00576662 / 0.5)","panelRadius":"0px","bodyBg":"oklch(0.141 0.005 285.823)","firstCard":{"l":272,"t":72,"r":1424,"b":1356,"w":1152},"cardCount":1,"cardToPanelLeft":16,"cardToPanelRight":16,"cardLeftMinusHeaderContentLeft":0,"cardsNarrower":[]}
dark.audit.columnMenu ["Data/hora=true","Módulo=true","Entidade=true","Ação=true","Usuário=true","Resumo=true"]
dark.navUser.menu "AD\nAdmin\nadmin@admin.com\nConta\nSair"
dark.sidebarCollapsed {"mainLeft":48,"headerH":48,"themeBtn":{"x":7.5,"y":824,"width":32,"height":32},"userBtn":{"x":7.5,"y":860,"width":32,"height":32}}
app.consoleErrors ["Failed to load resource: net::ERR_FAILED","Failed to load resource: net::ERR_FAILED","Failed to load resource: net::ERR_FAILED","Failed to load resource: net::ERR_FAILED"]
sb.themeGlobalEscuroComSistemaClaro "light"
light.sb.modalHeaderActionEsc {"focusInModal":"DIV:dialog:Contrato.pdfBaixar[data-radix-","closedAfterOneEsc":true}
light.sb.attachmentPreview {"image":{"img":{"src":"blob:","naturalWidth":320,"complete":true},"iframe":null,"buttons":["Baixar Foto da vistoria.png","Fechar"],"closedAfterOneEsc":true},"pdf":{"img":null,"iframe":{"src":"blob:","sandbox":null,"h":630},"buttons":["Baixar Proposta.pdf","Fechar"],"frameUrl":"blob:","frameContent":{"embedType":null,"contentType":"application/pdf","text":""},"closedAfterOneEsc":true},"text":{"img":null,"iframe":{"src":"blob:","sandbox":"","h":630},"buttons":["Baixar Anotações.txt","Fechar"],"frameUrl":"blob:","frameContent":{"embedType":null,"contentType":"text/plain","text":"Linha 1 do arquivo de exemplo\nLinha 2 do arquivo\n"},"closedAfterOneEsc":true},"zip":{"img":null,"iframe":null,"buttons":["Baixar Pacote.zip","Baixar arquivo","Fechar"],"closedAfterOneEsc":true}}
light.sb.fieldShortcuts {"htmlClass":"light","baseDefault":"R$ 1.000,00","pctDisabledEmptyBase":"true","pctNameEmptyBase":"50%","pctTooltipEmptyBase":["Informe o valor base."],"amountAfterDisabledClick":"","dateAfter7":"17/11/2026","today":"10/11/2026","baseTyped1000":"R$ 10,00","pctDisabledAfter":null,"amountAfter50":"R$ 5,00"}
light.sb.multiSelect {"before":["false","false","false","false","false"],"after":["true","true","true","true","true"],"selectAllStillVisible":false,"trigger":"5 selecionados"}
dark.sb.modalHeaderActionEsc {"focusInModal":"DIV:dialog:Contrato.pdfBaixar[data-radix-","closedAfterOneEsc":true}
dark.sb.attachmentPreview {"image":{"img":{"src":"blob:","naturalWidth":320,"complete":true},"iframe":null,"buttons":["Baixar Foto da vistoria.png","Fechar"],"closedAfterOneEsc":true},"pdf":{"img":null,"iframe":{"src":"blob:","sandbox":null,"h":630},"buttons":["Baixar Proposta.pdf","Fechar"],"frameUrl":"blob:","frameContent":{"embedType":null,"contentType":"application/pdf","text":""},"closedAfterOneEsc":true},"text":{"img":null,"iframe":{"src":"blob:","sandbox":"","h":630},"buttons":["Baixar Anotações.txt","Fechar"],"frameUrl":"blob:","frameContent":{"embedType":null,"contentType":"text/plain","text":"Linha 1 do arquivo de exemplo\nLinha 2 do arquivo\n"},"closedAfterOneEsc":true},"zip":{"img":null,"iframe":null,"buttons":["Baixar Pacote.zip","Baixar arquivo","Fechar"],"closedAfterOneEsc":true}}
dark.sb.fieldShortcuts {"htmlClass":"dark","baseDefault":"R$ 1.000,00","pctDisabledEmptyBase":"true","pctNameEmptyBase":"50%","pctTooltipEmptyBase":["Informe o valor base."],"amountAfterDisabledClick":"","dateAfter7":"17/11/2026","today":"10/11/2026","baseTyped1000":"R$ 10,00","pctDisabledAfter":null,"amountAfter50":"R$ 5,00"}
dark.sb.multiSelect {"before":["false","false","false","false","false"],"after":["true","true","true","true","true"],"selectAllStillVisible":false,"trigger":"5 selecionados"}
sb.consoleErrors []
limpeza {"user":200,"role":200}
```

### Conferências avulsas

```
# node senha-modal.mjs
light {"htmlClass":"light","before":{"visible":true,"disabled":true},"after":{"visible":true,"disabled":false},"afterEsc":{"dialogVisible":false,"discardPrompt":0}}
dark {"htmlClass":"dark","before":{"visible":true,"disabled":true},"after":{"visible":true,"disabled":false},"afterEsc":{"dialogVisible":false,"discardPrompt":0}}
# node tooltip-master.mjs (master na 4174, branch na 4173)
master /users {"tooltips":["Configurar colunas"],"focused":"Configurar colunas","buscarRect":[1320,231,88,32],"buscarCenterHits":"tooltip"}
master /roles {"tooltips":["Configurar colunas"],"focused":"Configurar colunas","buscarRect":[1320,155,88,32],"buscarCenterHits":"tooltip"}
master /audit-logs {"tooltips":["Configurar colunas"],"focused":"Configurar colunas","buscarRect":[1320,231,88,32],"buscarCenterHits":"tooltip"}
branch /users {"tooltips":["Configurar colunas"],"focused":"Configurar colunas","buscarRect":[1316,240,91,32],"buscarCenterHits":"tooltip"}
branch /roles {"tooltips":["Configurar colunas"],"focused":"Configurar colunas","buscarRect":[1316,164,91,32],"buscarCenterHits":"tooltip"}
branch /audit-logs {"tooltips":["Configurar colunas"],"focused":"Configurar colunas","buscarRect":[1316,240,91,32],"buscarCenterHits":"tooltip"}
```
