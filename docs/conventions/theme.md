# Convenções: cor da marca, tema, badges e tipografia

Parte das convenções do projeto, lida sob demanda (ver **Guias de referência** no [`CLAUDE.md`](../../CLAUDE.md)). As regras gerais, que valem para toda tarefa, ficam no `CLAUDE.md`.

## Cor da marca e tema

A cor primária do sistema vive em **uma única variável** no topo de [`src/index.css`](../../src/index.css):

```css
:root {
  --brand: oklch(0.488 0.243 264.376); /* marca do projeto */
  --brand-foreground: oklch(0.97 0.014 254.604);
}
.dark {
  --brand: oklch(0.424 0.199 265.638); /* mesma marca, tonada para dark */
}
```

`--primary`, `--primary-foreground`, `--sidebar-primary` e `--sidebar-primary-foreground` são apenas aliases (`var(--brand)`) — não duplicar valores. Pra trocar a marca em um novo projeto, mude apenas `--brand` (light + dark).

**Derivados da marca para texto, fundo suave e linha** — `--brand-text`, `--brand-surface` e `--brand-line`, mapeados no `@theme` como `text-brand-text`, `bg-brand-surface` e `border-brand-line`. Existem porque a `--brand` do escuro (`0.424`) é escura demais para texto: no `.dark`, `--brand-text` é um passo mais claro. `--brand-text` mede, no pior caso, 6,15:1 (claro) e 6,57:1 (escuro) sobre `--brand-surface`, e 6,20:1 (claro) e 7,13:1 (escuro) sobre `--muted`; `--brand-line` é decorativa (divisor), não delimita controle. Ao trocar a marca, regere os três nos dois temas e meça.

**Variante `brand` do `Button`**: soft-tint da marca (`bg-primary/10 text-primary`) para o botão auxiliar que precisa de corpo sem competir com o `default` (cheio). Divergência do shadcn, registrada no comentário de `ui/button.tsx`.

**Locale do `ui/chart.tsx`**: o tooltip formata o valor com `APP_LOCALE` (`pt-BR`, de `src/lib/locale.ts`) em vez do locale do navegador. Divergência do shadcn, registrada no comentário de `ui/chart.tsx`: preserve numa atualização.

**Números em coluna**: a classe utilitária `.tabular` (`index.css`, `@layer base`) liga `tabular-nums`/`'tnum'`; use em células e totais numéricos para os dígitos alinharem.

**Há DUAS paletas de gráfico, com papéis diferentes — não as confunda:**

- **`--chart-1..5` (SEQUENCIAL) faz parte da marca**: um ramp de 5 tons harmonizados com `--brand` (mesmo hue, luminosidade escalonada). Serve para **uma** medida em intensidades — barra empilhada, área, mapa de calor. Ao trocar a marca, regere o ramp no novo hue, senão os gráficos destoam do resto da UI (mantenha a estrutura de luminosidade: mais claro no `--chart-1`, mais escuro no `--chart-5`).
  - **O ramp é MEDIDO, não escolhido no olho**: objeto gráfico pede 3:1 (WCAG 1.4.11) contra `--background`, `--card` e `--muted` do tema. O `.dark` **redeclara** o ramp (o do claro é escuro de propósito e sumiria sobre o card escuro). Razões atuais (pior superfície): claro 3,42:1 (`--chart-1`, sobre muted) a 10,31:1; escuro 4,32:1 (`--chart-5`, sobre muted) a 9,74:1. As razões de cada passo estão ao lado do valor em `index.css`; ao regerar o ramp, meça de novo e atualize-as.
- **`--series-1..5` (CATEGÓRICA) NÃO faz parte da marca**: hues distintos, para **séries diferentes** no mesmo gráfico, onde o leitor precisa separar uma linha da outra. **Não regere ao trocar a identidade** — os valores são validados como conjunto (contraste entre pares adjacentes em visão normal **e** em deficiência de cor, nas duas superfícies). A **ordem dos slots é o mecanismo de segurança**: use sempre na sequência, nunca ciclando nem escolhendo "a que combina". Como dois dos tons ficam abaixo de 3:1 no fundo claro, a legenda e o traçado de cada série carregam a identidade **junto** com a cor (nunca só a cor).

