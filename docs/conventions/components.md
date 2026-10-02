# Convenções: notificações, shadcn/ui, abstrações globais e Storybook

Parte das convenções do projeto, lida sob demanda (ver **Guias de referência** no [`CLAUDE.md`](../../CLAUDE.md)). As regras gerais, que valem para toda tarefa, ficam no `CLAUDE.md`.

## Notificações

- `sonner` (Toaster montado no `Layout`). Os interceptors do `api` já disparam toasts de erro — não duplique no caller.
- **Cores por tipo** (em [`ui/sonner.tsx`](../../src/components/ui/sonner.tsx)): `richColors` ligado; sucesso em **verde** (`--success`) e erro em **vermelho** (`--destructive`), derivados dos tokens semânticos. O mix de cor é em **`srgb`** (não `oklch`) — no oklch a interpolação de matiz contra o neutro puxa o verde para o lado errado no dark. Ao mexer nas cores do toast, mantenha `in srgb`.

## shadcn/ui

- Adicione componentes via CLI: `npx shadcn@latest add <nome>`. **Não escreva à mão.**
- Customize `components/ui/<x>.tsx` localmente quando necessário; mas só edite o que foi gerado pelo shadcn.
- **Componentes próprios (não-shadcn) ficam em `components/global/`, não em `components/ui/`.** Exemplo: o primitivo `MultiSelect` é escrito à mão e vive em [`global/form/multiSelectPrimitive.tsx`](../../src/components/global/form/multiSelectPrimitive.tsx), ao lado do wrapper integrado ao `react-hook-form`.
- Wrappers genéricos só com ganho real (API simplificada, default visual do projeto, integração com `react-hook-form`). Quando criar um, siga o padrão em **Abstrações globais** abaixo.
- Use `cn()` de [`src/lib/utils.ts`](../../src/lib/utils.ts) para concatenar classes do Tailwind.

## Abstrações globais (`components/global/`)

Wrappers sobre primitivos do shadcn que padronizam API, defaults visuais (incluindo dark mode) e integração com `react-hook-form`.

**Regra dura: sempre prefira a abstração de `components/global/` antes de importar do `components/ui/`.** O `components/ui/` é o andar do primitivo shadcn cru — ele existe para alimentar o `global/`, não para ser consumido direto pelas telas. Quando você importa `@/components/ui/...` numa tela, você está pulando a camada que padroniza dark mode, espaçamento, integração com `react-hook-form` e tom visual do projeto — e a próxima tela vai parecer diferente da anterior.

- **Antes de importar de `components/ui/`**, varra `components/global/` (incluindo `global/form/`) atrás de equivalente. Se já existe, use o global.
- **Se faltar a abstração**, crie uma nova em `components/global/<nome>/` seguindo o padrão da seção "Padrão para criar uma nova abstração global" abaixo — assim a próxima tela já encontra pronto. Não saia importando `ui/` direto "só por essa vez".
- **Exceções legítimas para importar de `ui/` direto**: (1) você está escrevendo a própria abstração `global/` que envolve aquele primitivo; (2) é um primitivo composicional puro sem equivalente global (ex.: `Tabs`, `Sheet`, `Popover` usados como blocos de layout). Em nenhum caso `Button`, `Card`, `Input`, `Select`, `Dialog`, `Checkbox`, `Switch`, `Textarea` devem ser importados de `ui/` numa tela — todos têm wrapper global.

Use estes antes de cair direto no `components/ui/`:

