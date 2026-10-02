# Guardrails

O que nenhum agente faz sem aval explícito da pessoa dona do repositório. Vale em qualquer tarefa, inclusive para "ficar verde" ou "destravar" uma verificação. As regras de segurança de código (validação com Zod, sessão por cookie HTTP-only, object injection, LGPD e PII) estão na seção [Segurança](../CLAUDE.md#segurança) do `CLAUDE.md` e não se repetem aqui; o que torna uma tarefa pronta está em [`definition-of-done.md`](definition-of-done.md).

## Sem aval, não se faz

- **Push** de qualquer branch.
- **Abrir merge request / pull request.**
- **Editar `.claude/settings.json`** (permissões e hooks do agente).
- **Commitar `.env`/`.env.local` ou segredo** (token, senha, chave, cookie de sessão). O `.gitignore` cobre `.env`, `*.local` (o que inclui `.env.local`) e `playwright/.auth/` (as sessões gravadas pelos E2E); não force a inclusão. Outro arquivo de ambiente (`.env.production`, `.env.staging`) **não** está coberto e nunca se commita. O `.env.example` leva só nomes e valores fictícios.
- **Apontar o e2e para uma API que não seja local.** A suíte cria e exclui usuários, cargos e configuração pela API; o `globalSetup` recusa, antes de qualquer requisição, a `VITE_API_URL` cujo host não seja `localhost`, `127.0.0.1` ou `::1` (ver **Banco e trava de host** em [`testing-guide.md`](testing-guide.md)). A trava não tem flag de escape, e não se edita nem se contorna.
- **Desligar teste, lint ou regra para ficar verde**: apagar ou enfraquecer teste, `eslint-disable` (inclusive o aviso de object injection), relaxar o `tsconfig`, pular hooks com `--no-verify`.
- **Deixar `test.skip`/`test.only`** (ou `describe.skip`/`only`, `it.skip`/`only`) no código, no Vitest ou no Playwright.

## Quando o aval falta

Pare naquele ponto, entregue o que não depende dele e reporte o que precisa de aval, com o motivo em uma linha.
