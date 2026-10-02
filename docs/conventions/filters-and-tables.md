# Convenções: filtros, cabeçalho de listagem e tabelas

Parte das convenções do projeto, lida sob demanda (ver **Guias de referência** no [`CLAUDE.md`](../../CLAUDE.md)). As regras gerais, que valem para toda tarefa, ficam no `CLAUDE.md`.

## Filtros sempre persistidos na URL

**Toda filtragem, busca, ordenação e paginação vive na query string da URL — sem exceção.** O estado de filtro nunca fica só em `useState` local: a URL é a fonte de verdade. O objetivo é que qualquer estado de uma listagem seja **compartilhável e restaurável** — colar a URL em outra aba, recarregar a página ou enviar o link a um colega reproduz exatamente a mesma visão (mesma busca, mesma página, mesmos filtros, mesma ordenação).

Por quê:

- **Compartilhável**: `/users?search=maria&status=active&page=2` abre na visão exata para quem receber o link. Não dá para compartilhar `useState`.
- **Restaurável**: recarregar (F5) ou voltar/avançar no histórico do navegador preserva a busca em vez de resetar para o estado inicial.
- **Deep-linkable**: outra tela pode linkar direto para uma visão filtrada (ex.: um card de dashboard que abre a lista já filtrada).

Regras:

- **Tabelas e listas server-side**: use [`useDataTableQuery`](../../src/components/global/dataTable/useDataTableQuery.ts) / [`useDataTableUrlQuery`](../../src/components/global/dataTable/useDataTableUrlQuery.ts) — já fazem isso. Não reimplemente estado de filtro com `useState`.
- **Filtros fora de `DataTable`** (tabs, toggles, faixas de data, selects de filtro): leia e escreva via search params do TanStack Router (`useSearch` + `navigate({ search })`), não `useState`. Tipar os search params com schema (`validateSearch`) garante shape e defaults.
- **`useState` para filtro é antipadrão** — só é aceitável para estado verdadeiramente efêmero e não-compartilhável (ex.: o texto sendo digitado antes do debounce que ainda não virou busca aplicada).
- **PII nunca vai na URL** (ver **Segurança** › **LGPD** no [`CLAUDE.md`](../../CLAUDE.md)): filtre por ID opaco ou termo genérico, nunca CPF, e-mail ou telefone como filtro nomeado na query string. A exceção é o texto livre de busca (o `search` das listagens, que pode ser um nome ou um e-mail): ele fica em `filters` e vai na query; o servidor mascara esse termo no log dele.
- **Defaults limpos**: filtro no valor default não suja a URL (ex.: `status=all` não precisa aparecer) — mantenha a URL curta e o link legível.
- **Restaura ao voltar pelo breadcrumb.** Ao entrar num detalhe/criar, a URL da lista (com seus filtros) sai da barra; para voltar à listagem com os mesmos filtros, o `Layout` lembra o último search de cada rota via [`rememberSearch`](../../src/lib/navigation/searchMemory.ts) e o breadcrumb reanexa esse search no link de volta (`getRememberedSearch`). A URL segue como fonte de verdade (reload restaura pela própria URL); a memória só cobre o "voltar" onde a URL de destino não carrega mais os filtros.

### Voltar para a listagem preserva os filtros — use `useReturnToList` (regra dura)

**Todo retorno de um detalhe/criação para a listagem usa [`useReturnToList(listPath)`](../../src/hooks/useReturnToList.ts)** — depois de salvar, criar, excluir e no `Cancelar`/`Descartar`. Ele lê o último search daquele caminho no [`searchMemory`](../../src/lib/navigation/searchMemory.ts) (alimentado a cada navegação pelo `Layout`, e usado também pelo breadcrumb) e o reaplica. Como é uma saída que a própria tela pediu, ele não passa pelo guard de edição não salva (`ignoreBlocker`, ver **Edição não salva** em Formulários).

- **`navigate({ to: '/lista' })` cru é regressão**: a URL do detalhe não carrega os filtros da lista, então a listagem reabre limpa e a busca do usuário é descartada. Quem revisa vários registros do mesmo filtro refiltra a cada um.
- Deep link/F5 direto no detalhe cai na listagem sem filtro — a memória reinicia no reload e a URL volta a ser a fonte de verdade. É o comportamento esperado, não um caso a tratar.
- Quando a tela pode ter sido aberta a partir de **mais de um lugar**, o retorno certo é "para onde o usuário veio" (`history.back`) — intenções diferentes, hooks diferentes.
- **Ao escrever o e2e de uma tela dessas**, a asserção do retorno é `waitForURL(/\/lista\?filters=/)` (a listagem **com** o filtro), não `'**/lista'`. Assertar a URL limpa passa com o bug de volta.