| Abstração          | Caminho                                                                                                      | Quando usar                                                                                                                                                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Card`             | [`card/card.tsx`](../../src/components/global/card/card.tsx)                                                 | Container de conteúdo com `title` + `description` + `children`. Já trata `bg-card`, borda, `shadow-sm` (light) e `dark:shadow-none`. Com `expanded`/`onToggle` vira **seção recolhível** (ver abaixo).                                                                                                           |
| `Modal`            | [`modal/modal.tsx`](../../src/components/global/modal/modal.tsx)                                             | Dialog no desktop, drawer no mobile. Props: `title`, `description`, `children`, `open`, `setOpen`, `size` (`default`/`lg`/`xl`/`2xl` — largura no desktop; no mobile é sempre full-width), `icon`, `onBack`/`backLabel` (ver abaixo).                                                                            |
| `ModalFooter`      | [`modal/modal.tsx`](../../src/components/global/modal/modal.tsx)                                             | Rodapé de ações de um modal. Envolve o(s) botão(ões) de ação (Salvar/Criar) para que ocupem **100% da largura** do modal (empilhados quando há mais de um). Padrão único de todos os modais de ação.                                                                                                             |
| `Empty`            | [`empty/empty.tsx`](../../src/components/global/empty/empty.tsx)                                             | Empty state. Props: `title`, `description` (obrigatórios), `icon`, `children` (opcionais).                                                                                                                                                                                                                       |
| `Skeleton*`        | [`skeleton/skeleton.tsx`](../../src/components/global/skeleton/skeleton.tsx)                                 | `SkeletonText`, `SkeletonValue`, `SkeletonBadge`, `SkeletonAvatar`. **Skeleton só no dado, nunca no card inteiro** — rótulos, títulos e estrutura permanecem visíveis durante o load.                                                                                                                            |
| `Button`           | [`button/button.tsx`](../../src/components/global/button/button.tsx)                                         | Estende o Button do shadcn com `loading` (spinner + desabilita) e **`tooltip`** (tooltip no hover/foco + `aria-label` — obrigatório em botão só-ícone; traz o próprio `TooltipProvider`). Mantém variantes/props do primitivo.                                                                                   |
| `ConfirmDialog`    | [`confirmDialog/confirmDialog.tsx`](../../src/components/global/confirmDialog/confirmDialog.tsx)             | Confirmação para ações destrutivas/reversíveis. **Uncontrolled** (`trigger` prop, estado interno) ou **controlled** (`open`/`setOpen`). Loading interno automático e auto-close. Controlled sem `trigger`: `onCloseAutoFocus` devolve o foco ao fechar (sem ele, cai no `body`).                                 |
| `PageHeader`       | [`pageHeader/pageHeader.tsx`](../../src/components/global/pageHeader/pageHeader.tsx)                         | Cabeçalho padrão de tela: `title`, `description`, `actions` opcional. Usado em `home/`.                                                                                                                                                                                                                          |
| `InfoTooltip`      | [`infoTooltip/infoTooltip.tsx`](../../src/components/global/infoTooltip/infoTooltip.tsx)                     | Ícone `i` com tooltip acessível (hover/foco) ao lado de um rótulo/campo. Traz o próprio `TooltipProvider`; props `label`/`triggerLabel`/`className`.                                                                                                                                                             |
| `FileDropzone`     | [`fileDropzone/fileDropzone.tsx`](../../src/components/global/fileDropzone/fileDropzone.tsx)                 | Área de upload com arrastar-e-soltar, seleção por clique/teclado e prévia (nome + tamanho + remover). **Um** arquivo (`file`/`onFileChange`) ou **vários** (`multiple` + `onFilesChange`, sem prévia — quem consome é dono da lista); props `accept`/`hint`/`disabled`/`id`.                                     |
| `ImageUploadField` | [`imageUploadField/imageUploadField.tsx`](../../src/components/global/imageUploadField/imageUploadField.tsx) | Upload + galeria de imagens (prévia, abrir em nova aba, remover). Sobe as fotos em paralelo e anexa só as que subiram. **Nunca duplique dropzone+galeria numa tela** — use este. `type` separa seções de foto que dividem o mesmo array.                                                                         |
| `RowActions`       | [`rowActions/rowActions.tsx`](../../src/components/global/rowActions/rowActions.tsx)                         | Ações de linha como botões-ícone visíveis (`tone` por ação, `disabled`+`disabledReason`, `href` que vira link de verdade). **Só em telas operacionais** — ver "Ações de item". Numa `DataTable`, use `rowActionsColumn`.                                                                                         |
| `CollapsibleCard`  | [`collapsibleCard/collapsibleCard.tsx`](../../src/components/global/collapsibleCard/collapsibleCard.tsx)     | **Item de lista** recolhível (cabeçalho tonado + resumo + ações, corpo animado). Controlado por `expanded`/`onToggle`. Para **seção de página**, use o `Card` com `expanded` — ver abaixo.                                                                                                                       |
| `FormTable`        | [`formTable/formTable.tsx`](../../src/components/global/formTable/formTable.tsx)                             | "Chrome" de tabela dentro de formulário — coleção editável inline (borda arredondada + cabeçalho na marca). Não confundir com a `DataTable` (listagem paginada server-side).                                                                                                                                     |
| `FieldChanges`     | [`fieldChanges/fieldChanges.tsx`](../../src/components/global/fieldChanges/fieldChanges.tsx)                 | De→para de um evento da auditoria (`fieldChanges` do servidor): `rótulo: de → para`, anterior riscado (`<del>`), novo em destaque (`<ins>`), `[Vazio]`/`[omitido]` em itálico. Sem mudanças, `emptyMessage`. Usado no detalhe da auditoria e na aba "Atividade".                                                 |
| `DemoNotice`       | [`demoNotice/demoNotice.tsx`](../../src/components/global/demoNotice/demoNotice.tsx)                         | Aviso "Dados de demonstração" de toda parte da tela que o servidor não atende. `badge` (padrão) no `action` do `Card` ou num bloco; `banner` (`role="note"`, com `description`) no topo de uma aba inteira de demonstração. Ações dessas partes chamam `notifyDemoAction`. Ver **Dados de demonstração** abaixo. |

### Dados de demonstração: toda parte sem servidor usa o `DemoNotice` (regra dura)

O que o servidor ainda não atende (hoje: 2FA, sessões ativas da conta e do usuário, preferências de notificação, plano e cobrança, convites, pendências e as métricas da home sem rota) continua como **exemplo de tela**, mas **nunca** se passa por função pronta:

- **Aviso visível, sempre o mesmo componente.** Card ou bloco com dado fixo leva o [`DemoNotice`](../../src/components/global/demoNotice/demoNotice.tsx) no cabeçalho (`action` do `Card`; num indicador, dentro dele); aba que é toda exemplo leva o `DemoNotice variant="banner"` no topo, com a `description` dizendo o que falta no servidor. Nada de texto próprio, cor solta ou aviso só num tooltip: o texto "Dados de demonstração" é o mesmo em todo o sistema, na cor `warning` da paleta, nos dois temas.
- **Os dados ficam num arquivo `*Demo.ts`** ao lado da tela que os usa (ex.: [`homeDemo.ts`](../../src/screens/home/utils/homeDemo.ts), [`accountSecurityDemo.ts`](../../src/screens/account/security/accountSecurityDemo.ts)), com um comentário no topo dizendo por que o servidor não os tem. Nunca dado fixo espalhado no componente, nunca no serviço (`services/` só fala com o servidor).
- **Ação de demonstração não simula confirmação.** Botão ou interruptor de uma parte de demonstração chama [`notifyDemoAction`](../../src/components/global/demoNotice/notifyDemoAction.ts) ("Dados de demonstração: nada foi alterado."), nunca um toast de sucesso inventado ("Sessão encerrada.").
- **O que é real, na mesma tela, não leva o aviso** (a troca de senha na aba "Segurança", os números de usuários na home): o aviso vale para a parte, não para a tela inteira.
- Quando o servidor ganhar a rota, a parte vira real: serviço em `services/<módulo>/`, o `*Demo.ts` e o `DemoNotice` saem (ver **Modo híbrido** em **Contrato com o backend**, [`http-and-state.md`](http-and-state.md)).

### Seção de página recolhível: `Card` com `expanded`/`onToggle` (não `CollapsibleCard`)

Tela longa cujas seções o usuário quer recolher usa o **`Card` global** com `expanded` + `onToggle` — o título vira o gatilho (chevron + clique) e o corpo anima a altura. **Não** troque o `Card` pelo `CollapsibleCard` para isso: o `CollapsibleCard` é o **item de lista** (fundo `bg-muted/40`, borda fina, sem `description`) usado dentro de um card. Os dois convivem: seção de página = `Card`; item dentro dela = `CollapsibleCard`.

- **Controlado, sempre.** A tela guarda quais seções estão abertas (`Set` no `useState`) — é o que permite decidir o padrão de abertura e **revelar** uma seção recolhida por conta própria.
- **Erro de validação escondido não pode existir (regra dura).** Se uma seção recolhida tem campo obrigatório, o `Salvar` falharia **em silêncio** — o formulário não submete e a mensagem fica dentro do bloco fechado. No `handleSubmit`, passe o **segundo callback** (`onInvalid`) e abra as seções com erro, mapeando campo → seção num `Map` (nunca objeto indexado por variável).
- **O que abre por padrão depende do modo:** no **detalhe**, só a primeira (identificação) — a tela abre no que identifica o registro; na **criação**, todas as seções, porque é preciso preencher todas para cadastrar.
- Os campos das seções recolhidas **desmontam**, mas o valor permanece no formulário (o RHF não desregistra ao desmontar) — recolher uma seção não perde o que foi digitado nem altera o que é enviado.

**Botão "Adicionar item" de uma coleção INLINE fica alinhado à DIREITA (regra dura).** Os botões de append de um `useFieldArray` que ficam **no corpo** (abaixo/acima da lista, não no cabeçalho de um `Card`) são **outline** (`Plus` + texto) e **sempre alinhados à direita** — envolva num `<div className="flex justify-end">`. Nunca à esquerda. (Quando a ação é a primária **de um `Card`**, ela vai no `action` do cabeçalho; este caso é o "adicionar mais uma linha" de uma coleção editável inline, que não tem cabeçalho próprio.)

```tsx
{
  !readOnly && (
    <div className="flex justify-end">
      <Button type="button" variant="outline" onClick={() => append(NEW_ITEM)}>
        <Plus />
        Adicionar contato
      </Button>
    </div>
  );
}
```

### Cabeçalho do modal: faixa própria, e o `icon` do contexto

O cabeçalho de **todo** modal vem numa **faixa própria** (`bg-muted/40`, o mesmo tom do `CollapsibleCard`), separada do corpo por `border-b` e com um **fio de 2px na cor da marca** no topo. Isso vive no `Modal` global (`HEADER_BAND`) — nenhuma tela configura nada. Sem a faixa, o cabeçalho divide o mesmo plano branco dos campos e o modal fica sem âncora, enquanto **toda tabela do sistema** já tem cabeçalho tonado.

- **Passe o `icon`** quando existir um ícone que **levou** até o modal — o item do menu, a ação da linha, o ícone do módulo. Ele aparece num quadrado tonado (`bg-primary/15`) à esquerda do título e faz o modal **continuar** o passo anterior em vez de recomeçar num bloco de texto. É decorativo (`aria-hidden`): quem nomeia o modal é o `title`. Reaproveite o **mesmo** mapa de ícones que o passo anterior usa — não duplique o mapa.
- Ícone escolhido em tempo de execução vai por **`createElement`**, não por variável `Maiúscula` usada como JSX: `const Icon = cond ? A : B; <Icon />` no corpo do render dispara `react-hooks/static-components`.
- **Não** ponha `overflow-hidden` no `DialogContent` para arredondar a faixa. O `DialogContent` tem `transform`, logo é o bloco de contenção dos filhos `fixed`, e o popover dos campos — que dentro do modal **não** portalam (`Select` searchable, `Combobox`, `MultiSelect`, `DateField`, `DateTimeField`) — seria **recortado**. Os cantos da faixa acompanham o modal pelo `rounded-t-xl` dela. O `p-0 gap-0` do `DialogContent` é o que deixa a faixa sangrar até a borda; o padding passou para a faixa e para o corpo.
- **Tabela larga dentro de modal rola DENTRO dele.** O corpo é um `ScrollArea` com `min-w-0`: sem isso, como item do grid do `DialogContent`, ele cresceria até a largura do conteúdo (`min-width:auto`) e a tabela **vazaria** para fora do modal. Com `min-w-0`, o `overflow-x-auto` do container da tabela aciona o scroll lateral dentro do modal. Vale para qualquer tabela larga, sem ajuste por tela.

**`Modal` — botões de ação (`ModalFooter`), dirty-gate e botão de voltar (`onBack`):** três regras para todo modal de ação seguir o mesmo padrão.

- **Botões de ação SEMPRE via `ModalFooter`, ocupando 100% da largura.** Envolva o(s) botão(ões) de ação (Salvar/Criar) do modal em `<ModalFooter>` — nunca use `<div className="flex justify-end">` nem deixe o botão solto. O `ModalFooter` estica os botões para a largura total do modal (`flex flex-col`; quando há mais de um, ficam empilhados, cada um 100%).
- **Salvar/Criar só aparece quando o formulário está _dirty_.** Em qualquer modal de formulário (criar **ou** editar), o botão de submit renderiza sob `{formState.isDirty && ...}` — nada mudou, nenhum botão. Não adicione um "Cancelar" próprio: o `X` do modal (e o clique fora) já cancela. Exceção: ações **de estado** que não dependem de alteração podem ficar sempre visíveis quando aplicáveis.
- **Botão de voltar (`onBack`) para fluxos com passos.** Quando um modal tem passos (ex.: escolher uma opção → formulário), passe `onBack` (e `backLabel` para o `aria-label`, padrão "Voltar") ao `Modal`: ele renderiza um **botão-ícone de voltar à esquerda do título**, alinhado verticalmente entre título e descrição. Não coloque o "voltar" solto no corpo do modal.

**`Modal` — scroll do corpo (Dialog no desktop / Drawer no mobile):** o corpo do `Modal` precisa rolar quando o conteúdo passa da altura da tela. No **mobile (Drawer/vaul)** o corpo é um **container de scroll NATIVO** (`<div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">`), **nunca** o `ScrollArea` do Radix — o vaul só reconhece overflow nativo para diferenciar "rolar conteúdo" de "arrastar o drawer" no toque; com `ScrollArea` o gesto não rola no celular. `flex-1 min-h-0` limita a altura ao espaço restante do drawer (habilita o scroll interno). O drawer inferior (`ui/drawer.tsx`) usa `mt-6` + `max-h-[92dvh]` (não `mt-24`/`max-h-[80vh]`) para não deixar uma faixa de fechamento morta grande acima dele. No desktop (Dialog), scroll do corpo é normal (roda do mouse).

