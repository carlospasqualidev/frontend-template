import * as React from 'react';
import { ChevronLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/useMobile';
import { cn } from '@/lib/utils';

/**
 * Largura do modal no desktop (Dialog). No mobile o Drawer é sempre full-width,
 * então `size` não o afeta. `default` cobre a maioria dos formulários; `lg`/`xl`
 * para conteúdo largo (ex.: dois painéis lado a lado); `2xl` para tabelas largas.
 * Independente do tamanho, tabela larga rola lateralmente DENTRO do modal (ver
 * `min-w-0` abaixo).
 */
export type ModalSize = 'default' | 'lg' | 'xl' | '2xl';

function sizeClassName(size: ModalSize): string {
  switch (size) {
    case 'lg':
      return 'sm:max-w-3xl';
    case 'xl':
      return 'sm:max-w-5xl';
    case '2xl':
      return 'sm:max-w-6xl';
    case 'default':
    default:
      return 'sm:max-w-lg';
  }
}

/** Falso para campo sem layout (`display:none`, `visibility:hidden`) ou `aria-hidden`. */
function isRendered(element: HTMLElement): boolean {
  if (element.closest('[hidden], [aria-hidden="true"]')) return false;
  for (
    let node: HTMLElement | null = element;
    node;
    node = node.parentElement
  ) {
    const style = window.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }
  }
  return true;
}

/**
 * Altura máxima do corpo que rola, no desktop. `xl`/`2xl` trazem conteúdo denso
 * (tabelas, dois painéis) e ganham mais altura; os demais ficam no teto padrão.
 */
function viewportMaxHeight(size: ModalSize): string {
  return size === 'xl' || size === '2xl' ? 'max-h-[85dvh]' : 'max-h-[70dvh]';
}

interface IModal {
  title: string;
  /**
   * Opcional: sem ela o modal não renderiza elemento de descrição (nem espaço
   * vazio). Só escreva quando houver regra ou risco que o título não revela.
   */
  description?: string;
  children: React.ReactNode;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** Largura no desktop. Padrão: `default`. */
  size?: ModalSize;
  /**
   * Quando definido, mostra um botão-ícone de voltar à esquerda do título/descrição
   * (alinhado verticalmente entre eles). Use em fluxos com passos (ex.: escolher
   * uma opção → formulário) para voltar ao passo anterior sem fechar o modal.
   */
  onBack?: () => void;
  /** Rótulo acessível do botão de voltar (padrão: "Voltar"). */
  backLabel?: string;
  /**
   * Ícone do contexto, exibido num quadrado tonado à esquerda do título. Use o
   * MESMO ícone que levou até aqui (item de menu, ação da linha), para o modal
   * continuar visualmente o passo anterior. Decorativo — o título é quem nomeia.
   */
  icon?: React.ReactNode;
  /**
   * Ação própria da janela, no alto à direita, antes do "fechar" (ex.: baixar o
   * arquivo que o modal mostra). É do modal, não do conteúdo: vale para qualquer
   * tamanho e não disputa espaço com o que está sendo exibido. Com ela, o foco
   * inicial vai ao primeiro campo visível do corpo (e não ao botão do
   * cabeçalho); sem campo, segue o padrão do Radix. Dialog: foco no primeiro
   * campo; Drawer: padrão do vaul (evita abrir o teclado virtual).
   */
  headerAction?: React.ReactNode;
  /**
   * Padrão `true`. Com `false` o modal é bloqueante: não fecha por Esc, clique
   * fora, arrastar (drawer) nem botão X, e só sai da tela quando o consumidor
   * muda `open`. Use para decisão que a pessoa precisa tomar antes de seguir e
   * ofereça sempre uma saída explícita no conteúdo.
   */
  dismissible?: boolean;
}

/**
 * Faixa do cabeçalho: fundo levemente destacado do corpo (`bg-muted/40`, mesmo
 * tom do `CollapsibleCard`), separada por `border-b`, com um fio da cor da marca
 * no topo. Sem isso o cabeçalho e os campos dividem o mesmo plano branco e o
 * modal fica sem âncora — as tabelas do sistema já têm cabeçalho tonado.
 * No Dialog soma o `pr-12` para reservar o espaço do botão de fechar (posicionado
 * por cima); o Drawer não tem esse botão, então mantém o padding simétrico.
 */
