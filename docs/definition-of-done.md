# Definition of Done

Fonte única do que torna uma tarefa pronta neste frontend. _Tarefa_ é o card, a unidade de trabalho; _entrega_ é o ticket inteiro. O _loop por tarefa_ roda a cada mudança e a cada rodada de correção; o _fechamento_ roda uma vez por entrega, depois da última tarefa, não por tarefa nem por rodada de correção. O que nunca se faz sem aval está em [`guardrails.md`](guardrails.md); como escrever e rodar os testes, em [`testing-guide.md`](testing-guide.md).

## Loop por tarefa

Escopado no que a mudança tocou. Tudo verde antes de passar adiante; erro que não dá para corrigir no escopo vira pendência reportada, não "pronto".

1. **Typecheck**: `npm run typecheck` (`tsc -b`, cobre o projeto inteiro).
2. **Lint** dos arquivos tocados: `npx eslint <arquivos ou pastas>` (ex.: `npx eslint src/components/global/button`). O `npm run lint` roda o projeto todo.
3. **Formato** dos arquivos tocados: `npx prettier --write <arquivos>` (o `pre-commit` já faz isso pelo `lint-staged`; o `check` do fechamento confere com `format:check`).
4. **Testes Vitest da área tocada**: `npm run test:related` é o padrão: roda só os testes afetados pelas mudanças não commitadas e inclui os testes de quem importa o arquivo alterado. O script é `vitest run --changed`, que sobe o grafo de imports a partir dos arquivos alterados no git (ver [`testing-guide.md`](testing-guide.md)). 0 arquivos de teste ou "No test files found" não é verde: depois do commit, use `npx vitest related --run <arquivos>`; mudança em `vitest.config.ts`, `src/tests/setup.ts` ou `package.json` roda a suíte inteira; em mudança sem código (só documentação), reporte `test:related 0/0 (só docs)`. Alternativas para iterar: `npx vitest run <caminho>` filtra por arquivo ou pasta de teste (ex.: `npx vitest run src/tests/globais/button`), `npx vitest run -t "<nome do teste>"` filtra por nome, e `npx vitest related --run <arquivos>` pega os afetados por arquivos já commitados. Lógica não-trivial e abstração global alteradas ganham ou atualizam teste junto (ver [`testing-guide.md`](testing-guide.md)).
5. **Documentação acompanha a mudança** (abaixo).

O e2e **não** roda no loop por tarefa: roda no **Fechamento** e, dentro da esteira, com o tester. Exceção única: a tarefa que **criou ou alterou** um spec em `e2e/` roda esse spec uma vez antes de se declarar pronta (abaixo).

### Documentação acompanha a mudança

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
- **Convenção que vai se repetir → registre no `CLAUDE.md` (regra geral) ou no guia de `docs/` do assunto.** Ao introduzir um
  padrão novo (organização de pasta, slot global, regra de UX), documente-o lá
  para a próxima sessão (humana ou Claude) já chegar alinhada.
- Só é dispensável quando a mudança **não afeta o uso** (refactor interno, teste,
  tooling).

### E2E da tarefa que mexe em tela, fluxo ou CRUD

**Regra:** toda feature entregue vem com um teste Playwright que exercita o fluxo no app real. Vale para **tela nova, modificação de tela/fluxo e novo CRUD/criação**. Se a mudança altera um fluxo já coberto, **atualize o spec existente** em vez de criar outro. O spec é escrito ou atualizado **na tarefa**; a execução da suíte é do **Fechamento** (e, dentro da esteira, do tester), não do loop: subir o server inteiro a cada tarefa não entra no loop.

**Exceção: a tarefa criou ou alterou um spec em `e2e/`.** Então ela roda **esse spec, uma vez**, antes de se declarar pronta, e de novo só se uma rodada de correção mexer no próprio spec ou no fluxo que ele cobre. Os E2E rodam **contra o server real** (`../server-template`, ver **Modo híbrido** em **Contrato com o backend**, [`conventions/http-and-state.md`](conventions/http-and-state.md)): suba-o antes (`npm run db:up`, `npm run db:deploy`, `npm run db:seed` e `npm run dev` lá dentro) e rode `npx playwright test e2e/<feature>.spec.ts` na raiz do frontend. O `webServer` do [`playwright.config.ts`](../playwright.config.ts) **sobe o Vite sozinho** na porta dos E2E (`4173`) apontando para `VITE_API_URL`. Se falhar, corrija e rode de novo até passar; reporte `e2e X/X`. Só pule a execução se o ambiente comprovadamente não puder subir o server ou o Vite na sessão, e aí diga que o spec foi escrito ou atualizado mas **falta rodar**.

Tarefa que mexe em tela sem tocar spec em `e2e/` não roda e2e no loop: o fluxo dela é coberto pela suíte inteira no **Fechamento**.

## Fechamento

Uma vez por entrega, depois da última tarefa, não por tarefa nem por correção. Bloqueia o "pronto": `npm run check`, `npm run build` ou e2e com falha; teste pulado ou focado (`test.skip`/`only`, `describe.only`, `it.skip`) deixado no código, ou regra, lint ou teste desligado para ficar verde (ver [`guardrails.md`](guardrails.md)); feature de tela, fluxo ou CRUD sem o spec Playwright escrito e executado; mudança de uso sem a documentação correspondente.

1. **`npm run check` completo** (lint + format:check + typecheck + test) verde.
2. **`npm run build`** (typecheck + build de produção) verde.
3. **E2E completo contra o server com seed**: suba o `../server-template` (`npm run db:up`, `npm run db:deploy`, `npm run db:seed` e `npm run dev` lá dentro) e rode `npm run test:e2e` na raiz do frontend. A trava de host do `globalSetup` recusa qualquer `VITE_API_URL` que não seja local (ver [`testing-guide.md`](testing-guide.md)).

## Como reportar

Placar medido, não estimado, no formato curto:

- `check N/N`: testes Vitest passando sobre o total da linha `Tests` do `npm run check`, com lint, formato e typecheck verdes (ex.: `check 855/855`).
- `build ok`, ou o erro em uma linha.
- `e2e X/X`: specs passando sobre specs rodados, contra o server local com seed; ou `e2e não rodou` com o motivo (ex.: o server não sobe na sessão; o spec foi escrito e falta rodar). No loop, só quando a tarefa criou ou alterou um spec em `e2e/`.
- No loop, dizer qual filtro rodou (`npm run test:related`, `npx vitest related --run <arquivos>`, `npx vitest run <caminho>`, `npx eslint <arquivos>`) e o placar N/N da linha `Tests` dele, inclusive do `npm run test:related` (ex.: `test:related 54/54`); um `0/0` ou "No test files found" aparece no relatório e não conta como verde (só documentação: `test:related 0/0 (só docs)`).
- O que foi verificado à mão (a tela no navegador, temas claro e escuro, largura de celular quando a tarefa mexe em layout), em uma linha.
- Falha que ficou: o erro em uma linha, como pendência.