**Lista suspensa (dropdown/popover) dentro de Dialog/Drawer: scroll NATIVO + conteúdo NÃO portalado.** Para a roda do mouse rolar a lista de um popover que vive dentro de um `Modal` (opções de um combobox, menu longo, etc.), **duas** coisas precisam ser verdade — uma só não basta:

1. **Container de overflow nativo** (`max-h-* overflow-y-auto`), nunca o `ScrollArea` do Radix. O `react-remove-scroll` do Dialog/Drawer só reconhece scroll nativo.
2. **Conteúdo do popover NÃO portalado.** O `react-remove-scroll` bloqueia o wheel em tudo que está **fora** da subárvore do Dialog; conteúdo portalado no `body` fica fora dessa subárvore e o wheel é bloqueado mesmo com overflow nativo. Não portalado, o conteúdo renderiza dentro do Dialog (no allowlist do RemoveScroll) e a roda funciona; como o Popover é `position: fixed` (Floating UI), não portalar **não** causa recorte por `overflow` nem erra o posicionamento.

Sintoma de esquecer o item 2: a lista rola pela barra mas **não pela roda do mouse** dentro do modal.

**Para os campos e para qualquer popover, o item 2 é automático:** o `Modal` marca a subárvore via [`InModalContext`](../../src/hooks/useInModal.ts) e é o **próprio `PopoverContent`** ([`ui/popover.tsx`](../../src/components/ui/popover.tsx)) que lê `useInModal()` e decide — `portal={false}` dentro de modal, `portal={true}` em página. Isso vale para `Combobox`, `Select` searchable, `MultiSelect`, `DateField`, `DateTimeField` **e para popovers montados à mão**. **Não passe `portal` manualmente**: a prop existe só como escape hatch e sempre vence o default (é assim que se produz o bug).

