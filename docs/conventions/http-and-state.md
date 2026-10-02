# Convenções: HTTP, sessão, estado global e variáveis de ambiente

Parte das convenções do projeto, lida sob demanda (ver **Guias de referência** no [`CLAUDE.md`](../../CLAUDE.md)). As regras gerais, que valem para toda tarefa, ficam no `CLAUDE.md`.

## HTTP

- Use a instância `api` de [`src/services/api`](../../src/services/api) — ela já trata `baseURL`, `withCredentials: true` (cookie) e toasts via interceptors. **Não crie axios direto.** Métodos: `get`, `post`, `put`, `patch`, `delete`, todos devolvendo só o `data` da resposta.
- **Silenciar o toast de erro de uma chamada: `silentError` no config** (declarado no `AxiosRequestConfig` em [`services/api/types.ts`](../../src/services/api/types.ts) e lido pelo `catchHandler`). Com uma **lista de status** (`api.get(url, { silentError: [401] })`), só as respostas com esses status ficam sem toast; outro status e falha de rede (sem resposta) continuam com o toast. `true` silencia qualquer falha, inclusive servidor fora: prefira a lista, com só o status esperado. Só o toast some: a rejeição continua chegando a quem chamou, que passa a decidir o que o usuário vê. Use só quando a falha é esperada e não é erro para o usuário, ou quando quem chama dá outra resposta a ela — hoje, estes casos: o `validate` da sessão (`GET /client/users/me`, com `[401]`): abrir o app sem sessão, ou com ela expirada, responde 401 e manda ao login sem o toast "Sessão não informada."; 5xx e rede fora mostram o toast (o usuário fica sabendo que o servidor está fora) e também mandam ao login. E a gravação das configurações (`PATCH /client/system-configs`, com `[400]`): a mensagem do 400 de validação abre com o caminho técnico (`items.0.value: ...`), então a tela marca o campo pelos `issues` e, sem campo a marcar, devolve o toast chamando o `catchHandler` com a resposta (ver **Contrato com o backend**). A criação e a edição de usuário (`POST /client/users` e `PATCH /client/users/:userId`, com `[400]`), pelo mesmo motivo e do mesmo jeito. O próprio perfil e a própria senha (`PATCH /client/users/me` e `PUT /client/users/me/password`, com `[400]`), do mesmo jeito, e o 400 que vem só com `message` (o tempo acima do limite da empresa; a senha atual errada) também marca o campo (ver **Minha conta** em **Contrato com o backend**). E a leitura do detalhe de usuário (`GET /client/users/:userId`, com `[400, 404]`): id fora do formato ou usuário que não existe mais vira a tela "Usuário não encontrado", e o toast repetiria o mesmo. E a leitura de um cargo (`GET /client/roles/:roleId`, com `[400, 404]`) e a dos usuários dele (`GET /client/roles/:roleId/users`, com `[400, 404]`): o detalhe do cargo vira a tela "Cargo não encontrado", o cargo de um link antigo (o filtro "Cargos" da URL de usuários) sai do filtro, da URL e da listagem sem toast, e a aba "Cargos" do usuário diz na seção dele que as permissões não carregaram. E a criação e a edição de cargo (`POST /client/roles` e `PUT /client/roles/:roleId`, com `[400]`), como as de usuário: a tela marca o campo pelos `issues` e, sem campo a marcar, devolve o toast pelo `catchHandler`. E a releitura da sessão aberta (`sessionService.refresh`, `GET /client/users/me` com `true`, o único caso de `true`): depois de gravar um cargo que a própria pessoa tem, a gravação já teve o toast dela, e a falha da releitura só mantém a sessão como está (`refreshUser` do `useSessionStore`: sem toast, sem ir ao login, com `console.info`). Não use para esconder erro de mutation sem dar outra resposta: aí o toast é a resposta ao usuário.
- **Erro de validação com `issues` num formulário:** `extractResponseIssues` ([`services/api/types.ts`](../../src/services/api/types.ts)) lê `{ path, message }[]` do corpo do erro; o serviço traduz o `path` do contrato dele para o campo (em configurações, `findSystemConfigIssues`: `items.<n>` é a posição no lote enviado, não na tela; em usuários, `findUserFormIssues`: o `path` é o nome do campo, e a tela só marca os que ela mostra; em cargos, `findRoleFormIssues`: `name`, `description` e `permissionIds` (um id do lote, `permissionIds.<n>`, marca o campo das permissões); em Minha conta, `findProfileFormIssues` e `findPasswordFormIssues`, que também leem o 400 sem `issues` do contrato, o único de cada rota, como o campo que ele recusa) e a tela faz `setError` no campo, que precisa ser controlado (`control` + `name`) para mostrar o erro. Referência: [`screens/settings/index.tsx`](../../src/screens/settings/index.tsx).
- **Formulário que chama o serviço direto, fora de `useMutation`** (login, cadastro): `try/catch` dentro do `handleSubmit`, senão a rejeição sobe como unhandled rejection. No `catch`, erro HTTP (`isAxiosError`) já teve o toast do interceptor e não ganha outro; qualquer outra falha (resposta fora do contrato recusada pelo `.parse`, que é um `ZodError`, ou bug) é inesperada: mensagem genérica ao usuário, `console.error` e `sendErrorMessage`. Modelo: [`screens/session/handleSessionSubmitError.ts`](../../src/screens/session/handleSessionSubmitError.ts). Numa `useMutation`, a mesma divisão vale no `onError` (referência: [`screens/settings/index.tsx`](../../src/screens/settings/index.tsx)).
- Para server state: TanStack Query (`useQuery` / `useMutation`) com o `queryClient` de [`src/lib/queryClient.ts`](../../src/lib/queryClient.ts). Não use `useEffect` + `fetch`.

