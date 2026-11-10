import * as React from 'react';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/global/button/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Uma opção do menu. O `label` é o texto e o nome acessível do item, exceto
 * quando a opção está indisponível e tem motivo: aí o nome vira "rótulo: motivo"
 * (o motivo não pode ficar só no visual).
 */
export interface IActionMenuItem {
  /** Chave estável da opção (a `key` da lista). */
  key: string;
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  /** Opção que existe mas não serve agora. */
  disabled?: boolean;
  /** Por que está indisponível: segunda linha dentro da opção. */
  disabledReason?: string;
  /** Estilo de remoção (vermelho). */
  destructive?: boolean;
  /** Abre um grupo: desenha um traço antes desta opção. */
  separatorBefore?: boolean;
  /**
   * Opção de alternância (liga/desliga): vira uma caixa marcável e o menu
   * continua aberto depois do clique. `undefined` = opção comum.
   */
  checked?: boolean;
}

/**
 * Botão que abre um menu de ações, para barras onde as ações passariam de meia
 * dúzia de botões lado a lado: a barra fica com poucos botões nomeados pelo
 * assunto ("Outras opções") e as ações vivem dentro, agrupadas.
 *
 * Opção indisponível fica visível e desabilitada, com o motivo; só some de vez a
 * opção que não existe para aquele usuário (falta de permissão).
 *
 * ```tsx
 * <ActionMenu
 *   label="Outras opções"
 *   items={[
 *     { key: 'export', label: 'Exportar', onSelect: openExport },
 *     { key: 'delete', label: 'Excluir', destructive: true, separatorBefore: true, onSelect: remove },
 *   ]}
 * />
 * ```
 */
export function ActionMenu({
  label,
  icon,
  items,
  variant = 'outline',
  menuLabel,
}: {
  /** O que o botão diz: o assunto do menu, não uma ação. */
  label: string;
  icon?: React.ReactNode;
  items: IActionMenuItem[];
  variant?: React.ComponentProps<typeof Button>['variant'];
  /** Cabeçalho dentro do menu, quando o assunto do botão não basta. */
  menuLabel?: string;
}) {
  // Ao fechar, o menu devolve o foco ao gatilho, o que tiraria o foco do modal
  // que a opção escolhida acabou de abrir. Fechou por escolha: quem manda no foco
  // é o que a ação abriu; no Esc ou no clique fora, o foco volta ao botão.
  const chose = React.useRef(false);

  if (items.length === 0) return null;

  const select = (item: IActionMenuItem) => {
    chose.current = true;
    item.onSelect();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant}>
          {icon}
          {label}
          <ChevronDown className="opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-56"
        onCloseAutoFocus={(event) => {
          if (!chose.current) return;
          chose.current = false;
          event.preventDefault();
        }}
      >
        {menuLabel && <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>}
        {items.map((item) => (
          <React.Fragment key={item.key}>
            {item.separatorBefore && <DropdownMenuSeparator />}
            {item.checked === undefined ? (
              <DropdownMenuItem
                variant={item.destructive ? 'destructive' : 'default'}
                disabled={item.disabled}
                aria-label={accessibleName(item)}
                onSelect={() => select(item)}
              >
                {item.icon}
                <ItemText item={item} />
              </DropdownMenuItem>
            ) : (
              <DropdownMenuCheckboxItem
                checked={item.checked}
                disabled={item.disabled}
                aria-label={accessibleName(item)}
                // Alternância não fecha o menu e o foco segue onde está.
                onSelect={(event) => {
                  event.preventDefault();
                  item.onSelect();
                }}
              >
                {item.icon}
                <ItemText item={item} />
              </DropdownMenuCheckboxItem>
            )}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function accessibleName(item: IActionMenuItem): string {
  return item.disabled && item.disabledReason
    ? `${item.label}: ${item.disabledReason}`
    : item.label;
}

function ItemText({ item }: { item: IActionMenuItem }) {
  if (!item.disabled || !item.disabledReason) return <span>{item.label}</span>;

  return (
    <span className="flex flex-col items-start gap-0.5">
      <span>{item.label}</span>
      <span className="text-xs opacity-80">{item.disabledReason}</span>
    </span>
  );
}