**Regra dura — a decisão do `portal` mora no `PopoverContent`, não em cada campo.** Se você criar uma abstração de campo que abre um `Popover`, **não repita a regra**: só encaminhe a prop (`portal={portal}`, normalmente `undefined`). Foi a duplicação dessa regra campo a campo que deixou `DateField`/`DateTimeField` de fora e trouxe de volta o "calendário abre atrás da modal". Nunca chumbe `false` "para consertar o scroll do modal" (quebra todas as páginas) nem `true` "para ancorar" (quebra a roda do mouse nos modais).

### Tranca do scroll da página: camada de ESCOLHA tranca, camada AUXILIAR não

Enquanto uma camada de **escolha** está aberta, a página **não rola** — o Radix faz isso com `react-remove-scroll` (`overflow: hidden` no `body`). Metade travando e metade não é bug visível: a lista fica ancorada no campo e "escorrega" junto com a página, e o usuário perde a referência do que estava escolhendo.

| Camada                                                                                             | Tranca? | Como                                                                                 |
| -------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------ |
| `Dialog`, `AlertDialog`, `Sheet`, `Drawer`                                                         | **Sim** | nativo do Radix/vaul                                                                 |
| `Select`, `DropdownMenu`                                                                           | **Sim** | nativo do Radix                                                                      |
| `Popover` — e com ele `Combobox`, `Select` searchable, `MultiSelect`, `DateField`, `DateTimeField` | **Sim** | `modal` LIGADO por padrão em [`ui/popover.tsx`](../../src/components/ui/popover.tsx) |
| `Tooltip`, `HoverCard`                                                                             | **Não** | camada auxiliar, aparece no hover                                                    |