const HEADER_BAND =
  'border-t-2 border-b border-t-primary bg-muted/40 px-4 py-3';

/**
 * Cabeçalho do modal com botão de voltar opcional. O botão fica à esquerda,
 * centralizado verticalmente contra o bloco título+descrição.
 */
function ModalHeaderContent({
  title,
  description,
  onBack,
  backLabel = 'Voltar',
  icon,
  headerAction,
  Title,
  Description,
}: {
  title: string;
  description?: string;
  onBack?: () => void;
  backLabel?: string;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  Title: React.ElementType;
  Description: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3 text-left">
      {onBack && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                aria-label={backLabel}
                onClick={onBack}
                className="-ml-2 shrink-0"
              >
                <ChevronLeft className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{backLabel}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {icon && (
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary [&_svg]:size-5"
        >
          {icon}
        </span>
      )}

      {/* `min-w-0` deixa o título truncar em vez de empurrar o botão de fechar. */}
      <div className="flex min-w-0 flex-col gap-1">
        <Title className="truncate">{title}</Title>
        {description ? <Description>{description}</Description> : null}
      </div>

      {headerAction && <div className="ml-auto shrink-0">{headerAction}</div>}
    </div>
  );
}

export function Modal({
  title,
  description,
  children,
  open,
  setOpen,
  size = 'default',
  onBack,
  backLabel,
  icon,
  headerAction,
  dismissible = true,
}: IModal) {
  const isMobile = useIsMobile();
  // Esc, clique fora e arrastar chegam como `onOpenChange(false)`; o bloqueante
  // só deixa passar o pedido de abrir.
  const handleOpenChange = (next: boolean): void => {
    if (dismissible || next) setOpen(next);
  };

  // Dialog: o `headerAction` vem antes do corpo no DOM e levaria o foco inicial;
  // com ele, o foco vai ao primeiro campo utilizável do corpo. O padrão só é
  // cancelado se o campo de fato recebeu o foco. O Drawer segue o padrão do vaul
  // (não força foco, para não abrir o teclado virtual).
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const focusFirstBodyField = headerAction
    ? (event: Event): void => {
        const field = Array.from(
          bodyRef.current?.querySelectorAll<HTMLElement>(
            'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), [role="combobox"]:not([disabled]):not([tabindex="-1"])'
          ) ?? []
        ).find((candidate) => isRendered(candidate));
        if (!field) return;
        field.focus();
        if (document.activeElement === field) event.preventDefault();
      }
    : undefined;
  // Defensivo: o Radix/vaul instalados não avisam nem ligam `aria-describedby`
  // sem `Description`. Passar `undefined` explícito garante isso em versões que
  // avisam (ou que apontam para um id inexistente).
  const noDescriptionProps = description
    ? {}
    : { 'aria-describedby': undefined };

  // O "dentro de modal" NÃO é marcado aqui: quem provê o `InModalContext` é o
  // próprio `DialogContent`/`DrawerContent` (e `SheetContent`/`AlertDialogContent`),
  // para valer também em overlays montados à mão. O `PopoverContent` lê o contexto
  // e não portala aqui dentro, liberando a roda do mouse nas listas. Isso NÃO é o
  // que coloca o popover na frente do modal — quem faz isso é `--z-floating` >
  // `--z-overlay`. Ver `hooks/useInModal.ts` e a seção "CAMADAS" em `src/index.css`.

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={handleOpenChange}
        dismissible={dismissible}
      >
        <DrawerContent {...noDescriptionProps}>
          <DrawerHeader className={cn('mt-2', HEADER_BAND)}>
            <ModalHeaderContent
              title={title}
              description={description}
              onBack={onBack}
              backLabel={backLabel}
              icon={icon}
              headerAction={headerAction}
              Title={DrawerTitle}
              Description={DrawerDescription}
            />
          </DrawerHeader>
          {/*
            Scroll NATIVO (não `ScrollArea` do Radix): no Drawer (vaul) o gesto
            de toque só rola quando o container é um overflow nativo — o vaul
            detecta isso para diferenciar "rolar conteúdo" de "arrastar o
            drawer". `flex-1 min-h-0` limita a altura ao espaço restante do
            drawer (`max-h`), habilitando o scroll interno.
          */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/*
        `p-0 gap-0`: o padding sai do container e vai para a faixa do cabeçalho e
        para o corpo, senão a faixa não sangra até a borda do modal. NÃO use
        `overflow-hidden` aqui para arredondar a faixa — o `DialogContent` tem
        `transform`, então é o bloco de contenção dos filhos `fixed`, e o popover
        dos campos (que dentro do modal NÃO portalam: Select searchable, Combobox,
        MultiSelect, DateField, DateTimeField) seria recortado.
        Os cantos da faixa acompanham o modal pelo `rounded-t-xl` dela.
      */}
      <DialogContent
        className={cn(
          'max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 p-0',
          sizeClassName(size)
        )}
        showCloseButton={dismissible}
        onOpenAutoFocus={focusFirstBodyField}
        // Barra o fechamento já no evento, e não só no `onOpenChange`.
        onEscapeKeyDown={dismissible ? undefined : (e) => e.preventDefault()}
        onInteractOutside={dismissible ? undefined : (e) => e.preventDefault()}
        {...noDescriptionProps}
      >
        <DialogHeader
          className={cn(HEADER_BAND, 'rounded-t-xl', dismissible && 'pr-12')}
        >
          <ModalHeaderContent
            title={title}
            description={description}
            onBack={onBack}
            backLabel={backLabel}
            icon={icon}
            headerAction={headerAction}
            Title={DialogTitle}
            Description={DialogDescription}
          />
        </DialogHeader>
        {/*
          `min-w-0`: como item do grid do DialogContent, sem isto o ScrollArea
          cresceria até a largura do conteúdo (min-width:auto) e uma tabela larga
          VAZARIA para fora do modal. Com `min-w-0` a largura fica presa ao modal,
          e o `overflow-x-auto` do container da tabela aciona o scroll lateral
          DENTRO do modal. Garantia sistêmica: qualquer tabela larga rola aqui.

          O padding é do próprio corpo (`p-4`, sem margem negativa): com a faixa do
          cabeçalho sangrando até a borda, o `DialogContent` ficou `p-0` e cada
          bloco passou a cuidar do seu espaçamento.
        */}
        <ScrollArea
          ref={bodyRef}
          className="min-h-0 min-w-0"
          viewportClassName={cn(viewportMaxHeight(size), 'p-4')}
        >
          {children}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Rodapé padrão de ações de um modal. Um botão ocupa 100% da largura; dois ou
 * mais ficam centralizados, cada um com a largura do próprio texto, e quebram de
 * linha se não couberem. Texto (`<p>`/`<span>`) ocupa a linha inteira,
 * centralizado, e não conta como botão. A regra é CSS sobre o que foi renderizado
 * (`only-of-type` de `button`), então `{cond && <Button />}` funciona sem
 * tratamento. A regra olha a tag: o filho precisa renderizar `<button>`; um
 * `Button asChild` que vira `<a>`/`Link` conta como texto (linha inteira).
 * Use para agrupar os botões de ação de QUALQUER modal do projeto.
 * O botão de salvar fica sempre visível, com `disabled` até haver mudança
 * (`!formState.isDirty`), combinado com os demais bloqueios: a ação é
 * descobrível sem permitir salvar à toa. Vale para modal; a tela de detalhe
 * segue o par Descartar + Salvar (ver docs/conventions/screen-layout.md).
 */
export function ModalFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-slot="modal-footer"
      className={cn(
        'flex flex-wrap justify-center gap-2 [&>:not(button)]:basis-full [&>:not(button)]:text-center [&>button:only-of-type]:basis-full',
        className
      )}
    >
      {children}
    </div>
  );
}