Tons do mesmo hue não se distinguem entre si: usar o ramp sequencial para séries diferentes é o erro clássico.

**Texto secundário**: `--muted-foreground` do claro (`oklch(0.54 …)`) mede 4,61:1 sobre `--muted` e 5,08:1 sobre `--background`; o cabeçalho de tabela (`bg-muted` + `text-muted-foreground`) depende disso. No escuro, 5,66:1 sobre `--muted`. O `0.54` **diverge do padrão do shadcn (`0.552`) de propósito, por contraste** (o padrão dá 4,39:1 sobre `--muted` e reprova): não desfaça numa atualização do shadcn.

**Não fazem parte da marca**: `--ring`/`--sidebar-ring` (neutros, convenção shadcn) e os tokens neutros (background, border, muted, etc.).

**Card no escuro**: `--card` é `oklch(0.19 0.006 285.885)` (≈ `#131316`), mais claro que o `--background` (`0.141`) por só 1,08:1: elevação sutil. Razões medidas por script (WCAG 2.x, oklch para sRGB; borda translúcida composta sobre o card): `--foreground` 17,70:1 e `--muted-foreground` 7,03:1 sobre o card (5,66:1 sobre `--muted`); `--brand-text` 8,85:1; `--muted` (cabeçalho de tabela) sobre o card 1,24:1; `--border` 1,31:1 e `--input` 1,55:1 sobre o card. Borda e input **não chegam a 3:1** (já era assim); subir o `--input` para ~33% de opacidade é decisão separada, não feita. O `--popover` fica em `0.24` de propósito (flutua 1,12:1 acima do card). A sidebar escura (`0.21`) fica 1,04:1 **acima** do card: decisão registrada de não mexer; se incomodar, `--sidebar: oklch(0.17 0.005 285.823)`. Ao mudar `--card`, remeça e atualize os comentários de `index.css`. O ramp `--chart-*` sobre o card escuro vai de 5,35 a 12,08:1.

**Dark mode em superfícies "card-like"**: use `bg-card` em vez de `bg-background` (o `.dark` já clareia `--card` em relação ao `--background` pra dar elevação) e adicione `dark:shadow-none` — sombras não rendem em fundo escuro. O `Card` global já faz isso automaticamente.

## Sempre projete para claro E escuro (obrigatório)

**Todo componente e toda tela nascem suportando os dois temas — não é opcional nem "depois".** O tema segue a preferência do usuário (`ToggleTheme`/`prefers-color-scheme`), então cada superfície precisa ficar correta e legível nos dois. Regressão comum: construir e olhar só no tema em que você trabalha e o outro sair quebrado (texto sem contraste, borda invisível, sombra fantasma).

- **Cor só via token do tema** (as CSS vars de [`src/index.css`](../../src/index.css) consumidas pelas classes semânticas: `bg-card`, `text-muted-foreground`, `border-border`, `bg-primary`…) — **nunca** cor da paleta crua do Tailwind (`bg-green-100`, `text-red-700`) nem hex/`rgb()` solto num componente ou tela. Se um tom novo é necessário, adicione o token em `:root` **e** em `.dark`, e exponha-o como variante do componente (ver "Tags e badges").
- **Verifique nos dois temas antes de considerar pronto.** Alterne o tema e confira contraste, elevação e bordas em claro e escuro. Contraste mínimo 4.5:1 (ver **Acessibilidade** no [`CLAUDE.md`](../../CLAUDE.md)).
- **Elevação no dark vem de `bg-card` mais claro que `bg-background`**, não de sombra — sombra não rende em fundo escuro; use `dark:shadow-none` (o `Card` global já faz).
- **Nada de estilo condicional em JS para tema.** Não leia o tema em JavaScript para escolher cor; use as variantes `dark:` (ou o token semântico, que já muda sozinho). Estilo condicional em JS não acompanha a troca de tema sem re-render.
- **Ilustração/ícone/imagem também tem os dois modos**: SVG inline usa `currentColor` ou token; imagem com fundo branco precisa de tratamento (`dark:` variante ou fundo próprio), senão aparece um bloco branco no dark.