**O `modal` do nosso `Popover` vem ligado — o do Radix vem desligado.** Isso alinha o popover ao `Select`: tranca o scroll **e** o clique fora só dispensa (não ativa o que está embaixo). É a razão de não ser preciso repetir nada em campo nenhum. **Não** passe `modal` num campo de escolha.

`modal={false}` só numa camada **auxiliar**, onde o usuário precisa continuar interagindo com a tela com ela aberta (um painel de ajuda que fica ao lado do conteúdo, por exemplo). Se o popover serve para **escolher um valor e fechar**, ele é de escolha — mantenha o default.

Verificado por navegador em `npm run test:layers` (campo `locksScroll` de cada caso em [`camadas.spec.ts`](../../e2e/storybook/camadas.spec.ts)). O `modal` também traz focus trap e `aria-modal`; está testado que o `Select` de mês/ano dentro do calendário, o `input type="time"` do `DateTimeField`, a busca do `Combobox` e a roda do mouse na lista continuam funcionando — em página, dentro de `Modal` e dentro de `Sheet`.

### Camadas (z-index) e portais — token único, nunca número solto

Todo componente que empilha **globalmente** (portal do Radix, overlay `fixed`, header sticky) usa um token `--z-*` de [`src/index.css`](../../src/index.css) via `z-(--z-header)`, `z-(--z-overlay)`, `z-(--z-floating)`… **Número solto (`z-50`, `z-[999]`) numa camada global é bug**: os portais renderizam no `body` e disputam empilhamento no root, então um número avulso quebra outro componente em silêncio. Empilhamento **local** (`z-0`/`z-10` dentro de um componente que já tem `isolate`/`relative`, como as células do `Calendar`) continua livre.

