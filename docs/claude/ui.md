# UI: JSX, texto, acessibilidade, responsivo e loading

Parte do [`CLAUDE.md`](../../CLAUDE.md), movida de lá sem reescrita: o texto é o mesmo, só alguns títulos mudaram de nível. Quando ler: antes de escrever JSX, skeleton, carregamento, texto com acento, tabela larga, foco, ícone ou modal. A versão curta de cada regra fica no `CLAUDE.md`.

## JSX e markup — menos é mais

### Regras

- **Reuse abstrações globais** (`Card`, `Empty`, `Modal`, `ConfirmDialog`, `Field`) em vez de recriar a estrutura delas com divs e classes soltas.
- **Não empilhe wrappers de layout**: um `flex`/`grid` parent geralmente basta. `<div flex><div flex>` é code smell.
- **Sem classe Tailwind redundante**: nada de `w-full` em elemento block-level, `flex-col` num pai que já é `flex-col`, ou `text-foreground` quando é o default.
- **Prefira utilitários da escala Tailwind à notação em pixel**. A escala do Tailwind (1 = 0.25rem = 4px) cobre praticamente todo caso de UI — use ela em vez de bracket notation com `px`. Valores arbitrários quebram a escala, descalibram o ritmo visual entre componentes e o ESLint do projeto sinaliza casos comuns (`min-h-[4px]` → `min-h-1`).
  - ❌ `min-h-[4px]` · `w-[16px]` · `size-[20px]` · `gap-[8px]` · `mt-[12px]`
  - ✓ `min-h-1` · `w-4` · `size-5` · `gap-2` · `mt-3`
  - Bracket notation só para valores fora da escala (ex.: `min-w-[260px]` em uma coluna específica de tabela, `top-[3px]` para ajuste óptico fino).
  > Verificar: possivelmente desatualizado — `eslint.config.js:29-58` não tem regra de Tailwind nem de `px`, e o `package.json` só traz o `prettier-plugin-tailwindcss` (que ordena classes); nada sinaliza `min-h-[4px]` hoje.
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

## Acentuação e codificação (evitar mojibake)

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

## Acessibilidade (a11y)

Radix (via shadcn) dá a base de a11y — foco, ARIA, navegação por teclado. Mas as regressões comuns vêm de **remover** ou **ignorar** o que Radix já entrega. As regras abaixo são o mínimo para uma tela nova não degradar.

- **Nunca remova o `focus-visible:ring`.** Se está atrapalhando o visual, ajuste a cor do ring (`--ring`), não remova. Sem indicador de foco, navegação por teclado fica cega.
- **Toda input precisa de label associada.** Use os fields globais (`InputField`, `Select`, `DateField`...) — eles já geram `<FieldLabel htmlFor>` ↔ `<Input id>`. **Não use `placeholder` como label** — placeholder some quando o usuário começa a digitar e leitor de tela ignora.
- **Botão-ícone exige rótulo E tooltip — use a prop `tooltip` do [`Button`](../../src/components/global/button/button.tsx) global (regra dura).** Ação renderizada **só como ícone** passa `tooltip="..."` em pt-BR: o componente usa o texto como `aria-label` (leitor de tela) **e** revela o tooltip no hover/foco (vidente descobre o que o ícone faz). `<Button variant="ghost" size="icon" tooltip="Fechar"><X /></Button>`. Só `aria-label` deixa o usuário vidente adivinhando; só tooltip deixa o leitor de tela anunciando "botão". O `Button` traz o próprio `TooltipProvider` — funciona em qualquer tela, sem provider ancestral.
  - **Exceção `asChild`:** com `asChild` o `Button` é um `Slot` para outro gatilho (um `<a>`, um `DropdownMenuTrigger`) e a prop `tooltip` é ignorada — monte o `Tooltip` em volta do gatilho na própria tela e passe `aria-label` no botão. Ver [`toggleTheme.tsx`](../../src/components/global/layout/toggleTheme.tsx) e [`rowActions.tsx`](../../src/components/global/rowActions/rowActions.tsx).
