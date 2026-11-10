import { type ComponentProps } from 'react';
import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/global/button/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/useThemeProvider';

interface ToggleThemeProps {
  variant?: ComponentProps<typeof Button>['variant'];
}

export function ToggleTheme({ variant = 'outline' }: ToggleThemeProps) {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      {/* Gatilho de menu (asChild) — o tooltip envolve o gatilho, pois o `tooltip`
          do Button não se aplica quando ele é `Slot` de outro gatilho. */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant={variant} size="icon" aria-label="Alternar tema">
                <Sun className="size-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                <Moon className="absolute size-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Alternar tema</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Escuro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