Ordem, do fundo para a frente (a lista completa e comentada está em `src/index.css`):

| Token              | Valor | Quem usa                                                             |
| ------------------ | ----- | -------------------------------------------------------------------- |
| `--z-sidebar`      | 10    | sidebar fixo (`ui/sidebar.tsx`)                                      |
| `--z-sidebar-rail` | 20    | alça de redimensionar do sidebar                                     |
| `--z-header`       | 40    | header/breadcrumb do `Layout`                                        |
| `--z-overlay`      | 50    | `Dialog`, `AlertDialog`, `Sheet`, `Drawer` (overlay + content)       |
| `--z-floating`     | 60    | `Popover`, `DropdownMenu`, `Select`, `HoverCard` (e todos os campos) |
| `--z-tooltip`      | 70    | `Tooltip` (pode nascer dentro de um flutuante)                       |
| `--z-toast`        | 80    | `Sonner` (o pacote traz `z-index: 999999999`; nós o prendemos aqui)  |

**Invariante que não pode regredir: `floating` > `overlay`.** É o que faz o calendário de um `DateField`, a lista de um `Combobox` ou um `DropdownMenu` abrirem **na frente** de um modal — portalados ou não. O histórico `z-30` do popover (abaixo do header `z-40`, e por tabela abaixo do modal `z-50`) é exatamente o bug do "menu abriu atrás da modal".

**O header NÃO é protegido por z-index** — ele fica de propósito abaixo dos flutuantes. Quem impede um popover de cobrir o breadcrumb é o `collisionPadding` de topo (`FLOATING_COLLISION_PADDING`, em [`lib/constants/layers.ts`](../../src/lib/constants/layers.ts)), aplicado por padrão em `Popover`, `DropdownMenu`, `Select` e `HoverCard`. Se a altura do header mudar em `layout.tsx` (`h-16`), ajuste `FLOATING_COLLISION_TOP` junto.

