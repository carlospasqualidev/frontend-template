# Convenções: botões, controles e ações de tela

Parte das convenções do projeto, lida sob demanda (ver **Guias de referência** no [`CLAUDE.md`](../../CLAUDE.md)). As regras gerais, que valem para toda tarefa, ficam no `CLAUDE.md`.

## Botões — tamanho/altura padrão do sistema (não misturar alturas)

**Use SEMPRE o tamanho padrão do [`Button`](../../src/components/global/button/button.tsx) (sem prop `size`) para qualquer botão de ação real** — ações de tela (`PageActions`), ações de formulário (Salvar/Cancelar), botões de barra de filtro (Buscar/Limpar), ações de diálogo, "Tentar novamente", "Expandir/Recolher", etc. O tamanho padrão (`h-8`) é a altura do sistema; recorrer a `size="sm"` (`h-7`) por reflexo deixa o botão **mais baixo que o resto** e quebra o alinhamento visual.

Tabela de tamanhos ([`components/ui/button.tsx`](../../src/components/ui/button.tsx)): `default` = `h-8` (**use este por padrão**), `sm` = `h-7`, `xs` = `h-6`, `lg` = `h-9`, `icon` = `size-8` (quadrado, só ícone).

Regras:

- **Ação real → tamanho `default`.** Não passe `size` a menos que haja motivo deliberado.
- **`size="sm"`/`xs` só para controles auxiliares densos** e reconhecidamente menores — ex.: chips/atalhos (presets de período), toolbar compacta dentro de um card denso, fileira de `RowActions`. Nunca para o botão primário de uma barra/rodapé.
- **Nunca misture alturas na MESMA linha/grupo de botões.** Se numa linha há um botão `default`, todos os botões daquela linha são `default`. (Um `sm` ao lado de um `default` é o erro clássico.)
- **`size="icon"` para botão só-ícone** (sempre com `tooltip` em pt-BR — ver a11y).
- Isso é ortogonal a `variant` (cor/ênfase) — variante escolhe a aparência; tamanho é sempre `default` salvo exceção justificada acima.

## Controles de formulário têm UMA altura padrão (`h-8`)

Todos os controles de campo do sistema têm a MESMA altura — **`h-8`** (32px): `ui/input` (usado por `InputField`/`DateField`/`DateTimeField`), `Select`, `MultiSelect` (`data-[size=default]:h-8`), `Combobox`. Um controle mais alto/baixo que os vizinhos numa linha de filtros/formulário é bug visual.

- **Ao escrever um gatilho/controle custom** (um botão que imita input), use **`h-8`** — nunca `h-9`/`h-10`. Espelhe o `ui/input`: `h-8`, `rounded-lg`, `px-2.5`, `text-sm`.
- Não misture alturas de controle na mesma linha; se um controle destoa, o errado é ele, não os outros.

## Erro de campo não desloca componentes vizinhos

Quando um campo (`InputField`/`NumberField`/`Combobox`/…) exibe mensagem de erro, ele cresce **para baixo** (a mensagem entra abaixo do input). Numa linha ou grid com outros elementos (botão ao lado, colunas irmãs), isso **não pode empurrar/deslocar os vizinhos**.

- **Linhas/grids de campos usam `items-start`** — nunca `items-end` ou `items-center` numa linha/grid onde algum campo pode exibir erro. `items-end`/`items-center` ancoram pelo rodapé/meio, que "desce" quando o erro aparece, arrastando os irmãos junto. Com `items-start`, cada item fica preso no topo e o erro cresce para baixo sem mover nada.
- **Botão/adorno ao lado de um campo**: alinhe-o ao **input**, não ao rodapé do campo (que cresce com o erro). Com o label acima, use `items-start` na linha e desça o botão pela altura do label (`mt-7` ≈ label `text-sm` + `gap-2` do campo) para casar com o input.

## Ações da tela ficam no topo (`PageActions`)

**Toda ação primária/contextual de uma tela (Novo, Editar, Excluir, Salvar, Cancelar…) vai no topo, via [`PageActions`](../../src/components/global/layout/pageActions.tsx)** — o slot exportável que renderiza (por portal) no header global do [`Layout`](../../src/components/global/layout/layout.tsx), ao lado do breadcrumb. **Não** crie uma barra de ações própria no corpo da tela, nem espalhe botões de ação soltos no meio do conteúdo.