- **Texto sempre dentro do elemento certo.** Não envolva texto em `<div onClick={...}>` — use `<button>` (ou `<Button variant="link">`). Div clicável não é focável por teclado, não tem role de botão, não dispara em `Enter`/`Space`.
- **Imagens precisam de `alt`.** Decorativa: `alt=""` (explícito). Informativa: descrição curta em pt-BR. Avatar: `alt={nome}` com fallback nas iniciais.
- **Contraste mínimo de 4.5:1** para texto sobre fundo (WCAG AA). Os tokens do projeto (`text-foreground` sobre `bg-background`, `text-muted-foreground` sobre `bg-card`) já passam — desvio só com motivo claro.
- **Estado e significado nunca só pela cor.** Status, erro, seleção e obrigatoriedade precisam de um segundo canal (texto, ícone, borda, `aria-*`): daltônico e leitor de tela não recebem "vermelho". Estado de controle vai também em ARIA (`aria-invalid`, `aria-selected`, `aria-disabled`, `aria-busy`), não apenas na classe visual.
- **Alvo de clique mínimo de 24×24 px** (WCAG 2.2 AA, "Target Size (Minimum)"). Os tamanhos do sistema já passam (`size="icon"` = `size-8`, botão padrão `h-8`) — o erro é encolher abaixo disso ou usar um ícone nu como gatilho. Ícone pequeno ganha área pelo padding do botão, nunca pelo alvo menor.
- **Foco inicial em Modal/Drawer/ConfirmDialog**: Radix põe foco no primeiro elemento focável; se há campo de input principal, garanta que ele seja o primeiro. Em `ConfirmDialog` destrutivo, **foco fica no botão de cancelar**, não no de confirmar (evita confirmação acidental no `Enter`).
- **Explicação ao lado de um controle é a descrição acessível dele.** O texto que diz por que um item está desabilitado ou travado (ex.: "Você não tem esta permissão." na árvore de cargos) vai pela `description` do [`Checkbox`](../../src/components/global/form/checkbox.tsx) global, que o liga ao controle por `aria-describedby` (somado a um `aria-describedby` de quem usa): o leitor de tela o lê junto do nome. Parágrafo solto ao lado só chega a quem vê a tela. No teste: `getByRole('checkbox', { name, description })`.
- **Toasts (`sonner`)**: já anunciam via `aria-live` por padrão. Não envolva toast em wrapper que sobrescreva role.
- **Listas com seleção/navegação por teclado**: use `role="listbox"` + `role="option"` + `aria-selected`, ou simplesmente reuse `Select` / `MultiSelect` globais que já têm isso.
- **`tabIndex` só quando há motivo.** `tabIndex={0}` em elemento naturalmente focável é redundante; `tabIndex={-1}` só para remover do tab order temporariamente; `tabIndex` positivo (`tabIndex={1}`) **nunca** — quebra a ordem natural do documento.
- **Não esconda conteúdo só para vidente.** `display: none` / `hidden` esconde de todos; para conteúdo só-leitor-de-tela use a classe utilitária `sr-only`. Para esconder do leitor mas manter visível, `aria-hidden="true"`.
- **Animação respeita `prefers-reduced-motion`**: Tailwind tem `motion-safe:` / `motion-reduce:` — use em qualquer animação não-trivial.

## Design responsivo

**Não esconda colunas, células ou qualquer conteúdo em mobile.** Quando uma tabela (ou área) não cabe na largura, a solução é **scroll lateral** dentro do container — não esconder informação.

- Tabelas largas: `overflow-x-auto` no container imediato do `<table>`. Deixe a `<table>` ficar mais larga que o viewport e rolar horizontalmente.
- Inputs de filtro: `w-full` em mobile (largura fixa só a partir de `sm:`/`md:`).
- **Não use** `hidden`, `md:hidden`, `md:table-cell` para esconder coluna/campo por breakpoint.
- Se a tabela parece cortada e não rola, o problema é um ancestral com `overflow-hidden` ou container com largura indefinida sendo expandido pelo conteúdo — conserte lá, não escondendo dados.

