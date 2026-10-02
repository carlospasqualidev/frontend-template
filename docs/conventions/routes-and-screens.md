# Convenções: rotas, navegação e organização de telas

Parte das convenções do projeto, lida sob demanda (ver **Guias de referência** no [`CLAUDE.md`](../../CLAUDE.md)). As regras gerais, que valem para toda tarefa, ficam no `CLAUDE.md`.

## Rotas (TanStack Router code-based)

- Cada tela em `screens/<nome>/` tem seu próprio `routes.ts` com `createRoute` + `lazyRouteComponent`, e é registrada na árvore em [`src/routes.tsx`](../../src/routes.tsx).
- Rotas protegidas ficam sob `protectedLayoutRoute` (que envolve `SessionValidation` + `Layout`). Login/signup ficam fora dela.
- `defaultPreload: 'intent'` já está ativo — não precise reconfigurar.
- Use `staticData: { breadcrumb: '...' }` para alimentar o breadcrumb global.
- Use o `Link` global em `src/components/global/link/link.tsx` para navegação no aplicativo. Ele recebe `href` como um `<a>` padrão e:
  - para caminhos internos same-origin, usa o roteamento cliente do TanStack Router;
  - para links externos, `target="_blank"`, `mailto:`, `tel:` ou clique do scroll, preserva o comportamento nativo do navegador.
  - não confunda com `Link` do `@tanstack/react-router` importado diretamente; aliase quando precisar usar os dois no mesmo arquivo.

### Hyperlink é `<a href>`, NUNCA `<button onClick={navigate}>` (regra dura)

**Todo hyperlink do sistema usa o `Link` global com `href` de verdade.** Navegar por
`<button onClick={() => navigate(...)}>` é proibido: botão não tem `href`, então
**Ctrl/Cmd+clique, clique do meio, "abrir em nova aba/janela", copiar endereço e
arrastar para os favoritos não funcionam** — o usuário perde a navegação que espera de
qualquer link da web, e nada na tela indica que aquilo não é um link de verdade.

O `Link` global já entrega as duas metades da regra:

1. **Modificadores caem no comportamento nativo.** O roteamento em SPA só acontece no
   clique simples com o botão esquerdo; com Ctrl, Cmd, Shift, Alt ou botão do meio o
   navegador abre em outra aba/janela sozinho.
2. **Ícone "abrir em nova aba" ao lado do texto**, ligado por padrão — uma âncora de
   verdade com `target="_blank"`, `aria-label` e tooltip, apontando para o mesmo `href`.

Desligue o ícone com `newTabIcon={false}` **apenas** onde ele não faz sentido: navegação
estrutural (sidebar, breadcrumb, abas), link dentro de frase corrida, e link que já abre
fora (aí o ícone seria redundante — o componente já o omite sozinho para `target="_blank"`,
`mailto:`, `tel:`, âncora `#` e `download`).

Use `newTabLabel` para dar contexto ao leitor de tela quando houver vários links iguais na
tela — ex.: ``newTabLabel={`Abrir o pedido ${code} em nova aba`}``.

```tsx
❌ <button type="button" onClick={() => goDetail(id)}>{code}</button>
✓  <Link href={detailHref(id)} newTabLabel={`Abrir o pedido ${code} em nova aba`}>{code}</Link>
```

Corolário: quem precisa navegar expõe **`href`**, não só um callback. Se um hook só
devolve `goX()`, adicione o `xHref()` correspondente. Navegação programática fica para o
que não é link clicável — submit de formulário, redirect após salvar.

- **Tela de erro por rota: já vem do layout, a rota não declara `errorComponent`.** Toda rota filha do `protectedLayoutRoute` herda o [`RouteErrorBoundary`](../../src/components/global/errorFallback/routeErrorBoundary.tsx), montado uma vez em volta do `Outlet` do layout protegido em [`src/routes.tsx`](../../src/routes.tsx): um erro lançado no render da tela, ou no carregamento dela (o módulo, um loader), troca só o conteúdo pelo [`ErrorFallback`](../../src/components/global/errorFallback/index.tsx) global na variante `content`, com o menu e o cabeçalho visíveis, e ir para outro endereço (outra tela, outros parâmetros ou outra busca) limpa o erro. A rota pública, filha direta do `rootRoute` (login, cadastro), e o próprio layout protegido caem no `errorComponent: RouteErrorFallback` da raiz: a mesma tela de erro, cheia, sem o layout. O adaptador [`RouteErrorFallback`](../../src/components/global/errorFallback/routeErrorFallback.tsx) liga o `errorComponent` do TanStack Router (`error`, `reset`) ao `ErrorFallback`: reporta o erro por `sendErrorMessage` (do usuário, só o `userId`) e por isso passa `reported` (o título diz que a equipe foi notificada), e "Tentar novamente" libera as queries que tenham lançado o erro para a tela (`useQueryErrorResetBoundary`), refaz o carregamento da rota (`router.invalidate()`) e chama o `reset`, que desenha a tela de novo; enquanto o carregamento não termina, o botão fica desabilitado, em carregamento. Um `notFound()` lançado no render de uma tela não vira tela de erro: o `RouteErrorBoundary` o repassa ao `notFoundComponent` da raiz, como os boundaries de rota do TanStack Router. O `ErrorBoundary` do [`App.tsx`](../../src/App.tsx) fica para o que falha fora do roteador. Referências: [`routeErrorFallback.test.tsx`](../../src/tests/globais/errorFallback/routeErrorFallback.test.tsx) (a árvore de rotas do app) e [`e2e/routeError.spec.ts`](../../e2e/routeError.spec.ts).

