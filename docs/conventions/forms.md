# Convenções: formulários

Parte das convenções do projeto, lida sob demanda (ver **Guias de referência** no [`CLAUDE.md`](../../CLAUDE.md)). As regras gerais, que valem para toda tarefa, ficam no `CLAUDE.md`.

## Formulários

- Use `useZodForm` ([`src/lib/forms/useZodForm.ts`](../../src/lib/forms/useZodForm.ts)) — integra React Hook Form com schema Zod.
- Componentes de campo prontos em [`src/components/global/form/`](../../src/components/global/form) (`inputField`, `numberField`, `decimalField`, `select`, `combobox`, `dateField`, `dateTimeField`, `checkbox`, `switch`, `textArea`, `multiSelect`).
- **Lista grande → `Combobox` (pesquisável); lista curta → `Select`.** O `Select` global liga a busca sozinho acima do limiar de opções (`searchable` explícito força). Campo opcional ganha `clearable` (botão "X" que volta a `''`) — sem ele o usuário não consegue desfazer a escolha.
- **Lista que não cabe numa página do servidor (usuários ou cargos de uma empresa) → busca no servidor, nunca "os primeiros 100".** O `MultiSelect` (e o `multiSelectFilter` da `DataTable`) aceita `onSearchChange` + `loading`: o campo repassa o texto digitado (e `''` ao fechar) e mostra `options` como vieram, sem filtrar local; quem chama guarda o texto, espera o [`useDebouncedValue`](../../src/hooks/useDebouncedValue.ts) e põe o termo atrasado na `queryKey` (uma requisição pelo termo, não por tecla). A opção marcada que sai do resultado continua no gatilho e no topo da lista; as que chegam marcadas de fora (a URL) precisam vir em `options`, pela leitura de cada uma. Referências: o filtro "Usuário" da auditoria ([`useAuditUserFilter`](../../src/screens/audit-logs/utils/useAuditUserFilter.ts)), as opções de cargo da tela de usuários ([`useRoleOptions`](../../src/screens/users/utils/useRoleOptions.ts)) e os usuários de um cargo ([`useRoleMemberOptions`](../../src/screens/roles/details/useRoleMemberOptions.ts)).
- **`DecimalField` × `NumberField`:** `NumberField` mascara na digitação (casas fixas, estilo centavos) — é o padrão para quantidade/moeda. [`DecimalField`](../../src/components/global/form/decimalField.tsx) é para digitação **livre** em pt-BR, quando a precisão é do usuário e varia por registro (ex.: uma medição onde "0,0003" e "200" convivem).
- **Campo numérico/monetário/decimal SEMPRE via [`NumberField`](../../src/components/global/form/numberField.tsx) — nunca `<input type="number">`.** Ele aplica máscara pt-BR (milhar "." e decimal ",") **na digitação e na exibição**, guarda um `number` no RHF (não a string), e mostra o zero mascarado como placeholder. Para dinheiro passe `prefix="R$ "`; ajuste as casas com `maxDecimals` (padrão 2; ex.: 5 para taxas/índices). O `type="number"` nativo não formata milhar/decimal pt-BR, aceita `e`/`+`/`-` e tem setas indesejadas — não use para quantidade/valor.
- Todos seguem o mesmo padrão: aceitam **uncontrolled** (`{...register('campo')}` + `errors`) **ou controlled** (`control` + `name` + opcional `rules`/`defaultValue`). Discriminated union impede misturar os dois modos.
- Veja [`src/screens/session/login.tsx`](../../src/screens/session/login.tsx) e a story `Formulário/Formulário completo` no Storybook como referência.

### Edição não salva: toda tela de edição usa o guard (regra dura)

**Toda tela com formulário de edição chama [`useUnsavedChangesGuard(isDirty)`](../../src/hooks/useUnsavedChangesGuard.ts)**, com o mesmo `isDirty` do `Salvar alterações` (no detalhe com permissão de leitura só, `!readOnly && isDirty`). Um mecanismo só, sobre o bloqueio de navegação do TanStack Router (`useBlocker`): com alteração, sair da tela pela navegação do app (link do menu, breadcrumb, voltar e avançar do navegador) abre a confirmação global, o [`UnsavedChangesDialog`](../../src/components/global/layout/unsavedChangesDialog.tsx) montado uma vez no `Layout` sobre o `ConfirmDialog` ("Descartar as alterações?": "Descartar alterações" segue, "Continuar editando" e o Esc ficam, com o foco de volta onde estava), e fechar ou recarregar a aba abre o aviso nativo do navegador (`beforeunload`). Hoje: criação e detalhe de usuário e de cargo, configurações, Minha conta (o perfil e o modal de troca de senha).

