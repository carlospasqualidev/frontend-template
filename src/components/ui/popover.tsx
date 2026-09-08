import * as React from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';

import { FLOATING_COLLISION_PADDING } from '@/lib/constants/layers';
import { useInModal } from '@/hooks/useInModal';
import { cn } from '@/lib/utils';

function Popover({
  // `modal` LIGADO por padrão — o Radix desliga. Com ele o popover se comporta
  // como o `Select` e o `DropdownMenu`: tranca o scroll da página enquanto está
  // aberto e o clique fora só dispensa (não ativa o que está embaixo). Sem isto,
  // metade dos campos de escolha do sistema travava o scroll e a outra metade
  // não — a lista ancorada escorregava junto com a página.
  // Passe `modal={false}` numa camada AUXILIAR, onde o usuário precisa seguir
  // interagindo com a tela com ela aberta.
  modal = true,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" modal={modal} {...props} />;
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  // Mantém o popover fora da faixa do header/breadcrumb (h-16 ≈ 64px, sempre no
  // topo do layout). O popover fica ACIMA do header no eixo z (`--z-floating` >
  // `--z-header`) para poder cobrir modais; é esta folga — não o z-index — que
  // impede que ele seja posicionado sobre o breadcrumb ao flipar perto do topo.
  collisionPadding = FLOATING_COLLISION_PADDING,
  portal,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  /**
   * Portala o conteúdo para o `body`. **Por padrão é resolvido pelo contexto**:
   * `false` dentro de um `Modal`/Dialog/Drawer, `true` em página. Passe
   * explicitamente só como escape hatch — a prop sempre vence o default.
   *
   * Dentro de modal não portalamos porque o `react-remove-scroll` do Dialog só
   * libera a roda do mouse em descendentes seus, e o conteúdo portalado fica
   * fora dessa subárvore (a lista não rolaria). O Popover é `position: fixed`
   * (Floating UI), então não portalar não causa recorte por `overflow` — desde
   * que o `DialogContent` (bloco de contenção, tem `transform`) não ganhe
   * `overflow-hidden`.
   *
   * Empilhamento NÃO depende desta prop: `--z-floating` > `--z-overlay`, então
   * o popover fica na frente do modal portalado ou não. Ver `src/index.css`.
   */
  portal?: boolean;
}) {
  const inModal = useInModal();
  const resolvedPortal = portal ?? !inModal;

  const content = (
    <PopoverPrimitive.Content
      data-slot="popover-content"
      align={align}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      className={cn(
        'z-(--z-floating) flex w-72 origin-(--radix-popover-content-transform-origin) flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
        className
      )}
      {...props}
    />
  );

  if (resolvedPortal) {
    return <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal>;
  }

  /*
    `display: contents` — não é decoração, é blindagem.

    Sem portal, o wrapper do popper (do Floating UI) passa a ser um IRMÃO do
    gatilho na árvore. Como o `Popover.Root` do Radix não emite DOM, num campo
    ele cai como filho DIRETO do `Field`, e o `*:w-full` do `Field`
    (`ui/field.tsx`) acerta esse wrapper. Ele é `position: fixed`, então o
    `width: 100%` resolve contra o BLOCO DE CONTENÇÃO — a largura inteira do
    modal, ou da viewport dentro de um `Sheet` — e o `shift` do Floating UI
    ancora o conteúdo no canto (o clássico "abriu no lugar errado"). No modal
    isso ficava mascarado por coincidência quando o campo era o da esquerda.

    Este wrapper absorve o seletor de filho direto (`> *`) e, sem gerar caixa,
    ignora o `width: 100%` que recebe. Assim qualquer popover — de campo ou
    montado à mão — ancora certo sem o consumidor saber deste detalhe.
  */
  return <div className="contents">{content}</div>;
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

function PopoverHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="popover-header"
      className={cn('flex flex-col gap-0.5 text-sm', className)}
      {...props}
    />
  );
}

function PopoverTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  return (
    <div
      data-slot="popover-title"
      className={cn('font-heading font-medium', className)}
      {...props}
    />
  );
}

function PopoverDescription({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="popover-description"
      className={cn('text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
};
