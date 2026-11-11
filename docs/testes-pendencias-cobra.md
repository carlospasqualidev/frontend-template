# Relatório de testes: rodada 10, "o que ficou de fora" (TPL-55 a TPL-70)

## 1. Cabeçalho

| Campo                | Valor                                                                                                                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recorte              | Rodada 10 (TPL-55 a TPL-70, pedido em `docs/specs/pendencias-cobra.pedido.md`): e2e inteiro contra a API local e conferência no navegador real do que o jsdom não prova                                                           |
| Plataforma           | frontend (Playwright contra o app real e o server real; Storybook para os componentes sem tela)                                                                                                                                   |
| Repositório          | `D:\Development\personal-projects\templates\frontend-template`; par: `D:\Development\personal-projects\templates\server-template` (branch `main`, sem alteração)                                                                  |
| Branch               | `upgrade-cobra`, HEAD `a50e9c5` (nada em `src/`, `e2e/` ou config foi editado; sem commit, sem push)                                                                                                                              |
| Data da execução     | 2026-11-11                                                                                                                                                                                                                        |
| Specs lidos          | `docs/specs/pendencias-cobra.pedido.md`, `docs/specs/pendencias-cobra.validacao.md`, `TASKS.md` (rodada 10), `docs/specs/TPL-55/56/57/59/60/62/64/65/66/67/69/70.handoff.md`, `docs/mapa/pendencias-cobra.md` (item 9 e decisões) |
| Rodou sem spec       | sim: os cards da rodada só têm `docs/specs/<card>.handoff.md` (nenhum `docs/specs/TPL-5x.md`/`TPL-6x.md`); a intenção veio do pedido, do `TASKS.md` e dos handoffs                                                                |
| Fora deste relatório | `pnpm run check`, `build`, `build-storybook` e `test:layers` (já verdes em `pendencias-cobra.validacao.md`, não repetidos)                                                                                                        |

## 2. Bloqueios

Nenhum bloqueio aberto. Resolvidos durante a sessão:

| O que travou                                                                                                                                                                                                        | Casos derrubados | O que foi feito                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A API do dono (8080, banco `server_template_local`) não pode receber escrita do e2e nem da conferência                                                                                                              | todos            | segundo `server-template` com banco descartável `temporary-3f88b4d3` (seção 9); a 8080 e o Vite 5173 do dono não foram tocados (`/health/ready` da 8080 `ok` e 5173 `200` no fim) |
| A 8090, usada na rodada 9, está ocupada por outro projeto (`sul-oxidos ... e2e`, em `0.0.0.0` e `[::]`): `localhost:8090` respondia `Cannot GET /health/ready` mesmo com o nosso server ouvindo em `127.0.0.1:8090` | nenhum           | o nosso server da 8090 foi parado antes de qualquer spec (só os 3 processos dele, pelos PIDs conferidos) e o server subiu na **8095**; o processo do outro projeto não foi tocado |

## 3. O que a automação já garante