- **Sem alteração, nada é registrado**: nem confirmação, nem aviso nativo. Salvar (o formulário volta a pristine) e `Descartar` (`reset()`) liberam a saída.
- **Saída que a própria tela pede não pergunta**: a navegação disparada pelo salvar (criar e abrir o detalhe) passa `ignoreBlocker: true`; o retorno à listagem ([`useReturnToList`](../../src/hooks/useReturnToList.ts), usado no `Cancelar` da criação, depois de excluir) já passa. Fechar um modal de formulário continua sendo o cancelar dele, sem pergunta.
- **Fim da sessão**: "Sair" (menu da pessoa, [`navUser`](../../src/components/global/sidebar/navUser.tsx)) pergunta **antes** do `signOut`, com `confirmLeaveIfDirty()`: resolve `true` sem edição ou com "Descartar alterações", `false` com "Continuar editando" (fica logado, na edição, com o foco de volta no botão do menu). Com `true`, encerra a sessão e vai ao login com `ignoreBlocker`. Não navegue ao `/login` antes de encerrar: com a sessão aberta, o `redirectIfAuthenticated` manda para `/`. Saída nova que não é navegação do roteador e perde a edição usa o mesmo `confirmLeaveIfDirty()`. O logout por inatividade sai sem perguntar, também com `ignoreBlocker`.
- **Sair da tela é trocar de caminho.** Abas e paginação da mesma tela não perguntam quando o formulário sobrevive a elas (acima do `UrlTabs`). Quando uma aba desmonta o formulário, passe o parâmetro dela: `{ searchKey: 'tab' }` (Minha conta).
- **Um guard por formulário, uma pergunta por saída.** Cada formulário de edição chama o seu guard, e mais de um na mesma tela (o formulário principal e um modal de edição aberto sobre ele) pergunta uma vez só: o primeiro guard com edição decide por todos, e a saída pergunta se sai da edição de qualquer um deles (o `searchKey` de cada). Não junte formulários num `isDirty` só para evitar a pergunta dupla.
- **Voltar de novo com a pergunta aberta não troca a pergunta.** O navegador volta para onde o primeiro voltar o deixou e a pergunta continua a mesma: "Continuar editando" volta à edição (URL e tela), "Descartar alterações" vai aonde o primeiro voltar ia.
- **Nova guia não pergunta**: Ctrl, Shift, Cmd+clique e clique do meio num link (o `Link` global, os do menu) ou numa aba do `UrlTabs` abrem outra guia sem mexer nesta.
- **No teste**, o [`renderRoutes`](../../src/tests/helpers/renderRoutes.tsx) já monta a confirmação; a navegação que sai da tela é `act(async () => { void router.navigate({ to }) })` (sem esperar: a bloqueada só termina com a resposta), e o `setup.ts` limpa a pergunta que um teste deixou aberta. Tela nova de edição entra com um teste de sair com e sem alteração.

### Nenhum input sem placeholder (regra dura)

**Todo campo de entrada tem um `placeholder` que orienta o que digitar/selecionar — sem exceção.** Vale para `InputField`, `NumberField`, `MaskedInputField`, `TextArea`, `Select`/`MultiSelect`, `DateField`/`DateTimeField`, qualquer `Combobox`/campo pesquisável, e os filtros da `DataTable`/barra de filtros. Um campo sem placeholder (só o rótulo e a caixa vazia) deixa o usuário sem pista do formato/ação esperados.

- O placeholder **complementa** o rótulo, **nunca o substitui** (o `label` continua obrigatório — ver a11y "Toda input precisa de label").
- **Texto/número/máscara:** exemplo do formato/conteúdo esperado ("Digite o código", "seu@email.com"). `DateField` já usa "dd/mm/aaaa"; `NumberField` já mostra o zero mascarado.
- **Select/Combobox/MultiSelect:** ação de escolha ("Selecione", "Selecione o cliente", "Todos" nos filtros multi).
- **Únicas exceções** (não têm placeholder por natureza): `Switch`, `Checkbox`, `RadioGroup` e campos read-only de exibição.