Esconder coluna em mobile é regressão de UX, não responsividade.

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

- **[`DataTable`](../../src/components/global/dataTable/dataTable.tsx)** com `isLoading={true}`: header, filtros e paginação **continuam visíveis**; só as células do `<tbody>` viram skeleton, linha-a-linha.
- **Atualizações parciais:** Evite recarregar a tela ou refetchar listas inteiras quando apenas um pedaço do dado muda. Por exemplo, ao editar um usuário diretamente na listagem, atualize apenas as informações daquele usuário (via `queryClient.setQueryData`, `useMutation` com `onMutate`/optimistic update ou atualizando a linha correspondente no estado) em vez de rebuscar todos os dados de todos os usuários. Isso mantém a UI responsiva, reduz tráfego desnecessário e evita flicker.
- **[`Skeleton*`](../../src/components/global/skeleton/skeleton.tsx)** (`SkeletonText`, `SkeletonValue`, `SkeletonBadge`, `SkeletonAvatar`): granulares por design — coloque no lugar **exato** do dado, dentro do card real.
- **[`Button` global](../../src/components/global/button/button.tsx)** com `loading`: spinner pequeno inline **dentro do botão** que disparou a ação. Esse spinner é localizado, não é "spinner de tela".

Regra adicional: Os skeletons devem ser extraídos para arquivos próprios em vez de serem definidos inline nos `index` ou arquivos de tela. Coloque o skeleton co-localizado com o componente que ele simula (por exemplo: `src/screens/users/userListSkeleton.tsx`) ou em `src/components/global/skeleton/` quando for reutilizável. Nome recomendado: `ComponentSkeleton.tsx` (camelCase para arquivos .tsx do projeto). Cada skeleton novo deve vir acompanhado de uma story e um teste (mesma regra das abstrações globais: "Padrão para criar uma nova abstração global", em [`docs/conventions/components.md`](../conventions/components.md), seção Abstrações globais) para manter a vitrine e a cobertura automatizada. Isso evita poluição do arquivo `index` e melhora legibilidade e reuso.

> Verificar: possivelmente desatualizado — o exemplo `src/screens/users/userListSkeleton.tsx` não existe; o arquivo real é `src/screens/users/list/userListSkeleton.tsx`. E `ComponentSkeleton.tsx` é PascalCase, embora a frase diga camelCase (os arquivos reais são camelCase).

Adicionalmente, o skeleton deve seguir a estrutura da tela e reproduzir o layout real o mais próximo possível: mantenha as mesmas margens, espaçamentos, tamanhos de blocos e ordem visual dos elementos para evitar shifts visuais quando o conteúdo real for carregado. O objetivo é minimizar CLS e dar ao usuário uma prévia fiel da UI enquanto os dados carregam.

### Anti-padrões a evitar

- ❌ `<div className="flex min-h-64 items-center justify-center"><Loader2 /></div>` no lugar do conteúdo de uma tela.
- ❌ Envolver tela ou card inteiro num `<Skeleton className="h-full w-full" />` genérico.
- ❌ Skeletonizar rótulos fixos ("Nome", "E-mail", "Status") — eles nunca mudam, não precisam virar bloco cinza.
- ❌ Modal/Drawer que abre e mostra spinner gigante até o form aparecer. Renderize o form com skeleton nos campos.

### Exceções legítimas

Tela cheia com indicador grande **só** quando ainda não existe shell pra mostrar — ex.: [`SessionValidationScreen`](../../src/components/global/layout/sessionValidationScreen.tsx) durante o boot da app, antes de qualquer rota protegida ter renderizado. Aí o "shell" não existe ainda; branding + barra de progresso é o melhor que dá.

O fallback do `<Suspense>` que carrega chunks de rota (em [`layout.tsx`](../../src/components/global/layout/layout.tsx)) deve ser **discreto** (barra fina pulsante, dots, ou nada visível) — `defaultPreload: 'intent'` já cobre 99% dos casos; o fallback é só pra cliques antes do hover. Spinner gigante aqui empobrece a navegação.