- **Todo botão do `PageActions` colapsa para ícone no mobile — sem exceção.** O header divide o espaço com o breadcrumb; botão só-texto empurra e quebra o breadcrumb em telas estreitas. Portanto **cada** ação (inclusive `Cancelar`, `Descartar`, `Criar`/`Salvar alterações`, não só `Excluir`) segue o mesmo padrão: **ícone + `aria-label` em pt-BR + texto em `<span className="hidden sm:inline">`**. No mobile fica só o ícone; no desktop, ícone + texto. Nunca deixe um botão de ação só com texto (empurra o breadcrumb) nem só com ícone sem `aria-label` (quebra a acessibilidade). Ícones canônicos: Cancelar/Descartar → `X`, salvar/confirmar → `Check`, criar → `Plus`/ícone do módulo, excluir → `Trash2`.

  ```tsx
  <Button aria-label="Salvar alterações" type="submit" form={FORM_ID}>
    <Check />
    <span className="hidden sm:inline">Salvar alterações</span>
  </Button>
  ```

  O `aria-label` também mantém o nome acessível estável para os testes (`getByRole('button', { name: 'Salvar alterações' })`) mesmo com o texto oculto no mobile.

- Ações destrutivas/críticas usam `ConfirmDialog` (ver **Abstrações globais** em [`components.md`](components.md)).
- A ordem visual segue: ações secundárias/destrutivas à esquerda, ação primária à direita (ex.: `Excluir` sozinho; ou `Descartar` … `Salvar alterações` quando há mudança).

**Ação de uma seção (não da tela) vai no slot `action` do `Card`** — alinhada à direita do cabeçalho, não solta acima/dentro do corpo. Ação da _tela_ inteira continua no `PageActions`; ação de uma _seção_ (ex.: "Adicionar item" numa coleção-filha) fica no `action` do `Card` que a envolve.

```tsx
<Card
  title="Membros"
  description="Pessoas com acesso a este projeto."
  action={
    <Button variant="outline" size="sm">
      <Plus />
      Adicionar membro
    </Button>
  }
>
  {/* … lista … */}
</Card>
```

## Detalhe = Edição (edição sempre liberada; salvar aparece quando há mudança)

**Quando uma entidade tem edição, a tela de detalhe É a tela de edição — não crie uma tela separada só de visualização.** Regra de produto: **a ação tem que ser o mais simples possível** — a tela **abre já editável**, sem passo intermediário de "Editar". Os campos ficam editáveis desde o primeiro render; **o `Salvar alterações` só aparece quando há mudança** (o formulário fica _dirty_). No topo (`PageActions`):

- **Sem mudanças (form pristine):** só **`Excluir`** (se permitido). Nada de `Editar`, nada de `Salvar`.
- **Com mudanças (form dirty):** o `Excluir` **some** e aparecem **`Descartar`** + **`Salvar alterações`**. `Descartar` reverte o formulário (`reset()` — volta ao último estado salvo/carregado); `Salvar alterações` persiste **sem trocar de rota** e, ao concluir, o form volta a pristine (aí o `Salvar`/`Descartar` some e o `Excluir` reaparece).
- **Sem permissão de update** (ou entidade protegida/de sistema): a tela cai em **modo leitura** — os campos ficam `readOnly`/`disabled` e não há fluxo de salvar; só o `Excluir` (se houver permissão de delete). Ou seja, `readOnly` é derivado **da permissão**, não de um toggle de UI.
- **Criação (`/create`)** é sempre editável: **`Cancelar`** (volta à lista) sempre visível + **`Criar`** que aparece quando há mudança (form dirty).

Gate por permissão: o fluxo de salvar/descartar só existe com a permissão de update; `Excluir` só com a de delete. A rota de detalhe e a de criação reusam **o mesmo componente de formulário** (não duplique).

Implementação (aprendizados que evitam bugs sutis — seguir à risca):

