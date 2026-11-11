# Relatório de testes: rodada 8, "consistência de UI" (TPL-34 a TPL-40)

## 1. Cabeçalho

| Campo            | Valor                                                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Recorte          | Rodada 8 (TPL-34 a TPL-38) e pendências (TPL-39, TPL-40): verificação real pendente                                                                                                  |
| Plataforma       | frontend (Playwright contra o app real e o server real)                                                                                                                              |
| Repositório      | `D:\Development\personal-projects\templates\frontend-template` (frontend); par: `D:\Development\personal-projects\templates\server-template` (backend, branch `main`, sem alteração) |
| Branch           | `ui-consistencia` (árvore sem commit; nada em `src/` foi editado nesta sessão)                                                                                                       |
| Data da execução | 2026-11-04                                                                                                                                                                           |
| Specs lidos      | `docs/specs/ui-consistencia.pedido.md`, `TASKS.md` (rodada 8 e TPL-39/40), `docs/specs/TPL-34..38.handoff.md`                                                                        |

## 2. Bloqueios

Nenhum bloqueio aberto. Resolvidos durante a sessão:

| O que travou                                                                                                                 | Casos derrubados                                                                                  | O que foi feito                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Binário do Chromium do Playwright ausente (`chromium_headless_shell-1243`)                                                   | a 1ª execução do `fechamento`: 70 de 70 falharam no `browserType.launch`, antes de qualquer passo | `pnpm exec playwright install chromium`; `fechamento` refeito (placar abaixo é o da 2ª execução)                  |
| `pnpm run dev -- --port 4173 --strictPort` subiu o Vite na 5173 (pnpm 12.16.1 repassa o `--` ao Vite, que ignora o `--port`) | nenhum                                                                                            | parei só esse Vite (casado pela linha de comando) e subi `pnpm exec vite --port 4173 --strictPort`; ver achado F3 |

**Vermelho que trava o push:** a suíte e2e não está verde (2 falhas determinísticas, causadas pela branch, bug B1).

## 3. O que a automação já garante

| Camada                                                            | Escopo                                     | Comando                                                                                                                                         | Resultado                                                                         |
| ----------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| e2e (Playwright, suíte do repo)                                   | `fechamento` (camada inteira, 14 specs)    | `VITE_API_URL=http://localhost:8095/api E2E_PORT=4173 pnpm exec playwright test`                                                                | **68 passed, 2 failed, 0 skipped** (70 testes; 13 de 14 arquivos verdes; 2,3 min) |
| e2e (Playwright, suíte do repo)                                   | repetição dirigida dos 2 que falharam      | `... pnpm exec playwright test e2e/auditLogs.spec.ts -g "pagina a partir do primeiro registro\|abre o detalhe com o que mudou" --repeat-each=2` | **0 passed, 4 failed** (determinístico: `Expected: 10, Received: 12` nas 4)       |
| verificação visual (Playwright dirigindo o app, script da sessão) | `loop` (itens 1 a 5 do pedido, 5 larguras) | `node verify/verify.mjs` (scratchpad da sessão)                                                                                                 | **185 checagens, 184 ok, 1 falha** (bug B2)                                       |

O script de verificação não é spec do repositório: roda contra o app real, entra pela tela de login, navega pelo menu e mede o DOM renderizado, mas não fica na suíte. Por isso os casos V1 a V16 levam `automatizado (sessão)`: verdes nesta execução, sem teste permanente que os repita (lacuna declarada na seção 7).