### Onde vivem as chamadas de API — `services/<módulo>/`

**Toda função que fala com o backend vive em `src/services/<módulo>/` — nunca co-localizada na tela (`screens/...`) nem dentro de `services/api/`.** Cada módulo tem sua pasta (ex.: `services/users/`, `services/session/`), que agrupa os **tipos/schemas** e as **chamadas** (`api.get/post/put/patch/delete`) daquele domínio. A tela (`screens/...`) importa essas funções e as consome via TanStack Query — **não** chama `api.*` direto, nem define `fetch*`/`create*` inline.

- **`services/api/`** é só o **cliente** `api`: a instância axios (`api.ts`), os interceptors (`errorHandlers.ts`), tipos do cliente e helpers genéricos de transporte (ex.: `upload.ts`). **Não** coloque chamadas de domínio aqui.
- **`services/<módulo>/`**: as chamadas daquele domínio + seus tipos. Modelos de referência: `services/session/` (`sessionService.ts` fala com o backend, `types.ts` guarda os schemas Zod do contrato), `services/systemConfigs/` e `services/audit/`. Quando o módulo cresce, separe por responsabilidade — ex.: `services/users/` → `userListApi.ts` (listagem + params), `userDetailApi.ts` (detalhe), `userFormApi.ts` (criar/editar/ações + dados auxiliares). Cada arquivo mantém o schema Zod **junto** do fetch que o usa, derivando o tipo com `z.infer<typeof schema>` (fonte de verdade do shape ao lado do parser).
- Atualize o schema/tipo quando o contrato da API mudar; importe-os em hooks, telas e testes a partir do arquivo do módulo.

### Contrato com o backend (`../server-template`)

A fonte de verdade do contrato é o OpenAPI gerado dos schemas Zod do server: `../server-template/docs/openapi.json` (ou `http://localhost:8080/docs` com ele no ar). Antes de escrever um schema Zod de resposta aqui, leia a rota lá — não invente shape. O que já está fechado entre os dois lados:

- **Base**: `VITE_API_URL=http://localhost:8080/api`; as rotas deste frontend ficam sob `/client` (`/client/session/login`, `/client/users/me`, `/client/users`…).
- **Sessão**: `POST /client/session/login` e `/register` → `{ success, user }`; `POST /client/session/logout` → `{ success }`; `GET /client/users/me` → `{ user }`. `user` = `{ id, name, email, image | null, permissions, idleTimeoutMinutes }`, validado por `sessionUserSchema` ([`services/session/types.ts`](../../src/services/session/types.ts)). `permissions` são as efetivas, achatadas e em ordem alfabética, no formato `modulo.entidade.acao` (ex.: `backoffice.users.read`; usuário sem cargo = `[]`). `idleTimeoutMinutes` é o tempo **resolvido** (usuário → `security.idleTimeoutMinutes` da empresa → 20). **Atenção:** o `user` do CRUD de usuários (`/client/users`, `/client/users/:userId`) traz o `idleTimeoutMinutes` **próprio** (`number | null`, `null` = herda) e não traz `permissions` — nunca grave esse `user` no store da sessão (o `IUser` exige os dois campos justamente para o tipo barrar a cópia).
- **Sessão, recusas**: `GET /client/users/me` sem sessão válida (sem cookie, token inválido ou expirado, usuário excluído) responde **401**: o app vai ao login sem toast (ver `silentError` em **HTTP**). Usuário bloqueado com a sessão aberta recebe **403** `"Conta bloqueada."`: vai ao login com o toast. Login recusado: **401** `"Credenciais inválidas."` (e-mail ou senha) e **403** `"Sua conta está bloqueada."`; o `message` vira o toast. Login e register aceitam **10 tentativas por minuto por IP**; acima disso, **429** `"Muitas tentativas. Aguarde um instante e tente novamente."`.
- **Erro**: sempre `{ message }` no topo, em pt-BR, pronto para o toast. Erro de validação traz também `issues: [{ path, message }]` (use para marcar campo no formulário quando fizer sentido).
- **Sucesso de mutation**: `{ message, <entidade> }` — o `message` vira toast automático pelo interceptor. Listagens não trazem `message`.
- **Listagem**: query `page` (**0-based**), `pageSize` (padrão 50, máx. 100), `orderBy` (allowlist do server), `order` (`asc`|`desc`), `search`, filtros múltiplos como `a,b,c`; resposta `{ <entidades>: [...], count }`.
- **Detalhe**: `{ <entidade> }` (ex.: `{ user }`); registro de outra empresa responde 404.
- **Upload**: `POST /client/upload/file`, campo `file`, resposta com `Location` (URL pública) — já é o que `services/api/upload.ts` espera.
- **Datas**: ISO 8601 UTC nas duas direções; data civil como `AAAA-MM-DD` (ver [`docs/dates.md`](../dates.md)).
- **Configurações de sistema**: `GET /client/system-configs` → `{ systemConfigs: [{ key, module, label, description, valueType, value }] }` (sem `id` — a `key` identifica; sem paginação nem `count`; `value` sempre string). `PATCH /client/system-configs` com `{ items: [{ key, value }] }` grava o **lote inteiro numa chamada**, tudo ou nada, e responde `{ message, systemConfigs }` (a lista completa). A tela manda só os itens alterados, numa gravação, e **não** dispara toast próprio — o `message` já vira toast. Recusa: 400 com `issues` no item (`items.<n>.value`, `n` = posição no lote) quando o valor sai do tipo ou da regra da chave, ou quando as duas chaves de retenção vêm no lote fora da ordem → a tela marca o campo, sem toast; 400 só com `message` quando a regra entre os prazos é conferida contra o valor já gravado → toast. Tipos, faixas e regras são só do servidor: a tela não valida o valor.
- **Auditoria**: `GET /client/audit-logs` (`page` 0-based, igual à `DataTable`: sem `+ 1`) → `{ logs, count }`; `GET /client/audit-logs/options` → `{ modules, actions, entities }`; `GET /client/audit-logs/:auditLogId` → `{ auditLog }`, com `before`/`after` crus **e** `fieldChanges: [{ field, label, from, to }]`; `GET /client/audit-logs/entities/:entity/:entityId` (`entity` ∈ `User | Role | SystemConfig`; em configuração o `entityId` é a chave; `page` 0-based, `pageSize` até 100) → `{ logs, count }`, a linha do tempo do registro, mais recente primeiro, cada item o da lista mais `fieldChanges` (sem `before`/`after`); registro sem eventos → lista vazia, nunca 404.
  - **De→para (`fieldChanges`) vem pronto do servidor**: `label` pt-BR, `from`/`to` já formatados (`Sim`/`Não`, número com vírgula, data `dd/mm/aaaa`, valor de configuração pelo tipo da chave). A tela imprime `label: from → to` com o [`FieldChanges`](../../src/components/global/fieldChanges/fieldChanges.tsx) global e nunca formata nem exibe `field` (é só a chave da lista). `[Vazio]` e `[omitido]` (segredo alterado, como a senha, ou dado anonimizado) aparecem como estão. Edição e mudança de status trazem só os campos alterados; criação e exclusão, os gravados, sem os vazios dos dois lados; login e exportação, `[]` (os filtros da exportação ficam no `after`).
  - **Valores pessoais na trilha, por decisão do dono**: nome, e-mail e telefone aparecem no de→para, em `before`/`after` e na `description` (`Criou o usuário "Maria Alves".`). A privacidade vem da **retenção** por empresa, nas configurações do grupo `SECURITY`: `audit.anonymizeAfterMonths` (padrão 12, de 1 a 120) troca os dados pessoais por `[omitido]` e tira o autor; `audit.deleteAfterMonths` (padrão 60, de 2 a 240) apaga o evento. O servidor recusa com 400 o lote em que o prazo para apagar não fique maior que o para anonimizar: com as duas chaves no lote, com `issues` no item de `audit.deleteAfterMonths`; com uma só, conferida contra o valor já gravado (ou o padrão), só com `message`.