### `readOnly` copiável × campo-espelho inerte

Há **duas** situações de `readOnly` num `InputField`/`TextArea` — não as confunda:

- **Travado por permissão** (o form inteiro em modo leitura por falta de `update`): o campo continua **focável e selecionável** de propósito — o usuário precisa **copiar** o valor (CNPJ, código do lote, etc.). É o `readOnly` documentado em "Detalhe = Edição". **Não** o torne inerte.
- **Campo-espelho de exibição** (mostra um valor **derivado** que o usuário nunca digita — ex.: "Cliente" espelhando o pedido de origem, "Peso líquido" calculado): renderizar como `<input readOnly>` deixa ele **focável e com realce de seleção**, o que parece um bug ("o campo disabled ainda seleciona texto"). Torne-o **inerte**: `readOnly` + `tabIndex={-1}` + `className="pointer-events-none select-none"`. Fica com o visual de campo (alinha no grid), mas sem foco nem seleção. Julgue pelo campo: se o valor vale a pena copiar (código de lote/corrida), mantenha selecionável; se é só um espelho de contexto, deixe inerte.

### Campos com popover (`Combobox`/`Select`/`MultiSelect`/`DateField`/`DateTimeField`): nada a configurar

Todo campo que abre um popover herda o comportamento certo do próprio [`PopoverContent`](../../src/components/ui/popover.tsx) — **não passe `portal` e não escreva `z-index`**. Duas mecânicas independentes, ambas centralizadas:

- **Empilhamento:** `--z-floating` > `--z-overlay` (ver a seção "CAMADAS (z-index)" em [`src/index.css`](../../src/index.css)). Qualquer flutuante abre **na frente** de um modal, portalado ou não.
- **Portal:** o `PopoverContent` lê [`useInModal()`](../../src/hooks/useInModal.ts) e resolve sozinho — **não portala dentro de um `Modal`** (para o `react-remove-scroll` do Dialog liberar a roda do mouse na lista), **portala em página** (para ancorar sob o campo mesmo com ancestrais que criam bloco de contenção).

Sintomas e causas:

- Popover abrindo **no canto da tela** numa página → alguém forçou `portal={false}` indevidamente.
- Lista que rola pela barra mas **não pela roda do mouse** dentro de um modal → alguém forçou `portal={true}` dentro do modal, ou o container de scroll não é nativo (ver "Lista suspensa dentro de Dialog/Drawer" em [`components.md`](components.md)).
- Menu abrindo **atrás da modal** → alguém escreveu um `z-` solto em vez do token `z-(--z-floating)`.

### Máscara de quantidade e valor (pt-BR) — obrigatória (preenchimento E exibição)

**Todo campo de quantidade (com casas decimais), valor monetário ou valor numérico com decimais usa máscara pt-BR (milhar `.` e decimal `,`) — sem exceção.** Vale tanto para **entrada** (formulários) quanto para **exibição** (tabelas, detalhes, resumos). Número decimal cru na tela (`1500` onde deveria ser `1.500,00`, ou `10000` ambíguo num input) é bug de produto.

- **Entrada:** use o [`NumberField`](../../src/components/global/form/numberField.tsx) — mascara **na digitação** (os dígitos preenchem da direita, `150000` → `1.500,00`) e guarda um **`number`** no formulário. Para dinheiro, `prefix="R$ "`. **Nunca** `<InputField type="number">` para quantidade/valor.
- **Schema:** o campo é `z.number(...)` (o `NumberField` já entrega número); vazio → `undefined` → o `z.number` acusa "obrigatório". Não use `z.coerce.number()` sobre string mascarada.
- **Exibição:** formate com `toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })` — ou reaproveite o valor **já formatado** quando o backend o entrega pronto. Não jogue número cru em célula/rótulo.

### Field-arrays grandes: assinaturas ESCOPADAS (nunca `useWatch` no array inteiro)