## Barra de filtros e cabeçalho de tela — padrão visual (obrigatório)

Telas de **listagem / consulta / relatório** seguem o MESMO padrão visual da barra de filtros da `DataTable` ([`dataTable/filters.tsx`](../../src/components/global/dataTable/filters.tsx)). Quando a tela **não** usa `DataTable` e monta uma barra própria, replique esse padrão — não invente layout:

- **Filtros NÃO ficam dentro de card.** Os campos de filtro ficam soltos no corpo da tela — **nunca** dentro de `Card`/`bg-card`/`rounded-md border p-4`.
- **Layout dos campos = `flex flex-wrap items-end gap-4`, cada campo com largura fixa `w-full sm:w-60`.** **Nunca** use `grid` com nº fixo de colunas (`lg:grid-cols-3` etc.) — trava em poucas colunas e desperdiça largura. Com `flex-wrap` + `w-60`, cabem ~6 campos por linha no FullHD e a barra **reflui sozinha**.
- **`w-full sm:w-60` é a largura de TODO campo de filtro** — texto, `Select`, `Combobox`, `MultiSelect`, numérico, data. Larguras variadas na mesma barra desalinham a linha e fazem a tela parecer improvisada. O tamanho **não** acompanha o conteúdo esperado: um campo de 2 dígitos tem a mesma largura de um de código.
  - **Sem exceção, nem para `DateTimeField`.** Ele cabe em `sm:w-60`: os três adornos (limpar/relógio/calendário) ficam AGRUPADOS num flex à direita e o input reserva `pr-22`. Se um campo novo não couber, **conserte o campo** (agrupe adornos, reduza padding) em vez de alargar a coluna.
  - Filtro de **faixa** (data/número) são dois campos `sm:w-60` lado a lado — não um campo largo.
- **Sem bloco de título/descrição no corpo da tela.** Não use `PageHeader` em tela de listagem/consulta/relatório — o **breadcrumb global** (via `staticData.breadcrumb`) já identifica a tela. (O `PageHeader` é reservado a telas tipo dashboard/`home`.) Ações da tela vão no `PageActions` (topo).
- **Botões da barra = padrão da `DataTable`**: alinhados à direita, **"Limpar"** (`variant="ghost"`) + **"Buscar"** (`variant="default"`), ambos com **altura padrão** — **NUNCA** `size="sm"` nesses dois.
- **Ícones padrão (todas as telas):** "Buscar" leva **lupa** (`Search`) e "Limpar"/"Limpar filtros" leva **borracha** (`Eraser`), sempre antes do texto. Não crie botão de buscar/limpar sem esses ícones.
- **O texto do botão que aplica os filtros é "Buscar"** — nunca "Filtrar", "Aplicar" ou similar. O que limpa é "Limpar".
- **Totalizadores/badges da tela ficam na MESMA linha dos botões**, à esquerda deles (slot "leading", `mr-auto`) — é o `filtersLeadingActions` da `DataTable`. Não empilhe os badges numa faixa separada acima do conteúdo.

### TODOS os filtros esperam o "Buscar" — sem exceção por tipo de campo (regra dura)

**Nenhum campo de filtro aplica sozinho.** Vale para **todos** eles: texto, `Select`, `Combobox`, `MultiSelect`, data, switch e os **atalhos/presets**. Todo campo escreve num **rascunho local** (`useState`) e só o **"Buscar"** promove o rascunho para a URL/consulta.

Por quê: misturar campos que filtram na hora com campos que esperam o botão é o pior dos mundos — o usuário troca o select (a tela muda), digita no texto (nada acontece) e conclui que o filtro travou. Ou pior: aplica um select por engano e perde o resultado que estava analisando.

- Cada campo é **controlado pelo rascunho** (`value={xDraft}`), nunca pelo valor aplicado vindo da URL. Quem filtra a lista continua sendo o valor **aplicado**.
- **Ressincronize o rascunho quando a URL mudar por fora** (voltar/avançar do navegador, link compartilhado): compare com o valor anterior em `useState`, sem `useEffect`.
- **`Limpar` reseta o rascunho E a URL**, senão o campo continua exibindo o filtro antigo.
- **Preset/atalho só PREENCHE o rascunho** (e destaca-se comparando com o rascunho, não com o valor aplicado); quem dispara é o "Buscar". Atalhos podem ser `size="sm" variant="outline"` — são controles auxiliares.
- `Enter` num campo de texto equivale a clicar em "Buscar".
- Toda tela com filtro tem o par **"Limpar" + "Buscar"** — se não tem, está fora do padrão.