- **Usuários** ([`services/users/`](../../src/services/users), chaves de cache em `services/users/queryKeys.ts`): o `user` do CRUD é o mesmo objeto na lista, no detalhe e nas mutações, `{ id, name, email, image, phone, isActive, idleTimeoutMinutes, lastLoginAt, roles: [{ id, name }], createdAt, updatedAt }` (`companyUserSchema`, tipo `CompanyUser`), com as datas em ISO UTC.
  - **Status é só `isActive`**: `true` = "Ativo", `false` = "Bloqueado" (o servidor diz "o cliente deriva daqui"). Não existe `inactive` nem `pending` (sem convite). `lastLoginAt: null` = "Nunca acessou". **Cargos são vários por usuário** (`roles`, os que valem, por nome); `[]` = sem cargo, sem acesso a nenhuma área.
  - **Lista**: `GET /client/users` → `{ users, count }`, com `page` 0-based, `pageSize` até 100, `orderBy` ∈ `name | email | createdAt | lastLoginAt | isActive` (padrão `name asc`; `roles` não ordena; `isActive` segue o booleano, `asc` = bloqueados antes, então a coluna Status tem `sortDescFirst` e o primeiro clique manda `desc`, os ativos primeiro), `search` (nome ou e-mail, contém), `isActive=true|false`, `roleId=a,b` (qualquer um dos cargos, ids uuid: um fora do formato faria o servidor recusar a listagem inteira com 400, e a tela o tira dos parâmetros e da URL antes da chamada, por [`isUuid`](../../src/lib/ids.ts), com `replace` e sem toast) e `createdFrom`/`createdTo` (ISO UTC com `Z`, inclusivos: o início e o fim do dia local, por `dateRangeParams` de [`lib/listQueryParams.ts`](../../src/lib/listQueryParams.ts)). A `DataTable` recebe `rowCount={count}` (paginação exata). As chaves dos filtros na URL são as da tela (`search`, `roleId`, `isActive`, `createdAt`), traduzidas por `buildUserListParams`.
  - **Detalhe**: `GET /client/users/:userId` → `{ user }`; 400 (id fora do formato) e 404 viram "Usuário não encontrado", sem toast.
  - **Mutações** (o `message` é o toast; a tela não soma outro): `POST /client/users` (`{ name, email, password, confirmPassword, phone, image, idleTimeoutMinutes }`, nasce ativo e sem cargo) → `{ message, user }`, 409 `"E-mail já cadastrado."`; `PATCH /client/users/:userId` parcial (só os campos alterados; `phone`, `image` e `idleTimeoutMinutes` aceitam `null`: sem telefone, sem foto, herda o tempo da empresa); bloquear e desbloquear = `PATCH` só com `{ isActive }`; `DELETE /client/users/:userId` → `{ message }`; `PUT /client/users/:userId/roles` com `{ roleIds }` (o conjunto completo) → `{ message, user }`. A foto sobe antes por `POST /client/upload/file` e vai como a URL `https:` do `Location`.
  - **Recusas do servidor, no toast** (a tela não reimplementa nenhuma): bloquear ou excluir o último administrador ativo (400), excluir o próprio usuário (400), alterar os próprios cargos (400), dar cargo com permissão que o autor não tem ou dar/tirar o `Administrador` sem tê-lo (403, anti-escalonamento), sem a permissão da rota (403). O 400 de validação do formulário traz `issues` com o nome do campo como `path`.