**Em formulário com `useFieldArray` (lista de linhas, ainda mais se aninhado), NUNCA use `useWatch({ name: 'arrayInteiro' })` no componente pai.** Isso assina TODAS as mudanças de QUALQUER campo de QUALQUER linha; digitar uma tecla dispara re-render do pai e, em cascata, de **todas** as linhas — o formulário "trava independente de onde se mexe".

- **A lista/estrutura vem do `useFieldArray`** (`fields`) — ele re-renderiza só em mudança **estrutural** (append/remove/move/replace), não a cada tecla. Se o pai precisa de `replace` e um filho precisa de `fields`, pegue ambos do mesmo `useFieldArray` e **passe `fields` como prop** (evite dois `useFieldArray` no mesmo `name`).
- **Cada linha é um COMPONENTE próprio** (`<Row index={i} />`) que assina só o **seu** estado com ``useWatch({ name: `arr.${i}.campo` })``. Digitar numa linha re-renderiza no máximo aquela linha.
- **Dados estáticos da linha** (nome, unidade, grupo) saem do `fields[i]`, não de `useWatch`.
- **Agregados** (ex.: "selecionar todos") assinam só a projeção necessária: ``useWatch({ name: fields.map((_, i) => `arr.${i}.flag`) })`` — não o array inteiro.
- **Efeito que reage à MUDANÇA de um campo compara com o valor ANTERIOR (ref), nunca um guard "montou".** Sob **StrictMode** o efeito roda 2× no mount e o guard de mount dispara na 2ª passada — sujando o form (`shouldDirty`) e **sobrescrevendo valores carregados** (Descartar/Salvar aparecem sem edição). Use `const prevRef = useRef(campo); useEffect(() => { if (prevRef.current === campo) return; prevRef.current = campo; ...reset... }, [campo])`.
- **Memoize a linha (`React.memo`) com callbacks ESTÁVEIS** — para adicionar/remover um item montar só a linha nova. Handlers recebem o índice por parâmetro e são `useCallback` estáveis; `options` memoizadas. Sem isso, `React.memo` não segura (props com identidade nova a cada render).
- **Regras de hooks:** todos os `useWatch` da linha vêm ANTES de qualquer `return` condicional.

### Cobertura obrigatória com Zod

**Todo formulário precisa ter cada campo coberto por um schema Zod — sem exceção.** A validação acontece **antes** do submit e antes de qualquer chamada à API. O schema é a fonte de verdade do shape e das regras do formulário; nada de validação ad-hoc dentro do `onSubmit` ou em `useState`.

- **Defina um schema por formulário** com `z.object({ ... })` colocando regra apropriada em cada campo (`z.string().min(1, 'Obrigatório')`, `z.string().email('E-mail inválido')`, `z.coerce.number().int().positive()`, etc.). Não deixe campo "solto" — se ele existe no form, ele existe no schema.
- **Mensagens de erro em pt-BR** dentro do próprio schema (`{ message: 'Informe um CPF válido.' }`). Erros do Zod chegam direto nos `errors` dos fields — não reescreva no componente.
- **Tipos derivam do schema**: `type FormData = z.infer<typeof schema>`. Não declare uma `interface` paralela ao schema — quando ela diverge, o form mente.
- **Validações com dependência entre campos** vão em `.refine()` / `.superRefine()` (ex.: `passwordConfirm === password`, `endDate >= startDate`), não em `useEffect`.
- **Transformações de entrada/saída** (máscaras de CPF/telefone, parse de data) ficam no schema via `.transform()` ou nos utilitários de [`src/lib/dateTime/`](../../src/lib/dateTime). Não duplique no `onSubmit`.
- **Resposta da API que vira valor inicial** (modo edição) também passa por um schema — defina `apiSchema` e use `.parse()` antes de jogar no `defaultValues`. Servidor não é fonte de verdade do shape do cliente.

❌ Validação à mão fora do schema:

```tsx
const onSubmit = (data: FormData) => {
  if (!data.email.includes('@')) {
    toast.error('E-mail inválido');
    return;
  }
  // ...
};
```

✓ Tudo no schema, o form bloqueia o submit sozinho:

```ts
const schema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(8, 'Mínimo de 8 caracteres.'),
});
type FormData = z.infer<typeof schema>;
```