Esqueleto para nova tela + rota:

```ts
// src/screens/minha-tela/routes.ts
import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { protectedLayoutRoute } from '@/routes';

export const minhaTelaRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/minha-tela',
  staticData: { breadcrumb: 'Minha tela' },
  component: lazyRouteComponent(() => import('.'), 'MinhaTela'),
});
```

Depois, registre em [`src/routes.tsx`](../../src/routes.tsx).

### Navegação (sidebar)

A navegação vive em [`src/lib/constants/sidebar.tsx`](../../src/lib/constants/sidebar.tsx) (`sidebarData`) e é renderizada por [`navMain.tsx`](../../src/components/global/sidebar/navMain.tsx). Regras:

- **Um item por tela, dentro do grupo do seu módulo.** Cada módulo é um grupo colapsável (`SidebarMenuSub`) e as telas são suas filhas, sob o prefixo de URL do módulo. **Não crie grupos ad-hoc** para subconjuntos de um módulo — o grupo é o módulo. Recursos transversais (Início, Documentação) ficam em `links`, fora de qualquer grupo.
- **Ordem sempre alfabética (pt-BR).** O `NavMain` ordena os itens de cada grupo por `title` via `localeCompare` — **não** confie na ordem da lista em `sidebarData`; ela é irrelevante para a exibição.
- **`permission` gata o item.** Item com `permission` só aparece para quem a possui ([`hasPermission`](../../src/lib/permissions.ts)); o grupo some se ficar sem itens visíveis. Use `anyPermission` quando a tela abre para quem tem **ao menos uma** de várias permissões. O backend continua sendo a autoridade — isto é só navegação. Ao criar uma tela com RBAC, use a permissão de leitura (`<módulo>.<entidade>.read`).
- **Hoje**, o módulo "Administração" tem Auditoria (`backoffice.audit.read`), Cargos (`backoffice.roles.read`), Configurações (`backoffice.systemConfigs.read`) e Usuários (`backoffice.users.read`); "Início" fica em `links`.
- **Sidebar recolhida em ícones** já é tratada: o `NavMain` troca o `SidebarMenuSub` (invisível nesse modo) por um flyout `DropdownMenu` à direita, senão os filhos ficariam inalcançáveis.

## Organização de telas

`screens/<feature>/index.tsx` deve ficar **enxuto** — apenas o shell da tela: orquestração de abas, layout principal, navegação e chamadas a hooks/serviços. Quando a tela cresce com várias seções lógicas (abas, blocos extensos, dialogs específicos, formulários grandes), **promova para pasta** e separe cada bloco em seu próprio arquivo. Não empilhe `OverviewTab`, `ActivityTab`, `PermissionsTab` etc. num único arquivo gigante.

❌ Tudo num só `userDetails.tsx`:

```tsx
function OverviewTab() { ... }      // 40 linhas
function ActivityTab() { ... }      // 60 linhas
function PermissionsTab() { ... }   // 50 linhas
function SessionsTab() { ... }      // 70 linhas

export function UserDetailsPage() {
  return <Tabs>...</Tabs>;
}
```

✓ Pasta com uma seção por arquivo:

```
screens/users/userDetails/
├── index.tsx              # UserDetailsPage — só o shell, monta as abas
├── overviewTab.tsx        # exporta OverviewTab
├── activityTab.tsx        # exporta ActivityTab
├── permissionsTab.tsx     # exporta PermissionsTab
└── sessionsTab.tsx        # exporta SessionsTab
```

Cada arquivo exporta apenas o seu componente público. Helpers privados (constantes de ícones, sub-componentes usados em uma única seção, type guards locais) ficam **dentro do arquivo onde são usados**, não num `utils.ts` compartilhado por reflexo. Utilitários compartilhados entre lista e detalhe (ex.: `getInitials`, mapas de variante de `Badge`) vivem ao lado do `routes.ts` da feature (`screens/<feature>/getInitials.ts`, `screens/<feature>/userBadges.ts`).