- **Cargos** ([`services/roles/`](../../src/services/roles), chaves de cache em `services/roles/queryKeys.ts`, que a tela de usuários também usa; a tela em [`screens/roles/`](../../src/screens/roles)): o `role` é o mesmo objeto no detalhe e em todas as mutações, `{ id, name, description, isSystem, usersCount, permissions: [{ id, name }], createdAt, updatedAt }` (`roleSchema`, tipo `Role`, `permissions` em ordem alfabética do nome); na listagem vem sem `permissions` e com `permissionsCount`. `isSystem` é o `Administrador`.
  - **Leituras** (`backoffice.roles.read`): `GET /client/roles` → `{ roles, count }`, com `page` 0-based, `pageSize` até 100, `search` (o nome contém o termo) e `orderBy` ∈ `name | createdAt` (padrão `name asc`; as contagens não ordenam), traduzidos por `buildRoleListParams`. É também a fonte das opções de cargo da tela de usuários: busca no servidor, 20 por vez em ordem de nome, por [`useRoleOptions`](../../src/screens/users/utils/useRoleOptions.ts), no filtro "Cargos" da lista e no campo da aba "Cargos". `GET /client/roles/:roleId` → `{ role }` (400/404 sem toast: o detalhe diz "Cargo não encontrado"; um cargo que ficou num link antigo volta em `missingIds` do `useRoleOptions`, e a lista de usuários o tira dos parâmetros e da URL, com `replace`). `GET /client/roles/permissions` → `{ modules: [{ module, moduleLabel, groups: [{ groupLabel, permissions: [{ id, name, action, label }] }] }] }`, na ordem de exibição e com os rótulos pt-BR: é a árvore do formulário de cargo e de onde a aba "Cargos" do usuário tira o rótulo e o agrupamento das permissões de um cargo. `GET /client/roles/:roleId/users` (exige também `backoffice.users.read`) → `{ users: [{ id, name, email, image, isActive }], count }`, paginado (até 100 por vez): o detalhe lê todas as páginas (`fetchAllRoleUsers`, até 1000, o máximo de ids no corpo do `PUT`; acima disso a lista só aparece). Sem `backoffice.roles.read`, a tela de usuários mostra só os nomes dos cargos (que vêm no `user`) e não oferece a troca.
  - **Mutações** (o `message` é o toast; a tela não soma outro): `POST /client/roles` (`roles.create`) e `PUT /client/roles/:roleId` (`roles.update`, substitui nome, descrição e o conjunto inteiro de permissões) com `{ name, description, permissionIds }` (`description` vazia vai como `null`; ao menos uma permissão) → `{ message, role }`; `POST /client/roles/:roleId/copy` (`roles.create`, sem corpo: descrição e permissões do original, sem usuários, com o nome `"X (cópia)"` dado pelo servidor) → `{ message, role }`; `DELETE /client/roles/:roleId` (`roles.delete`, exclusão lógica; o nome continua reservado) → `{ message }`; `PUT /client/roles/:roleId/users` (`roles.update` e `users.update`) com `{ userIds }` (o conjunto completo) → `{ message, role }`.
  - **Regras que a tela espelha, sem ser a autoridade**: qualquer ação diferente de `read` num grupo inclui, ao salvar, o `read` do mesmo grupo, então a árvore marca o `read` junto e o trava enquanto houver uma escrita do grupo marcada; ninguém acrescenta a um cargo uma permissão que não tem, então a árvore desabilita, com a explicação ao lado, a permissão que quem edita não tem (pelos nomes da sessão) e que o cargo gravado não tem (manter ou retirar o que ele já tem é permitido); o `Administrador` só aparece (tudo em leitura, sem copiar, excluir nem trocar usuários). Regras em [`screens/roles/utils/permissionTree.ts`](../../src/screens/roles/utils/permissionTree.ts).
  - **Recusas do servidor, no toast** (a tela não reimplementa nenhuma): nome repetido, inclusive de cargo excluído (409); editar, copiar ou excluir o `Administrador` e trocar os usuários dele por aqui (400); excluir cargo com usuários vinculados (400, a confirmação fica aberta); incluir ou retirar a si mesmo dos usuários do cargo (400); conceder permissão que o autor não tem, inclusive pela cópia ou ao vincular alguém ao cargo (403); sem a permissão da rota (403). O 400 de validação da criação e da edição traz `issues` com `name`, `description` ou `permissionIds` como `path` (`findRoleFormIssues`) e marca o campo, sem toast.
  - **Cache entre as duas telas e a própria sessão**: a aba "Usuários" do cargo grava o conjunto completo, então parte sempre do que o servidor tem. Trocar os cargos de um usuário e excluí-lo releem todo o cache de cargos (`invalidateRoleMemberships`, `roleKeys.all`: os usuários de cada cargo, as contagens da listagem, o detalhe); editar o cadastro de alguém, bloqueá-lo e desbloqueá-lo (e o próprio perfil, em Minha conta) releem só os usuários de cada cargo (`invalidateRoleMembers`, `roleKeys.allMembers()`: a aba "Usuários" mostra nome, e-mail, foto e status; as contagens não mudam); no sentido contrário, trocar os usuários de um cargo e renomeá-lo releem `userKeys.all` (criar, copiar e excluir não mexem em usuário: o cargo novo nasce vazio e o que tem usuário não é excluído). Gravar um cargo que a própria pessoa tem relê a sessão (`refreshUser`, ver **Sessão e autenticação**); sem a lista inteira de usuários do cargo (sem `backoffice.users.read`, ou acima de 1000), a tela não sabe se ela o tem e relê do mesmo jeito.