Larguras: 1440x900, 1280x800, 1024x768 com sidebar expandida e recolhida, 390x844 com `isMobile`, `hasTouch` e `deviceScaleFactor: 2`. Screenshots em `C:\Users\admin\AppData\Local\Temp\claude\15dbe538224f4a51\c15d8a30-3b1a-45d3-96b2-5de7dfe4a4e2\scratchpad\real\` (85 PNGs, nome `<tela>-<largura>.png`).

Atalhos de preparação (declarados):

- 30 pessoas `Pessoa Visual 01..30` e o cargo `Cargo Visual` (com `backoffice.users.read`, dado a Pessoa Visual 01 e 02) criados por API (`POST /client/users`, `POST /client/roles`, `PUT /client/users/:id/roles`), só para haver mais de 25 linhas e um cargo editável com pessoas. O mesmo passo pela interface é coberto por `e2e/users.spec.ts` "cria um usuário e abre o detalhe dele na aba Cargos" e `e2e/roles.spec.ts` "cria um cargo..." e "vincula um usuário pela aba Usuários" (verdes no `fechamento`).
- Login pela tela uma vez (admin do seed) e a sessão reaproveitada por `storageState`, como a suíte do repo faz.
- Itens de "Pendências" duplicados por `page.evaluate` (26 clones do primeiro `li`) só para provar o scroll interno com lista longa, como pedido; a página é recarregada depois.
- Rede lenta para o skeleton por CDP (`Network.emulateNetworkConditions`, latência 4 s), com os módulos da rota já carregados.
- Aviso de inatividade pelo relógio do Playwright (`clock.install` + `fastForward('19:10')`, padrão de 20 min), sem mudar configuração.

## 4. Cobertura das regras

| Regra                                                                                                    | Âncora                                                                                                                                                                                             | Casos       | Resultado                       |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------- |
| Par de cards: a lista mede a linha até o teto (lg 46rem, xl 36rem), corpo rola por dentro, âncora estica | `src/lib/constants/pairedCard.ts:22`, `:25`, `:28`; `src/screens/home/pendingTasks.tsx:44-45`; `src/screens/home/activityChart.tsx:29`, `:31`                                                      | V1, V2      | passou                          |
| Selo de demonstração inteiro no cabeçalho; cabeçalho estreito (< 20rem) empilha                          | `src/components/ui/card.tsx:28`, `:55`, `:66-70`                                                                                                                                                   | V3, V6      | passou                          |
| Atalhos rápidos com blocos de mesma altura                                                               | `src/screens/home/quickActions.tsx:71` (`h-full`)                                                                                                                                                  | V4          | passou                          |
| Rodapé de modal: 1 botão ocupa 100%, 2+ centralizados na largura do texto                                | `src/components/global/modal/modal.tsx:273`; `src/components/ui/alert-dialog.tsx:99`; `src/components/ui/dialog.tsx:118`                                                                           | V7, V8, V10 | passou                          |
| Modal sem descrição não renderiza `Description` nem `aria-describedby`                                   | `src/components/global/modal/modal.tsx:163-201`                                                                                                                                                    | V9          | passou                          |
| Troca de senha: descrição "Esta sessão continua aberta.", botão só com edição                            | `src/screens/account/security/changePasswordModal.tsx:44`, `:132`                                                                                                                                  | V7          | passou                          |
| Coluna "Ações" com título e botões no mesmo eixo; coluna própria do ícone de colunas, fora do menu       | `src/components/global/dataTable/columnHelpers.tsx:380-386`; `src/components/global/dataTable/columnVisibilityMenu.tsx:131-132`                                                                    | V11, V12    | passou                          |
| Skeleton: Ações centralizada, coluna do ícone sem skeleton                                               | `src/components/global/dataTable/dataTable.tsx:318-326`                                                                                                                                            | V15         | passou                          |
| "Itens por página" 25/50/100, chave global `dataTable:pageSize`, troca volta à página 1, URL vence       | `src/components/global/dataTable/pageSizeStorage.ts:2`, `:7`; `src/components/global/dataTable/useDataTableUrlQuery.ts:59-60`, `:119-128`; `src/components/global/dataTable/dataTable.tsx:468-490` | V13         | passou, com B2                  |
| Rodapé da tabela quebra sem overflow em 390                                                              | `src/components/global/dataTable/dataTable.tsx:468`, `:473`                                                                                                                                        | V14         | passou (ver F1)                 |
| Cargo, aba Usuários: header "Ações" visível e centralizado                                               | `src/screens/roles/details/usersTab.tsx:188`, `:207`                                                                                                                                               | V16         | passou                          |
| Auditoria com 25 por página (era 10)                                                                     | `src/screens/audit-logs/list/index.tsx:29`                                                                                                                                                         | E2E         | falhou: spec desatualizado (B1) |

Checagem anti-lacuna:

- Toda regra colhida aparece em caso: sim (tabela acima).
- Todo caso aponta para regra com âncora: sim.
- Recusa da API: não se aplica; nenhuma regra do recorte é de permissão ou validação (layout, texto, preferência local). O `pageSize` vai para a API e foi conferido na requisição (V13).
- Dado existente: o recorte não mexe em dado gravado; sem fase de migração. A única persistência nova é `localStorage` do navegador.
- Perfis: só o admin do seed. O pedido não traz regra por perfil (o caso "cargos sem permissão: só a coluna do ícone", do handoff do TPL-36, ficou fora: ver seção 7).
- Caminho de erro: `?pageSize=` inválido e storage bloqueado têm teste unitário (handoff TPL-35); não reexecutados aqui.
- Nenhum caso manual.
- Processos no ar: seção 9.

## 5. Resultado por caso

| Id  | Título                                                                                                                                                                                                                                                                               | Severidade | Execução              | Resultado                                                              | Spec                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | --------------------- | ---------------------------------------------------------------------- | --------------------------------------- |
| V1  | Home: par "Atividade da semana" + "Pendências" com 4 itens sem scroll, sem vazio, gráfico ocupando a altura, mesma altura em lg                                                                                                                                                      | normal     | automatizado (sessão) | passou nas 5 larguras                                                  | `verify.mjs`, grupo `home`              |
| V2  | Home: lista longa (30 itens) rola por dentro, título fixo, teto 576px em xl e 736px em lg, gráfico acompanha; em 390 corpo até 448px                                                                                                                                                 | normal     | automatizado (sessão) | passou nas 5                                                           | `verify.mjs`, `home`                    |
| V3  | Home: selos "Dados de demonstração" inteiros (sem corte no card)                                                                                                                                                                                                                     | normal     | automatizado (sessão) | passou nas 5                                                           | `verify.mjs`, `home`                    |
| V4  | Home: atalhos rápidos com blocos da mesma altura na linha                                                                                                                                                                                                                            | normal     | automatizado (sessão) | passou nas 5                                                           | `verify.mjs`, `home`                    |
| V5  | Home, listagens e detalhe: sem texto cortado por overflow ou ellipsis                                                                                                                                                                                                                | normal     | automatizado (sessão) | passou                                                                 | `verify.mjs`, `home`/`listagem`/`modal` |
| V6  | Conta > Segurança: ação do cabeçalho à direita no largo, empilhada no estreito, com e sem descrição, sem corte                                                                                                                                                                       | normal     | automatizado (sessão) | passou (largo de 1440 a 1024; em 390 o cabeçalho mede 292px e empilha) | `verify.mjs`, `seguranca`               |
| V7  | Troca de senha: descrição visível, sem rodapé antes de editar, com edição 1 botão a 100% (Dialog no desktop, Drawer em 390)                                                                                                                                                          | normal     | automatizado (sessão) | passou nas 5                                                           | `verify.mjs`, `modal`                   |
| V8  | ConfirmDialog "Bloquear usuário?" com 2 botões centralizados, cada um na largura do texto (cancelado, nada gravado)                                                                                                                                                                  | normal     | automatizado (sessão) | passou nas 5 (em 390 continua AlertDialog)                             | `verify.mjs`, `modal`                   |
| V9  | Detalhe da auditoria: sem descrição, sem `aria-describedby`, sem rodapé de botões, sem overflow (Dialog e Drawer)                                                                                                                                                                    | normal     | automatizado (sessão) | passou nas 5                                                           | `verify.mjs`, `modal`                   |
| V10 | Aviso de inatividade: "Continuar conectado" a 100% e inteiro na tela                                                                                                                                                                                                                 | normal     | automatizado (sessão) | passou em 1440 (Dialog) e 390 (Drawer)                                 | `verify.mjs`, `modal`                   |
| V11 | Usuários e cargos: "Ações" com título e botões no mesmo eixo (desvio máximo 0,04px); última coluna só com o ícone (56px), à direita de "Ações", células vazias; auditoria com a coluna do ícone                                                                                      | normal     | automatizado (sessão) | passou nas 5                                                           | `verify.mjs`, `listagem`                |
| V12 | Menu de colunas sem "Ações" (usuários, cargos, auditoria)                                                                                                                                                                                                                            | normal     | automatizado (sessão) | passou nas 5                                                           | `verify.mjs`, `listagem`                |
| V13 | Itens por página: padrão 25, opções 25/50/100; na página 2 da auditoria trocar para 50 volta à página 1 e grava `dataTable:pageSize=50`; vale em Usuários (32 linhas numa página) e depois de recarregar; `?pageSize=100` vence (combo 100, storage segue 50, requisição só com 100) | normal     | automatizado (sessão) | passou, com 1 falha: requisição extra (B2)                             | `verify.mjs`, `page-size` (1440)        |
| V14 | Rodapé da tabela em 390 sem overflow horizontal (usuários, cargos, auditoria)                                                                                                                                                                                                        | normal     | automatizado (sessão) | passou (`scrollWidth` 326 = `clientWidth` 326; ver F1)                 | `verify.mjs`, `listagem`                |
| V15 | Skeleton com rede lenta: Ações centralizada (desvio 0), coluna do ícone sem skeleton                                                                                                                                                                                                 | normal     | automatizado (sessão) | passou em 1440, 1280, 1024 expandida e 390                             | `verify.mjs`, `listagem`                |
| V16 | Cargo > aba Usuários: header "Ações" visível (42px, `text-align: center`) e centralizado sobre os botões                                                                                                                                                                             | normal     | automatizado (sessão) | passou nas 5                                                           | `verify.mjs`, `cargo-usuarios`          |
| E2E | Suíte e2e completa do frontend contra o server real                                                                                                                                                                                                                                  | alto       | automatizado          | falhou: 68/70 (B1)                                                     | `e2e/*.spec.ts`                         |

Contagem: 17 casos; 16 `normal`, 1 `alto` (a suíte, que trava o push); 0 crítico; 0 manual; 0 `nao executado`.

## 6. Bugs encontrados

| Id  | Descrição                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Severidade            | Âncora                                                                                  | Status |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------- | ------ |
| B1  | `e2e/auditLogs.spec.ts` ainda espera 10 linhas por página na auditoria; o TPL-35 trocou `PAGE_SIZE` de 10 para 25, e a busca pela auditada devolve os 12 eventos numa página só. Falham "pagina a partir do primeiro registro" (`toHaveCount(10)` em `:133`) e "abre o detalhe com o que mudou..." (`:150-151`). Causa: branch (TPL-35); o spec não foi atualizado (`git diff --stat -- e2e/` vazio). Defeito do teste, não da tela. Trava o push.                                                                      | alto (suíte vermelha) | `e2e/auditLogs.spec.ts:126-139`, `:142-151`; `src/screens/audit-logs/list/index.tsx:29` | aberto |
| B2  | Trocar "Itens por página" fora da página 1 faz uma requisição a mais com a página antiga e o tamanho novo: na página 2 da auditoria, 25 → 50 pede `GET /client/audit-logs?page=1&pageSize=50` (itens 51 a 100) e só depois `?page=0&pageSize=50`. O estado final está certo (página 1, primeira linha igual à da página 1), mas sai uma chamada inútil. Causa provável: `setStoredPageSize` (`:121`) atualiza o estado local e renderiza com o tamanho novo antes do `navigate` (`:124`) zerar a página na URL. TPL-35. | normal                | `src/components/global/dataTable/useDataTableUrlQuery.ts:119-128`                       | aberto |

Saída da checagem que falhou: `FAIL [page-size] [1440] troca para 50 pede so a primeira pagina ao servidor (page=0) ["/api/client/audit-logs?page=1&pageSize=50","/api/client/audit-logs?page=0&pageSize=50"]`.

## 7. Critério para considerar pronto

- B1 precisa ser corrigido (spec da auditoria com 25 por página, ou dado com mais de 25 eventos) e o `fechamento` refeito verde antes do push, que pela regra do repositório só sai com suíte verde.
- B2 pode seguir registrado: estado final correto, custo de uma requisição. Quando corrigir, o `pos-correcao` é `e2e/auditLogs.spec.ts`, `e2e/users.spec.ts`, `e2e/roles.spec.ts` e os testes de `src/tests/globais/dataTable`.
- Lacuna: os casos V1 a V16 não têm spec permanente. Ficam provados nesta execução, mas uma regressão de layout não derruba a suíte.
- Não verificado, e por quê:
  - Aviso de inatividade em 1280 e 1024: medido só em 1440 e 390 (Dialog e Drawer; nas outras larguras de desktop é o mesmo Dialog).
  - Skeleton com sidebar recolhida em 1024: pulado (o recolhimento não persiste entre recarregamentos, e o preparo do skeleton recarrega a página).
  - Rodapé com texto entre botões: nenhuma tela real tem (só a story do TPL-34).
  - Drawer com 2 botões no mobile: nenhuma tela real tem; o ConfirmDialog continua AlertDialog em 390 (V8).
  - Cargos sem permissão de escrita (só a coluna do ícone, sem "Ações" vazio): fora do pedido; não exercitado.

Achados de fora do escopo, para decidir depois:

| Id  | Achado                                                                                                                                                                                                                                                                   | Por que não afeta o recorte         | Âncora / evidência                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| F1  | Em 390 o rodapé da tabela quebra com "Itens por página", o seletor e "Anterior" numa linha e "Próxima" sozinha na de baixo. Sem overflow, mas o par Anterior/Próxima se separa; o handoff do TPL-35 diz "linhas limpas". Cosmético.                                      | não quebra função                   | `src/components/global/dataTable/dataTable.tsx:468`; `...\scratchpad\real\lista-usuarios-rodape-390.png` |
| F2  | Menu mobile (Sheet) não fecha ao tocar num item: a tela nova carrega por trás e o menu fica aberto até tocar fora. Nenhum `setOpenMobile` fora de `ui/sidebar.tsx`; anterior à branch (o diff de `sidebar.tsx` só traduz o título).                                      | anterior à branch                   | `src/components/ui/sidebar.tsx:198-200`; `src/components/global/layout/layout.tsx:47`                    |
| F3  | `playwright.config.ts` sobe o Vite com `pnpm run dev -- --port ${FRONTEND_PORT} --strictPort`; com pnpm 12.16.1 o `--` chega ao Vite, que ignora `--port` e sobe na 5173. Sem um Vite já de pé na 4173, o `webServer` esperaria a 4173 até o timeout. Anterior à branch. | não exercitado (Vite reaproveitado) | `playwright.config.ts:45-46`                                                                             |
| F4  | O rótulo sr-only do botão da sidebar continua em inglês ("Toggle Sidebar", no trigger e no rail); o TPL-39 traduziu só o cabeçalho do Sheet.                                                                                                                             | só leitor de tela                   | `src/components/ui/sidebar.tsx:275`, `:287-290`                                                          |

## 8. Dado existente

O recorte não lê nem escreve dado gravado no banco (layout, copy e preferência em `localStorage`). Sem baseline nem fase de migração.

## 9. Ambiente de teste

| Item                                                                            | Necessário para                            | Como obter                                                                                                                                                                        | Estado                                    |
| ------------------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Postgres do compose do server-template (`server-template-postgres`, porta 5433) | banco do server                            | já estava de pé (não foi subido nem parado por esta sessão)                                                                                                                       | ok                                        |
| Banco `temporary-39f6b736`                                                      | dado descartável                           | `docker exec server-template-postgres psql -U postgres -c 'CREATE DATABASE "temporary-39f6b736";'`                                                                                | criado, migrado e semeado; apagado no fim |
| server-template na 8095                                                         | API real                                   | `DATABASE_URL=postgresql://postgres:***@localhost:5433/temporary-39f6b736 PORT=8095 CORS_ORIGINS=http://localhost:4173 node --env-file-if-exists=.env --import tsx src/server.ts` | ok (`/health/ready` 200); parado no fim   |
| Vite do frontend na 4173                                                        | app e e2e (reaproveitado pelo `webServer`) | `VITE_API_URL=http://localhost:8095/api pnpm exec vite --port 4173 --strictPort` (variável de ambiente, sem `.env.local`)                                                         | ok; parado no fim                         |
| Chromium do Playwright 1243                                                     | e2e e verificação                          | `pnpm exec playwright install chromium`                                                                                                                                           | instalado                                 |

- Portas não tocadas: 8080 (outro projeto), 5432 (`db-local`), 5173 e 5174. O `.env` do server aponta para a 5432 e não foi usado: a `DATABASE_URL` foi injetada por comando (Node e `dotenv` não sobrescrevem variável já definida).
- Prova do banco: host `localhost`, porta 5433 (container do compose do server-template), nome `temporary-39f6b736` criado nesta sessão; migrations por `pnpm exec prisma migrate deploy` ("All migrations have been successfully applied"); seed por `pnpm exec prisma db seed`; tabela `users` com `admin@admin.com` e `blocked@admin.com`, conferida antes de qualquer escrita.
- Comandos: criação acima (uma vez); reset não usado (a suíte desfaz o que cria, e uma rodada só); descarte `docker exec server-template-postgres psql -U postgres -c 'DROP DATABASE "temporary-39f6b736";'`.
- Perfis: admin do seed (`admin@admin.com`, senha `123123123` do `prisma/seed.ts`), login pela tela. A suíte e2e cria e exclui o próprio gestor e as próprias pessoas.
- Escritas da verificação: só o preparo da seção 3 (no banco temporário). O ConfirmDialog foi cancelado e a troca de senha fechada sem enviar.

## 10. Dúvidas abertas

- B1: o dono prefere que o spec da auditoria passe a usar 25 por página (com mais eventos no preparo) ou que leia o tamanho da tela?
- F1: aceitar a quebra atual em 390 ou manter Anterior e Próxima sempre juntos?

## Portão de fechamento

1. **A suíte rodou, e em que escopo?** Sim. `loop` (verificação dirigida dos itens 1 a 5): `node verify/verify.mjs`, 185 checagens, 184 ok, 1 falha (B2). `fechamento`: `VITE_API_URL=http://localhost:8095/api E2E_PORT=4173 pnpm exec playwright test`, `68 passed`, `2 failed` (B1), mais a repetição dirigida `--repeat-each=2` dos dois, `4 failed`. Saídas coladas no anexo. Atalhos: pessoas e cargo por API (cobertos pela interface em `e2e/users.spec.ts` "cria um usuário e abre o detalhe dele na aba Cargos" e `e2e/roles.spec.ts` "cria um cargo: marcar uma escrita marca e trava a leitura" e "vincula um usuário pela aba Usuários, com a busca do servidor", verdes no `fechamento`); itens de Pendências por DOM, só para medir (pedido explícito, sem par na interface porque a lista é de demonstração).
2. **Cada selo tem teste nomeado?** E2E: os 70 títulos estão na saída do runner; os 2 vermelhos são B1. V1 a V16: `automatizado (sessão)`, cada um com as linhas `OK`/`FAIL` do script no anexo (grupos `home`, `seguranca`, `modal`, `listagem`, `cargo-usuarios`, `page-size`); sem spec permanente (lacuna da seção 7).
3. **A app foi dirigida como uma pessoa dirige?** Sim: login pela tela, listagens pelo menu lateral (no mobile pelo Sheet "Menu"), aba Segurança e aba Usuários do cargo por clique, menus de ações e de colunas por clique, seletor de itens por página por clique, recarregar pela página. Exceções declaradas: com a sidebar recolhida, as telas abriram por URL e a sidebar foi recolhida pelo botão. O recorte não tem ciclo de vida de registro (nada é criado, editado ou excluído pela tela); o ciclo de usuários e cargos é coberto pelos specs do `fechamento` (`users.spec.ts` cria, edita, bloqueia e exclui; `roles.spec.ts` cria, edita, copia e exclui), conferido na tela e na resposta do server.
4. **De onde veio cada login?** `admin@admin.com`, do seed do server-template (`pnpm exec prisma db seed`, senha `123123123`), entrando pela tela de login. A suíte e2e entra com o mesmo admin e com o gestor que o `globalSetup` cria por API e exclui no fim.
5. **O banco temporário foi apagado?** Sim: `temporary-39f6b736`, com `docker exec server-template-postgres psql -U postgres -c 'DROP DATABASE "temporary-39f6b736";'` (saída no anexo).

## Anexo: saídas coladas

### `fechamento`: `pnpm exec playwright test` (2a execucao, linhas de resultado e resumo)

```text
  ok  1 [chromium] › e2e\account.spec.ts:103:3 › Minha conta › Perfil: pré-preenche pelo servidor, salva só o que mudou e atualiza a sessão (4.0s)
  ok  2 [chromium] › e2e\account.spec.ts:148:3 › Minha conta › Perfil: tempo acima do limite da empresa é recusado no campo, sem toast (1.1s)
  ok  3 [chromium] › e2e\account.spec.ts:187:3 › Minha conta › Perfil: trocar de aba com edição não salva pede confirmação (1.9s)
  ok  4 [chromium] › e2e\account.spec.ts:223:3 › Minha conta › Segurança: troca a senha (a atual errada marca o campo) e volta à original (3.2s)
  ok  5 [chromium] › e2e\account.spec.ts:277:3 › Minha conta › o que não tem servidor mostra o aviso de demonstração (2.9s)
  ok  6 [chromium] › e2e\auditLogs.spec.ts:86:3 › Auditoria › lista os registros de auditoria, o mais recente primeiro (1.1s)
  ok  7 [chromium] › e2e\auditLogs.spec.ts:95:3 › Auditoria › filtra por conteúdo: o que casa aparece, o que não casa some (2.0s)
  ok  8 [chromium] › e2e\auditLogs.spec.ts:109:3 › Auditoria › filtra por módulo (multiSelect) mantendo só o que casa (1.8s)
  x   9 [chromium] › e2e\auditLogs.spec.ts:128:3 › Auditoria › pagina a partir do primeiro registro (6.5s)
  x  10 [chromium] › e2e\auditLogs.spec.ts:142:3 › Auditoria › abre o detalhe com o que mudou e os dados técnicos recolhidos (6.6s)
  ok 11 [chromium] › e2e\auditLogs.spec.ts:174:3 › Auditoria › evento sem campos alterados mostra o estado vazio do de→para (1.5s)
  ok 12 [chromium] › e2e\auditLogs.spec.ts:218:3 › Auditoria — filtro por usuário › só aparece com a permissão de ver usuários, e filtra pelo autor (2.9s)
  ok 13 [chromium] › e2e\auditLogs.spec.ts:308:3 › Atividade do usuário › mostra a linha do tempo do usuário, paginada, a mais recente primeiro (1.1s)
  ok 14 [chromium] › e2e\columnVisibility.spec.ts:15:3 › Tabela — mostrar e ocultar colunas › oculta uma coluna e mantém a escolha após recarregar (2.7s)
  ok 15 [chromium] › e2e\columnVisibility.spec.ts:42:3 › Tabela — mostrar e ocultar colunas › abrir o menu de colunas mantém a cor do cabeçalho (1.3s)
  ok 16 [chromium] › e2e\columnVisibility.spec.ts:56:3 › Tabela — mostrar e ocultar colunas › ocultar colunas não altera os filtros da URL (1.5s)
  ok 17 [chromium] › e2e\home.spec.ts:76:3 › Home › números de usuários e atividade recente reais (943ms)
  ok 18 [chromium] › e2e\home.spec.ts:107:3 › Home › o que não tem rota mostra o aviso; os atalhos abrem telas reais (1.2s)
  ok 19 [chromium] › e2e\idleTimeout.spec.ts:58:3 › Tempo de inatividade da sessão › segue a configuração da empresa gravada no preparo (969ms)
  ok 20 [chromium] › e2e\login.spec.ts:11:3 › Login › renderiza o formulário de login (589ms)
  ok 21 [chromium] › e2e\login.spec.ts:20:3 › Login › valida e-mail inválido antes de enviar (642ms)
  ok 22 [chromium] › e2e\login.spec.ts:28:3 › Login › navega para a tela de criar conta (623ms)
  ok 23 [chromium] › e2e\loginErrors.spec.ts:13:3 › Login recusado pelo server real › senha errada mostra "Credenciais inválidas." (881ms)
  ok 24 [chromium] › e2e\loginErrors.spec.ts:24:3 › Login recusado pelo server real › conta bloqueada mostra "Sua conta está bloqueada." (1.0s)
  ok 25 [chromium] › e2e\roles.spec.ts:205:5 › Cargos › como admin › lista os cargos do servidor pela busca, com as contagens (1.6s)
  ok 26 [chromium] › e2e\roles.spec.ts:230:5 › Cargos › como admin › o item "Cargos" do menu abre a lista (1.1s)
  ok 27 [chromium] › e2e\roles.spec.ts:247:5 › Cargos › como admin › cria um cargo: marcar uma escrita marca e trava a leitura (1.3s)
  ok 28 [chromium] › e2e\roles.spec.ts:285:5 › Cargos › como admin › recusa o nome repetido com o toast do servidor, um só (1.1s)
  ok 29 [chromium] › e2e\roles.spec.ts:299:5 › Cargos › como admin › edita as permissões e o servidor guarda a expansão para leitura (1.9s)
  ok 30 [chromium] › e2e\roles.spec.ts:340:5 › Cargos › como admin › vincula um usuário pela aba "Usuários", com a busca do servidor (2.5s)
  ok 31 [chromium] › e2e\roles.spec.ts:384:5 › Cargos › como admin › o vínculo feito na tela de usuários aparece no cargo, sem recarregar (2.9s)
  ok 32 [chromium] › e2e\roles.spec.ts:415:5 › Cargos › como admin › copia um cargo pela lista e abre a cópia (1.5s)
  ok 33 [chromium] › e2e\roles.spec.ts:433:5 › Cargos › como admin › exclui com confirmação, e recusa o cargo com usuários vinculados (2.9s)
  ok 34 [chromium] › e2e\roles.spec.ts:465:5 › Cargos › como admin › o Administrador aparece só para leitura, sem ações (1.2s)
  ok 35 [chromium] › e2e\roles.spec.ts:498:5 › Cargos › como gestor › a permissão que o gestor não tem aparece desabilitada, com a explicação (906ms)
  ok 36 [chromium] › e2e\roles.spec.ts:514:5 › Cargos › como gestor › o servidor recusa copiar um cargo com permissão que o gestor não tem (1.4s)
  ok 37 [chromium] › e2e\roles.spec.ts:539:5 › Cargos › como gestor › editar o próprio cargo muda na hora o que a tela oferece (1.2s)
  ok 38 [chromium] › e2e\routeError.spec.ts:56:3 › Tela de erro por rota: telas protegidas › o erro no render troca só o conteúdo, e "Tentar novamente" desenha a tela de novo (819ms)
  ok 39 [chromium] › e2e\routeError.spec.ts:82:3 › Tela de erro por rota: telas protegidas › ir para outra tela pelo menu limpa o erro (1.2s)
  ok 40 [chromium] › e2e\routeError.spec.ts:101:3 › Tela de erro por rota: rotas públicas › o erro no render do login mostra a tela de erro sem o menu, e "Tentar novamente" desenha de novo (828ms)
  ok 41 [chromium] › e2e\session.spec.ts:47:3 › Sessão contra o server real › abrir o app sem sessão vai ao login, sem toast de erro (896ms)
  ok 42 [chromium] › e2e\session.spec.ts:64:3 › Sessão contra o server real › o admin entra, vê Usuários, Cargos, Auditoria e Configurações, e recarregar mantém a sessão (2.1s)
  ok 43 [chromium] › e2e\session.spec.ts:89:5 › Sessão contra o server real › com a sessão aberta › sair volta ao login, e a rota protegida depois redireciona para o login (1.7s)
  ok 44 [chromium] › e2e\settings.spec.ts:86:3 › Configurações › exibe os grupos e só as configurações do servidor (769ms)
  ok 45 [chromium] › e2e\settings.spec.ts:109:3 › Configurações › grava as alterações numa chamada só, com um toast, e o valor fica no servidor (1.5s)
  ok 46 [chromium] › e2e\settings.spec.ts:163:3 › Configurações › marca o campo que o servidor recusou, sem toast e sem gravar (839ms)
  ok 47 [chromium] › e2e\settings.spec.ts:200:3 › Configurações › recusa apagar a auditoria antes de anonimizá-la, com toast, sem gravar (855ms)
  ok 48 [chromium] › e2e\settings.spec.ts:223:3 › Configurações › descartar reverte a alteração (887ms)
  ok 49 [chromium] › e2e\unsavedChanges.spec.ts:72:3 › Edição não salva › menu lateral: "Continuar editando" fica com a edição, "Descartar alterações" sai (1.9s)
  ok 50 [chromium] › e2e\unsavedChanges.spec.ts:97:3 › Edição não salva › voltar do navegador com edição pergunta; ficar mantém a URL e a edição (2.1s)
  ok 51 [chromium] › e2e\unsavedChanges.spec.ts:124:3 › Edição não salva › dois voltar com a pergunta aberta: uma pergunta só, e ficar mantém URL e edição (2.3s)
  ok 52 [chromium] › e2e\unsavedChanges.spec.ts:158:3 › Edição não salva › Ctrl+clique no menu abre a tela em nova guia, sem perguntar (1.9s)
  ok 53 [chromium] › e2e\unsavedChanges.spec.ts:179:3 › Edição não salva › fechar a aba com edição pede o aviso nativo; sem edição, fecha direto (1.8s)
  ok 54 [chromium] › e2e\unsavedChanges.spec.ts:209:3 › Edição não salva › "Sair" com edição pergunta antes: "Continuar editando" fica logado na edição, "Descartar alterações" sai (2.0s)
  ok 55 [chromium] › e2e\unsavedChanges.spec.ts:244:3 › Edição não salva › depois de salvar, o menu sai sem perguntar (1.4s)
  ok 56 [chromium] › e2e\users.spec.ts:148:5 › Usuários › como admin › lista do servidor, com cargos e status derivado de isActive (1.1s)
  ok 57 [chromium] › e2e\users.spec.ts:170:5 › Usuários › como admin › ordena por status pelo cabeçalho, no servidor (1.6s)
  ok 58 [chromium] › e2e\users.spec.ts:200:5 › Usuários › como admin › id de cargo fora do formato na URL sai do filtro, sem toast (1.2s)
  ok 59 [chromium] › e2e\users.spec.ts:220:5 › Usuários › como admin › a aba "Sessões" do detalhe mostra o aviso de demonstração (1.0s)
  ok 60 [chromium] › e2e\users.spec.ts:230:5 › Usuários › como admin › filtra por status pelos campos: o que casa aparece, o que não casa some (1.5s)
  ok 61 [chromium] › e2e\users.spec.ts:245:5 › Usuários › como admin › filtra por cargo e por período de cadastro no servidor (3.0s)
  ok 62 [chromium] › e2e\users.spec.ts:269:5 › Usuários › como admin › cria um usuário e abre o detalhe dele na aba "Cargos" (2.4s)
  ok 63 [chromium] › e2e\users.spec.ts:296:5 › Usuários › como admin › recusa o e-mail já cadastrado com o toast do servidor (1.5s)
  ok 64 [chromium] › e2e\users.spec.ts:310:5 › Usuários › como admin › edita o cadastro no detalhe e o valor fica no servidor (2.7s)
  ok 65 [chromium] › e2e\users.spec.ts:339:5 › Usuários › como admin › troca o cargo na aba "Cargos" e mostra as permissões dele (3.5s)
  ok 66 [chromium] › e2e\users.spec.ts:366:5 › Usuários › como admin › bloqueia e desbloqueia pela lista, com confirmação (2.5s)
  ok 67 [chromium] › e2e\users.spec.ts:388:5 › Usuários › como admin › exclui pela lista, com confirmação (1.8s)
  ok 68 [chromium] › e2e\users.spec.ts:406:5 › Usuários › como admin › a recusa do servidor aparece num toast só, sem toast da tela (1.6s)
  ok 69 [chromium] › e2e\users.spec.ts:432:5 › Usuários › como gestor › o servidor recusa dar cargo com permissão que o autor não tem (1.7s)
  ok 70 [chromium] › e2e\userWithoutRole.spec.ts:31:3 › Usuário sem cargo › entra e não vê Usuários, Cargos, Auditoria nem Configurações, nem os blocos deles na home (1.2s)
...
  2 failed
  68 passed (2.3m)
exit=1
```

### Repeticao dirigida: `e2e/auditLogs.spec.ts` x2

```text
    Expected: 10
    Received: 12
    Expected: 10
    Received: 12
    Expected: 10
    Received: 12
    Expected: 10
    Received: 12
  4 failed
exit=1
```

### `loop`: `node verify/verify.mjs` (ultima execucao, todas as checagens)

```text
OK   [login] [1440] login pela tela com admin do seed http://localhost:4173/
OK   [home] [1440] Pendências com 4 itens sem scroll interno {"chartH":385,"pendH":385,"items":4,"pendScroll":false,"sh":309,"ch":309,"pendEmptyBelow":0,"chartEmptyBelow":0,"chartCardBottomGap":17,"pendCardBottomGap":17,"sameRow":true}
OK   [home] [1440] Pendências sem vazio abaixo do ultimo item vazio=0px
OK   [home] [1440] par na mesma linha com a mesma altura chart=385 pend=385
OK   [home] [1440] grafico ocupa a altura do corpo (sem vazio embaixo) vazio=0px
OK   [home] [1440] selos de demonstracao inteiros (nao cortados) [{"card":"?","clipped":false,"w":174,"sw":172},{"card":"?","clipped":false,"w":174,"sw":172},{"card":"Atividade da semana","clipped":false,"w":174,"sw":172},{"card":"Pendências","clipped":false,
OK   [home] [1440] atalhos rapidos com blocos da mesma altura na linha [[52,52],[84,84],[52]]
OK   [home] [1440] sem textos cortados na home []
OK   [home] [1440] lista longa rola por dentro, titulo fixo {"chartH":576,"pendH":576,"sh":2311,"ch":500,"scrolled":200,"headerFixed":true,"rem":16}
OK   [home] [1440] lista longa respeita o teto (576px) e o grafico acompanha pend=576 chart=576
OK   [seguranca] [1440] aba Segurança selecionada (aria-selected e cor diferente de Perfil) [{"t":"Perfil","sel":"false","color":"oklab(0.481056 -0.02331 -0.237087 / 0.986834)"},{"t":"Segurança","sel":"true","color":"oklab(0.159627 0.0000118469 -0.0175335 /
OK   [seguranca] [1440] card "Senha": largo, acao a direita {"title":"Senha","headerW":1086,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":null,"descOverlapsAction":false}
OK   [seguranca] [1440] card "Autenticação em 2 fatores": largo, acao a direita (com descricao) {"title":"Autenticação em 2 fatores","headerW":1086,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":true,"descOverlapsAction":false}
OK   [seguranca] [1440] card "Sessões ativas": largo, acao a direita {"title":"Sessões ativas","headerW":1086,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":null,"descOverlapsAction":false}
OK   [modal] [1440] troca de senha: descricao "Esta sessão continua aberta." visivel
OK   [modal] [1440] troca de senha: sem rodape antes de editar (isDirty) botoes=0
OK   [modal] [1440] troca de senha (Dialog): 1 botao ocupa 100% {"buttons":1,"footerW":480,"bs":[{"text":"Alterar senha","left":480,"right":960,"w":480,"top":580}],"leftGap":0,"rightGap":0,"texts":[],"footerBottomInView":true,"overflowX":false}
OK   [listagem] [1440] usuarios: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1440] usuarios: "Ações" com titulo e botoes no mesmo eixo {"headerCenter":1317.9,"textCenter":1317.9,"btnCenters":[1317.9],"maxDelta":0.03749999999990905,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1440] usuarios: coluna do icone propria, a direita de "Ações", celulas vazias {"headerCenter":1317.9,"textCenter":1317.9,"btnCenters":[1317.9],"maxDelta":0.03749999999990905,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1440] usuarios: menu de colunas sem "Ações" ["Nome","E-mail","Cargos","Status","Último acesso","Criado em"]
OK   [listagem] [1440] usuarios: sem textos cortados []
OK   [modal] [1440] ConfirmDialog (Desbloquear): 2 botoes centralizados, largura do texto {"buttons":2,"footerW":400,"bs":[{"text":"Cancelar","left":634.078125,"right":715.921875,"w":82,"top":483},{"text":"Bloquear","left":723.921875,"right":805.90625,"w":82,"
OK   [listagem] [1440] cargos: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1440] cargos: "Ações" com titulo e botoes no mesmo eixo {"headerCenter":1317.9,"textCenter":1317.9,"btnCenters":[1317.9],"maxDelta":0.03749999999990905,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1440] cargos: coluna do icone propria, a direita de "Ações", celulas vazias {"headerCenter":1317.9,"textCenter":1317.9,"btnCenters":[1317.9],"maxDelta":0.03749999999990905,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1440] cargos: menu de colunas sem "Ações" ["Nome","Descrição","Permissões","Usuários","Criado em"]
OK   [listagem] [1440] cargos: sem textos cortados []
OK   [listagem] [1440] auditoria: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1440] auditoria: menu de colunas sem "Ações" ["Data/hora","Módulo","Entidade","Ação","Usuário","Resumo"]
OK   [listagem] [1440] auditoria: sem textos cortados []
OK   [modal] [1440] detalhe da auditoria (dialog-content): sem descricao/vao, sem rodape de botoes, sem overflow {"hasDescription":false,"describedBy":null,"footerButtons":0,"overflowX":false,"kind":"dialog-content"}
OK   [modal] [1440] detalhe da auditoria sem textos cortados []
OK   [cargo-usuarios] [1440] header "Ações" visivel e centralizado sobre os botoes {"visibleText":true,"textW":42,"textAlign":"center","rows":2,"maxDelta":0}
OK   [modal] [1440] aviso de inatividade: botao inteiro dentro da tela depois da animacao
OK   [modal] [1440] aviso de inatividade (Dialog): 1 botao ocupa 100% {"buttons":1,"footerW":480,"bs":[{"text":"Continuar conectado","left":480,"right":960,"w":480,"top":486}],"leftGap":0,"rightGap":0,"texts":[],"footerBottomInView":true,"overflowX":false}
OK   [listagem] [1440] skeleton: coluna Ações centralizada, coluna do icone sem skeleton {"acoes":true,"rows":8,"maxDelta":0,"menuColHasSkeleton":false}
OK   [home] [1280] Pendências com 4 itens sem scroll interno {"chartH":500,"pendH":500,"items":4,"pendScroll":false,"sh":399,"ch":399,"pendEmptyBelow":0,"chartEmptyBelow":0,"chartCardBottomGap":17,"pendCardBottomGap":17,"sameRow":true}
OK   [home] [1280] Pendências sem vazio abaixo do ultimo item vazio=0px
OK   [home] [1280] par na mesma linha com a mesma altura chart=500 pend=500
OK   [home] [1280] grafico ocupa a altura do corpo (sem vazio embaixo) vazio=0px
OK   [home] [1280] selos de demonstracao inteiros (nao cortados) [{"card":"?","clipped":false,"w":174,"sw":172},{"card":"?","clipped":false,"w":174,"sw":172},{"card":"Atividade da semana","clipped":false,"w":174,"sw":172},{"card":"Pendências","clipped":false,
OK   [home] [1280] atalhos rapidos com blocos da mesma altura na linha [[52,52],[100,100],[52]]
OK   [home] [1280] sem textos cortados na home []
OK   [home] [1280] lista longa rola por dentro, titulo fixo {"chartH":576,"pendH":576,"sh":2817,"ch":475,"scrolled":200,"headerFixed":true,"rem":16}
OK   [home] [1280] lista longa respeita o teto (576px) e o grafico acompanha pend=576 chart=576
OK   [seguranca] [1280] aba Segurança selecionada (aria-selected e cor diferente de Perfil) [{"t":"Perfil","sel":"false","color":"oklab(0.448524 -0.0209496 -0.214866 / 0.929503)"},{"t":"Segurança","sel":"true","color":"oklab(0.23221 -0.00525454 -0.0671117 /
OK   [seguranca] [1280] card "Senha": largo, acao a direita {"title":"Senha","headerW":926,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":null,"descOverlapsAction":false}
OK   [seguranca] [1280] card "Autenticação em 2 fatores": largo, acao a direita (com descricao) {"title":"Autenticação em 2 fatores","headerW":926,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":true,"descOverlapsAction":false}
OK   [seguranca] [1280] card "Sessões ativas": largo, acao a direita {"title":"Sessões ativas","headerW":926,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":null,"descOverlapsAction":false}
OK   [modal] [1280] troca de senha: descricao "Esta sessão continua aberta." visivel
OK   [modal] [1280] troca de senha: sem rodape antes de editar (isDirty) botoes=0
OK   [modal] [1280] troca de senha (Dialog): 1 botao ocupa 100% {"buttons":1,"footerW":480,"bs":[{"text":"Alterar senha","left":400,"right":880,"w":480,"top":530}],"leftGap":0,"rightGap":0,"texts":[],"footerBottomInView":true,"overflowX":false}
OK   [listagem] [1280] usuarios: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1280] usuarios: "Ações" com titulo e botoes no mesmo eixo {"headerCenter":1230.9,"textCenter":1230.9,"btnCenters":[1230.9],"maxDelta":0.02187499999990905,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1280] usuarios: coluna do icone propria, a direita de "Ações", celulas vazias {"headerCenter":1230.9,"textCenter":1230.9,"btnCenters":[1230.9],"maxDelta":0.02187499999990905,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1280] usuarios: menu de colunas sem "Ações" ["Nome","E-mail","Cargos","Status","Último acesso","Criado em"]
OK   [listagem] [1280] usuarios: sem textos cortados []
OK   [modal] [1280] ConfirmDialog (Desbloquear): 2 botoes centralizados, largura do texto {"buttons":2,"footerW":400,"bs":[{"text":"Cancelar","left":554.078125,"right":635.921875,"w":82,"top":433},{"text":"Bloquear","left":643.921875,"right":725.90625,"w":82,"
OK   [listagem] [1280] cargos: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1280] cargos: "Ações" com titulo e botoes no mesmo eixo {"headerCenter":1157.9,"textCenter":1157.9,"btnCenters":[1157.9],"maxDelta":0.03749999999990905,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1280] cargos: coluna do icone propria, a direita de "Ações", celulas vazias {"headerCenter":1157.9,"textCenter":1157.9,"btnCenters":[1157.9],"maxDelta":0.03749999999990905,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1280] cargos: menu de colunas sem "Ações" ["Nome","Descrição","Permissões","Usuários","Criado em"]
OK   [listagem] [1280] cargos: sem textos cortados []
OK   [listagem] [1280] auditoria: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1280] auditoria: menu de colunas sem "Ações" ["Data/hora","Módulo","Entidade","Ação","Usuário","Resumo"]
OK   [listagem] [1280] auditoria: sem textos cortados []
OK   [modal] [1280] detalhe da auditoria (dialog-content): sem descricao/vao, sem rodape de botoes, sem overflow {"hasDescription":false,"describedBy":null,"footerButtons":0,"overflowX":false,"kind":"dialog-content"}
OK   [modal] [1280] detalhe da auditoria sem textos cortados []
OK   [cargo-usuarios] [1280] header "Ações" visivel e centralizado sobre os botoes {"visibleText":true,"textW":42,"textAlign":"center","rows":2,"maxDelta":0}
OK   [listagem] [1280] skeleton: coluna Ações centralizada, coluna do icone sem skeleton {"acoes":true,"rows":8,"maxDelta":0,"menuColHasSkeleton":false}
OK   [home] [1024-expandida] Pendências com 4 itens sem scroll interno {"chartH":722,"pendH":722,"items":4,"pendScroll":false,"sh":621,"ch":621,"pendEmptyBelow":0,"chartEmptyBelow":0,"chartCardBottomGap":17,"pendCardBottomGap":17,"sameRow":true}
OK   [home] [1024-expandida] Pendências sem vazio abaixo do ultimo item vazio=0px
OK   [home] [1024-expandida] par na mesma linha com a mesma altura chart=722 pend=722
OK   [home] [1024-expandida] grafico ocupa a altura do corpo (sem vazio embaixo) vazio=0px
OK   [home] [1024-expandida] selos de demonstracao inteiros (nao cortados) [{"card":"?","clipped":false,"w":174,"sw":172},{"card":"?","clipped":false,"w":174,"sw":172},{"card":"Atividade da semana","clipped":false,"w":174,"sw":172},{"card":"Pendências","clipp
OK   [home] [1024-expandida] atalhos rapidos com blocos da mesma altura na linha [[62,62],[116,116],[52]]
OK   [home] [1024-expandida] sem textos cortados na home []
OK   [home] [1024-expandida] lista longa rola por dentro, titulo fixo {"chartH":736,"pendH":736,"sh":4807,"ch":635,"scrolled":200,"headerFixed":true,"rem":16}
OK   [home] [1024-expandida] lista longa respeita o teto (736px) e o grafico acompanha pend=736 chart=736
OK   [seguranca] [1024-expandida] aba Segurança selecionada (aria-selected e cor diferente de Perfil) [{"t":"Perfil","sel":"false","color":"oklab(0.48105 -0.0233096 -0.237083 / 0.986824)"},{"t":"Segurança","sel":"true","color":"oklab(0.159642 0.0000107663 -0
OK   [seguranca] [1024-expandida] card "Senha": largo, acao a direita {"title":"Senha","headerW":670,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":null,"descOverlapsAction":false}
OK   [seguranca] [1024-expandida] card "Autenticação em 2 fatores": largo, acao a direita (com descricao) {"title":"Autenticação em 2 fatores","headerW":670,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":true,"descOverlapsAction":fal
OK   [seguranca] [1024-expandida] card "Sessões ativas": largo, acao a direita {"title":"Sessões ativas","headerW":670,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":null,"descOverlapsAction":false}
OK   [modal] [1024-expandida] troca de senha: descricao "Esta sessão continua aberta." visivel
OK   [modal] [1024-expandida] troca de senha: sem rodape antes de editar (isDirty) botoes=0
OK   [modal] [1024-expandida] troca de senha (Dialog): 1 botao ocupa 100% {"buttons":1,"footerW":480,"bs":[{"text":"Alterar senha","left":272,"right":752,"w":480,"top":514}],"leftGap":0,"rightGap":0,"texts":[],"footerBottomInView":true,"overflowX":false}
OK   [listagem] [1024-expandida] usuarios: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1024-expandida] usuarios: "Ações" com titulo e botoes no mesmo eixo {"headerCenter":1230.9,"textCenter":1230.9,"btnCenters":[1230.9],"maxDelta":0.02187499999990905,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1024-expandida] usuarios: coluna do icone propria, a direita de "Ações", celulas vazias {"headerCenter":1230.9,"textCenter":1230.9,"btnCenters":[1230.9],"maxDelta":0.02187499999990905,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1024-expandida] usuarios: menu de colunas sem "Ações" ["Nome","E-mail","Cargos","Status","Último acesso","Criado em"]
OK   [listagem] [1024-expandida] usuarios: sem textos cortados []
OK   [modal] [1024-expandida] ConfirmDialog (Desbloquear): 2 botoes centralizados, largura do texto {"buttons":2,"footerW":400,"bs":[{"text":"Cancelar","left":426.078125,"right":507.921875,"w":82,"top":417},{"text":"Bloquear","left":515.921875,"right":597.9062
OK   [listagem] [1024-expandida] cargos: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1024-expandida] cargos: "Ações" com titulo e botoes no mesmo eixo {"headerCenter":980.3,"textCenter":980.3,"btnCenters":[980.3],"maxDelta":0.012500000000045475,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1024-expandida] cargos: coluna do icone propria, a direita de "Ações", celulas vazias {"headerCenter":980.3,"textCenter":980.3,"btnCenters":[980.3],"maxDelta":0.012500000000045475,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1024-expandida] cargos: menu de colunas sem "Ações" ["Nome","Descrição","Permissões","Usuários","Criado em"]
OK   [listagem] [1024-expandida] cargos: sem textos cortados []
OK   [listagem] [1024-expandida] auditoria: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1024-expandida] auditoria: menu de colunas sem "Ações" ["Data/hora","Módulo","Entidade","Ação","Usuário","Resumo"]
OK   [listagem] [1024-expandida] auditoria: sem textos cortados []
OK   [modal] [1024-expandida] detalhe da auditoria (dialog-content): sem descricao/vao, sem rodape de botoes, sem overflow {"hasDescription":false,"describedBy":null,"footerButtons":0,"overflowX":false,"kind":"dialog-content"}
OK   [modal] [1024-expandida] detalhe da auditoria sem textos cortados []
OK   [cargo-usuarios] [1024-expandida] header "Ações" visivel e centralizado sobre os botoes {"visibleText":true,"textW":42,"textAlign":"center","rows":2,"maxDelta":0}
OK   [listagem] [1024-expandida] skeleton: coluna Ações centralizada, coluna do icone sem skeleton {"acoes":true,"rows":8,"maxDelta":0,"menuColHasSkeleton":false}
OK   [home] [1024-recolhida] Pendências com 4 itens sem scroll interno {"chartH":522,"pendH":522,"items":4,"pendScroll":false,"sh":421,"ch":421,"pendEmptyBelow":0,"chartEmptyBelow":0,"chartCardBottomGap":17,"pendCardBottomGap":17,"sameRow":true}
OK   [home] [1024-recolhida] Pendências sem vazio abaixo do ultimo item vazio=0px
OK   [home] [1024-recolhida] par na mesma linha com a mesma altura chart=522 pend=522
OK   [home] [1024-recolhida] grafico ocupa a altura do corpo (sem vazio embaixo) vazio=0px
OK   [home] [1024-recolhida] selos de demonstracao inteiros (nao cortados) [{"card":"?","clipped":false,"w":174,"sw":172},{"card":"?","clipped":false,"w":174,"sw":172},{"card":"Atividade da semana","clipped":false,"w":174,"sw":172},{"card":"Pendências","clipp
OK   [home] [1024-recolhida] atalhos rapidos com blocos da mesma altura na linha [[52,52],[100,100],[52]]
OK   [home] [1024-recolhida] sem textos cortados na home []
OK   [home] [1024-recolhida] lista longa rola por dentro, titulo fixo {"chartH":736,"pendH":736,"sh":3411,"ch":635,"scrolled":200,"headerFixed":true,"rem":16}
OK   [home] [1024-recolhida] lista longa respeita o teto (736px) e o grafico acompanha pend=736 chart=736
OK   [seguranca] [1024-recolhida] aba Segurança selecionada (aria-selected e cor diferente de Perfil) [{"t":"Perfil","sel":"false","color":"oklab(0.488 -0.0238138 -0.24183)"},{"t":"Segurança","sel":"true","color":"oklab(0.141 0.00136333 -0.00481054 / 0.6)"},
OK   [seguranca] [1024-recolhida] card "Senha": largo, acao a direita {"title":"Senha","headerW":878,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":null,"descOverlapsAction":false}
OK   [seguranca] [1024-recolhida] card "Autenticação em 2 fatores": largo, acao a direita (com descricao) {"title":"Autenticação em 2 fatores","headerW":878,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":true,"descOverlapsAction":fal
OK   [seguranca] [1024-recolhida] card "Sessões ativas": largo, acao a direita {"title":"Sessões ativas","headerW":878,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":null,"descOverlapsAction":false}
OK   [modal] [1024-recolhida] troca de senha: descricao "Esta sessão continua aberta." visivel
OK   [modal] [1024-recolhida] troca de senha: sem rodape antes de editar (isDirty) botoes=0
OK   [modal] [1024-recolhida] troca de senha (Dialog): 1 botao ocupa 100% {"buttons":1,"footerW":480,"bs":[{"text":"Alterar senha","left":272,"right":752,"w":480,"top":514}],"leftGap":0,"rightGap":0,"texts":[],"footerBottomInView":true,"overflowX":false}
OK   [listagem] [1024-recolhida] usuarios: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1024-recolhida] usuarios: "Ações" com titulo e botoes no mesmo eixo {"headerCenter":1022.9,"textCenter":1022.9,"btnCenters":[1022.9],"maxDelta":0.021875000000022737,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1024-recolhida] usuarios: coluna do icone propria, a direita de "Ações", celulas vazias {"headerCenter":1022.9,"textCenter":1022.9,"btnCenters":[1022.9],"maxDelta":0.021875000000022737,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1024-recolhida] usuarios: menu de colunas sem "Ações" ["Nome","E-mail","Cargos","Status","Último acesso","Criado em"]
OK   [listagem] [1024-recolhida] usuarios: sem textos cortados []
OK   [modal] [1024-recolhida] ConfirmDialog (Desbloquear): 2 botoes centralizados, largura do texto {"buttons":2,"footerW":400,"bs":[{"text":"Cancelar","left":426.078125,"right":507.921875,"w":82,"top":417},{"text":"Bloquear","left":515.921875,"right":597.9062
OK   [listagem] [1024-recolhida] cargos: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1024-recolhida] cargos: "Ações" com titulo e botoes no mesmo eixo {"headerCenter":901.9,"textCenter":901.9,"btnCenters":[901.9],"maxDelta":0.03750000000002274,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1024-recolhida] cargos: coluna do icone propria, a direita de "Ações", celulas vazias {"headerCenter":901.9,"textCenter":901.9,"btnCenters":[901.9],"maxDelta":0.03750000000002274,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1024-recolhida] cargos: menu de colunas sem "Ações" ["Nome","Descrição","Permissões","Usuários","Criado em"]
OK   [listagem] [1024-recolhida] cargos: sem textos cortados []
OK   [listagem] [1024-recolhida] auditoria: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1024-recolhida] auditoria: menu de colunas sem "Ações" ["Data/hora","Módulo","Entidade","Ação","Usuário","Resumo"]
OK   [listagem] [1024-recolhida] auditoria: sem textos cortados []
OK   [modal] [1024-recolhida] detalhe da auditoria (dialog-content): sem descricao/vao, sem rodape de botoes, sem overflow {"hasDescription":false,"describedBy":null,"footerButtons":0,"overflowX":false,"kind":"dialog-content"}
OK   [modal] [1024-recolhida] detalhe da auditoria sem textos cortados []
OK   [cargo-usuarios] [1024-recolhida] header "Ações" visivel e centralizado sobre os botoes {"visibleText":true,"textW":42,"textAlign":"center","rows":2,"maxDelta":0}
OK   [home] [390] Pendências com 4 itens sem scroll interno {"chartH":317,"pendH":484,"items":4,"pendScroll":false,"sh":383,"ch":383,"pendEmptyBelow":0,"chartEmptyBelow":0,"chartCardBottomGap":17,"pendCardBottomGap":17,"sameRow":false}
OK   [home] [390] Pendências sem vazio abaixo do ultimo item vazio=0px
OK   [home] [390] par empilhado no estreito {"chartH":317,"pendH":484,"items":4,"pendScroll":false,"sh":383,"ch":383,"pendEmptyBelow":0,"chartEmptyBelow":0,"chartCardBottomGap":17,"pendCardBottomGap":17,"sameRow":false}
OK   [home] [390] selos de demonstracao inteiros (nao cortados) [{"card":"?","clipped":false,"w":174,"sw":172},{"card":"?","clipped":false,"w":174,"sw":172},{"card":"Atividade da semana","clipped":false,"w":174,"sw":172},{"card":"Pendências","clipped":false,"
OK   [home] [390] atalhos rapidos com blocos da mesma altura na linha [[52],[52],[52],[84],[52]]
OK   [home] [390] sem textos cortados na home []
OK   [home] [390] lista longa rola por dentro, titulo fixo {"chartH":317,"pendH":549,"sh":2801,"ch":448,"scrolled":200,"headerFixed":true,"rem":16}
OK   [home] [390] lista longa empilhada com max-h (28rem) no corpo content=448
OK   [seguranca] [390] aba Segurança selecionada (aria-selected e cor diferente de Perfil) [{"t":"Perfil","sel":"false","color":"oklab(0.481019 -0.0233074 -0.237062 / 0.986766)"},{"t":"Segurança","sel":"true","color":"oklab(0.159721 0.00000499467 -0.017598 /
OK   [seguranca] [390] card "Senha": estreito empilha {"title":"Senha","headerW":292,"action":{"stacked":true,"right":158,"clipped":false},"descBelowTitle":null,"descOverlapsAction":false}
OK   [seguranca] [390] card "Autenticação em 2 fatores": estreito empilha (com descricao) {"title":"Autenticação em 2 fatores","headerW":292,"action":{"stacked":true,"right":118,"clipped":false},"descBelowTitle":true,"descOverlapsAction":false}
OK   [seguranca] [390] card "Sessões ativas": estreito empilha {"title":"Sessões ativas","headerW":292,"action":{"stacked":true,"right":118,"clipped":false},"descBelowTitle":null,"descOverlapsAction":false}
OK   [modal] [390] troca de senha: descricao "Esta sessão continua aberta." visivel
OK   [modal] [390] troca de senha: sem rodape antes de editar (isDirty) botoes=0
OK   [modal] [390] troca de senha (Drawer): 1 botao ocupa 100% {"buttons":1,"footerW":358,"bs":[{"text":"Alterar senha","left":16,"right":374,"w":358,"top":797}],"leftGap":0,"rightGap":0,"texts":[],"footerBottomInView":true,"overflowX":false}
OK   [listagem] [390] usuarios: ultima coluna so com o icone de colunas w=56
OK   [listagem] [390] usuarios: "Ações" com titulo e botoes no mesmo eixo {"headerCenter":974.9,"textCenter":974.9,"btnCenters":[974.9],"maxDelta":0.021875000000022737,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [390] usuarios: coluna do icone propria, a direita de "Ações", celulas vazias {"headerCenter":974.9,"textCenter":974.9,"btnCenters":[974.9],"maxDelta":0.021875000000022737,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [390] usuarios: menu de colunas sem "Ações" ["Nome","E-mail","Cargos","Status","Último acesso","Criado em"]
OK   [listagem] [390] usuarios: rodape da tabela sem overflow horizontal em 390 {"sw":326,"cw":326,"right":358,"vw":390,"overflow":false}
OK   [listagem] [390] usuarios: sem textos cortados []
OK   [modal] [390] ConfirmDialog (Desbloquear): 2 botoes centralizados, largura do texto {"buttons":2,"footerW":272,"bs":[{"text":"Cancelar","left":109.078125,"right":190.921875,"w":82,"top":455},{"text":"Bloquear","left":198.921875,"right":280.90625,"w":82,"t
OK   [listagem] [390] cargos: ultima coluna so com o icone de colunas w=56
OK   [listagem] [390] cargos: "Ações" com titulo e botoes no mesmo eixo {"headerCenter":724.3,"textCenter":724.3,"btnCenters":[724.3],"maxDelta":0.012500000000045475,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [390] cargos: coluna do icone propria, a direita de "Ações", celulas vazias {"headerCenter":724.3,"textCenter":724.3,"btnCenters":[724.3],"maxDelta":0.012500000000045475,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [390] cargos: menu de colunas sem "Ações" ["Nome","Descrição","Permissões","Usuários","Criado em"]
OK   [listagem] [390] cargos: rodape da tabela sem overflow horizontal em 390 {"sw":326,"cw":326,"right":358,"vw":390,"overflow":false}
OK   [listagem] [390] cargos: sem textos cortados []
OK   [listagem] [390] auditoria: ultima coluna so com o icone de colunas w=56
OK   [listagem] [390] auditoria: menu de colunas sem "Ações" ["Data/hora","Módulo","Entidade","Ação","Usuário","Resumo"]
OK   [listagem] [390] auditoria: rodape da tabela sem overflow horizontal em 390 {"sw":326,"cw":326,"right":358,"vw":390,"overflow":false}
OK   [listagem] [390] auditoria: sem textos cortados []
OK   [modal] [390] detalhe da auditoria (drawer-content): sem descricao/vao, sem rodape de botoes, sem overflow {"hasDescription":false,"describedBy":null,"footerButtons":0,"overflowX":false,"kind":"drawer-content"}
OK   [modal] [390] detalhe da auditoria sem textos cortados []
OK   [cargo-usuarios] [390] header "Ações" visivel e centralizado sobre os botoes {"visibleText":true,"textW":42,"textAlign":"center","rows":2,"maxDelta":0}
OK   [modal] [390] aviso de inatividade: botao inteiro dentro da tela depois da animacao
OK   [modal] [390] aviso de inatividade (Drawer): 1 botao ocupa 100% {"buttons":1,"footerW":358,"bs":[{"text":"Continuar conectado","left":16,"right":374,"w":358,"top":796}],"leftGap":0,"rightGap":0,"texts":[],"footerBottomInView":true,"overflowX":false}
OK   [listagem] [390] skeleton: coluna Ações centralizada, coluna do icone sem skeleton {"acoes":true,"rows":8,"maxDelta":0,"menuColHasSkeleton":false}
OK   [page-size] [1440] seletor mostra 25 por padrao 25
OK   [page-size] [1440] opcoes 25/50/100 ["25","50","100"]
FAIL [page-size] [1440] troca para 50 pede so a primeira pagina ao servidor (page=0) ["/api/client/audit-logs?page=1&pageSize=50","/api/client/audit-logs?page=0&pageSize=50"]
OK   [page-size] [1440] trocar para 50 volta a pagina 1 {"urlP2":"http://localhost:4173/audit-logs?page=1","url50":"http://localhost:4173/audit-logs?pageSize=50","req":"/api/client/audit-logs?page=1&pageSize=50"}
OK   [page-size] [1440] grava dataTable:pageSize=50 50
OK   [page-size] [1440] auditoria com ate 50 linhas 50
OK   [page-size] [1440] vale em outra listagem (usuarios mostra 50, todas as 32 pessoas numa pagina) {"combo":"50","rows":32,"url":"http://localhost:4173/users"}
OK   [page-size] [1440] depois de recarregar continua 50 50
OK   [page-size] [1440] ?pageSize=100 na URL vence o storage (sem requisicao com 50) {"combo":"100","stored":"50","reqs":["/api/client/users?page=0&pageSize=100"]}
TOTAL 185 checks, 184 ok, 1 falhas
exit=0
```

### Descarte do banco e encerramento dos processos

```text
$ docker exec server-template-postgres psql -U postgres -c 'DROP DATABASE "temporary-39f6b736";'
DROP DATABASE
bancos temporary-39f6b736 restantes: 0
processos parados: 16100 (server-template, porta 8095) e 18040 (Vite, porta 4173); um Vite anterior (5228, porta 5173) parado logo apos subir por engano
```

---

# Reexecução 2026-11-04 (pós-correção)

Escopo `pos-correcao` com camada inteira: as correções tocaram código compartilhado (`useDataTableUrlQuery`, `dataTable`, `alert-dialog`, `sidebar`, dependências do Storybook), então o `fechamento` foi refeito. A seção acima fica como registro da 1ª execução; o placar válido passa a ser o desta seção.

## R1. Cabeçalho

| Campo       | Valor                                                                                                                                                                                                                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Recorte     | B1 (`e2e/auditLogs.spec.ts`), B2 (troca de tamanho sem requisição intermediária), F1 (Anterior/Próxima juntas em 390), F4 ("Alternar menu lateral"), TPL-41 (negativa à esquerda, positiva à direita; billing "Cancelar plano"), TPL-42 (Storybook 10.6.5, sidebar contida no Docs, override do `@radix-ui/react-dismissable-layer` 1.2.1) |
| Branch      | `ui-consistencia`, sem commit; nada em `src/` nem `e2e/` editado por esta sessão                                                                                                                                                                                                                                                           |
| Specs lidos | `TASKS.md` (TPL-41, TPL-42), `docs/specs/TPL-42.handoff.md` (rodou sem spec, segundo o próprio handoff)                                                                                                                                                                                                                                    |
| Banco       | `temporary-f9abf13f` no Postgres do compose (5433), criado, migrado, semeado, provado e apagado nesta sessão                                                                                                                                                                                                                               |

## R2. Bloqueios e interferências

Nenhum bloqueio aberto. Uma interferência de ambiente, resolvida:

| O que aconteceu                                                                                                                                                                                                                                                                                                                                                                                       | Casos derrubados                                                                                                                                                   | O que foi feito                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Outro processo editou a árvore durante a 1ª execução do `fechamento`: `src/components/global/dataTable/useDataTableUrlQuery.ts` (11:29:07 e 11:29:20), `src/tests/globais/dataTable/useDataTableUrlQuery.test.tsx` (11:28:49), `docs/conventions/components.md` (11:28:48) e `CLAUDE.md` (11:29:23). O Vite aplicou HMR (`hmr update ... audit-logs/list, users/list, roles/list`) com specs no meio. | 2 de 70: `roles.spec.ts:384` (`isSameDocument` false, a página recarregou) e `settings.spec.ts:200` ("waiting for navigation to finish... navigated to /settings") | conferido que a árvore parou de mudar (nenhum arquivo alterado em 45 s), repetição dirigida `--repeat-each=2` dos dois (4 de 4 verdes) e `fechamento` refeito inteiro com o código estável (`sha1` de `useDataTableUrlQuery.ts`: `4000bb402835a188bf00474ad6bbfb2974ec40b9`). Classificação: ambiente (edição concorrente), não branch. |

O `webServer` do `playwright.config.ts` não subiu Vite (reaproveitou o da 4173; nada na 5173 durante nem depois). F3 continua no código, não exercitado.

## R3. O que a automação garante (placar medido)

| Camada                                | Escopo         | Comando                                                                                                                                                                                           | Resultado                                                              |
| ------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| e2e, 1ª execução                      | `fechamento`   | `VITE_API_URL=http://localhost:8095/api E2E_PORT=4173 pnpm exec playwright test`                                                                                                                  | 68 passed, 2 failed (2,7 min). Invalidada pela edição concorrente (R2) |
| e2e, repetição dirigida               | `pos-correcao` | `... pnpm exec playwright test e2e/roles.spec.ts e2e/settings.spec.ts -g "o vínculo feito na tela de usuários aparece no cargo\|recusa apagar a auditoria antes de anonimizá-la" --repeat-each=2` | **4 passed, 0 failed**                                                 |
| e2e, 2ª execução (placar válido)      | `fechamento`   | `VITE_API_URL=http://localhost:8095/api E2E_PORT=4173 pnpm exec playwright test`                                                                                                                  | **70 passed, 0 failed, 0 skipped** (2,5 min; 14 de 14 arquivos verdes) |
| verificação visual (script da sessão) | `loop`         | `node verify/verify2.mjs` (scratchpad)                                                                                                                                                            | **233 checagens, 233 ok, 0 falhas**                                    |
| camadas (Storybook)                   | camada inteira | `STORYBOOK_BASE_URL=http://127.0.0.1:6116 pnpm run test:layers`                                                                                                                                   | **10 passed, 0 failed** (39,7 s)                                       |
| sidebar no Storybook                  | `loop`         | `node verify/sbdocs.mjs` (scratchpad)                                                                                                                                                             | 2 instâncias, as 2 contidas na moldura, sem erro de console            |

`verify2.mjs` é o `verify.mjs` anterior com o rótulo novo do botão da sidebar, screenshots em `real2\` e os grupos novos `ordem`, `billing`, `sidebar-a11y` e `F1`. Os casos dele continuam `automatizado (sessão)`: sem spec permanente (lacuna mantida).

Screenshots: `C:\Users\admin\AppData\Local\Temp\claude\15dbe538224f4a51\c15d8a30-3b1a-45d3-96b2-5de7dfe4a4e2\scratchpad\real2\` (108 PNGs do app e 4 do Storybook).

Atalhos de preparação: os mesmos da 1ª execução (30 pessoas e o "Cargo Visual" por API, depois do `fechamento`; login pela tela uma vez e `storageState`; itens de Pendências clonados no DOM; rede lenta por CDP; relógio do Playwright). Nesta rodada a criação, o guard e o detalhe foram exercitados pela tela e nada foi gravado: a criação saiu por "Cancelar" e o detalhe por "Descartar".

## R4. Cobertura das correções

| Regra                                                                                                                     | Âncora                                                                                                                                                                                                                                                                                                                                                                                      | Casos     | Resultado                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------ |
| B1: spec da auditoria com 25 por página                                                                                   | `e2e/auditLogs.spec.ts:33`, `:135-158`; `src/screens/audit-logs/list/index.tsx:29`                                                                                                                                                                                                                                                                                                          | RX1       | passou ("pagina a partir do primeiro registro" e "abre o detalhe com o que mudou...", no `fechamento`) |
| B2: trocar o tamanho grava e navega para a página 1 numa navegação só                                                     | `src/components/global/dataTable/useDataTableUrlQuery.ts:118-128`                                                                                                                                                                                                                                                                                                                           | RX2       | passou: na página 2 da auditoria, 25 → 50 pede só `GET /client/audit-logs?page=0&pageSize=50`          |
| F1: Anterior e Próxima num grupo próprio, sem quebrar entre si                                                            | `src/components/global/dataTable/dataTable.tsx:468`, `:495`, `:502`, `:515`                                                                                                                                                                                                                                                                                                                 | RX3       | passou em 390 (usuários, cargos, auditoria: mesmo `top`, Anterior à esquerda)                          |
| TPL-41: negativa antes da positiva no DOM e à esquerda na tela; ao quebrar, negativa em cima; sem `*-reverse` nem `order` | `CLAUDE.md` "Ordem das ações"; `src/components/ui/alert-dialog.tsx:99`; `src/components/ui/dialog.tsx:118`; `src/components/global/confirmDialog/confirmDialog.tsx:91-99`; `src/components/global/layout/unsavedChangesDialog.tsx:55-56`; `src/screens/users/create/index.tsx:88-108`; `src/screens/users/details/index.tsx:326-350`; `src/components/global/dataTable/filters.tsx:398-420` | RX4 a RX8 | passou nas 5 larguras                                                                                  |
| TPL-41: billing "Cancelar plano"                                                                                          | `src/screens/account/billing/billingTab.tsx:37-44`                                                                                                                                                                                                                                                                                                                                          | RX9       | passou                                                                                                 |
| F4: rótulo pt-BR do botão da sidebar                                                                                      | `src/components/ui/sidebar.tsx:275`, `:287`, `:290`                                                                                                                                                                                                                                                                                                                                         | RX10      | passou                                                                                                 |
| TPL-42: override do dismissable-layer (Escape fecha só o popover dentro do Drawer mobile)                                 | `pnpm-workspace.yaml:7`; `e2e/storybook/camadas.spec.ts:210`                                                                                                                                                                                                                                                                                                                                | RX11      | passou (era o 1 vermelho do `test:layers` antes da correção, segundo o handoff)                        |
| TPL-42: sidebar contida na moldura da story (Docs e Canvas)                                                               | `src/stories/globais/sidebar/sidebar.stories.tsx:55-57`                                                                                                                                                                                                                                                                                                                                     | RX12      | passou (ver R7 sobre a página Docs do manager)                                                         |

Anti-lacuna: toda correção do pedido tem caso; recusa da API não se aplica (ordem, rótulo e layout; o `pageSize` foi conferido na requisição); o recorte não mexe em dado gravado; perfil só o admin do seed, porque nenhuma regra do recorte é por perfil; nenhum caso manual.

## R5. Resultado por caso

| Id     | Título                                                                                                                                                 | Severidade | Execução              | Resultado                                                                                   | Spec                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | --------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| V1–V16 | Casos da 1ª execução (home, segurança, modais, listagens, skeleton, itens por página, cargo)                                                           | normal     | automatizado (sessão) | passaram todos, nas mesmas larguras                                                         | `verify2.mjs`, grupos `home`, `seguranca`, `modal`, `listagem`, `cargo-usuarios`, `page-size` |
| E2E    | Suíte e2e completa contra o server real                                                                                                                | alto       | automatizado          | **70/70** na 2ª execução                                                                    | `e2e/*.spec.ts`                                                                               |
| RX1    | B1: auditoria pagina com 25 e o detalhe abre                                                                                                           | alto       | automatizado          | passou                                                                                      | `e2e/auditLogs.spec.ts:135`, `:149`                                                           |
| RX2    | B2: na página 2, trocar para 50 faz uma requisição só, `page=0`                                                                                        | normal     | automatizado (sessão) | passou (1440)                                                                               | `verify2.mjs`, `page-size`                                                                    |
| RX3    | F1: em 390, Anterior e Próxima na mesma linha                                                                                                          | normal     | automatizado (sessão) | passou (3 listagens)                                                                        | `verify2.mjs`, `F1`                                                                           |
| RX4    | ConfirmDialog "Bloquear usuário?": Cancelar à esquerda de Bloquear                                                                                     | normal     | automatizado (sessão) | passou nas 5 (em 390 cabem na mesma linha)                                                  | `verify2.mjs`, `ordem`                                                                        |
| RX5    | PageActions da criação de usuário: Cancelar antes de Criar usuário                                                                                     | normal     | automatizado (sessão) | passou nas 5 (em 390 só ícones, mesma linha)                                                | `verify2.mjs`, `ordem`                                                                        |
| RX6    | Guard de saída: Continuar editando antes de Descartar alterações; em 390 quebra com a negativa em cima; "Continuar editando" mantém a criação e o nome | normal     | automatizado (sessão) | passou nas 5; em 390 quebrou (Continuar editando `top` 435, Descartar alterações `top` 475) | `verify2.mjs`, `ordem`                                                                        |
| RX7    | PageActions do detalhe de usuário: Descartar antes de Salvar alterações                                                                                | normal     | automatizado (sessão) | passou nas 5                                                                                | `verify2.mjs`, `ordem`                                                                        |
| RX8    | Filtros da listagem: Limpar antes de Buscar                                                                                                            | normal     | automatizado (sessão) | passou nas 5                                                                                | `verify2.mjs`, `ordem`                                                                        |
| RX9    | Conta > Pagamento, card Plano: "Cancelar plano" no lugar de "Cancelar"; ordem Trocar de plano, Cancelar plano (a destrutiva à direita)                 | normal     | automatizado (sessão) | passou nas 5                                                                                | `verify2.mjs`, `billing`                                                                      |
| RX10   | Sidebar: trigger com sr-only "Alternar menu lateral", rail com `aria-label` e `title` iguais, nenhum "Toggle Sidebar" no DOM                           | normal     | automatizado (sessão) | passou nas 5 (em 390 só o trigger, o rail não existe no Sheet)                              | `verify2.mjs`, `sidebar-a11y`                                                                 |
| RX11   | Camadas no Storybook, inclusive Drawer mobile com DateTimeField                                                                                        | alto       | automatizado          | 10/10                                                                                       | `e2e/storybook/camadas.spec.ts`                                                               |
| RX12   | Sidebar contida na moldura da story, sem cobrir a página                                                                                               | normal     | automatizado (sessão) | passou (Docs e Canvas do iframe)                                                            | `sbdocs.mjs`                                                                                  |

Contagem: 29 casos (16 V, E2E, 12 RX); 26 `normal`, 3 `alto`; 0 crítico; 0 manual; 0 `nao executado`.

## R6. Bugs

| Id                                            | Status nesta reexecução                                                    |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| B1                                            | corrigido: `fechamento` 70/70                                              |
| B2                                            | corrigido: uma requisição só, `page=0`                                     |
| F1                                            | corrigido em 390                                                           |
| F4                                            | corrigido                                                                  |
| F2 (menu mobile não fecha ao navegar)         | não reavaliado: fora do pedido; o script segue fechando o Sheet por Escape |
| F3 (`webServer` com `pnpm run dev -- --port`) | não exercitado: Vite reaproveitado na 4173                                 |

Nenhum defeito novo encontrado.

## R7. Não verificado, e por quê

- Página Docs da sidebar no manager do Storybook: não existe. O `index.json` do Storybook tem 104 entradas, todas `story`, nenhuma `docs` (sem `autodocs` e sem `@storybook/addon-docs` em `.storybook/main.ts`); `?path=/docs/globais-sidebar--docs` mostra "Couldn't find story matching 'globais-sidebar--docs'" (`storybook-sidebar-docs-manager-1440.png`). O que foi medido é o iframe em `viewMode=docs` e `viewMode=story` (`storybook-sidebar-docs-1440.png`, `storybook-sidebar-story-1440.png`) e o Canvas no manager (`storybook-sidebar-canvas-manager-1440.png`): as duas instâncias (`position: fixed`) ficam dentro da moldura `transform-gpu`, com 446 px de altura, não a da janela. Se "Docs" no pedido quer dizer outra tela, ela não foi verificada.
- Drawer com 2 botões e Modal com 2 botões em tela real: nenhuma tela tem (os `Modal` reais têm 0 ou 1 botão). A ordem foi provada no `AlertDialog` (ConfirmDialog e guard), no PageActions e nos filtros; o Drawer mobile só pelo `test:layers`.
- Sheet com rodapé de ações em tela real: nenhuma tela tem (só `Sheet.stories.tsx`, não medido).
- PageActions quebrando linha em 390: não quebra (só ícones, 38 px cada), então "negativa em cima" ali não se aplica; a quebra foi provada no guard de saída.
- Aviso de inatividade em 1280 e 1024 e skeleton com sidebar recolhida: como na 1ª execução.

## R8. Ambiente

| Item                       | Comando                                                                                                                                                                                                                                                                                                                               | Porta / PID                                 | Estado no fim                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------- |
| Banco `temporary-f9abf13f` | `docker exec server-template-postgres psql -U postgres -c 'CREATE DATABASE "temporary-f9abf13f";'`; `DATABASE_URL=postgresql://postgres:***@localhost:5433/temporary-f9abf13f pnpm exec prisma migrate deploy` ("All migrations have been successfully applied."); `... pnpm exec prisma db seed` ("Seed concluído: admin@admin.com") | 5433 (container `server-template-postgres`) | apagado (`DROP DATABASE`; restantes `temporary-%`: 0) |
| server-template            | `DATABASE_URL=... PORT=8095 CORS_ORIGINS=http://localhost:4173 node --env-file-if-exists=.env --import tsx src/server.ts`                                                                                                                                                                                                             | 8095 / 18924                                | parado (`taskkill /T /F`)                             |
| Vite                       | `VITE_API_URL=http://localhost:8095/api pnpm exec vite --port 4173 --strictPort` (sem `.env` local)                                                                                                                                                                                                                                   | 4173 / 14428                                | parado                                                |
| Storybook próprio          | `rm -rf node_modules/.cache/storybook`; `pnpm exec storybook dev -p 6116 --no-open --ci`                                                                                                                                                                                                                                              | 6116 / 8392                                 | parado                                                |

- Prova do banco antes de qualquer escrita: host `localhost`, porta 5433, `current_database()` = `temporary-f9abf13f`, criado nesta sessão; `users` com `admin@admin.com` e `blocked@admin.com`.
- Não tocados: 8080 (PID 24848, outro projeto), 6006 (PID 2588, outro Storybook), 5432 (`db-local`), 5173. O `.env` do server (que aponta para a 5432) não foi usado para o banco: a `DATABASE_URL` foi injetada por comando.
- Reset não usado: uma rodada de `fechamento` por banco limpo; a 2ª execução rodou sobre o mesmo banco, e a suíte cria e desfaz o próprio dado (verde). O preparo da verificação visual veio depois das duas.
- `node_modules` em dia com o `pnpm-lock.yaml` (só o cabeçalho `packageManagerDependencies` difere do `node_modules/.pnpm/lock.yaml`); `storybook` 10.6.5; o `@radix-ui/react-dialog` resolve `react-dismissable-layer` 1.2.1.

## R9. Portão de fechamento (reexecução)

1. **A suíte rodou, e em que escopo?** Sim. `fechamento`: `VITE_API_URL=http://localhost:8095/api E2E_PORT=4173 pnpm exec playwright test`, 2ª execução `70 passed`, `exit=0` (a 1ª, 68/70, invalidada por edição concorrente e explicada em R2, com a repetição dirigida 4/4). `loop`: `node verify/verify2.mjs`, 233/233; `pnpm run test:layers` contra o Storybook na 6116, 10/10. Saídas no anexo R.
2. **Cada selo tem teste nomeado?** E2E e camadas: títulos na saída do runner. RX2 a RX10 e RX12, e V1 a V16: `automatizado (sessão)`, linhas `OK` do script no anexo; sem spec permanente (lacuna mantida).
3. **A app foi dirigida como uma pessoa dirige?** Sim: login pela tela, listagens pelo menu lateral (no mobile pelo Sheet aberto em "Alternar menu lateral"), "Novo usuário" por clique, nome digitado, guard aberto pelo menu (pela volta do navegador com a sidebar recolhida), detalhe pela linha da tabela, telefone preenchido, "Descartar" por clique, aba Pagamento por clique. Nada gravado pela verificação.
4. **De onde veio cada login?** `admin@admin.com`, do seed do server-template (senha `123123123`, `prisma/seed.ts`), pela tela; a suíte e2e usa também o gestor que o `globalSetup` cria e exclui.
5. **O banco temporário foi apagado?** Sim: `temporary-f9abf13f`, `DROP DATABASE` (saída no anexo R).

## Anexo R: saídas coladas da reexecução

### `fechamento`, 2ª execução (placar válido)

```text
  ok  1 [chromium] › e2e\account.spec.ts:103:3 › Minha conta › Perfil: pré-preenche pelo servidor, salva só o que mudou e atualiza a sessão (2.2s)
  ok  2 [chromium] › e2e\account.spec.ts:148:3 › Minha conta › Perfil: tempo acima do limite da empresa é recusado no campo, sem toast (1.4s)
  ok  3 [chromium] › e2e\account.spec.ts:187:3 › Minha conta › Perfil: trocar de aba com edição não salva pede confirmação (2.4s)
  ok  4 [chromium] › e2e\account.spec.ts:223:3 › Minha conta › Segurança: troca a senha (a atual errada marca o campo) e volta à original (3.5s)
  ok  5 [chromium] › e2e\account.spec.ts:277:3 › Minha conta › o que não tem servidor mostra o aviso de demonstração (3.6s)
  ok  6 [chromium] › e2e\auditLogs.spec.ts:93:3 › Auditoria › lista os registros de auditoria, o mais recente primeiro (1.3s)
  ok  7 [chromium] › e2e\auditLogs.spec.ts:102:3 › Auditoria › filtra por conteúdo: o que casa aparece, o que não casa some (1.7s)
  ok  8 [chromium] › e2e\auditLogs.spec.ts:116:3 › Auditoria › filtra por módulo (multiSelect) mantendo só o que casa (2.0s)
  ok  9 [chromium] › e2e\auditLogs.spec.ts:135:3 › Auditoria › pagina a partir do primeiro registro (1.7s)
  ok 10 [chromium] › e2e\auditLogs.spec.ts:149:3 › Auditoria › abre o detalhe com o que mudou e os dados técnicos recolhidos (2.1s)
  ok 11 [chromium] › e2e\auditLogs.spec.ts:181:3 › Auditoria › evento sem campos alterados mostra o estado vazio do de→para (1.8s)
  ok 12 [chromium] › e2e\auditLogs.spec.ts:225:3 › Auditoria — filtro por usuário › só aparece com a permissão de ver usuários, e filtra pelo autor (4.0s)
  ok 13 [chromium] › e2e\auditLogs.spec.ts:315:3 › Atividade do usuário › mostra a linha do tempo do usuário, paginada, a mais recente primeiro (1.4s)
  ok 14 [chromium] › e2e\columnVisibility.spec.ts:15:3 › Tabela — mostrar e ocultar colunas › oculta uma coluna e mantém a escolha após recarregar (3.5s)
  ok 15 [chromium] › e2e\columnVisibility.spec.ts:42:3 › Tabela — mostrar e ocultar colunas › abrir o menu de colunas mantém a cor do cabeçalho (1.5s)
  ok 16 [chromium] › e2e\columnVisibility.spec.ts:56:3 › Tabela — mostrar e ocultar colunas › ocultar colunas não altera os filtros da URL (1.7s)
  ok 17 [chromium] › e2e\home.spec.ts:76:3 › Home › números de usuários e atividade recente reais (1.2s)
  ok 18 [chromium] › e2e\home.spec.ts:107:3 › Home › o que não tem rota mostra o aviso; os atalhos abrem telas reais (1.7s)
  ok 19 [chromium] › e2e\idleTimeout.spec.ts:58:3 › Tempo de inatividade da sessão › segue a configuração da empresa gravada no preparo (1.2s)
  ok 20 [chromium] › e2e\login.spec.ts:11:3 › Login › renderiza o formulário de login (811ms)
  ok 21 [chromium] › e2e\login.spec.ts:20:3 › Login › valida e-mail inválido antes de enviar (887ms)
  ok 22 [chromium] › e2e\login.spec.ts:28:3 › Login › navega para a tela de criar conta (837ms)
  ok 23 [chromium] › e2e\loginErrors.spec.ts:13:3 › Login recusado pelo server real › senha errada mostra "Credenciais inválidas." (1.3s)
  ok 24 [chromium] › e2e\loginErrors.spec.ts:24:3 › Login recusado pelo server real › conta bloqueada mostra "Sua conta está bloqueada." (1.2s)
  ok 25 [chromium] › e2e\roles.spec.ts:205:5 › Cargos › como admin › lista os cargos do servidor pela busca, com as contagens (2.2s)
  ok 26 [chromium] › e2e\roles.spec.ts:230:5 › Cargos › como admin › o item "Cargos" do menu abre a lista (1.6s)
  ok 27 [chromium] › e2e\roles.spec.ts:247:5 › Cargos › como admin › cria um cargo: marcar uma escrita marca e trava a leitura (1.9s)
  ok 28 [chromium] › e2e\roles.spec.ts:285:5 › Cargos › como admin › recusa o nome repetido com o toast do servidor, um só (1.4s)
  ok 29 [chromium] › e2e\roles.spec.ts:299:5 › Cargos › como admin › edita as permissões e o servidor guarda a expansão para leitura (2.5s)
  ok 30 [chromium] › e2e\roles.spec.ts:340:5 › Cargos › como admin › vincula um usuário pela aba "Usuários", com a busca do servidor (3.0s)
  ok 31 [chromium] › e2e\roles.spec.ts:384:5 › Cargos › como admin › o vínculo feito na tela de usuários aparece no cargo, sem recarregar (3.7s)
  ok 32 [chromium] › e2e\roles.spec.ts:415:5 › Cargos › como admin › copia um cargo pela lista e abre a cópia (1.8s)
  ok 33 [chromium] › e2e\roles.spec.ts:433:5 › Cargos › como admin › exclui com confirmação, e recusa o cargo com usuários vinculados (3.7s)
  ok 34 [chromium] › e2e\roles.spec.ts:465:5 › Cargos › como admin › o Administrador aparece só para leitura, sem ações (1.6s)
  ok 35 [chromium] › e2e\roles.spec.ts:498:5 › Cargos › como gestor › a permissão que o gestor não tem aparece desabilitada, com a explicação (1.2s)
  ok 36 [chromium] › e2e\roles.spec.ts:514:5 › Cargos › como gestor › o servidor recusa copiar um cargo com permissão que o gestor não tem (1.6s)
  ok 37 [chromium] › e2e\roles.spec.ts:539:5 › Cargos › como gestor › editar o próprio cargo muda na hora o que a tela oferece (1.7s)
  ok 38 [chromium] › e2e\routeError.spec.ts:56:3 › Tela de erro por rota: telas protegidas › o erro no render troca só o conteúdo, e "Tentar novamente" desenha a tela de novo (1.1s)
  ok 39 [chromium] › e2e\routeError.spec.ts:82:3 › Tela de erro por rota: telas protegidas › ir para outra tela pelo menu limpa o erro (1.6s)
  ok 40 [chromium] › e2e\routeError.spec.ts:101:3 › Tela de erro por rota: rotas públicas › o erro no render do login mostra a tela de erro sem o menu, e "Tentar novamente" desenha de novo (996ms)
  ok 41 [chromium] › e2e\session.spec.ts:47:3 › Sessão contra o server real › abrir o app sem sessão vai ao login, sem toast de erro (1.1s)
  ok 42 [chromium] › e2e\session.spec.ts:64:3 › Sessão contra o server real › o admin entra, vê Usuários, Cargos, Auditoria e Configurações, e recarregar mantém a sessão (2.6s)
  ok 43 [chromium] › e2e\session.spec.ts:89:5 › Sessão contra o server real › com a sessão aberta › sair volta ao login, e a rota protegida depois redireciona para o login (2.0s)
  ok 44 [chromium] › e2e\settings.spec.ts:86:3 › Configurações › exibe os grupos e só as configurações do servidor (1.0s)
  ok 45 [chromium] › e2e\settings.spec.ts:109:3 › Configurações › grava as alterações numa chamada só, com um toast, e o valor fica no servidor (1.8s)
  ok 46 [chromium] › e2e\settings.spec.ts:163:3 › Configurações › marca o campo que o servidor recusou, sem toast e sem gravar (1.1s)
  ok 47 [chromium] › e2e\settings.spec.ts:200:3 › Configurações › recusa apagar a auditoria antes de anonimizá-la, com toast, sem gravar (1.1s)
  ok 48 [chromium] › e2e\settings.spec.ts:223:3 › Configurações › descartar reverte a alteração (1.1s)
  ok 49 [chromium] › e2e\unsavedChanges.spec.ts:72:3 › Edição não salva › menu lateral: "Continuar editando" fica com a edição, "Descartar alterações" sai (2.8s)
  ok 50 [chromium] › e2e\unsavedChanges.spec.ts:97:3 › Edição não salva › voltar do navegador com edição pergunta; ficar mantém a URL e a edição (2.9s)
  ok 51 [chromium] › e2e\unsavedChanges.spec.ts:124:3 › Edição não salva › dois voltar com a pergunta aberta: uma pergunta só, e ficar mantém URL e edição (3.2s)
  ok 52 [chromium] › e2e\unsavedChanges.spec.ts:158:3 › Edição não salva › Ctrl+clique no menu abre a tela em nova guia, sem perguntar (2.6s)
  ok 53 [chromium] › e2e\unsavedChanges.spec.ts:179:3 › Edição não salva › fechar a aba com edição pede o aviso nativo; sem edição, fecha direto (2.5s)
  ok 54 [chromium] › e2e\unsavedChanges.spec.ts:209:3 › Edição não salva › "Sair" com edição pergunta antes: "Continuar editando" fica logado na edição, "Descartar alterações" sai (2.7s)
  ok 55 [chromium] › e2e\unsavedChanges.spec.ts:244:3 › Edição não salva › depois de salvar, o menu sai sem perguntar (1.8s)
  ok 56 [chromium] › e2e\users.spec.ts:148:5 › Usuários › como admin › lista do servidor, com cargos e status derivado de isActive (1.3s)
  ok 57 [chromium] › e2e\users.spec.ts:170:5 › Usuários › como admin › ordena por status pelo cabeçalho, no servidor (1.8s)
  ok 58 [chromium] › e2e\users.spec.ts:200:5 › Usuários › como admin › id de cargo fora do formato na URL sai do filtro, sem toast (1.5s)
  ok 59 [chromium] › e2e\users.spec.ts:220:5 › Usuários › como admin › a aba "Sessões" do detalhe mostra o aviso de demonstração (1.2s)
  ok 60 [chromium] › e2e\users.spec.ts:230:5 › Usuários › como admin › filtra por status pelos campos: o que casa aparece, o que não casa some (1.8s)
  ok 61 [chromium] › e2e\users.spec.ts:245:5 › Usuários › como admin › filtra por cargo e por período de cadastro no servidor (3.3s)
  ok 62 [chromium] › e2e\users.spec.ts:269:5 › Usuários › como admin › cria um usuário e abre o detalhe dele na aba "Cargos" (2.0s)
  ok 63 [chromium] › e2e\users.spec.ts:296:5 › Usuários › como admin › recusa o e-mail já cadastrado com o toast do servidor (1.3s)
  ok 64 [chromium] › e2e\users.spec.ts:310:5 › Usuários › como admin › edita o cadastro no detalhe e o valor fica no servidor (2.4s)
  ok 65 [chromium] › e2e\users.spec.ts:339:5 › Usuários › como admin › troca o cargo na aba "Cargos" e mostra as permissões dele (3.1s)
  ok 66 [chromium] › e2e\users.spec.ts:366:5 › Usuários › como admin › bloqueia e desbloqueia pela lista, com confirmação (3.0s)
  ok 67 [chromium] › e2e\users.spec.ts:388:5 › Usuários › como admin › exclui pela lista, com confirmação (2.4s)
  ok 68 [chromium] › e2e\users.spec.ts:406:5 › Usuários › como admin › a recusa do servidor aparece num toast só, sem toast da tela (2.3s)
  ok 69 [chromium] › e2e\users.spec.ts:432:5 › Usuários › como gestor › o servidor recusa dar cargo com permissão que o autor não tem (2.1s)
  ok 70 [chromium] › e2e\userWithoutRole.spec.ts:31:3 › Usuário sem cargo › entra e não vê Usuários, Cargos, Auditoria nem Configurações, nem os blocos deles na home (1.6s)

  70 passed (2.5m)
exit=0
```

### `fechamento`, 1ª execução (invalidada, R2): falhas e resumo

```text
  x  31 [chromium] › e2e\roles.spec.ts:384:5 › Cargos › como admin › o vínculo feito na tela de usuários aparece no cargo, sem recarregar (7.0s)
  x  47 [chromium] › e2e\settings.spec.ts:200:3 › Configurações › recusa apagar a auditoria antes de anonimizá-la, com toast, sem gravar (6.2s)
    Error: expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false
    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('button', { name: 'Salvar alterações' })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" getByRole('button', { name: 'Salvar alterações' }) with timeout 5000ms
      - waiting for getByRole('button', { name: 'Salvar alterações' })
        - waiting for navigation to finish...
        - navigated to "http://localhost:4173/settings"

  2 failed
    [chromium] › e2e\roles.spec.ts:384:5 › Cargos › como admin › o vínculo feito na tela de usuários aparece no cargo, sem recarregar
    [chromium] › e2e\settings.spec.ts:200:3 › Configurações › recusa apagar a auditoria antes de anonimizá-la, com toast, sem gravar
  68 passed (2.7m)
exit=1
```

### HMR durante a 1ª execução (log do Vite)

```text
11:28:49 [vite] (client) hmr update /src/index.css
11:29:07 [vite] (client) hmr update /src/index.css, /src/screens/audit-logs/list/index.tsx, /src/screens/users/list/index.tsx, /src/screens/roles/list/index.tsx
11:29:20 [vite] (client) hmr update /src/index.css, /src/screens/audit-logs/list/index.tsx, /src/screens/users/list/index.tsx, /src/screens/roles/list/index.tsx
```

### Repetição dirigida `--repeat-each=2`

```text
  ok 1 [chromium] › e2e\roles.spec.ts:384:5 › Cargos › como admin › o vínculo feito na tela de usuários aparece no cargo, sem recarregar (3.7s)
  ok 2 [chromium] › e2e\settings.spec.ts:200:3 › Configurações › recusa apagar a auditoria antes de anonimizá-la, com toast, sem gravar (1.2s)
  ok 3 [chromium] › e2e\roles.spec.ts:384:5 › Cargos › como admin › o vínculo feito na tela de usuários aparece no cargo, sem recarregar (3.7s)
  ok 4 [chromium] › e2e\settings.spec.ts:200:3 › Configurações › recusa apagar a auditoria antes de anonimizá-la, com toast, sem gravar (1.1s)
  4 passed (15.3s)
exit=0
```

### `loop`: `node verify/verify2.mjs` (todas as checagens, detalhe cortado em 260 caracteres)

```text
OK   [login] [1440] login pela tela com admin do seed http://localhost:4173/
OK   [home] [1440] Pendências com 4 itens sem scroll interno {"chartH":385,"pendH":385,"items":4,"pendScroll":false,"sh":309,"ch":309,"pendEmptyBelow":0,"chartEmptyBelow":0,"chartCardBottomGap":17,"pendCardBottomGap":17,"sameRow":true}
OK   [home] [1440] Pendências sem vazio abaixo do ultimo item vazio=0px
OK   [home] [1440] par na mesma linha com a mesma altura chart=385 pend=385
OK   [home] [1440] grafico ocupa a altura do corpo (sem vazio embaixo) vazio=0px
OK   [home] [1440] selos de demonstracao inteiros (nao cortados) [{"card":"?","clipped":false,"w":174,"sw":172},{"card":"?","clipped":false,"w":174,"sw":172},{"card":"Atividade da semana","clipped":false,"w":174,"sw":172},{"card":"Pendências","clipped":false,
OK   [home] [1440] atalhos rapidos com blocos da mesma altura na linha [[52,52],[84,84],[52]]
OK   [home] [1440] sem textos cortados na home []
OK   [home] [1440] lista longa rola por dentro, titulo fixo {"chartH":576,"pendH":576,"sh":2311,"ch":500,"scrolled":200,"headerFixed":true,"rem":16}
OK   [home] [1440] lista longa respeita o teto (576px) e o grafico acompanha pend=576 chart=576
OK   [seguranca] [1440] aba Segurança selecionada (aria-selected e cor diferente de Perfil) [{"t":"Perfil","sel":"false","color":"oklab(0.481079 -0.0233117 -0.237103 / 0.986877)"},{"t":"Segurança","sel":"true","color":"oklab(0.159567 0.000016164 -0.0174929 /
OK   [seguranca] [1440] card "Senha": largo, acao a direita {"title":"Senha","headerW":1086,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":null,"descOverlapsAction":false}
OK   [seguranca] [1440] card "Autenticação em 2 fatores": largo, acao a direita (com descricao) {"title":"Autenticação em 2 fatores","headerW":1086,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":true,"descOverlapsAction":false}
OK   [seguranca] [1440] card "Sessões ativas": largo, acao a direita {"title":"Sessões ativas","headerW":1086,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":null,"descOverlapsAction":false}
OK   [modal] [1440] troca de senha: descricao "Esta sessão continua aberta." visivel
OK   [modal] [1440] troca de senha: sem rodape antes de editar (isDirty) botoes=0
OK   [modal] [1440] troca de senha (Dialog): 1 botao ocupa 100% {"buttons":1,"footerW":480,"bs":[{"text":"Alterar senha","left":480,"right":960,"w":480,"top":580}],"leftGap":0,"rightGap":0,"texts":[],"footerBottomInView":true,"overflowX":false}
OK   [listagem] [1440] usuarios: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1440] usuarios: "Ações" com titulo e botoes no mesmo eixo {"headerCenter":1317.9,"textCenter":1317.9,"btnCenters":[1317.9],"maxDelta":0.03749999999990905,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1440] usuarios: coluna do icone propria, a direita de "Ações", celulas vazias {"headerCenter":1317.9,"textCenter":1317.9,"btnCenters":[1317.9],"maxDelta":0.03749999999990905,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1440] usuarios: menu de colunas sem "Ações" ["Nome","E-mail","Cargos","Status","Último acesso","Criado em"]
OK   [listagem] [1440] usuarios: sem textos cortados []
OK   [modal] [1440] ConfirmDialog (Desbloquear): 2 botoes centralizados, largura do texto {"buttons":2,"footerW":400,"bs":[{"text":"Cancelar","left":634.078125,"right":715.921875,"w":82,"top":483},{"text":"Bloquear","left":723.921875,"right":805.90625,"w":82,"
OK   [ordem] [1440] ConfirmDialog "Bloquear usuário?": Cancelar antes de Bloquear (a esquerda) {"neg":"Cancelar","pos":"Bloquear","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[634,483,82],"posBox"
OK   [listagem] [1440] cargos: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1440] cargos: "Ações" com titulo e botoes no mesmo eixo {"headerCenter":1317.9,"textCenter":1317.9,"btnCenters":[1317.9],"maxDelta":0.03749999999990905,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1440] cargos: coluna do icone propria, a direita de "Ações", celulas vazias {"headerCenter":1317.9,"textCenter":1317.9,"btnCenters":[1317.9],"maxDelta":0.03749999999990905,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1440] cargos: menu de colunas sem "Ações" ["Nome","Descrição","Permissões","Usuários","Criado em"]
OK   [listagem] [1440] cargos: sem textos cortados []
OK   [listagem] [1440] auditoria: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1440] auditoria: menu de colunas sem "Ações" ["Data/hora","Módulo","Entidade","Ação","Usuário","Resumo"]
OK   [listagem] [1440] auditoria: sem textos cortados []
OK   [modal] [1440] detalhe da auditoria (dialog-content): sem descricao/vao, sem rodape de botoes, sem overflow {"hasDescription":false,"describedBy":null,"footerButtons":0,"overflowX":false,"kind":"dialog-content"}
OK   [modal] [1440] detalhe da auditoria sem textos cortados []
OK   [cargo-usuarios] [1440] header "Ações" visivel e centralizado sobre os botoes {"visibleText":true,"textW":42,"textAlign":"center","rows":2,"maxDelta":0}
OK   [ordem] [1440] PageActions da criacao: Cancelar antes de Criar usuario {"neg":"Cancelar","pos":"Criar usuário","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[1182,16,104],"posBox":[1294,16,130
OK   [ordem] [1440] guard de saida: Continuar editando antes de Descartar alteracoes (a esquerda, mesma linha) {"neg":"Continuar editando","pos":"Descartar alterações","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUse
OK   [ordem] [1440] Continuar editando fica na criacao com o nome http://localhost:4173/users/create
OK   [ordem] [1440] PageActions do detalhe: Descartar antes de Salvar alteracoes {"neg":"Descartar","pos":"Salvar alterações","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[1146,16,110],"posBox":[
OK   [ordem] [1440] filtros: Limpar antes de Buscar {"neg":"Limpar","pos":"Buscar","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[1219,231,90],"posBox":[1317,231,91],"ok":true}
OK   [billing] [1440] card Plano com "Cancelar plano" e sem "Cancelar" solto ["Trocar de plano","Cancelar plano"]
OK   [billing] [1440] card Plano: Trocar de plano, depois Cancelar plano {"neg":"Trocar de plano","pos":"Cancelar plano","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[1134,271,127],"posBox":[1268,2
OK   [sidebar-a11y] [1440] trigger com sr-only "Alternar menu lateral", rail com aria-label/title, sem "Toggle Sidebar" {"buttons":2,"triggerSrOnly":"Alternar menu lateral","rail":{"aria":"Alternar menu lateral","title":"Alternar menu lateral"},"englishLeft":f
OK   [modal] [1440] aviso de inatividade: botao inteiro dentro da tela depois da animacao
OK   [modal] [1440] aviso de inatividade (Dialog): 1 botao ocupa 100% {"buttons":1,"footerW":480,"bs":[{"text":"Continuar conectado","left":480,"right":960,"w":480,"top":486}],"leftGap":0,"rightGap":0,"texts":[],"footerBottomInView":true,"overflowX":false}
OK   [listagem] [1440] skeleton: coluna Ações centralizada, coluna do icone sem skeleton {"acoes":true,"rows":8,"maxDelta":0,"menuColHasSkeleton":false}
OK   [home] [1280] Pendências com 4 itens sem scroll interno {"chartH":500,"pendH":500,"items":4,"pendScroll":false,"sh":399,"ch":399,"pendEmptyBelow":0,"chartEmptyBelow":0,"chartCardBottomGap":17,"pendCardBottomGap":17,"sameRow":true}
OK   [home] [1280] Pendências sem vazio abaixo do ultimo item vazio=0px
OK   [home] [1280] par na mesma linha com a mesma altura chart=500 pend=500
OK   [home] [1280] grafico ocupa a altura do corpo (sem vazio embaixo) vazio=0px
OK   [home] [1280] selos de demonstracao inteiros (nao cortados) [{"card":"?","clipped":false,"w":174,"sw":172},{"card":"?","clipped":false,"w":174,"sw":172},{"card":"Atividade da semana","clipped":false,"w":174,"sw":172},{"card":"Pendências","clipped":false,
OK   [home] [1280] atalhos rapidos com blocos da mesma altura na linha [[52,52],[100,100],[52]]
OK   [home] [1280] sem textos cortados na home []
OK   [home] [1280] lista longa rola por dentro, titulo fixo {"chartH":576,"pendH":576,"sh":2817,"ch":475,"scrolled":200,"headerFixed":true,"rem":16}
OK   [home] [1280] lista longa respeita o teto (576px) e o grafico acompanha pend=576 chart=576
OK   [seguranca] [1280] aba Segurança selecionada (aria-selected e cor diferente de Perfil) [{"t":"Perfil","sel":"false","color":"oklab(0.481033 -0.0233083 -0.237071 / 0.986791)"},{"t":"Segurança","sel":"true","color":"oklab(0.159686 0.00000752158 -0.0175742
OK   [seguranca] [1280] card "Senha": largo, acao a direita {"title":"Senha","headerW":926,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":null,"descOverlapsAction":false}
OK   [seguranca] [1280] card "Autenticação em 2 fatores": largo, acao a direita (com descricao) {"title":"Autenticação em 2 fatores","headerW":926,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":true,"descOverlapsAction":false}
OK   [seguranca] [1280] card "Sessões ativas": largo, acao a direita {"title":"Sessões ativas","headerW":926,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":null,"descOverlapsAction":false}
OK   [modal] [1280] troca de senha: descricao "Esta sessão continua aberta." visivel
OK   [modal] [1280] troca de senha: sem rodape antes de editar (isDirty) botoes=0
OK   [modal] [1280] troca de senha (Dialog): 1 botao ocupa 100% {"buttons":1,"footerW":480,"bs":[{"text":"Alterar senha","left":400,"right":880,"w":480,"top":530}],"leftGap":0,"rightGap":0,"texts":[],"footerBottomInView":true,"overflowX":false}
OK   [listagem] [1280] usuarios: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1280] usuarios: "Ações" com titulo e botoes no mesmo eixo {"headerCenter":1230.9,"textCenter":1230.9,"btnCenters":[1230.9],"maxDelta":0.02187499999990905,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1280] usuarios: coluna do icone propria, a direita de "Ações", celulas vazias {"headerCenter":1230.9,"textCenter":1230.9,"btnCenters":[1230.9],"maxDelta":0.02187499999990905,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1280] usuarios: menu de colunas sem "Ações" ["Nome","E-mail","Cargos","Status","Último acesso","Criado em"]
OK   [listagem] [1280] usuarios: sem textos cortados []
OK   [modal] [1280] ConfirmDialog (Desbloquear): 2 botoes centralizados, largura do texto {"buttons":2,"footerW":400,"bs":[{"text":"Cancelar","left":554.078125,"right":635.921875,"w":82,"top":433},{"text":"Bloquear","left":643.921875,"right":725.90625,"w":82,"
OK   [ordem] [1280] ConfirmDialog "Bloquear usuário?": Cancelar antes de Bloquear (a esquerda) {"neg":"Cancelar","pos":"Bloquear","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[554,433,82],"posBox"
OK   [listagem] [1280] cargos: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1280] cargos: "Ações" com titulo e botoes no mesmo eixo {"headerCenter":1157.9,"textCenter":1157.9,"btnCenters":[1157.9],"maxDelta":0.03749999999990905,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1280] cargos: coluna do icone propria, a direita de "Ações", celulas vazias {"headerCenter":1157.9,"textCenter":1157.9,"btnCenters":[1157.9],"maxDelta":0.03749999999990905,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1280] cargos: menu de colunas sem "Ações" ["Nome","Descrição","Permissões","Usuários","Criado em"]
OK   [listagem] [1280] cargos: sem textos cortados []
OK   [listagem] [1280] auditoria: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1280] auditoria: menu de colunas sem "Ações" ["Data/hora","Módulo","Entidade","Ação","Usuário","Resumo"]
OK   [listagem] [1280] auditoria: sem textos cortados []
OK   [modal] [1280] detalhe da auditoria (dialog-content): sem descricao/vao, sem rodape de botoes, sem overflow {"hasDescription":false,"describedBy":null,"footerButtons":0,"overflowX":false,"kind":"dialog-content"}
OK   [modal] [1280] detalhe da auditoria sem textos cortados []
OK   [cargo-usuarios] [1280] header "Ações" visivel e centralizado sobre os botoes {"visibleText":true,"textW":42,"textAlign":"center","rows":2,"maxDelta":0}
OK   [ordem] [1280] PageActions da criacao: Cancelar antes de Criar usuario {"neg":"Cancelar","pos":"Criar usuário","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[1022,16,104],"posBox":[1134,16,130
OK   [ordem] [1280] guard de saida: Continuar editando antes de Descartar alteracoes (a esquerda, mesma linha) {"neg":"Continuar editando","pos":"Descartar alterações","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUse
OK   [ordem] [1280] Continuar editando fica na criacao com o nome http://localhost:4173/users/create
OK   [ordem] [1280] PageActions do detalhe: Descartar antes de Salvar alteracoes {"neg":"Descartar","pos":"Salvar alterações","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[986,16,110],"posBox":[1
OK   [ordem] [1280] filtros: Limpar antes de Buscar {"neg":"Limpar","pos":"Buscar","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[1059,231,90],"posBox":[1157,231,91],"ok":true}
OK   [billing] [1280] card Plano com "Cancelar plano" e sem "Cancelar" solto ["Trocar de plano","Cancelar plano"]
OK   [billing] [1280] card Plano: Trocar de plano, depois Cancelar plano {"neg":"Trocar de plano","pos":"Cancelar plano","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[974,271,127],"posBox":[1108,27
OK   [sidebar-a11y] [1280] trigger com sr-only "Alternar menu lateral", rail com aria-label/title, sem "Toggle Sidebar" {"buttons":2,"triggerSrOnly":"Alternar menu lateral","rail":{"aria":"Alternar menu lateral","title":"Alternar menu lateral"},"englishLeft":f
OK   [listagem] [1280] skeleton: coluna Ações centralizada, coluna do icone sem skeleton {"acoes":true,"rows":8,"maxDelta":0,"menuColHasSkeleton":false}
OK   [home] [1024-expandida] Pendências com 4 itens sem scroll interno {"chartH":722,"pendH":722,"items":4,"pendScroll":false,"sh":621,"ch":621,"pendEmptyBelow":0,"chartEmptyBelow":0,"chartCardBottomGap":17,"pendCardBottomGap":17,"sameRow":true}
OK   [home] [1024-expandida] Pendências sem vazio abaixo do ultimo item vazio=0px
OK   [home] [1024-expandida] par na mesma linha com a mesma altura chart=722 pend=722
OK   [home] [1024-expandida] grafico ocupa a altura do corpo (sem vazio embaixo) vazio=0px
OK   [home] [1024-expandida] selos de demonstracao inteiros (nao cortados) [{"card":"?","clipped":false,"w":174,"sw":172},{"card":"?","clipped":false,"w":174,"sw":172},{"card":"Atividade da semana","clipped":false,"w":174,"sw":172},{"card":"Pendências","clipp
OK   [home] [1024-expandida] atalhos rapidos com blocos da mesma altura na linha [[62,62],[116,116],[52]]
OK   [home] [1024-expandida] sem textos cortados na home []
OK   [home] [1024-expandida] lista longa rola por dentro, titulo fixo {"chartH":736,"pendH":736,"sh":4807,"ch":635,"scrolled":200,"headerFixed":true,"rem":16}
OK   [home] [1024-expandida] lista longa respeita o teto (736px) e o grafico acompanha pend=736 chart=736
OK   [seguranca] [1024-expandida] aba Segurança selecionada (aria-selected e cor diferente de Perfil) [{"t":"Perfil","sel":"false","color":"oklab(0.481094 -0.0233128 -0.237113 / 0.986906)"},{"t":"Segurança","sel":"true","color":"oklab(0.159528 0.0000190376 -
OK   [seguranca] [1024-expandida] card "Senha": largo, acao a direita {"title":"Senha","headerW":670,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":null,"descOverlapsAction":false}
OK   [seguranca] [1024-expandida] card "Autenticação em 2 fatores": largo, acao a direita (com descricao) {"title":"Autenticação em 2 fatores","headerW":670,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":true,"descOverlapsAction":fal
OK   [seguranca] [1024-expandida] card "Sessões ativas": largo, acao a direita {"title":"Sessões ativas","headerW":670,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":null,"descOverlapsAction":false}
OK   [modal] [1024-expandida] troca de senha: descricao "Esta sessão continua aberta." visivel
OK   [modal] [1024-expandida] troca de senha: sem rodape antes de editar (isDirty) botoes=0
OK   [modal] [1024-expandida] troca de senha (Dialog): 1 botao ocupa 100% {"buttons":1,"footerW":480,"bs":[{"text":"Alterar senha","left":272,"right":752,"w":480,"top":514}],"leftGap":0,"rightGap":0,"texts":[],"footerBottomInView":true,"overflowX":false}
OK   [listagem] [1024-expandida] usuarios: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1024-expandida] usuarios: "Ações" com titulo e botoes no mesmo eixo {"headerCenter":1230.9,"textCenter":1230.9,"btnCenters":[1230.9],"maxDelta":0.02187499999990905,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1024-expandida] usuarios: coluna do icone propria, a direita de "Ações", celulas vazias {"headerCenter":1230.9,"textCenter":1230.9,"btnCenters":[1230.9],"maxDelta":0.02187499999990905,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1024-expandida] usuarios: menu de colunas sem "Ações" ["Nome","E-mail","Cargos","Status","Último acesso","Criado em"]
OK   [listagem] [1024-expandida] usuarios: sem textos cortados []
OK   [modal] [1024-expandida] ConfirmDialog (Desbloquear): 2 botoes centralizados, largura do texto {"buttons":2,"footerW":400,"bs":[{"text":"Cancelar","left":426.078125,"right":507.921875,"w":82,"top":417},{"text":"Bloquear","left":515.921875,"right":597.9062
OK   [ordem] [1024-expandida] ConfirmDialog "Bloquear usuário?": Cancelar antes de Bloquear (a esquerda) {"neg":"Cancelar","pos":"Bloquear","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[426,417,82
OK   [listagem] [1024-expandida] cargos: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1024-expandida] cargos: "Ações" com titulo e botoes no mesmo eixo {"headerCenter":980.3,"textCenter":980.3,"btnCenters":[980.3],"maxDelta":0.012500000000045475,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1024-expandida] cargos: coluna do icone propria, a direita de "Ações", celulas vazias {"headerCenter":980.3,"textCenter":980.3,"btnCenters":[980.3],"maxDelta":0.012500000000045475,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1024-expandida] cargos: menu de colunas sem "Ações" ["Nome","Descrição","Permissões","Usuários","Criado em"]
OK   [listagem] [1024-expandida] cargos: sem textos cortados []
OK   [listagem] [1024-expandida] auditoria: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1024-expandida] auditoria: menu de colunas sem "Ações" ["Data/hora","Módulo","Entidade","Ação","Usuário","Resumo"]
OK   [listagem] [1024-expandida] auditoria: sem textos cortados []
OK   [modal] [1024-expandida] detalhe da auditoria (dialog-content): sem descricao/vao, sem rodape de botoes, sem overflow {"hasDescription":false,"describedBy":null,"footerButtons":0,"overflowX":false,"kind":"dialog-content"}
OK   [modal] [1024-expandida] detalhe da auditoria sem textos cortados []
OK   [cargo-usuarios] [1024-expandida] header "Ações" visivel e centralizado sobre os botoes {"visibleText":true,"textW":42,"textAlign":"center","rows":2,"maxDelta":0}
OK   [ordem] [1024-expandida] PageActions da criacao: Cancelar antes de Criar usuario {"neg":"Cancelar","pos":"Criar usuário","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[766,16,104],"posBox":[87
OK   [ordem] [1024-expandida] guard de saida: Continuar editando antes de Descartar alteracoes (a esquerda, mesma linha) {"neg":"Continuar editando","pos":"Descartar alterações","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false
OK   [ordem] [1024-expandida] Continuar editando fica na criacao com o nome http://localhost:4173/users/create
OK   [ordem] [1024-expandida] PageActions do detalhe: Descartar antes de Salvar alteracoes {"neg":"Descartar","pos":"Salvar alterações","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[730,16,110],"
OK   [ordem] [1024-expandida] filtros: Limpar antes de Buscar {"neg":"Limpar","pos":"Buscar","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[803,306,90],"posBox":[901,306,91],"ok":true}
OK   [billing] [1024-expandida] card Plano com "Cancelar plano" e sem "Cancelar" solto ["Trocar de plano","Cancelar plano"]
OK   [billing] [1024-expandida] card Plano: Trocar de plano, depois Cancelar plano {"neg":"Trocar de plano","pos":"Cancelar plano","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[718,291,127],"posBox
OK   [sidebar-a11y] [1024-expandida] trigger com sr-only "Alternar menu lateral", rail com aria-label/title, sem "Toggle Sidebar" {"buttons":2,"triggerSrOnly":"Alternar menu lateral","rail":{"aria":"Alternar menu lateral","title":"Alternar menu lateral"},"engl
OK   [listagem] [1024-expandida] skeleton: coluna Ações centralizada, coluna do icone sem skeleton {"acoes":true,"rows":8,"maxDelta":0,"menuColHasSkeleton":false}
OK   [home] [1024-recolhida] Pendências com 4 itens sem scroll interno {"chartH":522,"pendH":522,"items":4,"pendScroll":false,"sh":421,"ch":421,"pendEmptyBelow":0,"chartEmptyBelow":0,"chartCardBottomGap":17,"pendCardBottomGap":17,"sameRow":true}
OK   [home] [1024-recolhida] Pendências sem vazio abaixo do ultimo item vazio=0px
OK   [home] [1024-recolhida] par na mesma linha com a mesma altura chart=522 pend=522
OK   [home] [1024-recolhida] grafico ocupa a altura do corpo (sem vazio embaixo) vazio=0px
OK   [home] [1024-recolhida] selos de demonstracao inteiros (nao cortados) [{"card":"?","clipped":false,"w":174,"sw":172},{"card":"?","clipped":false,"w":174,"sw":172},{"card":"Atividade da semana","clipped":false,"w":174,"sw":172},{"card":"Pendências","clipp
OK   [home] [1024-recolhida] atalhos rapidos com blocos da mesma altura na linha [[52,52],[100,100],[52]]
OK   [home] [1024-recolhida] sem textos cortados na home []
OK   [home] [1024-recolhida] lista longa rola por dentro, titulo fixo {"chartH":736,"pendH":736,"sh":3411,"ch":635,"scrolled":200,"headerFixed":true,"rem":16}
OK   [home] [1024-recolhida] lista longa respeita o teto (736px) e o grafico acompanha pend=736 chart=736
OK   [seguranca] [1024-recolhida] aba Segurança selecionada (aria-selected e cor diferente de Perfil) [{"t":"Perfil","sel":"false","color":"oklab(0.481036 -0.0233085 -0.237073 / 0.986797)"},{"t":"Segurança","sel":"true","color":"oklab(0.159679 0.00000806269
OK   [seguranca] [1024-recolhida] card "Senha": largo, acao a direita {"title":"Senha","headerW":878,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":null,"descOverlapsAction":false}
OK   [seguranca] [1024-recolhida] card "Autenticação em 2 fatores": largo, acao a direita (com descricao) {"title":"Autenticação em 2 fatores","headerW":878,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":true,"descOverlapsAction":fal
OK   [seguranca] [1024-recolhida] card "Sessões ativas": largo, acao a direita {"title":"Sessões ativas","headerW":878,"action":{"stacked":false,"right":0,"clipped":false},"descBelowTitle":null,"descOverlapsAction":false}
OK   [modal] [1024-recolhida] troca de senha: descricao "Esta sessão continua aberta." visivel
OK   [modal] [1024-recolhida] troca de senha: sem rodape antes de editar (isDirty) botoes=0
OK   [modal] [1024-recolhida] troca de senha (Dialog): 1 botao ocupa 100% {"buttons":1,"footerW":480,"bs":[{"text":"Alterar senha","left":272,"right":752,"w":480,"top":514}],"leftGap":0,"rightGap":0,"texts":[],"footerBottomInView":true,"overflowX":false}
OK   [listagem] [1024-recolhida] usuarios: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1024-recolhida] usuarios: "Ações" com titulo e botoes no mesmo eixo {"headerCenter":1022.9,"textCenter":1022.9,"btnCenters":[1022.9],"maxDelta":0.021875000000022737,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1024-recolhida] usuarios: coluna do icone propria, a direita de "Ações", celulas vazias {"headerCenter":1022.9,"textCenter":1022.9,"btnCenters":[1022.9],"maxDelta":0.021875000000022737,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1024-recolhida] usuarios: menu de colunas sem "Ações" ["Nome","E-mail","Cargos","Status","Último acesso","Criado em"]
OK   [listagem] [1024-recolhida] usuarios: sem textos cortados []
OK   [modal] [1024-recolhida] ConfirmDialog (Desbloquear): 2 botoes centralizados, largura do texto {"buttons":2,"footerW":400,"bs":[{"text":"Cancelar","left":426.078125,"right":507.921875,"w":82,"top":417},{"text":"Bloquear","left":515.921875,"right":597.9062
OK   [ordem] [1024-recolhida] ConfirmDialog "Bloquear usuário?": Cancelar antes de Bloquear (a esquerda) {"neg":"Cancelar","pos":"Bloquear","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[426,417,82
OK   [listagem] [1024-recolhida] cargos: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1024-recolhida] cargos: "Ações" com titulo e botoes no mesmo eixo {"headerCenter":901.9,"textCenter":901.9,"btnCenters":[901.9],"maxDelta":0.03750000000002274,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1024-recolhida] cargos: coluna do icone propria, a direita de "Ações", celulas vazias {"headerCenter":901.9,"textCenter":901.9,"btnCenters":[901.9],"maxDelta":0.03750000000002274,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [1024-recolhida] cargos: menu de colunas sem "Ações" ["Nome","Descrição","Permissões","Usuários","Criado em"]
OK   [listagem] [1024-recolhida] cargos: sem textos cortados []
OK   [listagem] [1024-recolhida] auditoria: ultima coluna so com o icone de colunas w=56
OK   [listagem] [1024-recolhida] auditoria: menu de colunas sem "Ações" ["Data/hora","Módulo","Entidade","Ação","Usuário","Resumo"]
OK   [listagem] [1024-recolhida] auditoria: sem textos cortados []
OK   [modal] [1024-recolhida] detalhe da auditoria (dialog-content): sem descricao/vao, sem rodape de botoes, sem overflow {"hasDescription":false,"describedBy":null,"footerButtons":0,"overflowX":false,"kind":"dialog-content"}
OK   [modal] [1024-recolhida] detalhe da auditoria sem textos cortados []
OK   [cargo-usuarios] [1024-recolhida] header "Ações" visivel e centralizado sobre os botoes {"visibleText":true,"textW":42,"textAlign":"center","rows":2,"maxDelta":0}
OK   [ordem] [1024-recolhida] PageActions da criacao: Cancelar antes de Criar usuario {"neg":"Cancelar","pos":"Criar usuário","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[766,8,104],"posBox":[878
OK   [ordem] [1024-recolhida] guard de saida: Continuar editando antes de Descartar alteracoes (a esquerda, mesma linha) {"neg":"Continuar editando","pos":"Descartar alterações","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false
OK   [ordem] [1024-recolhida] Continuar editando fica na criacao com o nome http://localhost:4173/users/create
OK   [ordem] [1024-recolhida] PageActions do detalhe: Descartar antes de Salvar alteracoes {"neg":"Descartar","pos":"Salvar alterações","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[730,8,110],"p
OK   [ordem] [1024-recolhida] filtros: Limpar antes de Buscar {"neg":"Limpar","pos":"Buscar","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[803,223,90],"posBox":[901,223,91],"ok":true}
OK   [billing] [1024-recolhida] card Plano com "Cancelar plano" e sem "Cancelar" solto ["Trocar de plano","Cancelar plano"]
OK   [billing] [1024-recolhida] card Plano: Trocar de plano, depois Cancelar plano {"neg":"Trocar de plano","pos":"Cancelar plano","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[718,255,127],"posBox
OK   [sidebar-a11y] [1024-recolhida] trigger com sr-only "Alternar menu lateral", rail com aria-label/title, sem "Toggle Sidebar" {"buttons":2,"triggerSrOnly":"Alternar menu lateral","rail":{"aria":"Alternar menu lateral","title":"Alternar menu lateral"},"engl
OK   [home] [390] Pendências com 4 itens sem scroll interno {"chartH":317,"pendH":484,"items":4,"pendScroll":false,"sh":383,"ch":383,"pendEmptyBelow":0,"chartEmptyBelow":0,"chartCardBottomGap":17,"pendCardBottomGap":17,"sameRow":false}
OK   [home] [390] Pendências sem vazio abaixo do ultimo item vazio=0px
OK   [home] [390] par empilhado no estreito {"chartH":317,"pendH":484,"items":4,"pendScroll":false,"sh":383,"ch":383,"pendEmptyBelow":0,"chartEmptyBelow":0,"chartCardBottomGap":17,"pendCardBottomGap":17,"sameRow":false}
OK   [home] [390] selos de demonstracao inteiros (nao cortados) [{"card":"?","clipped":false,"w":174,"sw":172},{"card":"?","clipped":false,"w":174,"sw":172},{"card":"Atividade da semana","clipped":false,"w":174,"sw":172},{"card":"Pendências","clipped":false,"
OK   [home] [390] atalhos rapidos com blocos da mesma altura na linha [[52],[52],[52],[84],[52]]
OK   [home] [390] sem textos cortados na home []
OK   [home] [390] lista longa rola por dentro, titulo fixo {"chartH":317,"pendH":549,"sh":2801,"ch":448,"scrolled":200,"headerFixed":true,"rem":16}
OK   [home] [390] lista longa empilhada com max-h (28rem) no corpo content=448
OK   [seguranca] [390] aba Segurança selecionada (aria-selected e cor diferente de Perfil) [{"t":"Perfil","sel":"false","color":"oklab(0.448511 -0.0209486 -0.214857 / 0.929482)"},{"t":"Segurança","sel":"true","color":"oklab(0.232235 -0.00525635 -0.0671287 /
OK   [seguranca] [390] card "Senha": estreito empilha {"title":"Senha","headerW":292,"action":{"stacked":true,"right":158,"clipped":false},"descBelowTitle":null,"descOverlapsAction":false}
OK   [seguranca] [390] card "Autenticação em 2 fatores": estreito empilha (com descricao) {"title":"Autenticação em 2 fatores","headerW":292,"action":{"stacked":true,"right":118,"clipped":false},"descBelowTitle":true,"descOverlapsAction":false}
OK   [seguranca] [390] card "Sessões ativas": estreito empilha {"title":"Sessões ativas","headerW":292,"action":{"stacked":true,"right":118,"clipped":false},"descBelowTitle":null,"descOverlapsAction":false}
OK   [modal] [390] troca de senha: descricao "Esta sessão continua aberta." visivel
OK   [modal] [390] troca de senha: sem rodape antes de editar (isDirty) botoes=0
OK   [modal] [390] troca de senha (Drawer): 1 botao ocupa 100% {"buttons":1,"footerW":358,"bs":[{"text":"Alterar senha","left":16,"right":374,"w":358,"top":796}],"leftGap":0,"rightGap":0,"texts":[],"footerBottomInView":true,"overflowX":false}
OK   [listagem] [390] usuarios: ultima coluna so com o icone de colunas w=56
OK   [listagem] [390] usuarios: "Ações" com titulo e botoes no mesmo eixo {"headerCenter":974.9,"textCenter":974.9,"btnCenters":[974.9],"maxDelta":0.021875000000022737,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [390] usuarios: coluna do icone propria, a direita de "Ações", celulas vazias {"headerCenter":974.9,"textCenter":974.9,"btnCenters":[974.9],"maxDelta":0.021875000000022737,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [390] usuarios: menu de colunas sem "Ações" ["Nome","E-mail","Cargos","Status","Último acesso","Criado em"]
OK   [listagem] [390] usuarios: rodape da tabela sem overflow horizontal em 390 {"sw":151,"cw":151,"right":358,"vw":390,"overflow":false}
OK   [F1] [390] usuarios: Anterior e Próxima juntas na mesma linha do rodape {"neg":"Anterior","pos":"Próxima","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[207,768,71],"posBox":[287,768,71],"ok"
OK   [listagem] [390] usuarios: sem textos cortados []
OK   [modal] [390] ConfirmDialog (Desbloquear): 2 botoes centralizados, largura do texto {"buttons":2,"footerW":272,"bs":[{"text":"Cancelar","left":109.078125,"right":190.921875,"w":82,"top":455},{"text":"Bloquear","left":198.921875,"right":280.90625,"w":82,"t
OK   [ordem] [390] ConfirmDialog "Bloquear usuário?": Cancelar antes de Bloquear (a esquerda) {"neg":"Cancelar","pos":"Bloquear","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[109,455,82],"posBox":
OK   [listagem] [390] cargos: ultima coluna so com o icone de colunas w=56
OK   [listagem] [390] cargos: "Ações" com titulo e botoes no mesmo eixo {"headerCenter":724.3,"textCenter":724.3,"btnCenters":[724.3],"maxDelta":0.012500000000045475,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [390] cargos: coluna do icone propria, a direita de "Ações", celulas vazias {"headerCenter":724.3,"textCenter":724.3,"btnCenters":[724.3],"maxDelta":0.012500000000045475,"menuColRightOfAcoes":true,"menuColIsNotAcoes":true}
OK   [listagem] [390] cargos: menu de colunas sem "Ações" ["Nome","Descrição","Permissões","Usuários","Criado em"]
OK   [listagem] [390] cargos: rodape da tabela sem overflow horizontal em 390 {"sw":151,"cw":151,"right":358,"vw":390,"overflow":false}
OK   [F1] [390] cargos: Anterior e Próxima juntas na mesma linha do rodape {"neg":"Anterior","pos":"Próxima","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[207,403,71],"posBox":[287,403,71],"ok":t
OK   [listagem] [390] cargos: sem textos cortados []
OK   [listagem] [390] auditoria: ultima coluna so com o icone de colunas w=56
OK   [listagem] [390] auditoria: menu de colunas sem "Ações" ["Data/hora","Módulo","Entidade","Ação","Usuário","Resumo"]
OK   [listagem] [390] auditoria: rodape da tabela sem overflow horizontal em 390 {"sw":151,"cw":151,"right":358,"vw":390,"overflow":false}
OK   [F1] [390] auditoria: Anterior e Próxima juntas na mesma linha do rodape {"neg":"Anterior","pos":"Próxima","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[207,768,71],"posBox":[287,768,71],"ok
OK   [listagem] [390] auditoria: sem textos cortados []
OK   [modal] [390] detalhe da auditoria (drawer-content): sem descricao/vao, sem rodape de botoes, sem overflow {"hasDescription":false,"describedBy":null,"footerButtons":0,"overflowX":false,"kind":"drawer-content"}
OK   [modal] [390] detalhe da auditoria sem textos cortados []
OK   [cargo-usuarios] [390] header "Ações" visivel e centralizado sobre os botoes {"visibleText":true,"textW":42,"textAlign":"center","rows":2,"maxDelta":0}
OK   [ordem] [390] PageActions da criacao: Cancelar antes de Criar usuario {"neg":"Cancelar","pos":"Criar usuário","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[290,16,38],"posBox":[336,16,38],"ok
OK   [ordem] [390] guard de saida: Continuar editando antes de Descartar alteracoes (quebrou: negativa em cima) {"neg":"Continuar editando","pos":"Descartar alterações","domBefore":true,"sameRow":false,"wrapped":true,"visualOk":true,"reversed":false,"orderUs
OK   [ordem] [390] Continuar editando fica na criacao com o nome http://localhost:4173/users/create
OK   [ordem] [390] PageActions do detalhe: Descartar antes de Salvar alteracoes {"neg":"Descartar","pos":"Salvar alterações","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[290,16,38],"posBox":[336
OK   [ordem] [390] filtros: Limpar antes de Buscar {"neg":"Limpar","pos":"Buscar","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[169,448,90],"posBox":[267,448,91],"ok":true}
OK   [billing] [390] card Plano com "Cancelar plano" e sem "Cancelar" solto ["Trocar de plano","Cancelar plano"]
OK   [billing] [390] card Plano: Trocar de plano, depois Cancelar plano {"neg":"Trocar de plano","pos":"Cancelar plano","domBefore":true,"sameRow":true,"wrapped":false,"visualOk":true,"reversed":false,"orderUsed":false,"negBox":[49,375,127],"posBox":[184,375,1
OK   [sidebar-a11y] [390] trigger com sr-only "Alternar menu lateral", rail com aria-label/title, sem "Toggle Sidebar" {"buttons":1,"triggerSrOnly":"Alternar menu lateral","rail":null,"englishLeft":false,"byRole":1}
OK   [modal] [390] aviso de inatividade: botao inteiro dentro da tela depois da animacao
OK   [modal] [390] aviso de inatividade (Drawer): 1 botao ocupa 100% {"buttons":1,"footerW":358,"bs":[{"text":"Continuar conectado","left":16,"right":374,"w":358,"top":796}],"leftGap":0,"rightGap":0,"texts":[],"footerBottomInView":true,"overflowX":false}
OK   [listagem] [390] skeleton: coluna Ações centralizada, coluna do icone sem skeleton {"acoes":true,"rows":8,"maxDelta":0,"menuColHasSkeleton":false}
OK   [page-size] [1440] seletor mostra 25 por padrao 25
OK   [page-size] [1440] opcoes 25/50/100 ["25","50","100"]
OK   [page-size] [1440] troca para 50 pede so a primeira pagina ao servidor (page=0) ["/api/client/audit-logs?page=0&pageSize=50"]
OK   [page-size] [1440] trocar para 50 volta a pagina 1 {"urlP2":"http://localhost:4173/audit-logs?page=1","url50":"http://localhost:4173/audit-logs?pageSize=50","req":"/api/client/audit-logs?page=0&pageSize=50"}
OK   [page-size] [1440] grava dataTable:pageSize=50 50
OK   [page-size] [1440] auditoria com ate 50 linhas 50
OK   [page-size] [1440] vale em outra listagem (usuarios mostra 50, todas as 32 pessoas numa pagina) {"combo":"50","rows":32,"url":"http://localhost:4173/users"}
OK   [page-size] [1440] depois de recarregar continua 50 50
OK   [page-size] [1440] ?pageSize=100 na URL vence o storage (sem requisicao com 50) {"combo":"100","stored":"50","reqs":["/api/client/users?page=0&pageSize=100"]}
TOTAL 233 checks, 233 ok, 0 falhas
exit=0
```

### `STORYBOOK_BASE_URL=http://127.0.0.1:6116 pnpm run test:layers`

```text
  ok  1 [chromium] › e2e\storybook\camadas.spec.ts:147:3 › camadas — flutuantes dentro de um Modal › todo flutuante abre NA FRENTE do modal (desktop/Dialog) (9.6s)
  ok  2 [chromium] › e2e\storybook\camadas.spec.ts:158:3 › camadas — flutuantes dentro de um Modal › o calendário é CLICÁVEL dentro do modal (nada intercepta o clique) (2.2s)
  ok  3 [chromium] › e2e\storybook\camadas.spec.ts:180:3 › camadas — flutuantes dentro de um Modal › o painel do calendário abraça o conteúdo (não estica com o modal) (1.9s)
  ok  4 [chromium] › e2e\storybook\camadas.spec.ts:210:3 › camadas — flutuantes dentro de um Modal › mesmo comportamento no mobile, onde o Modal vira Drawer (7.0s)
  ok  5 [chromium] › e2e\storybook\camadas.spec.ts:224:3 › camadas — flutuantes dentro de um Sheet › todo flutuante abre NA FRENTE do sheet (6.8s)
  ok  6 [chromium] › e2e\storybook\camadas.spec.ts:234:3 › camadas — em página › todo flutuante abre por cima do conteúdo (5.9s)
  ok  7 [chromium] › e2e\storybook\camadas.spec.ts:240:3 › camadas — em página › flutuante não cobre o header, mesmo flipando para cima (1.1s)
  ok  8 [chromium] › e2e\storybook\camadas.spec.ts:268:3 › camadas — empilhamento profundo › Modal → DropdownMenu → ConfirmDialog → Toast, cada um na frente do anterior (1.9s)
  ok  9 [chromium] › e2e\storybook\camadas.spec.ts:288:3 › camadas — empilhamento profundo › Tooltip fica acima do Popover que o contém (1.5s)
  ok 10 [chromium] › e2e\storybook\camadas.spec.ts:309:3 › camadas — escala de tokens › os tokens --z-* estão em ordem crescente no navegador (883ms)
  10 passed (39.7s)
exit=0
```

### Sidebar no Storybook (`sbdocs.mjs`, resumo)

```text
docs instancias=2 todas_contidas=true caixas=[[50,112,256,446],[50,672,48,446]] moldura=[[49,111,1342,448],[49,671,1342,448]] erros=0
story instancias=2 todas_contidas=true caixas=[[50,112,256,446],[50,672,48,446]] moldura=[[49,111,1342,448],[49,671,1342,448]] erros=0
manager http://127.0.0.1:6116/?path=/docs/globais-sidebar--docs -> sem pagina Docs
```

### Descarte e encerramento

```text
$ docker exec server-template-postgres psql -U postgres -c 'DROP DATABASE "temporary-f9abf13f";'
DROP DATABASE
restantes temporary-%: 0
taskkill /T /F: 8392 (Storybook 6116), 14428 (Vite 4173), 18924 (server 8095): finalizados
portas no fim: 6006 (PID 2588) e 8080 (PID 24848), de outros projetos, intocadas; 4173, 5173, 6116 e 8095 livres
```