Exceção: filtro puramente **client-side de refino instantâneo** dentro de um resultado já carregado só é aceitável se **não houver** botão "Buscar" na tela — nunca conviva os dois comportamentos na mesma barra.

## Tabelas — cabeçalho na cor da marca (regra dura)

**Toda tabela do sistema tem o cabeçalho num tom claro da marca (`bg-primary/35`) com texto escuro (`text-foreground`, o padrão do `TableHead`).** O estilo está **embutido na base** ([`components/ui/table.tsx`](../../src/components/ui/table.tsx) → `TableHeader`), então **toda** tabela que usa o primitivo `Table` herda o cabeçalho na marca **automaticamente** — `DataTable`, `FormTable` e qualquer tabela montada à mão com `Table`/`TableHeader`. Numa tela nova não há o que configurar.

- **Nunca monte tabela com `<table>`/`<thead>` cru** (HTML nativo). Isso pula o cabeçalho tonado **e** todo o estilo do primitivo (padding, borda, truncamento, scroll horizontal). Use `Table`/`TableHeader`/`TableRow`/`TableCell` de [`@/components/ui/table`](../../src/components/ui/table.tsx), ou uma das abstrações:
  - **`DataTable`** ([`components/global/dataTable`](../../src/components/global/dataTable)) — listagens paginadas/filtráveis server-side.
  - **`FormTable` + `FormTableHeader`** ([`components/global/formTable/formTable.tsx`](../../src/components/global/formTable/formTable.tsx)) — tabelas de **formulário/coleção editável inline**. Dão o container com cantos arredondados + o cabeçalho da marca; componha com `TableBody`/`TableRow`/`TableCell` (reexportados).
- **Não sobrescreva o fundo do cabeçalho para um tom neutro** (`bg-muted`, ou sem fundo). O tom claro da marca é o padrão do sistema — trocá-lo é regressão.
- `bg-primary/35` é calibrado para light e dark, com o texto escuro padrão (contraste AA). Se precisar montar o cabeçalho manualmente, replique `bg-primary/35 hover:bg-primary/35` na linha do cabeçalho (padrão do `FormTableHeader`).

## DataTable

- Padrão de tabela com paginação/filtro server-side em [`src/components/global/dataTable/`](../../src/components/global/dataTable). Use [`useDataTableQuery`](../../src/components/global/dataTable/useDataTableQuery.ts) (estado da URL via [`useDataTableUrlQuery`](../../src/components/global/dataTable/useDataTableUrlQuery.ts)).
- **Tipe as colunas com `DataTableColumnDef<T>`** de [`tableFeatures.ts`](../../src/components/global/dataTable/tableFeatures.ts) — nunca `ColumnDef` direto do `@tanstack/react-table`. No TanStack Table v9 todo tipo recebe as _features_ da tabela como primeiro genérico; o `tableFeatures.ts` declara as da `DataTable` (ordenação, seleção, expansão, visibilidade) e o shape do `meta` (`className`, `label`) num lugar só. Precisa de outra feature? Adicione-a lá.
- Empty state automático: quando não há resultados e há filtros ativos, exibe um `Empty` com botão "Limpar filtros" que dispara `onSearch({})`. Sem filtros, mostra "Ainda não há registros para exibir.".
- **Linha clicável (`onRowClick` + `getRowHref`)** dá à linha comportamento de link nativo: clique do meio e Ctrl/Cmd/Shift+clique abrem em nova aba. Arrastar para **selecionar texto** numa linha clicável **não** navega (a tabela detecta a seleção ativa) — não recrie esse guard na tela.
- **`rowCount`** (opt-in) habilita a "Próxima" por total exato, para quando o número de **linhas exibidas** não corresponde ao tamanho da página (um item da página vira várias linhas). Sem ele, vale a heurística `data.length < pageSize`, que dispensa `COUNT` no servidor.
- **`renderSubRow`** expande uma sub-linha com detalhes que não cabem numa célula; a coluna do chevron é **injetada automaticamente** (não declare uma). Expandir e clicar na linha são gestos independentes.
- **`columnVisibilityKey`** liga o ícone **"Configurar colunas"** (`Columns3Cog`) no canto direito do cabeçalho da tabela — dentro do cabeçalho da última coluna quando ela é de sistema (`actionsColumn`/`rowActionsColumn`), ou numa coluna estreita injetada no fim quando não é: o usuário escolhe quais colunas ver e a escolha fica salva **só neste navegador** (`localStorage`, via [`useColumnVisibility`](../../src/components/global/dataTable/useColumnVisibility.ts)) — é preferência de exibição, **não** vai na URL. Use uma chave única e estável por tabela (ex.: `'users'`). Guarda só os ids **ocultos**, então coluna nova nasce visível. Coluna com `header` renderizado (`SortableHeader`) precisa de **`meta.label`** para entrar no menu (sem rótulo legível ela não é ocultável — nunca expomos o id técnico); `selectColumn`/`actionsColumn`/`rowActionsColumn`/expander têm `enableHiding: false`. Listagem nova de topo **liga** o recurso.
- **`filtersLeadingActions`** coloca conteúdo (totalizadores, avisos) na linha dos botões "Limpar"/"Buscar", à esquerda — ver "Barra de filtros".
- Helpers de coluna em [`columnHelpers.tsx`](../../src/components/global/dataTable/columnHelpers.tsx): `selectColumn`, `actionsColumn` (menu "⋯"), `rowActionsColumn` (botões visíveis), `expandColumn`, `SortableHeader` e **`SortMenuHeader`** (menu de ordenação para coluna que reúne vários campos, onde um `SortableHeader` de campo único não dá conta).
- Exemplo vivo: story `DataTable/ServerSide` no Storybook.

