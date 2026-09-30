import { FlaskConical } from 'lucide-react';

import {
  Alert as AlertPrimitive,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const DEMO_NOTICE_LABEL = 'Dados de demonstração';

const DEFAULT_DESCRIPTION =
  'Exemplo de tela: o servidor ainda não tem esta função, e nada aqui é gravado.';

interface IDemoNotice {
  /**
   * `badge` (padrão): selo curto no cabeçalho de um card ou bloco (o `action`
   * do `Card`). `banner`: faixa no topo de uma aba ou tela inteira que só tem
   * dados de demonstração, com a explicação.
   */
  variant?: 'badge' | 'banner';
  /** Explicação do banner; o badge mostra só o rótulo. */
  description?: string;
  className?: string;
}

/**
 * Aviso de que a parte da tela mostra dados de demonstração: o servidor não
 * atende aquela função, então o conteúdo é fixo e nada é gravado. Toda aba,
 * bloco ou card que ainda não fala com o servidor usa este aviso, visível, com
 * o mesmo texto em todo o sistema. Cor da paleta de status (`warning`), nos
 * dois temas; o texto é o que dá o significado (não só a cor).
 */
export function DemoNotice({
  variant = 'badge',
  description = DEFAULT_DESCRIPTION,
  className,
}: IDemoNotice) {
  if (variant === 'badge') {
    return (
      <Badge variant="warning" className={className}>
        <FlaskConical aria-hidden />
        {DEMO_NOTICE_LABEL}
      </Badge>
    );
  }

  // Aviso fixo da página, não uma mensagem que acabou de chegar: `note`, para
  // o leitor de tela não interromper a leitura como faria o `alert`.
  return (
    <AlertPrimitive
      role="note"
      aria-label={DEMO_NOTICE_LABEL}
      className={cn(
        'border-warning/25 bg-warning/10 text-warning dark:bg-warning/20',
        className
      )}
    >
      <FlaskConical aria-hidden />
      <AlertTitle>{DEMO_NOTICE_LABEL}</AlertTitle>
      <AlertDescription className="text-warning/90">
        {description}
      </AlertDescription>
    </AlertPrimitive>
  );
}