- **Estado _dirty_ vem do RHF (`formState.isDirty`), não de `useState`.** Não crie um `editing`/`setEditing`. `readOnly` = `isDetail && !podeEditar` (a permissão), e o par `Descartar`/`Salvar alterações` renderiza sob `!readOnly && isDirty`.
- **Ao salvar, volte o form a pristine.** No `onSuccess` de update, faça `reset(getValues())` para adotar os valores atuais como novo baseline (`isDirty` → `false`). Se os filhos têm IDs do servidor que só chegam no refetch (coleção-filha com endpoints próprios), ressincronize o form com os dados refetchados **quando já estiver pristine** (guarde com um `ref` de `isDirty` para não sobrescrever uma edição em andamento por refetch de fundo).
- **`defaultValues` precisam bater com o que os controles produzem** — senão o form nasce _dirty_ à toa (ex.: campo `undefined` no default mas `''` no controle). Use mapeadores `entityToFormValues` que normalizam tudo. `setValue` que alimenta campo controlado precisa de `shouldDirty: true` para revelar o `Salvar`.
- **Leitura por tipo de campo (quando `readOnly` por falta de permissão) — NÃO use `<fieldset disabled>`.** O `fieldset` impede **copiar** o texto e não trava o dropdown do `Select` (Radix) nem widgets externos (ex.: campo de telefone). Em vez disso: campos de **texto** (`InputField`, `TextArea` e derivados como campos mascarados) recebem **`readOnly`** (ficam selecionáveis/copiáveis, mas não editáveis); os controles **sem seleção de texto** (`Select`, `Switch` e afins) recebem **`disabled`** (não abrem/não trocam). Os fields globais passam `disabled`/`readOnly` para o controle renderizado, **não** para o `useController` — então isso **não** zera o valor no RHF. Uma seção recebe um único flag `readOnly` e também o usa para **esconder** botões de adicionar/remover em leitura. O `ui/input` e `ui/textarea` têm um leve realce de leitura (`read-only:bg-muted/40`).
- **Monte o formulário só com os dados prontos** (casca que faz as queries + gate de loading → componente interno com `useZodForm({ defaultValues })`). Setar valor depois via `values`/`reset` do RHF **não sincroniza** com `Select` do Radix (o valor fica vazio). Use `key` estável no interno (ex.: `key={id ?? 'create'}`).
- **`key` distinta em cada botão de ação** do `PageActions`. Sem isso, o React reusa o mesmo nó `<button>` entre um botão `type="button"` (ex.: `Descartar`) e um `type="submit"` (`Salvar alterações`) na mesma posição — o clique passa a submeter o formulário sem querer.
- **Formulário que ocupa mais de uma aba** (o detalhe do usuário: o cadastro em "Visão geral", os cargos em "Cargos"): o `useZodForm` fica no componente **acima** do `UrlTabs`. A aba inativa desmonta, mas os valores continuam no RHF, então trocar de aba não perde a edição e o `Salvar alterações` do topo vale em qualquer aba. Como o `<form>` só existe na aba que o renderiza, o `Salvar` chama o `handleSubmit` pelo `onClick` (`type="button"`), sem `form={FORM_ID}`; o `<form onSubmit>` da aba fica para o `Enter`. Não embrulhe o `UrlTabs` num `<form>`: botão sem `type` dentro de uma aba (a paginação da "Atividade") viraria submit.
- **Formulário de uma aba só, numa página com outras abas** (Minha conta: o perfil vive na aba "Perfil"): a aba inativa desmonta e leva a edição junto, então trocar de aba com alteração não salva **pede confirmação** em vez de descartar calado. É o mesmo guard de sair da tela (ver **Edição não salva** em [`forms.md`](forms.md)): trocar de aba é uma navegação do roteador (`?tab=`), e o formulário da aba passa `useUnsavedChangesGuard(isDirty, { searchKey: 'tab' })`, com o que a troca de aba também pergunta ("Descartar alterações" troca e descarta; "Continuar editando" fica na aba, com a edição). As setas passam pela confirmação como o clique; abrir a aba em nova guia do navegador (clique do meio, Ctrl/Cmd/Shift+clique) não passa por ela nem troca a aba atual. Referência: [`screens/account/profile/profileTab.tsx`](../../src/screens/account/profile/profileTab.tsx). O formulário **acima** das abas (detalhe de usuário e de cargo) não passa `searchKey`: trocar de aba ali não sai da edição.
- **Um `Salvar` que grava por mais de uma rota** (o cadastro em `PATCH /client/users/:userId` e os cargos em `PUT /client/users/:userId/roles`): mande só o que mudou, uma rota depois da outra, e ponha no cache o que cada resposta devolve. Se a segunda recusar, o que a primeira gravou vira o novo ponto de partida e a parte recusada continua pendente, com o toast do servidor. Referências: [`screens/users/details/index.tsx`](../../src/screens/users/details/index.tsx) e, com o cargo (`PUT /client/roles/:roleId`) e os usuários dele (`PUT /client/roles/:roleId/users`), [`screens/roles/details/index.tsx`](../../src/screens/roles/details/index.tsx).
- **Uma referência só: o registro do cache.** É com ele que o `Salvar` compara, é a ele que o `Descartar` volta e é contra ele que o _dirty_ aparece. Sempre que o registro do cache muda (a resposta de uma gravação, uma ação lateral como "Bloquear", uma releitura), um `useEffect` refaz o ponto de partida: `reset` com o registro novo e, depois dele, `setValue(..., { shouldDirty: true })` nos campos que a pessoa alterou em relação ao ponto de partida anterior e que o registro novo não tem (inclusive o que ela digitou enquanto a gravação ou a releitura corria). Campo que ela não mexeu segue o servidor, então o próximo `Salvar` não desfaz em silêncio o que outra pessoa gravou no meio. Referência: `pendingFieldsOnRebase` em [`screens/users/utils/userForm.ts`](../../src/screens/users/utils/userForm.ts) e, com o perfil gravado como registro, `pendingProfileFieldsOnRebase` em [`screens/account/profile/profileForm.ts`](../../src/screens/account/profile/profileForm.ts).