A ordem e o uso dos tokens são travados por teste: [`src/tests/globais/layout/layers.test.ts`](../../src/tests/globais/layout/layers.test.ts). Componente novo que empilhe no root entra na lista `LAYER_OWNERS` de lá.

**Armadilha do `*:w-full` do `Field` — já blindada, não desfaça.** Sem portal, o wrapper que o Floating UI cria fica na árvore como IRMÃO do gatilho; como o `Popover.Root` do Radix não emite DOM, num campo ele caía como filho **direto** do `Field`, e o `*:w-full` dele ([`ui/field.tsx`](../../src/components/ui/field.tsx)) acertava esse wrapper. Sendo `position: fixed`, o `width: 100%` resolve contra o **bloco de contenção** (a largura inteira do modal; a da viewport dentro de um `Sheet`) e o `shift` do Floating UI prendia o conteúdo no canto da tela. Dentro de um `Modal` isso ficava **mascarado por coincidência** quando o campo era o da coluna esquerda; num `Sheet` a lista ia para `x=0`. O [`PopoverContent`](../../src/components/ui/popover.tsx) resolve isso envolvendo o conteúdo não portalado num `<div className="contents">` — o div absorve o seletor `> *` e, sem gerar caixa, ignora a largura. Não remova esse wrapper e **não** "conserte" o sintoma com `w-auto!` no campo.

**Bancada de verificação:** a story `Padrões/Camadas (z-index)` ([`Camadas.stories.tsx`](../../src/stories/padroes/camadas/Camadas.stories.tsx)) repete a MESMA bancada de flutuantes em página, dentro de `Modal` (Dialog e Drawer), dentro de `Sheet` e em empilhamento profundo. Ao tocar em popover/portal/z-index, abra-a (`npm run storybook`) e rode `npm run test:layers` — o spec [`e2e/storybook/camadas.spec.ts`](../../e2e/storybook/camadas.spec.ts) mede no navegador, por hit-test, se cada flutuante está no topo, se ancorou no campo e se o painel abraça o conteúdo. Campo novo com popover entra na bancada **e** na lista `FLOATING_CASES` do spec.

**Padrão para criar uma nova abstração global:**

- Pasta `components/global/<nome>/<nome>.tsx`, export nomeado, interface prefixada com `I`.
- Importe o primitivo como `XPrimitive` (ex.: `Card as CardPrimitive`) para evitar shadowing.
- Mantenha a API minimalista: props essenciais como obrigatórias, extras como opcionais.
- **Story obrigatória no mesmo PR.** Toda abstração nova em `components/global/<nome>/` precisa entrar acompanhada de `src/stories/globais/<nome>/<nome>.stories.tsx` com vitrine das variações principais (estados: default, loading, error/disabled, com/sem prop opcional). Sem story, a abstração some do radar da próxima sessão — humano ou Claude — e a tela seguinte reinventa o componente.
- **Teste obrigatório no mesmo PR.** Espelhe a story com `src/tests/globais/<nome>/<nome>.test.tsx` cobrindo o contrato público (props obrigatórias, estados, handlers). Veja `button/button.test.tsx` e `confirmDialog/confirmDialog.test.tsx` como referência de profundidade esperada.
- Para componentes de formulário ou de "abre/fecha", espelhe o padrão de `inputField.tsx` / `switch.tsx` / `confirmDialog.tsx`: modo **uncontrolled** + modo **controlled** via discriminated union. Discrimine via `'prop' in props` — nunca via `prop !== undefined`. Quando uma das variantes declarar `prop?: never`, o `'prop' in props` sozinho não narrowed para TS; nesses casos, encapsule num **type guard** com type predicate. Padrão usado em todos os fields e no `ConfirmDialog`:

```ts
function isControlled<TFieldValues, TName>(
  props: FieldProps<TFieldValues, TName>
): props is ControlledFieldProps<TFieldValues, TName> {
  return 'control' in props;
}

export function Field(props: FieldProps<...>) {
  if (isControlled(props)) {
    return <ControlledField {...props} />;
  }
  return <FieldBase {...props} />;
}
```

