import { type ReactNode } from 'react';

import { Button } from '@/components/global/button/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * Tom da ação — dá a cor do botão (tokens de `index.css`, soft-tint como as tags).
 * A cor é o que o operador reconhece antes de ler o tooltip, então mantenha o
 * MESMO tom para a mesma ação em todas as telas: `neutral` (cinza) para consulta,
 * `brand` para a ação principal do fluxo, `info`/`success`/`warning` conforme o
 * significado e `destructive` para o que remove.
 *
 * Precisa de um tom novo (ex.: distinguir etapas de um fluxo específico)? Adicione
 * o token em `index.css` e a entrada em `toneClasses` — nunca cor solta na tela.
 */
export type RowActionTone =
  'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'destructive';

export interface RowActionBase {
  /** Chave estável da ação (usada como `key` da lista). */
  key: string;
  /** Rótulo em pt-BR: vira o tooltip **e** o nome acessível do botão. */
  label: string;
  icon: ReactNode;
  /**
   * URL de destino, quando a ação **navega** (ex.: `/pedidos/1/itens/2`).
   * Com ela o botão vira um link de verdade: **clique do meio** (bolinha do mouse)
   * e Ctrl/Cmd/Shift+clique abrem em **nova aba**, e o clique normal segue a
   * navegação SPA do `onSelect`. Ações que abrem modal/confirmação não têm `href`.
   */
  href?: string;
  /** Padrão: `neutral`. */
  tone?: RowActionTone;
  /** Ação visível mas indisponível nesta linha (ex.: etapa fora do status atual). */
  disabled?: boolean;
  /**
   * Motivo da indisponibilidade. Vai no tooltip (padrão: o próprio `label`) e no
   * nome acessível do botão desabilitado, como "rótulo: motivo".
   */
  disabledReason?: string;
}

/** Ação interna do app: `onSelect` é obrigatório. */
interface RowActionInternal extends RowActionBase {
  external?: false;
  onSelect: () => void;
}

/**
 * Link para FORA do app (`mailto:`, `wa.me`, mapa): `href` é obrigatório e o
 * clique é do navegador, em nova aba, sem interceptação. Se `onSelect` vier, ele
 * **não roda**: por isso é opcional só aqui.
 */
interface RowActionExternal extends RowActionBase {
  external: true;
  href: string;
  onSelect?: () => void;
}

export type RowAction = RowActionInternal | RowActionExternal;

// Soft-tint com a mesma fórmula das variantes do `Badge`: texto na cor cheia
// sobre 10% do tom (20% no dark, onde o fundo é escuro).
const toneClasses = new Map<RowActionTone, string>([
  [
    // `accent`, e não `muted`: a ação neutra também mora sobre superfície clara
    // (cabeçalho de card, linha em `bg-muted/40`), e ali um fundo `muted` sumia.
    'neutral',
    'bg-accent text-muted-foreground hover:bg-accent hover:text-foreground dark:bg-accent/60',
  ],
  [
    'brand',
    'bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30',
  ],
  [
    'info',
    'bg-info/10 text-info hover:bg-info/20 dark:bg-info/20 dark:hover:bg-info/30',
  ],
  [
    'success',
    'bg-success/10 text-success hover:bg-success/20 dark:bg-success/20 dark:hover:bg-success/30',
  ],
  [
    'warning',
    'bg-warning/10 text-warning hover:bg-warning/20 dark:bg-warning/20 dark:hover:bg-warning/30',
  ],
  [
    'destructive',
    'bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30',
  ],
]);