## Tags e badges — cor semântica vem do tema (regra dura)

Toda tag/pílula ([`Badge`](../../src/components/ui/badge.tsx)) tira a cor de uma **variante semântica**, e a cor de cada variante vive **só** nos tokens da paleta de status em [`src/index.css`](../../src/index.css) (`--success`, `--info`, `--warning`, `--destructive`, calibrados para contraste AA em claro **e** dark). Nunca escreva cor solta numa tela (`bg-green-100`, `text-red-700`, `className` com cor) nem use `variant="default"` (cor sólida da marca) como tag — texto branco sobre a marca reprova no contraste e destoa das tags soft-tint. As variantes soft-tint têm o mesmo tratamento (texto na cor cheia sobre fundo com 10%/20% do tom).

Mapa de significado (use a variante, não invente cor):

- **`success`** (verde) — positivo / ativo / concluído.
- **`info`** (azul) — informativo / em andamento.
- **`warning`** (âmbar) — atenção / pendência.
- **`destructive`** (vermelho) — erro / negativo / destrutivo.
- **`secondary`** (cinza) e **`outline`** (contorno) — **neutro**: rótulos e **totalizadores** (contadores/somatórios como "5 registros", "Total: 1.500 kg"). Totalizador **não tem status** → não recebe cor semântica (nada de arco-íris ciclando `success`/`info`).

Mapa de status→variante que se repete numa tela vive num `Map<string, BadgeVariant>` (sem object-injection). Ao precisar de uma cor nova, **adicione um token na paleta + uma variante no `Badge`** (e atualize a story `stories/ui-primitivos/badge`), nunca cor solta na tela. O mesmo vale para o `Alert` global e para os tons do `RowActions`.

## Tipografia

- Use o componente [`Typography`](../../src/components/ui/typography.tsx) para textos do sistema (headings de página, parágrafos, labels). Variantes: `hero`, `h1`, `h2`, `h3`, `lead`, `p`, `small`, `muted`.
- `as` aceita o elemento HTML semântico independente do styling (ex.: `<Typography as="h1" variant="h3">` para uma h1 com peso visual de h3).
- Não use a classes `text-{size} font-{weight} text-muted-foreground` manualmente quando uma variante já bate — isso garante consistência visual entre telas.
- Texto dentro de primitivos shadcn (`CardTitle`, `EmptyTitle`, `FieldLabel`, `Badge`) já tem tipografia interna — não envolver com `Typography`.
- **Hierarquia: subtítulo NUNCA maior que o título do container (regra dura).** Dentro de um `Modal`, `Card`, `Dialog` ou seção, o **título do container é o maior heading**; todo **heading de subseção** no corpo deve ser **visualmente menor** que esse título — nunca maior. Um subtítulo maior que o título inverte a hierarquia e confunde o que é o quê (ex.: um bloco "Variáveis" renderizado como `h1`/`h2` dentro de um modal cujo título "Lançar resultado" é `h3` — o subtítulo "grita" mais que o título). Na prática: o título de `Modal`/`Card` já tem sua tipografia; subseções internas usam no máximo `Typography variant="small"`/`muted` (rótulo de grupo) ou um heading **abaixo** do tamanho do título — **nunca** `hero`/`h1`/`h2`. Se a subseção parece maior que o título, **reduza a variante da subseção** (não aumente o título). Vale para qualquer nível: sub-subtítulo < subtítulo < título.