**Confirmações de ação (delete, publicar, arquivar)**: use `ConfirmDialog` com modo uncontrolled — dispensa `useState` no consumidor:

```tsx
<ConfirmDialog
  title="Excluir registro?"
  description="Esta ação não pode ser desfeita."
  confirmLabel="Excluir"
  destructive
  trigger={<Button variant="destructive">Excluir</Button>}
  onConfirm={async () => {
    await api.delete(`/records/${id}`);
    toast.success('Registro excluído.');
  }}
/>
```

O dialog fica aberto enquanto `onConfirm` resolve (botão com spinner via `loading`), fecha em sucesso e permanece aberto se a promise lançar — deixe o erro propagar pro interceptor do `api` (que já mostra o toast). A rejeição é só o sinal de "não deu certo": o `ConfirmDialog` a absorve (não vira rejeição solta no clique), então quem rejeita precisa já ter dado a resposta ao usuário (o toast do interceptor ou o `onError` da mutation). Com `useMutation`, use `mutateAsync` no `onConfirm`. Referência: [`screens/users/list/userActionDialog.tsx`](../../src/screens/users/list/userActionDialog.tsx).

**Confirmação dupla para ações críticas:** Para ações mais sérias (bloquear/banir usuário, apagar dados sensíveis, reverter cobrança), exija uma confirmação adicional antes de executar. Padrões recomendados:

- UX: primeiro `ConfirmDialog` com descrição clara; se o usuário confirmar, abra um segundo passo que peça digitar o nome do recurso ou uma palavra de confirmação (`BLOCK`, `APAGAR`) antes de habilitar o botão final. Isso reduz confirmações acidentais.
- Técnica: reuse `ConfirmDialog` em modo uncontrolled para o gatilho, e no `onConfirm` do primeiro passo abra um segundo modal ou um pequeno inline form que exige a confirmação textual. Implemente a ação final através de `useMutation` com `onMutate`/`onError`/`onSettled` para optimistic updates/rollback quando aplicável.
- Exemplo rápido: botão "Bloquear" → `ConfirmDialog` com `description` → ao confirmar mostrar campo `Digite "BLOQUEAR" para confirmar` + botão final que só fica `enabled` quando o texto bate.

Use confirmação dupla apenas em ações irreversíveis ou que tenham alto impacto de negócio; para ações de rotina, o `ConfirmDialog` simples é suficiente.

## Storybook (demos de componentes)

Todas as stories vivem em [`src/stories/`](../../src/stories), organizadas em três pastas — uma pasta por componente, com o arquivo `<name>.stories.tsx` dentro. Cada componente tem uma "Vitrine" mostrando todas as variações em um só lugar. Rode com `npm run storybook` (porta 6006).

```
src/stories/
├── Introducao.stories.tsx                    # boas-vindas
├── globais/<component>/<component>.stories.tsx     # abstrações em components/global/
│   ├── button/button.stories.tsx
│   ├── card/card.stories.tsx
│   ├── dataTable/DataTable.stories.tsx
│   ├── pageActions/pageActions.stories.tsx
│   └── form/<field>/<field>.stories.tsx       # inputField, select, dateField...
├── ui-primitivos/<component>/<Component>.stories.tsx  # primitivos shadcn em components/ui/
│   ├── tabs/Tabs.stories.tsx
│   └── typography/Typography.stories.tsx
└── padroes/<padrao>/<Padrao>.stories.tsx      # composições e padrões
    ├── form/Form.stories.tsx                  # formulário completo com Zod
    └── patterns/Patterns.stories.tsx          # OptimisticUpdate, CRUD, etc.
```

- Stories ficam **separadas** do componente (diferente dos `*.test.tsx`, que continuam co-localizados). Isso mantém o source dos componentes enxuto e centraliza a documentação visual.
- Cada vitrine envolve as variações em `Card` global com título + descrição explicativa.
- O componente é importado via alias `@/components/...`, nunca por caminho relativo.
- O título da story (`title:` no `meta`) usa o mesmo prefixo da pasta (`Globais/Button`, `UI primitivos/Tabs`, `Padrões/OptimisticUpdate`).
- Configuração: [`.storybook/main.ts`](../../.storybook/main.ts) e [`.storybook/preview.tsx`](../../.storybook/preview.tsx) (já injetam `ThemeProvider`, `QueryClient` e `Toaster`).
