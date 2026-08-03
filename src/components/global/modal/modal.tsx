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
import { InModalContext } from '@/components/global/modal/inModalContext';
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

interface IModal {
  title: string;
  description: string;
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
  Title,
  Description,
}: {
  title: string;
  description: string;
  onBack?: () => void;
  backLabel?: string;
  icon?: React.ReactNode;
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
        <Description>{description}</Description>
      </div>
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
}: IModal) {
  const isMobile = useIsMobile();

  // Marca a subárvore como "dentro de modal" para os campos com popover
  // (Select/Combobox/MultiSelect) não portalarem por padrão — senão abririam atrás
  // do modal e a roda do mouse não rolaria a lista. Ver `inModalContext`.
  const body = (
    <InModalContext.Provider value={true}>{children}</InModalContext.Provider>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader className={cn('mt-2', HEADER_BAND)}>
            <ModalHeaderContent
              title={title}
              description={description}
              onBack={onBack}
              backLabel={backLabel}
              icon={icon}
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
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/*
        `p-0 gap-0`: o padding sai do container e vai para a faixa do cabeçalho e
        para o corpo, senão a faixa não sangra até a borda do modal. NÃO use
        `overflow-hidden` aqui para arredondar a faixa — o `DialogContent` tem
        `transform`, então é o bloco de contenção dos filhos `fixed`, e o popover
        dos Select/Combobox (que dentro do modal NÃO portalam) seria recortado.
        Os cantos da faixa acompanham o modal pelo `rounded-t-xl` dela.
      */}
      <DialogContent className={cn('gap-0 p-0', sizeClassName(size))}>
        <DialogHeader className={cn(HEADER_BAND, 'rounded-t-xl pr-12')}>
          <ModalHeaderContent
            title={title}
            description={description}
            onBack={onBack}
            backLabel={backLabel}
            icon={icon}
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
        <ScrollArea className="min-w-0" viewportClassName="max-h-[70dvh] p-4">
          {body}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Rodapé padrão de ações de um modal: o(s) botão(ões) ocupam 100% da largura do
 * modal (empilhados quando há mais de um). Use para agrupar o(s) botão(ões) de
 * ação (Salvar/Criar) de QUALQUER modal do projeto, garantindo o mesmo padrão em
 * todos. A largura total vem do `flex flex-col` (align-items: stretch estica os
 * filhos). Em modais de edição, o botão de salvar deve renderizar apenas quando
 * o formulário está _dirty_ (ver CLAUDE.md).
 */
export function ModalFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('flex flex-col gap-2', className)}>{children}</div>;
}
