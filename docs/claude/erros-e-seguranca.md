# Segurança: object injection e LGPD

Parte do [`CLAUDE.md`](../../CLAUDE.md), movida de lá sem reescrita: o texto é o mesmo, só alguns títulos mudaram de nível. Quando ler: ao indexar por variável, logar/reportar erro, pôr dado na URL ou filtro, ou PII em toast, mock, story ou form. A versão curta destas regras fica em **Segurança**, no `CLAUDE.md`.

## Object injection — nunca indexe objeto/array com variável

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

## LGPD e dados pessoais (PII)

Produto pt-BR opera sob a LGPD. Considere PII e **proibido logar** em qualquer canal (console, Sentry/breadcrumb, analytics, query string da URL, body de erro exibido ao usuário, payload de toast):

- **Identificadores pessoais**: nome completo, CPF, CNPJ (de pessoa física), RG, CNH, passaporte, título de eleitor, PIS.
- **Contato**: e-mail, telefone, endereço, CEP.
- **Credenciais e sessão**: senha (em qualquer forma — texto puro, hash, parcial), token de API, cookie de sessão, código 2FA, perguntas de recuperação.
- **Financeiro**: número de cartão (mesmo mascarado), CVV, dados bancários, conta, chave PIX.
- **Sensíveis (art. 5º, II)**: dados de saúde, biometria, origem racial, religião, opinião política, orientação sexual.

Regras práticas:

- **Erros de API**: o interceptor do `api` exibe mensagem amigável — não relogue o objeto de erro cru no `console.error` de produção. Em dev, OK, desde que o `.env.local` não vá pro repo.
- **Reporte de erro** (`sendErrorMessage` em [`services/api/errorHandlers.ts`](../../src/services/api/errorHandlers.ts), para `VITE_ERROR_LOG_URL`): do usuário da sessão vai só o `userId` (id opaco, o mesmo campo que o `server-template` manda ao log dele), nunca nome, e-mail ou o objeto `user` inteiro. Contexto novo no reporte segue a mesma regra.
- **Query string nunca leva PII** (`?email=foo@bar.com` aparece em log de servidor, histórico do navegador, referer). Use POST body.
- **Exceção explícita: o texto livre de busca.** O que a pessoa digita no campo "Buscar" de uma listagem (ex.: "Nome ou e-mail" em `/users`) fica em `filters` na URL e vai como `search` na query do GET: é a regra "Filtros na URL" ([`docs/conventions/filters-and-tables.md`](../conventions/filters-and-tables.md)) (link compartilhável, F5 restaura) e o contrato do servidor é GET com query. Só esse termo: nenhum outro dado pessoal vai como filtro nomeado (`?cpf=`, `?phone=`, `?email=` como parâmetro próprio). Mascarar o termo de busca no log é do servidor (`server-template`). Por isso o **reporte de erro do cliente nunca leva a query nem o hash da URL**: do endereço, o `sendErrorMessage` manda só o `pathname` (`/users`, nunca `/users?filters=...`), e contexto novo no reporte não reintroduz a URL inteira (`location.href`, `location.search`).
- **URL de tela pode conter ID opaco** (`/users/abc123`), nunca CPF na URL.
- **Toast/erro ao usuário não ecoa o input**: `"Falha ao salvar."` em vez de `"Falha ao salvar o usuário ${nome} (CPF ${cpf})."`.
- **Form com PII** (cadastro, perfil): se for usar `react-hook-form` devtools/Storybook, garanta que defaultValues não foram commitados com dado real.
- **Storybook e mocks**: dados de exemplo são fictícios — não cole CPF/e-mail real "porque é só pra testar".