## Ações de item: coleção-filha (inline) × lista de topo (menu "⋯")

Há **dois** padrões de ação sobre itens, e eles **não se misturam**. Antes de criar uma tela com itens editáveis, decida em qual caso você está e siga o padrão correspondente — não invente um terceiro (ex.: modal com "Salvar" próprio para um filho).

**1. Coleção-filha dentro de um detalhe/formulário** (endereços e contatos do Cliente; localizações do Armazém; itens/anexos de um cadastro). A coleção pertence a uma entidade-pai que tem tela de detalhe no padrão **Detalhe = Edição**. Regras **obrigatórias**:

- **Sem CRUD próprio, sem "Salvar" separado.** Nada de modal por item com botão de salvar próprio, nem de chamada à API por linha no `onClick`. Criar/editar/remover filhos é **inline** e é **persistido pelo mesmo `Salvar alterações` do topo** do pai — junto com o resto do formulário.
- Como a tela abre já editável (ver "Detalhe = Edição"), os filhos já vêm como **linha editável** (`useFieldArray`): há um botão **"Adicionar X"** (append) e um ícone de **remover** (`X`/`Trash2`, `type="button"`) por linha. Nenhum desses botões submete o form; mexer neles deixa o pai _dirty_ e faz o `Salvar alterações` aparecer. (Só ficam estáticos/read-only quando o pai inteiro está em modo leitura por **falta de permissão** de update.)
- **Prefira uma tabela compacta (uma linha por item) a um card grande por item.** Cada linha é uma linha de formulário; o cabeçalho da coluna é o rótulo visual, então os campos in-cell usam **`srOnlyLabel`** (rótulo acessível ao leitor de tela, oculto visualmente — evita repetir o rótulo em cada célula). Campos secundários/raros (ex.: conversão de unidade, opções avançadas) ficam atrás de um **popover por linha** (disclosure progressivo), não poluindo a linha. Tabela larga rola horizontalmente (`overflow-x-auto` no container — ver "Design responsivo"), nunca esconda coluna no mobile.
- No `Salvar alterações` do topo: se o backend tem um endpoint que grava o pai **com** os filhos (ex.: Cliente — o servidor recria os filhos), mande tudo num payload só. Se os filhos têm **endpoints próprios** (ex.: Armazém → `/locations`), **faça o diff** (criar/editar/excluir) contra o estado original e dispare as chamadas **na mesma ação de salvar**, depois invalide. Ressincronize o form com os dados do servidor após salvar (senão uma linha nova sem `id` é recriada no próximo salvar).
- Gate de permissão por ação do filho continua valendo (ex.: `Adicionar` só com a permissão de criar do filho).
- Referências vivas: **Clientes** (`screens/customers/form/` — `contactsTable.tsx`, `addressFields.tsx`) e **Armazéns** (`screens/warehouses/details/` — `locationsFieldArray.tsx` + diff em `schema.ts`).