function RowActionButton({ action }: { action: RowAction }) {
  // `icon-sm` (28px): a fileira chega a 7 ações por linha, e com o tamanho padrão
  // (32px) ela empurra a tabela para o scroll lateral cedo demais. É o caso de
  // "controle auxiliar denso" da regra de tamanhos (todos os botões do grupo têm
  // a MESMA altura).
  const className = cn(
    'rounded-full',
    toneClasses.get(action.tone ?? 'neutral')
  );

  if (action.disabled) {
    // Botão desabilitado não recebe eventos de mouse (`disabled:pointer-events-none`),
    // então o gatilho do tooltip é o wrapper — assim o operador ainda descobre o
    // que a ação faz (e por que está indisponível) ao passar o mouse. O motivo
    // entra também no nome acessível, para quem não usa mouse nem vê o tooltip.
    const accessibleName = action.disabledReason
      ? `${action.label}: ${action.disabledReason}`
      : action.label;

    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled
                aria-label={accessibleName}
                className={className}
              >
                {action.icon}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {action.disabledReason ?? action.label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (action.href) {
    // Ação de navegação = link de verdade: o clique do meio (e Ctrl/Cmd/Shift+
    // clique) abre em nova aba pelo comportamento NATIVO do `<a>`; o clique
    // normal é interceptado para seguir a navegação SPA do `onSelect`.
    // Com `asChild` o `Button` é um `Slot` e ignora a prop `tooltip` (ver
    // `CLAUDE.md` → Acessibilidade), então o tooltip é montado aqui.
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              variant="ghost"
              size="icon-sm"
              aria-label={action.label}
              className={className}
            >
              {action.external ? (
                <a href={action.href} target="_blank" rel="noopener noreferrer">
                  {action.icon}
                </a>
              ) : (
                <a
                  href={action.href}
                  onClick={(event) => {
                    if (
                      event.metaKey ||
                      event.ctrlKey ||
                      event.shiftKey ||
                      event.button !== 0
                    )
                      return;
                    event.preventDefault();
                    action.onSelect();
                  }}
                >
                  {action.icon}
                </a>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{action.label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      tooltip={action.label}
      className={className}
      onClick={action.onSelect}
    >
      {action.icon}
    </Button>
  );
}

export type RowActionsAlign = 'center' | 'right';

interface RowActionsProps {
  actions: RowAction[];
  /** Alinhamento da fileira na célula. Padrão: `center`; `right` para tabela de valores. */
  align?: RowActionsAlign;
  className?: string;
}

/**
 * Ações de uma linha de tabela como **botões-ícone visíveis**, um por ação: é o
 * padrão de toda lista. O menu "⋯" (`actionsColumn`) é o escape, para quando as
 * ações não cabem na fileira — ver `docs/conventions/screen-layout.md` → "Ações de item".
 * As ações recorrentes (editar, excluir, baixar…) vêm do catálogo `actions.tsx`.
 *
 * Cada ação tem seu ícone e seu tom; o rótulo em pt-BR vira tooltip + nome
 * acessível. Ações indisponíveis ficam **visíveis e desabilitadas** (a posição
 * dos ícones não muda de linha para linha, então a memória muscular funciona).
 *
 * Numa `DataTable`, use o helper `rowActionsColumn`; em tabelas montadas com o
 * primitivo `Table` (ex.: sub-tabelas de detalhe), use este componente na célula.
 *
 * ```tsx
 * <RowActions
 *   actions={[
 *     { key: 'history', label: 'Consultar alterações', icon: <FileClock />, onSelect: openHistory },
 *     { key: 'delete', label: 'Excluir', icon: <Trash2 />, tone: 'destructive', onSelect: remove },
 *   ]}
 * />
 * ```
 */
export function RowActions({
  actions,
  align = 'center',
  className,
}: RowActionsProps) {
  // Sem nenhuma ação, reserva o espaço de um botão para a linha manter a MESMA
  // altura das que têm ações (linhas de altura uniforme na tabela).
  if (actions.length === 0) {
    return (
      <div
        aria-hidden
        className={cn('size-7', align === 'right' ? 'ml-auto' : 'mx-auto')}
      />
    );
  }

  return (
    // Isola os eventos do `onRowClick`/`getRowHref` da linha: executar uma ação
    // não deve abrir o registro. O `onMouseDown` também para aqui porque a linha
    // clicável cancela o padrão do botão do meio (evitar o autoscroll) — e isso
    // impediria o clique do meio de abrir a AÇÃO em nova aba.
    <div
      className={cn(
        'flex items-center gap-0.5',
        align === 'right' ? 'justify-end' : 'justify-center',
        className
      )}
      onClick={(event) => event.stopPropagation()}
      onAuxClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {actions.map((action) => (
        <RowActionButton key={action.key} action={action} />
      ))}
    </div>
  );
}
