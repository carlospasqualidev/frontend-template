import * as React from 'react';
import { useNavigate, useRouter, useSearch } from '@tanstack/react-router';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface UrlTabItem {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface IUrlTabs {
  items: UrlTabItem[];
  defaultValue: string;
  /** Chave do search param na URL. Default: `'tab'`. */
  searchKey?: string;
  listClassName?: string;
  contentClassName?: string;
}

/**
 * Abas com valor ativo sincronizado a um search param da URL.
 *
 * Quando `value === defaultValue`, a chave é removida da URL (deixa a aba
 * "padrão" sem ?tab=...). Outros search params da rota são preservados.
 *
 * - **Responsivo**: a lista de abas rola horizontalmente quando não cabe na
 *   largura (em vez de quebrar ou esconder abas em mobile).
 * - **Nova aba do navegador**: clique do meio (scroll) ou Ctrl/Cmd/Shift+clique
 *   numa aba abrem a URL correspondente (`?tab=...`) em nova guia, como um link,
 *   sem trocar a aba atual.
 * - **Edição não salva**: trocar de aba é uma navegação do roteador (`?tab=`),
 *   então passa pelo guard de edição não salva da tela
 *   (`useUnsavedChangesGuard` com `searchKey`), que pergunta antes de trocar
 *   quando a aba leva um formulário alterado; a nova guia não passa por ele.
 */
export function UrlTabs({
  items,
  defaultValue,
  searchKey = 'tab',
  listClassName,
  contentClassName,
}: IUrlTabs) {
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const navigate = useNavigate();
  const router = useRouter();

  const validValues = React.useMemo(
    () => new Set(items.map((item) => item.value)),
    [items]
  );

  const candidate = new Map(Object.entries(search)).get(searchKey);
  const activeTab =
    typeof candidate === 'string' && validValues.has(candidate)
      ? candidate
      : defaultValue;

  const tabSearch = (next: string) => (previous: Record<string, unknown>) => ({
    ...previous,
    [searchKey]: next === defaultValue ? undefined : next,
  });

  const setTab = (next: string) => {
    void navigate({ to: '.', search: tabSearch(next), replace: true });
  };

  const hrefForTab = (next: string) =>
    router.buildLocation({ to: '.', search: tabSearch(next) }).href;

  const openInNewTab = (next: string) => {
    window.open(hrefForTab(next), '_blank', 'noopener,noreferrer');
  };

  return (
    <Tabs value={activeTab} onValueChange={setTab}>
      {/* Container rolável: mantém as abas acessíveis por scroll lateral em
          telas estreitas. O `pb-2`/`-mb-2` reserva espaço para o sublinhado da
          aba ativa não ser cortado pelo overflow, sem alterar o ritmo vertical. */}
      <div className="-mb-2 overflow-x-auto pb-2">
        <TabsList variant="line" className={cn('w-max', listClassName)}>
          {items.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey) {
                  // Mantém a aba atual e abre a clicada em nova guia.
                  event.preventDefault();
                  openInNewTab(item.value);
                }
              }}
              onAuxClick={(event) => {
                // Botão do meio (scroll) → nova guia.
                if (event.button === 1) {
                  event.preventDefault();
                  openInNewTab(item.value);
                }
              }}
              onMouseDown={(event) => {
                const opensNewTab =
                  event.button === 0 && (event.metaKey || event.shiftKey);
                // Botão do meio: evita o cursor de autoscroll. Cmd/Shift+clique:
                // o Radix troca a aba já no mousedown (só poupa o Ctrl+clique),
                // e esses cliques só abrem a nova guia, no `onClick`.
                if (event.button === 1 || opensNewTab) event.preventDefault();
              }}
            >
              {item.icon}
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {items.map((item) => (
        <TabsContent
          key={item.value}
          value={item.value}
          className={cn('pt-4', contentClassName)}
        >
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