**2. Lista de topo (entidades de 1ª classe numa `DataTable`)** — Usuários, Clientes, Perfis, Indicadores, Armazéns (a **listagem**).

- **Editar é SEMPRE pelo clique na linha** (`onRowClick` + `getRowHref`), que abre o detalhe/modal de edição. **Nunca** coloque uma ação "Editar" no menu "⋯" — ela seria redundante com o clique na linha e o usuário deve aprender um gesto único para editar.
- O **menu "⋯"** (`actionsColumn` de `components/global/dataTable/columnHelpers`) existe só para as ações que **não são** "abrir/editar": `Excluir` (destrutivo em vermelho), `Ativar/Inativar`, `Bloquear/Desbloquear`, `Copiar…` etc. Se, tiradas essas, não sobra nenhuma ação para a qual o usuário tenha permissão, **não renderize a coluna** (só inclua `actionsColumn` quando houver ação efetiva).
- **Não** use ícones de ação soltos na célula nem um layout de ações diferente por tela — clique na linha (editar) + "⋯" (demais ações) é o padrão único.

Resumo: **item de lista de topo → clique na linha edita; "⋯" só para Excluir/toggle de status/ações auxiliares (e some se não sobrar ação permitida). Filho de um detalhe → inline, sem save próprio, tudo pelo `Salvar alterações` do topo do pai.**

### Exceção: telas operacionais usam ações em BOTÕES visíveis (`RowActions`)

Numa tela **operacional** — aquela em que a mesma pessoa repete as etapas do fluxo dezenas de vezes por dia — as ações da linha viram **botões-ícone visíveis** em vez do menu "⋯": esconder cada ação atrás de um menu custa um clique a mais em **cada** repetição. Isso é **decisão de produto por tela**, não um estilo alternativo: registre aqui a tela que adotou o padrão, e mantenha o menu "⋯" em todas as outras (inclusive nas demais telas do mesmo módulo).

- Use **[`RowActions`](../../src/components/global/rowActions/rowActions.tsx)** (célula de tabela montada à mão) ou o helper **`rowActionsColumn`** ([`dataTable/columnHelpers.tsx`](../../src/components/global/dataTable/columnHelpers.tsx)) numa `DataTable`. **Não** monte fileira de botões à mão na célula.
- Cada ação declara `key`, `label` (pt-BR — vira tooltip **e** `aria-label`), `icon` e um **`tone`**. A cor é o que o operador reconhece **antes** de ler o tooltip, então a mesma ação mantém o mesmo tom em todas as telas. Os tons vêm de tokens do `index.css` — **nunca** cor solta via `className`. Precisa de um tom novo? Token + entrada em `toneClasses`.
- **Etapa indisponível fica visível e desabilitada** (`disabled` + `disabledReason`), nunca omitida: a posição de cada ícone não muda entre linhas (memória muscular) e o tooltip diz o que falta. Só omita a ação quando ela **não existe** para aquela linha (ex.: sem permissão).
- **Não duplique um caminho que já existe na célula.** Se a ação já é oferecida na coluna do assunto dela, não entra também na coluna de ações.
- **Ação que NAVEGA declara `href`** (além do `onSelect`): o botão vira um `<a>` de verdade, então **clique do meio** e Ctrl/Cmd/Shift+clique abrem em **nova aba** — o operador abre a etapa sem perder a listagem filtrada — e o clique normal segue a navegação SPA. Ação que abre modal/confirmação não tem `href`.
- **Continua sem `Editar` na coluna de ações**: o clique na linha já abre a edição.