### Colunas ordenáveis pelo cabeçalho — padrão obrigatório

**Por padrão, TODA coluna de uma `DataTable` é ordenável pelo cabeçalho.** O clique no cabeçalho alterna asc/desc. A `DataTable` **nunca reordena localmente** (`manualSorting: true`): quem ordena é o **dono dos dados** — o backend (listas paginadas server-side) ou a própria tela (listas pequenas carregadas por inteiro). Regra dura ao criar/tocar uma listagem:

- **Frontend (sempre):** o `header` da coluna usa [`SortableHeader`](../../src/components/global/dataTable/columnHelpers.tsx) — `header: ({ column }) => <SortableHeader column={column}>Rótulo</SortableHeader>` — com `id`/`accessorKey` que identifique o campo. O primeiro clique ordena em ascendente; a coluna com `sortDescFirst: true` começa em descendente (booleano de status que o servidor ordena `false` antes de `true`, quando a tela quer os ativos primeiro: a coluna Status de usuários). O `onSortingChange` já vem fiado em `tableProps` (via `useDataTableQuery`/`useDataTableUrlQuery`), então o estado de ordenação chega em `query.sort`.
- **Lista server-side (paginada):** traduza `query.sort[0]` em `orderBy`/`order` no service e a rota/serviço aplica no banco. O `orderBy` é **sempre validado contra uma allowlist** de campos (nunca interpolar o nome da coluna cru numa query — em SQL raw isso é injeção; com um ORM, restrinja a um union/`switch`). Defina uma **ordenação padrão** explícita no banco (ex.: `createdAt desc`, `name asc`).
- **Lista client-side (carrega tudo, filtra/ordena na tela):** a tela ordena o array de `rows` conforme `query.sort[0]` (comparador por coluna via `switch`/`Map`, sem indexar objeto por variável). Não precisa de mudança no backend.
- **Ordem padrão (sem sort ativo):** a ordem inicial vem do **backend** (server-side) ou do **fallback do comparador** (client-side, ex.: `sort?.id ?? 'name'`) — **não** passe `defaultSorting` ao `useDataTable*Query` só para isso. `defaultSorting` **semeia a URL** com `?sort=...` no mount, o que polui o link e quebra asserções de URL "limpa". Reserve `defaultSorting` para quando o padrão do backend **não** for a coluna/ordem que você quer destacar como já-ativa no cabeçalho.

**Exceções legítimas (as ÚNICAS):** colunas de **ação** (`actionsColumn`) e **seleção** (`selectColumn`) — já vêm com `enableSorting: false`; e colunas **compostas/derivadas sem um único campo de banco** que dê para ordenar (ex.: uma coluna que combina dois campos). Fora esses casos, cabeçalho sem `SortableHeader` é regressão — não deixe coluna "muda". Se a coluna mapeia um campo real (inclusive contagens e booleanos de status), ela é ordenável.
