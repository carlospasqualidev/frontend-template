# Usabilidade: facilitar sempre a vida do usuário final

Regra: diante de duas soluções corretas, vence a que dá menos trabalho a quem usa a tela. O núcleo vive no [`CLAUDE.md`](../../CLAUDE.md); aqui ficam, por princípio, quando usar, um exemplo neutro e o anti-padrão. Todo caminho citado existe em `src/`.

## 1. Atalho onde a escolha é previsível

Quando a maioria dos valores cai em poucas opções (hoje, daqui a 7 dias, 10%, 50%), ofereça-as como atalho sob o campo com [`FieldShortcuts`](../../src/components/global/form/fieldShortcuts.tsx): rótulo, fileira de botões `outline xs` e o campo como filho. Atalho que não se aplica fica visível e desabilitado com `disabledReason`. Data relativa usa `businessToday()`/`businessDatePlusDays(n)` de [`businessDate.ts`](../../src/lib/dateTime/businessDate.ts), no fuso de negócio, nunca `new Date()`.

- Exemplo: campo "Vencimento" com atalhos 1, 3, 7 e 30 dias.
- Anti-padrão: o usuário calcula a data de cabeça e digita; atalho que muda o valor sem o usuário ver.

## 2. Ação indisponível fica visível, com o motivo

Esconder a ação deixa o usuário sem saber se ela existe. Mostre-a desabilitada e diga por quê, com `disabledReason` (vira tooltip e parte do nome acessível: "rótulo: motivo") em [`RowActions`](../../src/components/global/rowActions/rowActions.tsx), [`ActionMenu`](../../src/components/global/actionMenu/actionMenu.tsx) e [`FilePickerButton`](../../src/components/global/filePickerButton/filePickerButton.tsx). As ações de linha comuns vêm do catálogo [`actions.tsx`](../../src/components/global/rowActions/actions.tsx) (`editAction`, `deleteAction`, `downloadAction`, `retryAction`, `copyAction`, `blockAction`, `unblockAction`). Sem permissão para a tela inteira, use [`NoAccess`](../../src/components/global/noAccess/noAccess.tsx) em vez de uma tela vazia.

- Exemplo: "Excluir" desabilitado com o motivo "Registro em uso".
- Anti-padrão: botão que some sem explicação; botão desabilitado sem motivo; esconder só no mobile.

## 3. "Selecionar tudo" onde se marcam vários

Em lista de marcação múltipla, o rodapé do [`MultiSelect`](../../src/components/global/form/multiSelectPrimitive.tsx) traz "Selecionar tudo" ao lado de "Limpar seleção": marca só o que está à vista, ignora opções desabilitadas e some quando não há o que marcar.

- Exemplo: escolher 40 colunas para exportar com um clique.
- Anti-padrão: lista de 40 caixas sem como marcar todas; "tudo" que marca também o que o filtro escondeu.

## 4. Padrões sensatos

O valor inicial é o que a maioria escolheria; o que raramente interessa começa fora do caminho. Colunas secundárias começam ocultas com `defaultHiddenColumnIds` no [`DataTable`](../../src/components/global/dataTable/dataTable.tsx) (o usuário as liga no menu de colunas). Valor derivado que o usuário nunca digita (um total calculado, um dado de outro registro) usa [`MirrorField`](../../src/components/global/form/mirrorField.tsx): somente leitura, inerte, com visual de campo e sem foco. Tamanho de página e rodapé seguem o [`PaginationFooter`](../../src/components/global/paginationFooter/paginationFooter.tsx).

- Exemplo: tabela com 12 colunas que abre com as 6 mais usadas.
- Anti-padrão: tabela que abre com tudo e rolagem lateral; valor calculado em campo editável, que o usuário tenta digitar.

## 5. Não perder o contexto

Nada que o usuário já fez pode se perder sem aviso. Formulário sujo avisa na saída com [`useUnsavedChangesGuard`](../../src/hooks/useUnsavedChangesGuard.ts). Falha de carga oferece `onRetry` (o botão mostra o carregamento e não dispara duas vezes). Tela que se atualiza sozinha mostra o pulso com [`AutoRefreshIndicator`](../../src/components/global/autoRefreshIndicator/autoRefreshIndicator.tsx) (monte-o só enquanto o polling roda). Anexo abre no visualizador ([`AttachmentRow`](../../src/components/global/attachmentRow/attachmentRow.tsx) e `AttachmentPreview`), sem tirar o usuário da tela; baixar é ação à parte. Filtros e aba ficam na URL (ver `docs/conventions/filters-and-tables.md`).

- Exemplo: erro ao carregar a lista com "Tentar novamente" na própria área.
- Anti-padrão: abrir o anexo em outra aba; recarregar a lista e perder a página e os filtros.

## 6. Menos cliques no caminho frequente

O caminho mais comum não passa por menu, confirmação ou segunda tela. Em modal, o botão de salvar fica sempre visível (`disabled` até haver mudança, mais `loading` ao enviar), para o usuário não procurá-lo. Ação frequente de item é ícone no `RowActions`, e o menu "⋯" ([`ActionMenu`](../../src/components/global/actionMenu/actionMenu.tsx)) fica para o resto. Busca no servidor: [`AsyncCombobox`](../../src/components/global/form/asyncCombobox.tsx) com `minChars` evita consulta a cada letra e diz "Digite ao menos N caracteres.". Confirmação só para o que apaga ou desfaz.

- Exemplo: editar um campo e salvar no mesmo modal, sem rolar até achar o botão.
- Anti-padrão: em modal, salvar que só aparece depois de digitar; confirmação para ação reversível. Tela de detalhe e de criação seguem `docs/conventions/screen-layout.md`, não esta regra.
