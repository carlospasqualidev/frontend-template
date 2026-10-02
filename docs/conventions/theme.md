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

**Há DUAS paletas de gráfico, com papéis diferentes — não as confunda:**

- **`--chart-1..5` (SEQUENCIAL) faz parte da marca**: um ramp de 5 tons harmonizados com `--brand` (mesmo hue, luminosidade escalonada). Serve para **uma** medida em intensidades — barra empilhada, área, mapa de calor. Ao trocar a marca, regere o ramp no novo hue, senão os gráficos destoam do resto da UI (mantenha a estrutura de luminosidade: mais claro no `--chart-1`, mais escuro no `--chart-5`).
- **`--series-1..5` (CATEGÓRICA) NÃO faz parte da marca**: hues distintos, para **séries diferentes** no mesmo gráfico, onde o leitor precisa separar uma linha da outra. **Não regere ao trocar a identidade** — os valores são validados como conjunto (contraste entre pares adjacentes em visão normal **e** em deficiência de cor, nas duas superfícies). A **ordem dos slots é o mecanismo de segurança**: use sempre na sequência, nunca ciclando nem escolhendo "a que combina". Como dois dos tons ficam abaixo de 3:1 no fundo claro, a legenda e o traçado de cada série carregam a identidade **junto** com a cor (nunca só a cor).

Tons do mesmo hue não se distinguem entre si: usar o ramp sequencial para séries diferentes é o erro clássico.

**Não fazem parte da marca**: `--ring`/`--sidebar-ring` (neutros, convenção shadcn) e os tokens neutros (background, border, muted, etc.).

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