O `lazyRouteComponent(() => import('./userDetails'), 'UserDetailsPage')` continua funcionando sem mudança — o resolver acha `userDetails/index.tsx` automaticamente.

O mesmo padrão vale para a lista (`index.tsx` da feature) quando ela ganha extensão: extraia colunas, filtros e células custom para arquivos próprios em vez de inflar o componente da página.

### Uma pasta por sub-tela da feature

Quando a feature tem telas distintas (listagem, detalhe — e às vezes criar/editar dedicados), **cada sub-tela ganha sua própria pasta** com o `index.tsx` daquela tela + **os componentes que só existem nela**. Regra dura:

- **Componente/utilitário exclusivo de uma sub-tela → dentro da pasta daquela sub-tela.** Um modal/skeleton/célula que só aparece nos detalhes mora em `details/`; o que só aparece na listagem, em `list/`.
- **Compartilhado entre sub-telas → numa pasta `utils/` da feature — nunca solto na raiz.** Os arquivos comuns (campos de formulário reaproveitados por criar **e** editar, `queryKeys.ts`, constantes, helpers) ficam em `screens/<feature>/utils/`. A raiz da feature guarda só o que é do próprio roteamento (`routes.ts` e o layout da feature).
- Nunca deixe um componente exclusivo de uma tela "solto" na raiz da feature — se só uma tela usa, ele pertence à pasta dela; se mais de uma usa, vai para `utils/`.

Exemplo real (feature Usuários):

```
screens/users/
├── routes.ts, usersLayout.tsx        # feature (roteamento)
├── utils/                            # comuns/compartilhados (nunca soltos na raiz)
│   ├── userForm.ts                   # schemas Zod + mapeadores, criar + detalhe
│   ├── userFormFields.tsx            # reaproveitado por criar + detalhe
│   ├── userImageField.tsx
│   ├── userMutations.ts              # bloquear/excluir + cache, lista + detalhe
│   └── userStatusBadge.tsx
├── list/
│   ├── index.tsx              # UsersPage (listagem)
│   ├── userColumns.tsx        # colunas e menu "⋯"
│   └── userActionDialog.tsx   # confirmação exclusiva da listagem
├── create/
│   └── index.tsx              # UserCreatePage (/users/create)
└── details/
    ├── index.tsx              # UserDetailsPage (shell + formulário + abas)
    ├── overviewTab.tsx, rolesTab.tsx, activityTab.tsx, sessionsTab.tsx
    └── userDetailSkeleton.tsx
```

No `routes.ts`, cada rota aponta para a pasta da sua sub-tela: `lazyRouteComponent(() => import('./list'), 'UsersPage')`, `lazyRouteComponent(() => import('./create'), 'UserCreatePage')` e `lazyRouteComponent(() => import('./details'), 'UserDetailsPage')`. (Chamadas de API continuam fora de `screens/`, em `services/<módulo>/` — ver [HTTP](http-and-state.md); as chaves de cache dos usuários ficam em `services/users/queryKeys.ts`, porque a home também as usa.)

**Não embrulhe a tela inteira num wrapper de spacing/padding.** O [`Layout`](../../src/components/global/layout/layout.tsx) global já aplica `space-y-4` ao container que recebe `children`, então os filhos diretos do componente da tela (`<PageHeader />`, `<section>`, `<Tabs>`, grids) **já ficam espaçados automaticamente**. Adicionar `<div className="space-y-6">…</div>` (ou outro `space-y-*` / `p-*`) na raiz da tela é redundante, descalibra o ritmo visual entre telas e empilha uma `<div>` à toa.

❌ Wrapper redundante:

```tsx
export function DashboardPage() {
  return (
    <div className="space-y-6">           {/* o Layout já faz isso */}
      <PageHeader ... />
      <StatsGrid />
      <ActivityChart />
    </div>
  );
}
```

✓ Filhos soltos sob um Fragment (`<>` somente se houver `<PageActions>` ou múltiplos irmãos):

```tsx
export function DashboardPage() {
  return (
    <>
      <PageActions>...</PageActions>
      <PageHeader ... />
      <StatsGrid />
      <ActivityChart />
    </>
  );
}
```

Só introduza um wrapper na raiz quando precisar de um comportamento de layout real que o Layout não cobre — ex.: a tela quer ocupar 100% da altura disponível (`flex h-full min-h-0 flex-col`, como na lista de usuários). Nesse caso, o wrapper paga pelo seu lugar; spacing puro não.