| Camada                                                      | Escopo                                 | Comando                                                                                                                                                                                                  | Resultado                                                                  |
| ----------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| e2e (Playwright, suíte do repo)                             | `loop`                                 | não se aplica: a rodada não criou nem alterou spec em `e2e/`; o pedido é a camada inteira, e a conferência no navegador (abaixo) mira os itens da rodada                                                 | n/a                                                                        |
| e2e (Playwright, suíte do repo)                             | `fechamento`: camada inteira, 14 specs | `VITE_API_URL=http://localhost:8095/api pnpm run test:e2e` (o `webServer` subiu sozinho `vite --port 4173 --strictPort`, TPL-60)                                                                         | **70 passed, 0 failed, 0 skipped** (2.6m), `exit=0`                        |
| Conferência no navegador (scripts Playwright fora da suíte) | itens pedidos, temas claro e escuro    | `node app.mjs` (app na 4174 contra a API 8095) e `node sb.mjs` (Storybook na 6006), em `C:\Users\admin\AppData\Local\Temp\claude\0a63b47506d5ac85\2fb4e0b5-aae0-4939-89c8-e6dca2eb3994\scratchpad\conf\` | 12 verificações: 10 conformes, 2 com achado `normal` da rodada 10 (B1, B2) |

Por spec, no `fechamento`: `users` 14, `roles` 13, `auditLogs` 8, `unsavedChanges` 7, `account` 5, `settings` 5, `columnVisibility` 3, `login` 3, `routeError` 3, `session` 3, `home` 2, `loginErrors` 2, `idleTimeout` 1, `userWithoutRole` 1. O que a rodada tocou e a camada passou por cima: `layout.tsx` (TPL-59, todas as telas), `dateFormatter` (TPL-55, listas de usuários e auditoria), `ConfirmDialog` (TPL-65, bloquear e excluir em `users` e `roles`), `aria-describedby` dos campos (TPL-69, todos os formulários por `getByLabel`), menu de colunas (TPL-56, `columnVisibility`), `webServer` (TPL-60).

**Vermelho no e2e: nenhum.** Nada trava o push por parte da suíte. Repetição dirigida (`--repeat-each`): nenhuma, nenhum spec falhou na sessão.

A conferência no navegador não ganha selo `automatizado`: é script desta sessão, não spec da suíte. Cada item tem a medida que o script leu da página e a captura. Capturas (106 PNG; 1440x900 no app, 390x844 no celular, 1280 no Storybook) e medidas (`app-results.json`, `sb-results.json`): `C:\Users\admin\AppData\Local\Temp\claude\0a63b47506d5ac85\2fb4e0b5-aae0-4939-89c8-e6dca2eb3994\scratchpad\shots\` e `...\scratchpad\conf\`. Nome: `<tema>-<tela ou story>-<estado>.png`.

## 4. Cobertura das regras

| Regra                                                                                                                                                        | Âncora                                                                                                                                                                                                                                                  | Superfície                   | Caso     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | -------- |
| `.dark --card` 0.19, um passo acima do `--background` 0.141; sidebar 0.21 mantida (decisão 5); painel `bg-muted/50`                                          | `src/index.css:244`, `:253`, `:259`, `:273`; `src/components/global/layout/layout.tsx:56`; `docs/conventions/theme.md:41-43`                                                                                                                            | shell, cards                 | V01, V02 |
| `ConfirmDialog`: filete à esquerda e ícone decorativo por severidade (destrutivo vermelho + `TriangleAlert`, demais âmbar + `CircleAlert`), foco em Cancelar | `src/components/global/confirmDialog/confirmDialog.tsx:89`, `:95-107`, `:116`; `src/components/global/card/accent.ts`; `src/screens/users/utils/userActionCopy.ts:21`, `:28`, `:35`                                                                     | lista de usuários, Storybook | V03, S06 |
| Tooltip de "Configurar colunas" não abre no foco devolvido pelo Esc; hover segue abrindo                                                                     | `src/components/global/dataTable/columnVisibilityMenu.tsx:55`, `:71`, `:84-89`, `:109`                                                                                                                                                                  | users                        | V04      |
| Datas no locale fixo `pt-BR`, independentes do navegador                                                                                                     | `src/lib/locale.ts:2`; `src/lib/dateTime/dateFormatter.ts:87`, `:94`, `:103`; `src/screens/users/list/userColumns.tsx:125-149`; `src/screens/audit-logs/list/index.tsx:140-148`                                                                         | users, audit-logs            | V05      |
| Menu mobile fecha ao navegar e ao tocar no item da página atual; fica aberto quando o guard barra                                                            | `src/components/global/sidebar/closeMobileSidebarOnNavigate.tsx:12-20`; `src/components/global/sidebar/useCloseMobileSidebarOnSamePage.ts:14-23`; `src/components/global/sidebar/navMain.tsx:127`, `:159`; `src/components/global/layout/layout.tsx:36` | sidebar em `Sheet`           | V06      |
| Tema do addon vence o do sistema no Storybook                                                                                                                | `.storybook/addonThemeSync.tsx:12-25`; `.storybook/preview.tsx:11-14`, `:57-66`                                                                                                                                                                         | Storybook                    | S01      |
| `RadioGroup`: legenda como nome, roving focus, setas marcam                                                                                                  | `src/components/global/form/radioGroup.tsx:42`, `:92-100`; `src/components/ui/radio-group.tsx`                                                                                                                                                          | Storybook                    | S02      |
| `MaskedInputField`: telefone, CPF/CNPJ, CEP; digitar, colar com `+55`, apagar no meio, tecla a mais ignorada                                                 | `src/components/global/form/maskedInputField.tsx:149-203`                                                                                                                                                                                               | Storybook                    | S03      |
| `FilterButtons`: grupo nomeado, `aria-pressed`, teclado                                                                                                      | `src/components/global/filterButtons/filterButtons.tsx:41-54`                                                                                                                                                                                           | Storybook                    | S04      |
| Descrição e erro ligados por `aria-describedby`                                                                                                              | `src/components/global/form/fieldDescribedBy.ts:25`; `src/components/global/form/checkbox.tsx:96`; `src/components/global/form/radioGroup.tsx:100`                                                                                                      | Storybook                    | S05      |
| Fluxos do app contra o server (camada inteira)                                                                                                               | `e2e/*.spec.ts`; `webServer` em `playwright.config.ts:48-49`                                                                                                                                                                                            | e2e                          | E01      |

Anti-lacuna:

- Toda regra colhida aparece em pelo menos um caso? sim.
- Todo caso aponta para regra com âncora? sim.
- Regra aplicada pela interface tem caso de recusa da API? Bloquear, excluir, permissão e nome repetido são conferidos contra a resposta do server nos specs de `users` e `roles` (E01). A rodada não criou regra nova de servidor: as demais são de apresentação.
- Regra que atinge dado existente tem caso na primeira fase? não se aplica: a rodada não mexe em schema nem em dado (seção 8).
- Perfil de permissão citado tem caso de acesso e de bloqueio? A rodada não mexe em permissão; admin e gestor rodam na camada (E01).
- Caminho de erro tem caso? sim: erro do campo (S05), guard que barra a navegação (V06), recusa do server (E01).
- Caso `manual` com impossibilidade declarada? Nenhum caso manual.
- Processo exigido no ar com comando e porta? sim (seção 9).
- Perfil com usuário do banco local e senha pelo caminho do projeto? sim (seção 9).
- Campo com máscara: digitação, colagem com mais dígitos e preenchimento de uma vez? sim (S03). O que o formulário **guarda** (só dígitos) não aparece na story nem vai a uma requisição, porque nenhuma tela usa o `MaskedInputField` ainda; fica com o teste de unidade `src/tests/globais/form/maskedInputField/maskedInputField.test.tsx`, que rodou verde no `check` da validação.

## 5. Resultado por caso

| Id  | Título                                                                               | Severidade | Execução              | Resultado                                                                                                      | Spec / evidência                    |
| --- | ------------------------------------------------------------------------------------ | ---------- | --------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| E01 | Camada e2e inteira contra o server local, com o Vite subido pelo `webServer`         | alto       | automatizado          | passou (70/70)                                                                                                 | `e2e/*.spec.ts` (saída na seção 11) |
| V01 | Card escuro um passo acima do fundo (TPL-66)                                         | normal     | script de conferência | **achado B1**: acima do `--background`, abaixo do painel em que está                                           | ver abaixo                          |
| V02 | Sidebar escura contra o card novo (decisão 5)                                        | normal     | script de conferência | passou (conforme a decisão registrada)                                                                         | ver abaixo                          |
| V03 | `ConfirmDialog` na tela: destrutivo e não destrutivo (TPL-65)                        | normal     | script de conferência | passou                                                                                                         | ver abaixo                          |
| V04 | Tooltip de "Configurar colunas" não cobre "Buscar" depois do Esc (TPL-56)            | normal     | script de conferência | passou                                                                                                         | ver abaixo                          |
| V05 | Datas em `pt-BR` com o navegador em `en-US` (TPL-55)                                 | alto       | script de conferência | passou (data com hora); só-data não distingue hoje                                                             | ver abaixo                          |
| V06 | Menu mobile: fecha ao navegar, fecha no item atual, fica aberto com o guard (TPL-59) | normal     | script de conferência | passou                                                                                                         | ver abaixo                          |
| S01 | Storybook: tema do addon vence o do sistema (TPL-57)                                 | normal     | script de conferência | passou                                                                                                         | ver abaixo                          |
| S02 | `RadioGroup` pelo teclado (TPL-62)                                                   | normal     | script de conferência | passou                                                                                                         | ver abaixo                          |
| S03 | `MaskedInputField`: telefone, CPF/CNPJ, CEP (TPL-64)                                 | alto       | script de conferência | passou em digitar, colar e apagar no meio; **achado B2** no preenchimento de uma vez do telefone com `+55`/`0` | ver abaixo                          |
| S04 | `FilterButtons` (TPL-67)                                                             | normal     | script de conferência | passou                                                                                                         | ver abaixo                          |
| S05 | Campo com descrição e erro anunciados (TPL-69)                                       | normal     | script de conferência | passou                                                                                                         | ver abaixo                          |
| S06 | `ConfirmDialog` na vitrine do Storybook (TPL-65)                                     | normal     | script de conferência | passou                                                                                                         | ver abaixo                          |

Contagem: 13 casos; `critico` 0, `alto` 3, `normal` 10. `nao executado`: nenhum.

O que cada verificação mediu (claro e escuro, salvo onde dito):

- **V01.** Cores lidas da captura (`/` e `/users`, 1440x900, pixel por canvas, contraste WCAG 2.x). Escuro: header/`--background` `rgb(9,9,11)`, **painel** (`bg-muted/50` do `ScrollArea`) `rgb(24,24,26)`, **card** `rgb(19,19,22)`, sidebar `rgb(24,24,27)`. O card fica **1,073:1 acima do `--background`**, como a decisão 1 pediu, mas o `--background` só aparece no header: atrás do card está o painel, e o card fica **1,046:1 abaixo dele**. No claro a relação é a outra: card `rgb(255,255,255)` 1,052:1 **acima** do painel `rgb(249,249,250)`. Tokens lidos do `:root`: `--card oklch(0.19 0.006 285.885)`, `--background oklch(0.141 …)`, `--sidebar oklch(0.21 …)`, `--popover oklch(0.24 …)`. Ver B1. `dark-home-card-sidebar.png`, `dark-users-card-sidebar.png`, `light-*`.
- **V02.** Sidebar escura `rgb(24,24,27)`: 1,047:1 acima do card e 1,001:1 do painel (barra e painel no mesmo tom, card um degrau abaixo dos dois). É o que a decisão 5 registrou (sidebar fica em 0,21); o mapa previa 1,04:1 contra o card, medido 1,047. No claro, sidebar `rgb(250,250,250)` 1,044:1 abaixo do card.
- **V03.** Lista de usuários, pessoa preparada "Pessoa Conferência <sufixo>". "Bloquear" (`destructive: true`, `userActionCopy.ts:21`): filete `4px` na cor do `--destructive` (claro `oklch(0.577 0.245 27.325)`, escuro `oklch(0.704 0.191 22.216)`), ícone `lucide-triangle-alert` em `aria-hidden="true"`, foco em "Cancelar"; confirmado: `PATCH 200`, a linha passou a "Bloqueado". "Desbloquear" (`destructive: false`, `:28`): filete e ícone na cor do `--warning` (claro `oklch(0.5 0.12 75)`, escuro `oklch(0.85 0.14 85)`), `lucide-circle-alert`, foco em "Cancelar"; confirmado: `PATCH 200`, linha "Ativo". "Excluir" (`:35`): vermelho com `TriangleAlert`, cancelado. Capturas tiradas depois do fim da animação de abertura. `*-confirm-destrutivo-bloquear.png`, `*-confirm-nao-destrutivo-desbloquear.png`, `*-confirm-destrutivo-excluir.png`.
- **V04.** `/users`: clique em "Configurar colunas", Esc. O foco volta ao gatilho; amostragem de 1,2 s (o atraso do tooltip é 300 ms) sem nenhum `role=tooltip`; `elementFromPoint` no centro de "Buscar" devolve o próprio botão "Buscar". Depois, o hover no gatilho abre o tooltip "Configurar colunas" e ele fecha quando o mouse sai (movimento em 15 passos). O A1 da rodada 9 está resolvido. `*-users-after-column-menu-esc.png`.
- **V05.** Contexto do Playwright com `locale: 'en-US'` e `timezoneId: 'America/Sao_Paulo'`; a página confirma `navigator.language = en-US` e `Intl` resolvido `en-US`. Usuários (colunas ocultas ligadas pelo menu de colunas), linha do admin: "Último acesso" mostra **`11/11/2026, 11:03`**; a mesma data com o locale do navegador daria `11/11/2026, 11:03 AM`. Auditoria, primeira linha: "Data/hora" **`11/11/2026, 11:04`** (API `createdAt 2026-11-11T14:04:26.041Z`), contra `11/11/2026, 11:04 AM` no locale do navegador. "Criado em" (só data) mostra `11/11/2026`, mas hoje é 11 de novembro, dia e mês iguais: o formato só-data não se distingue do `en-US` com o dado do banco descartável (criado hoje); o `03/31/2026` está coberto pelo teste de unidade `src/tests/lib/dateTime/dateFormatterLocale.test.ts` (verde no `check`). `enUS-users-dates.png`, `enUS-audit-dates.png`.
- **V06.** Viewport 390x844, `isMobile`, toque. "Alternar menu lateral" abre o `dialog` "Menu". (1) Tocar em "Usuários" vai para `/users` e o menu fecha. (2) Reaberto, tocar em "Usuários" estando em `/users` fecha. (3) Em Configurações, "Nome da aplicação" alterado (não salvo), menu aberto, tocar em "Usuários": aparece "Descartar as alterações?"; "Continuar editando" deixa a URL em `/settings` e **o menu continua aberto**; tocar de novo e "Descartar alterações" vai para `/users` e o menu fecha. Nada foi gravado em Configurações. `*-mobile-menu-open.png`, `*-mobile-guard.png`, `*-mobile-guard-continue.png`.
- **S01.** Story `Globais/Button`, `iframe.html?…&globals=theme:<X>`: sistema claro + Claro → `html.light`, fundo `oklch(1 0 0)`; sistema claro + Escuro → `html.dark`, `oklch(0.141 …)`; sistema escuro + Claro → `html.light`; sistema escuro + Escuro → `html.dark`. Pela barra do Storybook, sistema escuro: o botão "Theme" ("Escuro theme") alterna para "Claro theme" e o iframe vai de `dark` para `light` sem recarregar; de novo, volta a `dark`. O A2 da rodada 9 está resolvido. `sb-theme-*.png`.
- **S02.** Story `Formulário/RadioGroup › Vitrine`, grupo "Canal de contato" (opções E-mail, SMS, Notificação no aplicativo; SMS marcada). Um Tab entra no grupo pela opção marcada (SMS). Seta para baixo segurada: foco e marcação vão para "Notificação no aplicativo"; de novo, voltam a "E-mail" (laço); seta para cima: "Notificação no aplicativo". Tab sai do grupo. Nota de método: com `keyboard.press` (keydown e keyup no mesmo instante) o foco anda e a marcação não, porque o Radix só marca no foco que chega com a seta ainda pressionada e move o foco num `setTimeout`; uma pessoa segura a tecla alguns milissegundos, e o caso foi refeito com `keyboard.down`, espera do foco e `keyboard.up`. Não é defeito (o teste de unidade `radioGroup.test.tsx:86-113` documenta o mesmo). `*-sb-radiogroup-keyboard.png`.
- **S03.** Story `Formulário/MaskedInputField › Showcase`. Telefone: valor do servidor `48999998888` aparece `(48) 99999-8888`; digitado tecla a tecla `(48) 99999-8888`; tecla a mais com 11 dígitos ignorada; **colado** (Ctrl+V da área de transferência) `+55 48 99999-8888` → `(48) 99999-8888` e `+55 (48) 3333-4444` → `(48) 3333-4444`; apagar no meio: Backspace em `(48) 999|99-8888` → `(48) 9999-8888`, cursor em 7; Backspace logo depois do `-` apaga o dígito vizinho → `(48) 9999-8888`, cursor em 9; Delete em `(48) 9|9999-8888` → `(48) 9999-8888`, cursor em 6; digitar `1` no meio → `(48) 91999-8888`, cursor em 7. **Preenchido de uma vez** (`fill`, um evento `input` com `inputType: insertText`): `48999998888` e `(48) 99999-8888` → `(48) 99999-8888`; `+55 48 99999-8888`, `+5548999998888` e `048999998888` → **campo vazio**; com valor anterior, o preenchimento é ignorado e o valor antigo fica (B2). CPF: digitado `529.982.247-25`; colado `529.982.247-25`; colado com 13 dígitos → `529.982.247-25`; preenchido de uma vez → `529.982.247-25`; Backspace no meio → `529.822.472-5`. CNPJ: digitado e colado `11.222.333/0001-81`; colado com 16 dígitos → `11.222.333/0001-81`. CEP: digitado e colado `01310-100`; colado e preenchido com 9 dígitos (o caso do autofill de 2026-09-30) → `01310-100`. "CPF ou CNPJ": 11 dígitos → `529.982.247-25`, 14 → `52.998.224/7251-23`. `*-sb-masked-input.png`.
- **S04.** Story `Globais/FilterButtons › Showcase`, grupo "Visão": "Todos 128" com `aria-pressed=true`, os outros `false`; clique em "Ativos" passa o `true` para ele; Tab leva a "Convidados 12", Enter o seleciona; Tab e Espaço selecionam "Bloqueados 3". Sempre um só pressionado. `*-sb-filterbuttons.png`.
- **S05.** Story `Formulário/Checkbox › Vitrine`: antes, "Aceito os termos de uso" com `aria-describedby="terms-description"` e descrição acessível "Obrigatório — submeter sem marcar dispara a validação."; depois de "Validar", `aria-describedby="terms-description terms-error"`, `aria-invalid="true"` e descrição acessível (`toHaveAccessibleDescription`) com as duas frases, a do erro "Você precisa aceitar os termos.". `MaskedInputField` "Com erro": descrição acessível "Informe um CPF válido.", `aria-invalid="true"`. `RadioGroup` "Com erro": o `radiogroup` com `aria-describedby` no erro "Escolha um canal." e `aria-invalid="true"`; a opção "Mensal" ligada à descrição "Notificação enviada todo mês.". `*-sb-checkbox-description-error.png`.
- **S06.** Story `Globais/ConfirmDialog › Vitrine`: "Excluir registro?" filete `4px` `--destructive`, `lucide-triangle-alert`; "Publicar agora?" filete `4px` `--warning`, `lucide-circle-alert`; ícone `aria-hidden`, foco em "Cancelar", raio 24 px; Esc fecha. `*-sb-confirm-*.png`.

## 6. Bugs encontrados

Nenhuma regressão no e2e. Dois achados `normal`, os dois **da rodada 10** (código novo desta rodada), nenhum preexistente:

| Id  | Descrição                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Severidade | Âncora                                                                                               | Status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | No escuro, o card ficou **abaixo** do painel em que ele está: card `rgb(19,19,22)` sobre o painel `bg-muted/50` `rgb(24,24,26)`, 1,046:1 mais escuro. O "um passo acima do fundo" vale contra o `--background`, que só aparece no header; o mapa (`docs/mapa/pendencias-cobra.md`, item 9) e o `docs/conventions/theme.md:41-43` ("elevação no dark vem de `bg-card` mais claro") não consideraram o painel tingido da rodada 9 (`layout.tsx:56`). No claro o card fica acima do painel; no escuro, abaixo: a relação se inverte entre os temas. Legível (texto 17,70:1), só o degrau é o contrário do documentado.                                                                                                                                                                                                                                                                                                                                                   | normal     | `src/index.css:253`; `src/components/global/layout/layout.tsx:56`; `docs/conventions/theme.md:41-43` | aberto; **da rodada 10 (TPL-66), provado**: entre `66b1076` (antes da rodada) e `HEAD`, o único token de cor alterado em `src/index.css` é `--card` (0.24 → 0.19; os outros diffs são comentários do `--chart-*`), e o painel não mudou. No mesmo Chromium, o card de antes (0.24) renderiza `rgb(31,31,34)`, 1,078:1 **acima** do painel; o de agora, `rgb(19,19,22)`, 1,046:1 abaixo. Saída possível, para o dono decidir: medir o card contra o painel (`--card` acima de ~0.21) ou aceitar o card afundado como o padrão do escuro |
| B2  | Telefone preenchido **de uma vez** com código do país ou zero (`+55 48 99999-8888`, `+5548999998888`, `048999998888`) num único evento `input` com `inputType: insertText` é descartado em silêncio: campo vazio fica vazio, campo com valor fica com o antigo. A guarda "tecla a mais com 11 dígitos" (`isTyping && onlyDigits(target.value).length > 11`) trata como digitação qualquer `insertText`, inclusive o valor inteiro. Colar (Ctrl+V, `insertFromPaste`) funciona. O teste de unidade simula o autofill com `fireEvent.change`, sem `inputType`, e por isso não pega o caso (`maskedInputField.test.tsx:190-229`). Quem manda o valor inteiro como `insertText`: o `fill` do Playwright, IME e o "colar" pela sugestão do teclado de celular (commit de texto). O autofill do Chrome no desktop não foi reproduzível aqui (não há como acioná-lo pelo Playwright). Nenhum dado errado é gravado; nenhuma tela usa o componente ainda (só story e testes). | normal     | `src/components/global/form/maskedInputField.tsx:151-162`                                            | aberto; **da rodada 10 (TPL-64)**: `git cat-file -e 66b1076:src/components/global/form/maskedInputField.tsx` → "exists on disk, but not in '66b1076'"; único commit do arquivo é `91c8912`                                                                                                                                                                                                                                                                                                                                             |

Observações de método, sem defeito: (1) o tooltip do Radix fica aberto se o mouse sair do gatilho num único `mousemove` (ele fecha pela área de tolerância, que precisa de mais um movimento); com movimento em passos, como o de uma pessoa, fecha; (2) o `RadioGroup` com `keyboard.press` não marca (S02).

## 7. Critério para considerar pronto

- Casos `critico`: nenhum. O que impediria publicar seria E01 vermelho (fluxo principal), e ele está verde 70/70.
- `alto`: E01, V05 e S03 passaram no que provam; S03 carrega o B2 (`normal`).
- B1 e B2 são `normal`, da rodada 10, e não quebram função: podem seguir registrados. **Nenhum vermelho trava o push** por parte da suíte e da conferência; B1 é decisão de tema e B2 é ajuste de componente sem consumidor, os dois para o dono decidir.
- Pendências sem teste: `docs/conventions/theme.md:41` descreve o degrau contra o `--background`; se B1 for aceito como está, vale dizer ali que o card escuro fica abaixo do painel tingido.

## 8. Dado existente

A rodada não altera schema, migration nem dado do server. Não há fase de migração.

## 9. Ambiente de teste

| Processo             | Comando                                                                                                                                                                                                                                        | Porta | Como foi derrubado                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Banco descartável    | `docker exec db-local createdb -U admin temporary-3f88b4d3` (container `db-local`, `localhost:5432`, credenciais do `.env` do server, só o nome trocado)                                                                                       | 5432  | `docker exec db-local dropdb -U admin temporary-3f88b4d3`; conferido: `select count(*) from pg_database where datname='temporary-3f88b4d3'` = 0 |
| Migrations e seed    | `DATABASE_URL=postgresql://admin:***@localhost:5432/temporary-3f88b4d3 pnpm exec prisma migrate deploy` ("All migrations have been successfully applied") e `... pnpm exec prisma db seed` ("Seed concluído", `admin@admin.com` Administrador) |       |                                                                                                                                                 |
| server-template      | `DATABASE_URL=<temporário> PORT=8095 CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:4173,http://localhost:4174 pnpm run dev`                                                                                        | 8095  | `Stop-Process` nos PIDs do `node --watch src/server.ts`, do filho e do `cmd` pai, conferidos pela linha de comando                              |
| Vite do e2e          | subido pelo `webServer` do `playwright.config.ts:48-49` (`vite --port 4173 --strictPort`, `VITE_API_URL=http://localhost:8095/api`)                                                                                                            | 4173  | encerrado pelo próprio Playwright; 4173 livre depois                                                                                            |
| Vite da conferência  | `VITE_API_URL=http://localhost:8095/api pnpm exec vite --port 4174 --strictPort` (porta separada da 4173 do e2e)                                                                                                                               | 4174  | `Stop-Process` nos PIDs conferidos                                                                                                              |
| Storybook            | `pnpm exec storybook dev -p 6006 --no-open --quiet`                                                                                                                                                                                            | 6006  | `Stop-Process` nos PIDs conferidos                                                                                                              |
| Tentativa descartada | `server-template` na 8090, parado antes de qualquer spec (a 8090 é de outro projeto, ver seção 2)                                                                                                                                              | 8090  | `Stop-Process` nos 3 PIDs dele; o processo do outro projeto ficou intacto                                                                       |

```text
DATABASE_URL efetiva: postgresql://admin:***@localhost:5432/temporary-3f88b4d3
Host: localhost (container docker db-local, publicado na 5432) — local
Banco: temporary-3f88b4d3, criado nesta execução (openssl rand -hex 4)
Prova antes de qualquer escrita: pg_stat_activity com 1 conexão em temporary-3f88b4d3 (a do server da 8095);
  GET http://localhost:8095/health/ready -> {"status":"ok","database":"ok"}
Criação (uma vez):  docker exec db-local createdb -U admin temporary-3f88b4d3 + prisma migrate deploy + prisma db seed
Reset entre rodadas: não foi preciso; cada spec desfaz o que cria e o script de conferência exclui a pessoa que cria
Descarte:            docker exec db-local dropdb -U admin temporary-3f88b4d3  (0 conexões antes; pg_database = 0 depois)
```

- Trava de host respeitada: `VITE_API_URL=http://localhost:8095/api`, host `localhost`, aceito pelo `assertLocalApiUrl` (`e2e/helpers/apiHost.ts`) no `globalSetup`.
- Perfis: admin do seed (`admin@admin.com`, senha do seed `prisma/seed.ts`); gestor e pessoas dos specs criados pelo `globalSetup`/helpers e excluídos por eles; `blocked@admin.com` do seed no `loginErrors`. Na conferência, login pela tela com o admin do seed, uma vez por execução do script, e a sessão (cookie) reaproveitada nos contextos de tema, celular e `en-US`.
- Efeito em banco da conferência: a cada execução do `app.mjs`, uma pessoa "Pessoa Conferência <sufixo>" criada pela API (`POST /client/users` 201), bloqueada e desbloqueada pela tela (`PATCH` 200 e 200; linhas "Bloqueou/Desbloqueou o usuário" na `audit_logs`), excluída pela API (`DELETE` 200, `deletedAt` preenchido). Foram 7 execuções (as três primeiras pararam em seletor do próprio script; a sexta e a sétima repetiram tudo para a data da auditoria e para as capturas depois da animação); tudo saiu com o `dropdb`. Configurações: campo alterado e descartado, nada gravado.
- O dono: a 8080 (banco `server_template_local`) e o Vite 5173 não foram tocados; no fim, `/health/ready` da 8080 `ok` e 5173 `200`.
- Casos sem interface: nenhum novo na rodada.

## 10. Dúvidas abertas

1. B1: o degrau do card escuro deve ser medido contra o painel tingido (`bg-muted/50`) ou contra o `--background`? Leitura mais segura: contra o painel, que é o que fica atrás do card em toda tela protegida; com `--card` acima de ~0.21 o card volta a ficar acima do painel (o 0.24 de antes dava 1,078:1).
2. B2: a guarda do telefone deve valer só para `insertText` de **um** caractere? Leitura mais segura: tratar como digitação só quando o texto inserido tem um caractere (`event.nativeEvent.data?.length === 1`), e deixar o valor inteiro cair no corte do `55`/`0`, como a colagem.

## Portão de fechamento

1. **A suíte rodou, e em que escopo?** Sim. `loop`: não se aplica (nenhum spec e2e criado ou alterado na rodada; os itens da rodada foram conferidos pelos scripts). `fechamento`: `VITE_API_URL=http://localhost:8095/api pnpm run test:e2e` → `70 passed (2.6m)`, `exit=0`; saída colada na seção 11. Atalhos de preparação: os specs preparam pessoas, cargos e configuração pela API (`e2e/helpers/serverApi.ts`), como o `docs/testing-guide.md` define; criação pela tela em `e2e/users.spec.ts` ("cria um usuário…") e `e2e/roles.spec.ts` ("cria um cargo…"). A conferência criou a pessoa pela API (par pela tela: o mesmo teste de `users.spec.ts`) e bloqueou/desbloqueou pela tela.
2. **Cada selo `automatizado` tem teste nomeado?** E01: os 70 testes de `e2e/*.spec.ts`, nomeados na saída da seção 11 (a lista por arquivo está na seção 3). Os casos V e S não têm selo: são script de conferência, com a medida e a captura de cada um na seção 5.
3. **A app foi dirigida como uma pessoa dirige?** Sim. Login pela tela; telas abertas pelo menu "Administração" da sidebar (no celular, pelo botão "Alternar menu lateral" e toque); menu de colunas pelo clique; confirmações pelo clique no ícone da linha. Ciclo de vida: "Pessoa Conferência <sufixo>" criada (API, 201), editada pela tela (bloquear e desbloquear com a confirmação; efeito no status da linha e nas linhas "Bloqueou/Desbloqueou o usuário" da `audit_logs`, conferidas por `psql`) e excluída (API, 200; `deletedAt` preenchido no banco). Nos specs, os ciclos de usuário e cargo são os de E01.
4. **De onde veio cada login?** Admin: `admin@admin.com` do seed do server (`prisma db seed`, senha do `prisma/seed.ts`), na tela de login. Gestor e pessoas dos specs: criados pelo `globalSetup` e pelos helpers da suíte, com senha definida no próprio cadastro pela API, e excluídos no fim. Bloqueado: `blocked@admin.com` do seed. Nenhum perfil faltou.
5. **O banco temporário foi apagado?** Sim: `temporary-3f88b4d3`, com `docker exec db-local dropdb -U admin temporary-3f88b4d3`; `pg_database` devolveu 0.

## 11. Saída do runner (`fechamento`)

```text
[WebServer] $ vite --port 4173 --strictPort
Running 70 tests using 1 worker
  ok  1 [chromium] › e2e\account.spec.ts:103:3 › Minha conta › Perfil: pré-preenche pelo servidor, salva só o que mudou e atualiza a sessão (2.8s)
  ok  2 [chromium] › e2e\account.spec.ts:148:3 › Minha conta › Perfil: tempo acima do limite da empresa é recusado no campo, sem toast (1.5s)
  ok  3 [chromium] › e2e\account.spec.ts:187:3 › Minha conta › Perfil: trocar de aba com edição não salva pede confirmação (2.5s)
  ok  4 [chromium] › e2e\account.spec.ts:223:3 › Minha conta › Segurança: troca a senha (a atual errada marca o campo) e volta à original (3.8s)
  ok  5 [chromium] › e2e\account.spec.ts:277:3 › Minha conta › o que não tem servidor mostra o aviso de demonstração (3.7s)
  ok  6 [chromium] › e2e\auditLogs.spec.ts:93:3 › Auditoria › lista os registros de auditoria, o mais recente primeiro (1.4s)
  ok  7 [chromium] › e2e\auditLogs.spec.ts:102:3 › Auditoria › filtra por conteúdo: o que casa aparece, o que não casa some (1.8s)
  ok  8 [chromium] › e2e\auditLogs.spec.ts:116:3 › Auditoria › filtra por módulo (multiSelect) mantendo só o que casa (2.2s)
  ok  9 [chromium] › e2e\auditLogs.spec.ts:135:3 › Auditoria › pagina a partir do primeiro registro (1.9s)
  ok 10 [chromium] › e2e\auditLogs.spec.ts:149:3 › Auditoria › abre o detalhe com o que mudou e os dados técnicos recolhidos (2.1s)
  ok 11 [chromium] › e2e\auditLogs.spec.ts:181:3 › Auditoria › evento sem campos alterados mostra o estado vazio do de→para (1.9s)
  ok 12 [chromium] › e2e\auditLogs.spec.ts:225:3 › Auditoria — filtro por usuário › só aparece com a permissão de ver usuários, e filtra pelo autor (4.2s)
  ok 13 [chromium] › e2e\auditLogs.spec.ts:315:3 › Atividade do usuário › mostra a linha do tempo do usuário, paginada, a mais recente primeiro (1.5s)
  ok 14 [chromium] › e2e\columnVisibility.spec.ts:16:3 › Tabela — mostrar e ocultar colunas › oculta uma coluna e mantém a escolha após recarregar (3.4s)
  ok 15 [chromium] › e2e\columnVisibility.spec.ts:43:3 › Tabela — mostrar e ocultar colunas › abrir o menu de colunas mantém a cor do cabeçalho (1.6s)
  ok 16 [chromium] › e2e\columnVisibility.spec.ts:57:3 › Tabela — mostrar e ocultar colunas › ocultar colunas não altera os filtros da URL (1.9s)
  ok 17 [chromium] › e2e\home.spec.ts:76:3 › Home › números de usuários e atividade recente reais (1.4s)
  ok 18 [chromium] › e2e\home.spec.ts:107:3 › Home › o que não tem rota mostra o aviso; os atalhos abrem telas reais (1.9s)
  ok 19 [chromium] › e2e\idleTimeout.spec.ts:58:3 › Tempo de inatividade da sessão › segue a configuração da empresa gravada no preparo (1.5s)
  ok 20 [chromium] › e2e\login.spec.ts:11:3 › Login › renderiza o formulário de login (908ms)
  ok 21 [chromium] › e2e\login.spec.ts:20:3 › Login › valida e-mail inválido antes de enviar (910ms)
  ok 22 [chromium] › e2e\login.spec.ts:28:3 › Login › navega para a tela de criar conta (868ms)
  ok 23 [chromium] › e2e\loginErrors.spec.ts:13:3 › Login recusado pelo server real › senha errada mostra "Credenciais inválidas." (1.1s)
  ok 24 [chromium] › e2e\loginErrors.spec.ts:24:3 › Login recusado pelo server real › conta bloqueada mostra "Sua conta está bloqueada." (1.2s)
  ok 25 [chromium] › e2e\roles.spec.ts:204:5 › Cargos › como admin › lista os cargos do servidor pela busca, com as contagens (2.3s)
  ok 26 [chromium] › e2e\roles.spec.ts:229:5 › Cargos › como admin › o item "Cargos" do menu abre a lista (1.7s)
  ok 27 [chromium] › e2e\roles.spec.ts:246:5 › Cargos › como admin › cria um cargo: marcar uma escrita marca e trava a leitura (2.0s)
  ok 28 [chromium] › e2e\roles.spec.ts:284:5 › Cargos › como admin › recusa o nome repetido com o toast do servidor, um só (1.5s)
  ok 29 [chromium] › e2e\roles.spec.ts:298:5 › Cargos › como admin › edita as permissões e o servidor guarda a expansão para leitura (2.5s)
  ok 30 [chromium] › e2e\roles.spec.ts:339:5 › Cargos › como admin › vincula um usuário pela aba "Usuários", com a busca do servidor (3.2s)
  ok 31 [chromium] › e2e\roles.spec.ts:383:5 › Cargos › como admin › o vínculo feito na tela de usuários aparece no cargo, sem recarregar (3.8s)
  ok 32 [chromium] › e2e\roles.spec.ts:414:5 › Cargos › como admin › copia um cargo pela lista e abre a cópia (1.8s)
  ok 33 [chromium] › e2e\roles.spec.ts:432:5 › Cargos › como admin › exclui com confirmação, e recusa o cargo com usuários vinculados (3.6s)
  ok 34 [chromium] › e2e\roles.spec.ts:464:5 › Cargos › como admin › o Administrador aparece só para leitura, sem ações (1.7s)
  ok 35 [chromium] › e2e\roles.spec.ts:496:5 › Cargos › como gestor › a permissão que o gestor não tem aparece desabilitada, com a explicação (1.2s)
  ok 36 [chromium] › e2e\roles.spec.ts:512:5 › Cargos › como gestor › o servidor recusa copiar um cargo com permissão que o gestor não tem (1.5s)
  ok 37 [chromium] › e2e\roles.spec.ts:538:5 › Cargos › como gestor › editar o próprio cargo muda na hora o que a tela oferece (1.7s)
[WebServer] 10:44:09 [vite] (client) [console.error] Error: Falha de render simulada pelo e2e
[WebServer]     at SettingsPage (http://localhost:4173/src/screens/settings/index.tsx:3:11)
[WebServer]     at Object.react_stack_bottom_frame (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:14140:12)
[WebServer]     at renderWithHooks (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:4398:19)
[WebServer]     at updateFunctionComponent (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:5773:16)
[WebServer]     at beginWork (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:6389:20)
[WebServer]     at runWithFiberInDEV (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:942:66)
[WebServer]     at performUnitOfWork (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:9146:92)
[WebServer]     at workLoopSync (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:9042:37)
[WebServer]     at renderRootSync (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:9026:6)
[WebServer]     at performWorkOnRoot (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:8713:27)
[WebServer]
[WebServer] The above error occurred in the <SettingsPage> component.
[WebServer]
[WebServer] React will try to recreate this component tree from scratch using the error boundary you provided, CatchBoundary.
[WebServer]
  ok 38 [chromium] › e2e\routeError.spec.ts:56:3 › Tela de erro por rota: telas protegidas › o erro no render troca só o conteúdo, e "Tentar novamente" desenha a tela de novo (1.2s)
[WebServer] 10:44:11 [vite] (client) [console.error] Error: Falha de render simulada pelo e2e
[WebServer]     at SettingsPage (http://localhost:4173/src/screens/settings/index.tsx:3:11)
[WebServer]     at Object.react_stack_bottom_frame (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:14140:12)
[WebServer]     at renderWithHooks (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:4398:19)
[WebServer]     at updateFunctionComponent (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:5773:16)
[WebServer]     at beginWork (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:6389:20)
[WebServer]     at runWithFiberInDEV (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:942:66)
[WebServer]     at performUnitOfWork (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:9146:92)
[WebServer]     at workLoopSync (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:9042:37)
[WebServer]     at renderRootSync (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:9026:6)
[WebServer]     at performWorkOnRoot (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:8713:27)
[WebServer]
[WebServer] The above error occurred in the <SettingsPage> component.
[WebServer]
[WebServer] React will try to recreate this component tree from scratch using the error boundary you provided, CatchBoundary.
[WebServer]
  ok 39 [chromium] › e2e\routeError.spec.ts:82:3 › Tela de erro por rota: telas protegidas › ir para outra tela pelo menu limpa o erro (1.7s)
[WebServer] 10:44:12 [vite] (client) [console.error] Error: Falha de render simulada pelo e2e
[WebServer]     at LoginScreen (http://localhost:4173/src/screens/session/login.tsx:3:11)
[WebServer]     at Object.react_stack_bottom_frame (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:14140:12)
[WebServer]     at renderWithHooks (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:4398:19)
[WebServer]     at updateFunctionComponent (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:5773:16)
[WebServer]     at beginWork (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:6389:20)
[WebServer]     at runWithFiberInDEV (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:942:66)
[WebServer]     at performUnitOfWork (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:9146:92)
[WebServer]     at workLoopSync (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:9042:37)
[WebServer]     at renderRootSync (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:9026:6)
[WebServer]     at performWorkOnRoot (http://localhost:4173/node_modules/.vite/deps/react-dom_client.js?v=4795ac44:8713:27)
[WebServer]
[WebServer] The above error occurred in the <LoginScreen> component.
[WebServer]
[WebServer] React will try to recreate this component tree from scratch using the error boundary you provided, CatchBoundary.
[WebServer]
[WebServer] 10:44:12 [vite] (client) [console.warn] Warning: Error in route match: __root__/
  ok 40 [chromium] › e2e\routeError.spec.ts:101:3 › Tela de erro por rota: rotas públicas › o erro no render do login mostra a tela de erro sem o menu, e "Tentar novamente" desenha de novo (999ms)
  ok 41 [chromium] › e2e\session.spec.ts:47:3 › Sessão contra o server real › abrir o app sem sessão vai ao login, sem toast de erro (1.1s)
  ok 42 [chromium] › e2e\session.spec.ts:64:3 › Sessão contra o server real › o admin entra, vê Usuários, Cargos, Auditoria e Configurações, e recarregar mantém a sessão (2.9s)
  ok 43 [chromium] › e2e\session.spec.ts:89:5 › Sessão contra o server real › com a sessão aberta › sair volta ao login, e a rota protegida depois redireciona para o login (2.2s)
  ok 44 [chromium] › e2e\settings.spec.ts:86:3 › Configurações › exibe os grupos e só as configurações do servidor (1.0s)
  ok 45 [chromium] › e2e\settings.spec.ts:109:3 › Configurações › grava as alterações numa chamada só, com um toast, e o valor fica no servidor (1.8s)
  ok 46 [chromium] › e2e\settings.spec.ts:163:3 › Configurações › marca o campo que o servidor recusou, sem toast e sem gravar (1.2s)
  ok 47 [chromium] › e2e\settings.spec.ts:200:3 › Configurações › recusa apagar a auditoria antes de anonimizá-la, com toast, sem gravar (1.2s)
  ok 48 [chromium] › e2e\settings.spec.ts:223:3 › Configurações › descartar reverte a alteração (1.1s)
  ok 49 [chromium] › e2e\unsavedChanges.spec.ts:72:3 › Edição não salva › menu lateral: "Continuar editando" fica com a edição, "Descartar alterações" sai (2.3s)
  ok 50 [chromium] › e2e\unsavedChanges.spec.ts:97:3 › Edição não salva › voltar do navegador com edição pergunta; ficar mantém a URL e a edição (2.9s)
  ok 51 [chromium] › e2e\unsavedChanges.spec.ts:124:3 › Edição não salva › dois voltar com a pergunta aberta: uma pergunta só, e ficar mantém URL e edição (2.9s)
  ok 52 [chromium] › e2e\unsavedChanges.spec.ts:158:3 › Edição não salva › Ctrl+clique no menu abre a tela em nova guia, sem perguntar (1.8s)
  ok 53 [chromium] › e2e\unsavedChanges.spec.ts:179:3 › Edição não salva › fechar a aba com edição pede o aviso nativo; sem edição, fecha direto (2.3s)
  ok 54 [chromium] › e2e\unsavedChanges.spec.ts:209:3 › Edição não salva › "Sair" com edição pergunta antes: "Continuar editando" fica logado na edição, "Descartar alterações" sai (2.6s)
  ok 55 [chromium] › e2e\unsavedChanges.spec.ts:244:3 › Edição não salva › depois de salvar, o menu sai sem perguntar (1.7s)
  ok 56 [chromium] › e2e\users.spec.ts:147:5 › Usuários › como admin › lista do servidor, com cargos e status derivado de isActive (1.5s)
  ok 57 [chromium] › e2e\users.spec.ts:170:5 › Usuários › como admin › ordena por status pelo cabeçalho, no servidor (1.9s)
  ok 58 [chromium] › e2e\users.spec.ts:200:5 › Usuários › como admin › id de cargo fora do formato na URL sai do filtro, sem toast (1.6s)
  ok 59 [chromium] › e2e\users.spec.ts:220:5 › Usuários › como admin › a aba "Sessões" do detalhe mostra o aviso de demonstração (1.3s)
  ok 60 [chromium] › e2e\users.spec.ts:230:5 › Usuários › como admin › filtra por status pelos campos: o que casa aparece, o que não casa some (2.1s)
  ok 61 [chromium] › e2e\users.spec.ts:245:5 › Usuários › como admin › filtra por cargo e por período de cadastro no servidor (3.4s)
  ok 62 [chromium] › e2e\users.spec.ts:269:5 › Usuários › como admin › cria um usuário e abre o detalhe dele na aba "Cargos" (2.3s)
  ok 63 [chromium] › e2e\users.spec.ts:296:5 › Usuários › como admin › recusa o e-mail já cadastrado com o toast do servidor (1.5s)
  ok 64 [chromium] › e2e\users.spec.ts:310:5 › Usuários › como admin › edita o cadastro no detalhe e o valor fica no servidor (2.5s)
  ok 65 [chromium] › e2e\users.spec.ts:339:5 › Usuários › como admin › troca o cargo na aba "Cargos" e mostra as permissões dele (3.1s)
  ok 66 [chromium] › e2e\users.spec.ts:366:5 › Usuários › como admin › bloqueia e desbloqueia pela lista, com confirmação (2.5s)
  ok 67 [chromium] › e2e\users.spec.ts:388:5 › Usuários › como admin › exclui pela lista, com confirmação (2.2s)
  ok 68 [chromium] › e2e\users.spec.ts:406:5 › Usuários › como admin › a recusa do servidor aparece num toast só, sem toast da tela (2.1s)
  ok 69 [chromium] › e2e\users.spec.ts:432:5 › Usuários › como gestor › o servidor recusa dar cargo com permissão que o autor não tem (2.1s)
  ok 70 [chromium] › e2e\userWithoutRole.spec.ts:31:3 › Usuário sem cargo › entra e não vê Usuários, Cargos, Auditoria nem Configurações, nem os blocos deles na home (1.8s)
  70 passed (2.6m)
exit=0
```

## 12. Reexecução pós-correção (B1 e B2)

Escopo `pos-correcao`: só os dois achados, sobre o HEAD `daa46d8` (TPL-71 `02e6e65`, TPL-72 `daa46d8`). O e2e inteiro não foi repetido (fica o 70/70 da seção 11): a correção tocou só o token `--card` e o `MaskedInputField`, que nenhuma tela usa. Nada em `src/` foi editado; sem commit, sem push. Scripts, logs e capturas em `C:\Users\admin\AppData\Local\Temp\claude\0a63b47506d5ac85\2fb4e0b5-aae0-4939-89c8-e6dca2eb3994\scratchpad\reexec\` (`b1.mjs`, `b2.mjs`, `b2comp.mjs`, `*.log`, `shots\`).

| Item                                       | Onde rodou                                                                                                                          | Comando                                                                                  | Resultado                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| B1                                         | Vite do dono (5173) com a API do dono (8080), só leitura: login pela tela com `admin@admin.com`, Usuários pelo menu "Administração" | `node b1.mjs`                                                                            | `exit=0`; **resolvido**                                                                       |
| B2                                         | Storybook do HEAD na **6140** (`pnpm exec storybook dev -p 6140 --no-open --quiet`)                                                 | `node b2.mjs` e `node b2comp.mjs`                                                        | `exit=0`; **resolvido** no que o B2 descreveu; **regressão nova B3** e **achado B4** (abaixo) |
| B2 antes da correção (prova de atribuição) | Storybook do `a50e9c5` numa worktree temporária (`node_modules` por junção), na **6141**                                            | `SB=http://localhost:6141 node b2.mjs` e `SB=http://localhost:6141 node b2comp.mjs`      | `exit=0`; mesmos casos, para comparar                                                         |
| Teste de unidade do componente             | local                                                                                                                               | `pnpm exec vitest run src/tests/globais/form/maskedInputField/maskedInputField.test.tsx` | `34 passed`, `exit=0`                                                                         |

### B1: card escuro contra o painel

Medida: a cor mais frequente dos pixels da captura (1440x900, Chromium) dentro do retângulo de cada superfície; no painel, excluídos os cards e todo descendente com fundo opaco. Razão WCAG 2.x.

| Tema, tela       | Card               | Painel `bg-muted/50` | Card x painel                | Header (`--background`) | Card x header | Sidebar            | Card x sidebar |
| ---------------- | ------------------ | -------------------- | ---------------------------- | ----------------------- | ------------- | ------------------ | -------------- |
| escuro, Usuários | `rgb(31,31,34)`    | `rgb(24,24,27)`      | **1,078:1, card mais claro** | `rgb(9,9,11)`           | 1,21:1        | `rgb(24,24,27)`    | 1,078:1        |
| escuro, Início   | `rgb(31,31,34)`    | `rgb(24,24,26)`      | **1,078:1, card mais claro** | `rgb(9,9,11)`           | 1,21:1        | `rgb(24,24,27)`    | 1,078:1        |
| claro, Usuários  | `rgb(255,255,255)` | `rgb(249,249,250)`   | 1,052:1, card mais claro     | `rgb(255,255,255)`      | 1,00          | `rgb(250,250,250)` | 1,044:1        |
| claro, Início    | `rgb(255,255,255)` | `rgb(249,249,250)`   | 1,052:1, card mais claro     | `rgb(255,255,255)`      | 1,00          | `rgb(250,250,250)` | 1,044:1        |

Computado no escuro: `--card oklch(0.24 0.006 285.885)` (`src/index.css:254`), painel `oklab(0.274 … / 0.5)` (`--muted` a 50%, `src/components/global/layout/layout.tsx:56`). Antes: card `rgb(19,19,22)`, 1,046:1 **abaixo** do painel; agora 1,078:1 **acima**, na mesma direção do claro e igual ao que o comentário do token declara (1,08). Sidebar e painel no mesmo tom (1,00), como a decisão 5 registrou. Capturas: `shots\dark-users-card-painel.png`, `shots\dark-home-card-painel.png`, `shots\light-users-card-painel.png`, `shots\light-home-card-painel.png`. **B1 fechado.** Fora do recorte, não medido: o TPL-71 deixou o `--popover` (0.24) igual ao card, separado só por borda e sombra (comentário em `src/index.css:246-253`).

### B2: telefone inteiro num único `insertText`

`fill` do Playwright e `keyboard.insertText` (um evento `input` com `inputType: insertText` e `data` com o número inteiro, registrado no próprio campo), story `Formulário/MaskedInputField › Showcase`, campo "Telefone":

| Caso                                                                                                                   | Antes (`a50e9c5`)                                    | Agora (`daa46d8`)                    |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------ |
| vazio + `+55 48 99999-8888`, `+5548999998888`, `048999998888` (fill e insertText)                                      | campo vazio                                          | **`(48) 99999-8888`**                |
| vazio + `+55 (48) 3333-4444`                                                                                           | campo vazio                                          | **`(48) 3333-4444`**                 |
| `(48) 3333-4444` + fill `048999998888`                                                                                 | fica `(48) 3333-4444`                                | **`(48) 99999-8888`**                |
| `(48) 99999-8888` + fill `+5548777776666`                                                                              | fica o antigo                                        | **`(48) 77777-6666`**                |
| tecla a mais no fim sobre `(55) 99999-8888` e `(48) 99999-8888`; no meio sobre `(55) 99999-8888`                       | ignorada                                             | ignorada                             |
| composição (CDP `Input.imeSetComposition` + `Input.insertText`), vazio + `048999998888` e `+55 48 99999-8888` inteiros | `(48) 99999-8888`                                    | `(48) 99999-8888`                    |
| composição de **um** dígito a mais sobre `(55) 99999-8888`                                                             | **`(99) 99988-8877`** (o DDD `55` cortado como país) | **ignorado**, fica `(55) 99999-8888` |
| composição de um dígito a mais sobre `(48) 99999-8888`                                                                 | ignorado                                             | ignorado                             |

**B2 fechado** no que descreveu; e a composição de um dígito a mais com DDD 55, que antes trocava o número, agora é ignorada. Captura: `shots\light-sb-masked-phone-reexec.png` (e `-antes.png`). Sem defeito: `0 48 3333-4444` (11 dígitos) vira `(04) 83333-4444` antes e depois, pela regra documentada em `src/lib/masks/phone.ts:6-10` (com onze dígitos ou menos nada é cortado).

### Achados novos

| Id  | Descrição                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Severidade | Âncora                                                                                                         | Status                                                                                                                             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| B3  | **Regressão do TPL-72.** Trocar um telefone de 11 dígitos por um valor de **12** dígitos de uma vez (Ctrl+A e Ctrl+V, ou `fill`) é descartado em silêncio: `(48) 99999-8888` + colar `048777776666` fica `(48) 99999-8888` (antes do TPL-72: `(48) 77777-6666`); + colar `+55 48 3333-4444` fica o antigo (antes: `(48) 3333-4444`). A trava nova trata como "tecla a mais" toda mudança que acrescenta exatamente um dígito e passa de onze, sem olhar se o valor inteiro foi trocado. Com 13 dígitos (`+55 48 77777-6666`) a colagem funciona. O `fill` de 12 sobre 11 também segue descartado (já era, parte do B2). Nenhum dado errado é gravado; nenhuma tela usa o componente. Para o dono decidir: limitar a trava ao caso em que os dígitos anteriores continuam todos no valor novo, ou ao `data` de um caractere. | normal     | `src/components/global/form/maskedInputField.tsx:163-170`                                                      | aberto; **da correção TPL-72**, provado ao vivo nos dois Storybooks (6141 antes, 6140 agora)                                       |
| B4  | Composição (IME) **dígito a dígito** grava dígito duplicado no passo em que a máscara acrescenta pontuação: CEP `01310100` vira `01310-110`; telefone `48999998888` vira `(48) 99999-9988`; `5548999998888` vira `(55) 44899-9999`. Um `<input>` comum injetado na mesma página, com a mesma sequência CDP, fica com os dígitos certos, então não é artefato do protocolo: o valor reformatado no meio de uma composição ativa desloca o trecho que o IME confirma. Reproduzido só pelo CDP (`Input.imeSetComposition` + `Input.insertText` por dígito), não num aparelho; teclado de celular costuma confirmar dígito sem compor, mas se um compuser, o número **gravado** sai errado (confirmado em aparelho, sobe para `alto`).                                                                                          | normal     | `src/components/global/form/maskedInputField.tsx:149-210` (o `handleChange` não distingue composição em curso) | aberto; **preexistente ao TPL-72, da rodada 10 (TPL-64)**: mesmo resultado no CEP antes e depois; o TPL-72 não mexeu nesse caminho |

### Ambiente desta reexecução

- Vite 5173 e API 8080 do dono: usados só para leitura (login e listas); não derrubados. No fim, 5173 `200` e `/health/ready` da 8080 `{"status":"ok","database":"ok"}`. O login grava a sessão e a linha de auditoria de entrada no banco do dono, como qualquer login.
- Storybooks 6140 e 6141: derrubados por `taskkill /T /F` nas árvores conferidas pela linha de comando; nenhuma das duas portas ouvindo depois.
- Worktree do `a50e9c5`: a junção do `node_modules` foi desfeita com `rmdir` antes do `git worktree remove --force` (o `node_modules` do repositório seguiu intacto) e `git worktree list` mostra só a árvore principal.
- Banco descartável: nenhum criado nesta reexecução (nenhuma escrita de teste).

### Portão de fechamento (reexecução)

1. **A suíte rodou, e em que escopo?** `pos-correcao`: scripts de conferência `b1.mjs` (5173/8080), `b2.mjs` e `b2comp.mjs` (Storybook 6140 e, para comparar, 6141), todos `exit=0`; teste de unidade do componente `34 passed`. O `fechamento` segue o 70/70 da seção 11, não repetido a pedido.
2. **Cada selo `automatizado` tem teste nomeado?** Nenhum selo novo: B1 e B2 são conferência por script, com medida e captura acima. O teste de unidade cobre o B2 (`maskedInputField.test.tsx:210`, `:224`, `:312`, `:327`, `:343`), mas nenhum caso troca um valor de 11 dígitos por um de 12 (B3) nem compõe dígito a dígito (B4).
3. **A app foi dirigida como uma pessoa dirige?** B1: login pela tela, Usuários e Início pelo menu. B2: digitação por tecla, colagem pela área de transferência, preenchimento de uma vez e composição pelo CDP.
4. **De onde veio cada login?** `admin@admin.com` / `123123123`, dado no pedido, contra a API do dono.
5. **O banco temporário foi apagado?** Não houve banco temporário nesta reexecução; o `temporary-3f88b4d3` da execução anterior segue apagado.

## 13. Reexecução pós-correção 2 (B3 e B4)

Escopo `pos-correcao`: só os achados B3 e B4 da seção 12, sobre o TPL-73 (`4a92a2b`, e o `d6b7ab5` que entrou durante a reexecução, só a formatação do prettier numa linha do componente: `git diff 4a92a2b d6b7ab5` junta a declaração do `displayValue` em uma linha), mais a regressão dirigida do B2. O e2e inteiro não foi repetido (fica o 70/70 da seção 11): o TPL-73 tocou só `src/components/global/form/maskedInputField.tsx` e o teste dele, e nenhuma tela usa o componente. Nada em `src/` foi editado; sem commit, sem push. Scripts, logs e captura em `C:\Users\admin\AppData\Local\Temp\claude\0a63b47506d5ac85\2fb4e0b5-aae0-4939-89c8-e6dca2eb3994\scratchpad\reexec2\` (`b3b4.mjs`, `teclado.mjs`, `*.log`, `shots\light-sb-masked-reexec2.png`).

| Item                           | Onde rodou                                                                                                                                                     | Comando                                                                                  | Resultado             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------- |
| B3, B4 e regressão             | Storybook do HEAD na **6150** (`pnpm exec storybook dev -p 6150 --no-open --quiet`), story `Formulário/MaskedInputField › Showcase`, card "As quatro máscaras" | `node b3b4.mjs`                                                                          | `exit=0`; 23 casos    |
| Controle do telefone com `55`  | mesmo Storybook                                                                                                                                                | `node teclado.mjs`                                                                       | `exit=0`              |
| Teste de unidade do componente | local                                                                                                                                                          | `pnpm exec vitest run src/tests/globais/form/maskedInputField/maskedInputField.test.tsx` | `40 passed`, `exit=0` |

Cada caso registra, no próprio campo, os eventos `input` (`inputType` e `data`), `compositionstart`, `compositionend` e `blur`, para provar qual caminho a entrada percorreu.

### B3: colar 12 dígitos por cima de um telefone de 11 selecionado

Campo "Telefone" com `(48) 99999-8888` digitado tecla a tecla; Ctrl+A e Ctrl+V pela área de transferência (evento `insertFromPaste`), e o `fill` (um `insertText` com o valor inteiro) para comparar:

| Caso                                         | Seção 12 (`daa46d8`)   | Agora (TPL-73)                               |
| -------------------------------------------- | ---------------------- | -------------------------------------------- |
| colar `+55 48 9999-8888` (12 dígitos)        | fica `(48) 99999-8888` | **`(48) 9999-8888`**                         |
| colar `048777776666` (12)                    | fica `(48) 99999-8888` | **`(48) 77777-6666`**                        |
| colar `+55 48 3333-4444` (12)                | fica `(48) 99999-8888` | **`(48) 3333-4444`**                         |
| colar `+55 48 77777-6666` (13)               | `(48) 77777-6666`      | `(48) 77777-6666`                            |
| colar `+55 48 99999-8888` (13, mesmo número) | `(48) 99999-8888`      | `(48) 99999-8888`                            |
| `fill` `+55 48 9999-8888` e `048777776666`   | fica o antigo          | **`(48) 9999-8888`** e **`(48) 77777-6666`** |

**B3 fechado**: a trava agora só vale para `insertText` de até um caractere ou `insertCompositionText` (`src/components/global/form/maskedInputField.tsx:174-182`). O teste de unidade novo cobre a colagem de 12 sobre 11 (`maskedInputField.test.tsx:312`).

### B4: composição (IME) dígito a dígito e foco tirado no meio

Pelo CDP, cada dígito como `Input.imeSetComposition` seguido de `Input.insertText` (eventos por dígito: `compositionstart`, `insertCompositionText`, `compositionend`). Valor do campo depois de cada dígito:

| Campo, dígitos           | Seção 12          | Agora                                                                                                                                                                                                                               |
| ------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CEP `01310100`           | `01310-110`       | **`01310-100`** (passos: `0`, `01`, `013`, `0131`, `01310`, `01310-1`, `01310-10`, `01310-100`)                                                                                                                                     |
| CPF `52998224725`        | não medido        | **`529.982.247-25`** (passos sem dígito repetido; a pontuação entra em `529.9`, `529.982.2`, `529.982.247-2`)                                                                                                                       |
| Telefone `48999998888`   | `(48) 99999-9988` | **`(48) 99999-8888`**                                                                                                                                                                                                               |
| Telefone `5548999998888` | `(55) 44899-9999` | `(55) 48999-9988`, igual ao mesmo número digitado tecla a tecla (`teclado.mjs`: `(55) 48999-9988`): com 11 dígitos e DDD `55`, o 12º e o 13º são "tecla a mais" e ficam de fora, pela regra do B2. Sem dígito duplicado nem trocado |

Foco tirado com a composição aberta (`Input.imeSetComposition` crescendo, sem confirmar; o Chromium dispara `compositionend` e depois `blur`):

| Caso                                                            | Durante a composição | Depois do blur              |
| --------------------------------------------------------------- | -------------------- | --------------------------- |
| CEP compondo `013101`, clique no campo CNPJ                     | `013101` (cru)       | **`01310-1`**               |
| CPF compondo `5299822`, Tab                                     | `5299822` (cru)      | **`529.982.2`**             |
| CPF compondo `5299822`, `blur()` programático                   | `5299822` (cru)      | **`529.982.2`**             |
| CEP com `013` confirmados e `101` em composição, clique no CNPJ | `013101`             | **`01310-1`**               |
| CEP depois do blur acima: volta ao campo, End, digita `00`      | —                    | `01310-1` → **`01310-100`** |

Fora da composição, o que o campo mostra sai do valor do formulário (`composingText ?? apply(mask, field.value)`, `src/components/global/form/maskedInputField.tsx:133`), então o mascarado depois do blur é o valor gravado, não só o texto da tela. **B4 fechado** no Chromium pelo CDP; segue não reproduzido em aparelho com IME real (mesmo limite da seção 12). Testes de unidade novos: `maskedInputField.test.tsx:334` (CEP e CPF dígito a dígito) e `:364` (blur no meio da composição).

### Regressão dirigida

| Caso                                                                          | Resultado                        |
| ----------------------------------------------------------------------------- | -------------------------------- |
| tecla a mais no fim sobre `(55) 99999-8888` (`insertText` `"7"`)              | ignorada, fica `(55) 99999-8888` |
| tecla a mais no meio sobre `(55) 99999-8888`                                  | ignorada, fica `(55) 99999-8888` |
| composição de um dígito a mais sobre `(55) 99999-8888`                        | ignorada, fica `(55) 99999-8888` |
| tecla a mais no fim sobre `(48) 99999-8888`                                   | ignorada                         |
| `keyboard.insertText` `+55 48 99999-8888` e `+5548999998888`, campo vazio     | **`(48) 99999-8888`**            |
| `keyboard.insertText` `+55 48 3333-4444`, campo vazio                         | **`(48) 3333-4444`**             |
| `keyboard.insertText` `+55 48 77777-6666` sobre `(48) 99999-8888` selecionado | **`(48) 77777-6666`**            |

Sem regressão. Achados novos: nenhum. Captura do estado final: `shots\light-sb-masked-reexec2.png`.

### Ambiente desta reexecução

- Storybook 6150: subido em segundo plano, log em `reexec2\sb6150.log`; derrubado por `taskkill /T /F` na árvore conferida pela linha de comando (`pnpm exec storybook dev -p 6150` e o `node … storybook\dist\bin\dispatcher.js`); depois, 6150 sem ninguém ouvindo e nenhum processo com essa linha de comando.
- Vite 5173 e API 8080 do dono: não usados e não derrubados; no fim, 5173 `200` e `/health/ready` da 8080 `{"status":"ok","database":"ok"}`.
- Banco descartável: nenhum criado (nenhuma escrita em banco; tudo no Storybook).

### Portão de fechamento (reexecução 2)

1. **A suíte rodou, e em que escopo?** `pos-correcao`: `node b3b4.mjs` e `node teclado.mjs` contra o Storybook 6150, os dois `exit=0`; teste de unidade do componente `40 passed`, `exit=0`. O `fechamento` segue o 70/70 da seção 11, não repetido: a correção não tocou código compartilhado por tela.
2. **Cada selo `automatizado` tem teste nomeado?** Nenhum selo novo: B3 e B4 são conferência por script, com o valor de cada caso acima. Os testes de unidade do TPL-73 cobrem os dois (`maskedInputField.test.tsx:312`, `:334`, `:364`) e rodaram verdes aqui.
3. **A app foi dirigida como uma pessoa dirige?** Colagem pela área de transferência com Ctrl+A e Ctrl+V, digitação por tecla, preenchimento de uma vez, composição pelo CDP e foco tirado por clique, Tab e `blur()`. Limite declarado: IME real em aparelho não disponível.
4. **De onde veio cada login?** Não houve login: o Storybook não autentica.
5. **O banco temporário foi apagado?** Não houve banco temporário nesta reexecução; o `temporary-3f88b4d3` da execução original segue apagado.