- **Minha conta (autoatendimento, [`services/account/`](../../src/services/account), chave `accountKeys.profile`)**: só a sessão, nenhuma permissão `backoffice.*`; o id é sempre o da sessão (nunca na URL nem no corpo).
  - `GET /client/users/me/profile` → `{ profile: { name, email, phone, image, idleTimeoutMinutes } }`: os valores **gravados**, de onde o formulário pré-preenche. Aqui `idleTimeoutMinutes` é o **próprio** (`number | null`, `null` = herda o da empresa); o da sessão (`IUser`) é o **resolvido**. Não misture: o formulário lê o do perfil, o `IdleTimeout` lê o da sessão.
  - `PATCH /client/users/me`, parcial e estrito (campo fora de `name`, `phone`, `image`, `idleTimeoutMinutes` é 400; o e-mail só aparece) → `{ message, user }`, com o `user` no formato da **sessão**: ele substitui o do `useSessionStore` (nome, foto e o tempo resolvido valem na hora). Mande **só os campos alterados**: o tempo vai de 1 até o `security.idleTimeoutMinutes` da empresa, e um valor que o administrador gravou acima dele seria recusado se fosse reenviado igual. `phone`, `image` e `idleTimeoutMinutes` aceitam `null` (sem telefone, sem foto, herda). A foto sobe por `POST /client/upload/file` e vai como a URL `https:` do `Location` (a tela recusa outra antes de enviar). Recusas (400, sem toast): com `issues` pelo nome do campo; o tempo acima do limite da empresa vem **só com `message`** (o limite no texto), o único 400 sem `issues`, e marca o campo do tempo.
  - `PUT /client/users/me/password` com `{ currentPassword, password, confirmPassword }` → `{ message }` ("Senha alterada."); a sessão continua aberta (o JWT não é revogado; as outras sessões também seguem). Recusas: 400 com `issues` (senha curta, confirmação diferente, nova igual à atual) ou **só com `message`** "Senha atual incorreta." (marca a senha atual); 409 (a senha mudou por outro caminho no meio) e 429 (10 por minuto por IP, contador à parte do login) no toast.
  - Referência: [`screens/account/profile/profileTab.tsx`](../../src/screens/account/profile/profileTab.tsx) (Detalhe = Edição com o perfil do cache como referência só) e [`screens/account/security/changePasswordModal.tsx`](../../src/screens/account/security/changePasswordModal.tsx).
- **Home** ([`services/home/homeApi.ts`](../../src/services/home/homeApi.ts)): sem rota própria. Usuários totais e novos no mês = o `count` de `GET /client/users` com `pageSize=1` (os novos, com `createdFrom` na meia-noite local do dia 1º, em ISO UTC), na chave `userKeys.list(params)` com `select` do `count` (o cache guarda a resposta inteira da listagem, que o `storeSavedUser` sabe atualizar); só com `backoffice.users.read`. Atividade recente = `GET /client/audit-logs` com `pageSize=5`, `createdAt desc`, na chave `auditKeys.list(params)`; só com `backoffice.audit.read`. Sem a permissão, o bloco some e nada é chamado. Os atalhos são links para as telas, cada um filtrado pela permissão dela.
- **Permissões por rota** (backend): `backoffice.users.{read,create,update,delete}`, `backoffice.roles.{read,create,update,delete}`, `backoffice.audit.read`, `backoffice.systemConfigs.{read,update}`. Sem a permissão, `403 { message }`. As rotas de `/client/users/me` só exigem a sessão.

**Modo híbrido: o que fala com a API e o que é mock.** Tela com rota no servidor fala só com ele, sem modo alternativo nem mock: a sessão ([`services/session/`](../../src/services/session)), as configurações ([`services/systemConfigs/`](../../src/services/systemConfigs)), a trilha de auditoria ([`services/audit/`](../../src/services/audit): lista, detalhe, opções e linha do tempo), os usuários ([`services/users/`](../../src/services/users): lista, detalhe, criação, edição, bloqueio, exclusão e os cargos de cada um), os cargos ([`services/roles/`](../../src/services/roles): lista, detalhe, catálogo de permissões, criação, edição, cópia, exclusão, os usuários de cada cargo e as opções de cargo da tela de usuários), Minha conta ([`services/account/`](../../src/services/account): o próprio perfil, a foto e a troca de senha), a home ([`services/home/`](../../src/services/home): total de usuários, novos no mês, atividade recente; os atalhos são links para telas reais) e o transporte (`services/api/`: upload em `POST /client/upload/file`, download). Os e2e dessas telas rodam contra o servidor real, com o dado preparado por API (ver **E2E** em [`docs/testing-guide.md`](../testing-guide.md)). O que o servidor **não** atende continua como exemplo de tela, com **dados de demonstração** isolados em arquivos `*Demo.ts` e o aviso `DemoNotice` visível (ver **Dados de demonstração** em **Abstrações globais**, [`components.md`](components.md)): em Minha conta, a autenticação em 2 fatores e as sessões ativas ([`accountSecurityDemo.ts`](../../src/screens/account/security/accountSecurityDemo.ts)), as preferências de notificação ([`notificationSettingsDemo.ts`](../../src/screens/account/notifications/notificationSettingsDemo.ts)) e plano e cobrança ([`billingDemo.ts`](../../src/screens/account/billing/billingDemo.ts)); na home, sessões ativas, convites pendentes, a série semanal de logins e as pendências ([`homeDemo.ts`](../../src/screens/home/utils/homeDemo.ts)); e a aba "Sessões" do detalhe do usuário ([`userSessionsDemo.ts`](../../src/screens/users/details/userSessionsDemo.ts)). O Storybook não usa serviço e roda sem backend. Para ligar uma parte de demonstração quando o servidor ganhar a rota: escreva o serviço em `services/<módulo>/` com o `api` e o schema Zod no `.parse` da resposta, apague o `*Demo.ts` dela e o `DemoNotice`, e troque os e2e dela para dado preparado por API. Regra de negócio, rótulo e mensagem continuam do servidor (ver **Dado derivado, rótulos e mensagens vêm do backend** no [`CLAUDE.md`](../../CLAUDE.md)). O filtro "Usuário" da auditoria busca no servidor (`searchUserOptions`: `GET /client/users?search=`, 20 por vez, com debounce de 300 ms, em [`useAuditUserFilter`](../../src/screens/audit-logs/utils/useAuditUserFilter.ts)), para empresa com qualquer número de usuários; os usuários já aplicados na URL entram nas opções pela leitura de cada um (`GET /client/users/:userId`). Exige `backoffice.users.read`: sem essa permissão o filtro não aparece e nada disso é chamado. A aba "Atividade" do usuário não tem dado próprio: lê a linha do tempo da auditoria (`entity: 'User'`, o id real do usuário), com a página na URL (`activityPage`, 0-based), e só aparece com `backoffice.audit.read`. O skeleton das configurações não depende da leitura: o formato esperado da tela (grupos e tipo de campo de cada chave) fica em `SETTINGS_OUTLINE` ([`screens/settings/utils/configModules.ts`](../../src/screens/settings/utils/configModules.ts)), junto das descrições dos grupos; chave nova no catálogo do servidor entra lá.

❌ `screens/users/userListApi.ts` (chamada de API dentro de `screens/`)
❌ `services/api/users/userListApi.ts` (chamada de domínio dentro de `services/api/`)
✓ `services/users/userListApi.ts` (chamada no módulo, importada pela tela)

### Convenção de `queryKey`

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

### Toda tela usa TanStack Query

Qualquer dado vindo do servidor entra na tela via **TanStack Query** — sem exceção. Não há `useEffect` + `fetch`, não há `useState` espelhando resposta de API, não há `axios` chamado direto no `onClick`. Isso não é preferência estética: o cache compartilhado, deduplicação, refetch em foco, retry, devtools e integração com router só funcionam se **todo mundo** usar a biblioteca.

**Estrutura mínima de uma tela com dados:**

```tsx
const { data, isPending, isError, refetch } = useQuery({
  queryKey: userKeys.list(filters),
  queryFn: () => api.get('/users', { params: filters }).then((r) => r.data),
  staleTime: 30_000,
});

if (isPending) return <UsersListSkeleton />;
if (isError) return <ErrorFallback variant="content" onRetry={refetch} />;
return <UsersTable rows={data} />;
```

O `onRetry` do [`ErrorFallback`](../../src/components/global/errorFallback/index.tsx) é chamado sem argumentos (o `refetch` não recebe o evento de clique) e, enquanto a promessa dele não termina, deixa "Tentar novamente" desabilitado, em carregamento. A variante `content` é a de dentro do `Layout`: fica no lugar do conteúdo, com o link para o início (que some quando a tela já é o início, `/`).

**Só marque `reported` quem chamou `sendErrorMessage`.** Sem a prop, o título é neutro ("Oops! Algo deu errado."); com `reported`, ele diz que a equipe foi notificada. Quem reporta de fato e passa a prop: o [`RouteErrorFallback`](../../src/components/global/errorFallback/routeErrorFallback.tsx) (erro de render ou de carregamento de uma tela) e o `ErrorBoundary` do [`App.tsx`](../../src/App.tsx) (no `onError`). O exemplo acima não passa: o `isError` de uma query não chama o `sendErrorMessage` (o erro HTTP já teve o toast do interceptor), e a tela não pode afirmar um aviso que não houve. Se uma tela passar a reportar o próprio erro, aí sim ela marca `reported`.

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

## Sessão e autenticação

- Sessão por cookie HTTP-only. `SessionValidation` ([`src/components/global/layout/sessionValidation.tsx`](../../src/components/global/layout/sessionValidation.tsx)) valida antes de renderizar rotas protegidas.
- **A sessão é sempre a do backend**, sem modo fictício: [`sessionService`](../../src/services/session/sessionService.ts) faz `POST /client/session/login`, `/register`, `/logout` e `GET /client/users/me` no `../server-template` (suba-o com `npm run db:up && npm run dev` lá dentro; `VITE_API_URL` aponta para ele), e cumpre `ISessionService` ([`services/session/types.ts`](../../src/services/session/types.ts)). A resposta passa por `sessionUserSchema` antes do store. O `GET /client/users/me` vai com `silentError: [401]` (ver **HTTP**): sem sessão, o 401 manda ao login sem toast; 5xx e rede fora mandam ao login com o toast. O `npm run dev` precisa do backend no ar; a suíte (`npm test`) responde pelo adapter do `axiosApi` ([`tests/helpers/axiosAdapter.ts`](../../src/tests/helpers/axiosAdapter.ts)), sem rede.
- Usuário fica em `useSessionStore` ([`src/hooks/useSessionStore.ts`](../../src/hooks/useSessionStore.ts)) — Zustand. Só entra ali o `user` da sessão (`IUser`), nunca o do CRUD de usuários (ver **Contrato com o backend**). O `PATCH /client/users/me` do próprio perfil devolve o `user` no formato da sessão, e a aba "Perfil" o põe no store (`setUser`): nome, foto e o tempo de inatividade resolvido mudam na hora, sem recarregar. Quando as permissões da pessoa mudam com a sessão aberta (gravar um cargo que ela tem), a tela chama `refreshUser()`: relê `GET /client/users/me` (`sessionService.refresh`, sem toast) e troca o `user` do store, e menu e botões seguem as permissões novas sem recarregar. Na falha, a sessão continua como está (não é o caminho do `SessionValidation`, que manda ao login); a resposta que chega depois de a sessão sair não a devolve.
- **Logout por inatividade é global**, montado uma vez no `Layout` via [`IdleTimeout`](../../src/components/global/layout/idleTimeout.tsx) (lógica em [`useIdleLogout`](../../src/hooks/useIdleLogout.ts)): passado o tempo de inatividade, abre um modal com contagem regressiva (~60s) e encerra a sessão se o usuário não continuar. O tempo efetivo vem do backend em `user.idleTimeoutMinutes`, já resolvido (usuário → config `security.idleTimeoutMinutes` da empresa → 20); o default do client é só rede de segurança. Nenhuma tela implementa timeout próprio. Mudança na configuração vale na próxima leitura de `/client/users/me` (recarregar a página ou entrar de novo).
- **Permissões** chegam prontas do backend em `user.permissions`, achatadas no formato `modulo.entidade.acao` (ex.: `backoffice.users.read`, `backoffice.audit.read`, `backoffice.systemConfigs.read` — as do menu em [`sidebar.tsx`](../../src/lib/constants/sidebar.tsx)), e são consultadas com [`hasPermission`](../../src/lib/permissions.ts) (igualdade exata, sem prefixo nem curinga) **apenas para ajustar a UI** (esconder item de menu, botão ou coluna de ação). O backend continua sendo a autoridade — nunca trate o gate de UI como segurança. Usuário sem cargo chega com `[]`: todo controle gateado fica escondido. Permissão nova no gate da UI precisa existir no catálogo do backend com o mesmo nome.

## Estado global

- Zustand para client state global compartilhado (sessão, tema).
- TanStack Query para server state — não duplique resposta de API no Zustand.
- Estado local de tela: `useState` normal.

## Variáveis de ambiente

- Validadas em [`src/lib/env.ts`](../../src/lib/env.ts) com Zod no boot — falha rápido se faltar.
- Ao adicionar uma env, declare-a no schema **e** em [`.env.example`](../../.env.example).
- Variáveis devem começar com `VITE_` para serem expostas ao cliente.
- **A suíte não lê `.env`.** Como o `env.ts` valida **no import**, qualquer teste cuja cadeia de imports passe por ele (`api`, `sidebar`, telas) quebra na coleta se faltar uma env — e dependeria de um `.env` local, que não é versionado. Os valores usados nos testes são fixos em `test.env` no [`vitest.config.ts`](../../vitest.config.ts). Portanto, env nova e **obrigatória** entra em **três** lugares: schema + [`.env.example`](../../.env.example) + `test.env`. Esquecer o terceiro faz o `npm test` falhar com "Variáveis de ambiente inválidas" antes de rodar qualquer teste.
- Os E2E passam `VITE_API_URL` ao Vite pelo `env` do `webServer` ([`playwright.config.ts`](../../playwright.config.ts)), com o valor do ambiente ou `http://localhost:8080/api`; `E2E_PORT` (padrão `4173`) é a porta do Vite deles. As duas são do Playwright, não do app: não entram no `env.ts`.
